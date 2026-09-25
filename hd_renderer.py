#!/usr/bin/env python3
"""
Text Animator PRO Native Desktop Launcher & Offline Renderer Server
==================================================================
Receives high-resolution frame snapshots from the React application via WebSockets,
saves them locally, compiles them using FFmpeg, and streams back the high-quality video.

Launches the application as a standalone desktop software window using PyWebView
with local caching enabled (prevents C: drive bloat). Auto-starts Deno Vite server.

Usage:
  python hd_renderer.py
"""

import asyncio
import os
import sys
import shutil
import json
import base64
import subprocess
import threading
import time
import socket
from datetime import datetime
import http.server
import socketserver

# Get Windows Documents directory path dynamically via Shell API
DOCUMENTS_DIR = None
if sys.platform == "win32":
    try:
        import ctypes
        from ctypes import wintypes
        CSIDL_PERSONAL = 5  # My Documents CSIDL
        SHGFP_TYPE_CURRENT = 0
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, CSIDL_PERSONAL, None, SHGFP_TYPE_CURRENT, buf)
        DOCUMENTS_DIR = buf.value
    except Exception:
        pass

if not DOCUMENTS_DIR:
    DOCUMENTS_DIR = os.path.expanduser("~/Documents")

WS_PORT = 8081
VITE_PORT = 5173
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(DOCUMENTS_DIR, "Text Animator PRO")

# Configure Windows console to display emoji/UTF-8 correctly
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

def get_video_bitrate(w, h):
    """Select high-quality bitrate based on resolution"""
    pixels = w * h
    if pixels >= 3840 * 2160: # 4K / UHD
        return 20000 # 20 Mbps
    elif pixels >= 1920 * 1080: # 1080p / FullHD
        return 8000 # 8 Mbps
    else: # 720p / HD
        return 4000 # 4 Mbps

def run_ffmpeg(cmd):
    """Run an FFmpeg command and return success status and logs"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            return True, ""
        else:
            return False, result.stderr
    except Exception as e:
        return False, str(e)

def detect_gpu_encoder(ffmpeg_path):
    """Detects available hardware-accelerated H.264 encoders in FFmpeg, prioritizing NVIDIA, Intel, then AMD"""
    try:
        result = subprocess.run([ffmpeg_path, "-encoders"], capture_output=True, text=True, timeout=5)
        output = result.stdout
        
        # Priority order: NVIDIA NVENC -> Intel QSV -> AMD AMF
        if "h264_nvenc" in output:
            print("[GPU Detect] Found NVIDIA H.264 NVENC encoder!")
            return "h264_nvenc"
        elif "h264_qsv" in output:
            print("[GPU Detect] Found Intel H.264 Quick Sync Video encoder!")
            return "h264_qsv"
        elif "h264_amf" in output:
            print("[GPU Detect] Found AMD H.264 AMF encoder!")
            return "h264_amf"
    except Exception as e:
        print(f"[GPU Detect] Failed to probe encoders: {e}")
    
    print("[GPU Detect] No hardware-accelerated H.264 encoders found. Falling back to CPU (libx264).")
    return "libx264"

def ffmpeg_encode(frames_dir, output_path, w, h, fps, total_frames, is_transparent):
    ffmpeg_path = os.path.join(SCRIPT_DIR, "ffmpeg.exe")
    if not os.path.exists(ffmpeg_path):
        ffmpeg_path = shutil.which("ffmpeg")
        
    if not ffmpeg_path:
        return False, "FFmpeg was not found in the system PATH or app folder. Please place 'ffmpeg.exe' in this folder or install it globally and restart this app."

    video_duration = total_frames / fps
    bitrate = get_video_bitrate(w, h)
    bitrate_str = f"{bitrate}k"

    print(f"\n[FFmpeg] Starting video encoding...")
    print(f"  Resolution: {w}x{h} @ {fps}fps")
    print(f"  Target Bitrate: {bitrate_str}")
    print(f"  Total Duration: {video_duration:.2f}s ({total_frames} frames)")
    print(f"  Alpha Transparency: {'Enabled (WebM)' if is_transparent else 'Disabled (MP4)'}")

    if is_transparent:
        # 1. Attempt libvpx-vp9 (Modern, optimized for web transparency)
        print("  [Try 1/3] Compiling transparent WebM (VP9)...")
        frame_pattern = os.path.join(frames_dir, "frame_%06d.png")
        cmd = [
            ffmpeg_path, "-y",
            "-framerate", str(fps),
            "-start_number", "0",
            "-i", frame_pattern,
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuva420p",
            "-b:v", "8M",
            "-t", f"{video_duration:.3f}",
            output_path
        ]
        success, err_log = run_ffmpeg(cmd)
        if success:
            return True, ""

        print(f"  VP9 compilation failed. Error:\n{err_log}")

        # 2. Fallback to libvpx (VP8 - highly compatible)
        print("  [Try 2/3] VP9 failed, trying legacy transparent WebM (VP8)...")
        cmd = [
            ffmpeg_path, "-y",
            "-framerate", str(fps),
            "-start_number", "0",
            "-i", frame_pattern,
            "-c:v", "libvpx",
            "-pix_fmt", "yuva420p",
            "-b:v", "8M",
            "-metadata:s:v:0", "alpha_mode=1",
            "-t", f"{video_duration:.3f}",
            output_path
        ]
        success, err_log = run_ffmpeg(cmd)
        if success:
            return True, ""

        print(f"  VP8 compilation failed. Error:\n{err_log}")

        # 3. Last fallback: Encode as non-transparent solid black MP4 to avoid crashing
        print("  [Try 3/3] Transparent WebM failed. Encoding as standard MP4 (solid black fallback)...")
        mp4_path = output_path.replace(".webm", ".mp4")
        cmd = [
            ffmpeg_path, "-y",
            "-framerate", str(fps),
            "-start_number", "0",
            "-i", frame_pattern,
            "-c:v", "libx264",
            "-preset", "medium",
            "-b:v", bitrate_str,
            "-pix_fmt", "yuv420p",
            "-t", f"{video_duration:.3f}",
            "-movflags", "+faststart",
            mp4_path
        ]
        success, err_log = run_ffmpeg(cmd)
        if success:
            os.replace(mp4_path, output_path)
            return True, "Alpha transparency compilation failed; fell back to standard MP4."
        
        return False, f"All encoder attempts failed. Final MP4 error: {err_log}"

    else:
        # Compile standard MP4
        frame_pattern = os.path.join(frames_dir, "frame_%06d.jpg")
        gpu_enc = detect_gpu_encoder(ffmpeg_path)
        
        success = False
        err_log = ""
        
        if gpu_enc != "libx264":
            print(f"  [GPU Try] Compiling standard MP4 using hardware acceleration ({gpu_enc})...")
            # Build GPU command
            cmd = [
                ffmpeg_path, "-y",
                "-framerate", str(fps),
                "-start_number", "0",
                "-i", frame_pattern,
                "-c:v", gpu_enc,
                "-b:v", bitrate_str,
                "-pix_fmt", "yuv420p",
                "-t", f"{video_duration:.3f}",
                "-movflags", "+faststart",
                output_path
            ]
            success, err_log = run_ffmpeg(cmd)
            if success:
                print(f"  [Success] GPU-accelerated encoding completed successfully using {gpu_enc}!")
                return True, ""
            else:
                print(f"  [GPU Failed] GPU encoding failed, falling back to CPU. Error:\n{err_log}")
        
        # CPU Fallback / Default
        print("  [CPU Try] Compiling standard MP4 using CPU (libx264)...")
        cmd = [
            ffmpeg_path, "-y",
            "-framerate", str(fps),
            "-start_number", "0",
            "-i", frame_pattern,
            "-c:v", "libx264",
            "-preset", "medium",
            "-b:v", bitrate_str,
            "-pix_fmt", "yuv420p",
            "-t", f"{video_duration:.3f}",
            "-movflags", "+faststart",
            output_path
        ]
        success, err_log = run_ffmpeg(cmd)
        if success:
            return True, ""
        return False, err_log

async def ws_handler(websocket):
    print("[+] Browser client connected!")

    session = {
        "active": False,
        "frames_dir": None,
        "frame_count": 0,
        "width": 1920,
        "height": 1080,
        "fps": 60,
        "bgType": "solid"
    }

    try:
        async for message in websocket:
            # Handle JSON commands
            if isinstance(message, str):
                try:
                    data = json.loads(message)
                    cmd = data.get("cmd")

                    if cmd == "start_offline":
                        w = data.get("width", 1920)
                        h = data.get("height", 1080)
                        fps = data.get("fps", 60)
                        bg_type = data.get("bgType", "solid")

                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        frames_dir = os.path.join(OUTPUT_DIR, f"frames_{timestamp}")
                        os.makedirs(frames_dir, exist_ok=True)

                        session.update({
                            "active": True,
                            "frames_dir": frames_dir,
                            "frame_count": 0,
                            "width": w,
                            "height": h,
                            "fps": fps,
                            "bgType": bg_type
                        })

                        print(f"\n{'='*55}")
                        print(f"[REC] High-Quality offline render started!")
                        print(f"  Resolution: {w}x{h} @ {fps}fps")
                        print(f"  Background type: {bg_type}")
                        print(f"  Frames folder: {frames_dir}")
                        print(f"{'='*55}")

                    elif cmd == "stop_offline":
                        if not session["active"]:
                            continue

                        session["active"] = False
                        fps = session["fps"]
                        w = session["width"]
                        h = session["height"]
                        bg_type = session["bgType"]
                        frames_dir = session["frames_dir"]
                        actual_frames = session["frame_count"]

                        is_transparent = (bg_type == "transparent")
                        ext = "webm" if is_transparent else "mp4"

                        print(f"\n[STOP] Rendering completed! Saved {actual_frames} frames.")
                        print("[FFmpeg] Assembling video sequence...")

                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        output_filename = f"TextAnimator_{timestamp}.{ext}"
                        output_path = os.path.join(OUTPUT_DIR, output_filename)

                        # Wrap rendering and sending in a try...finally block to guarantee cleanup!
                        try:
                            success, warning = ffmpeg_encode(
                                frames_dir, output_path, w, h, fps, actual_frames, is_transparent
                            )

                            if is_transparent and not os.path.exists(output_path) and os.path.exists(output_path.replace(".webm", ".mp4")):
                                output_path = output_path.replace(".webm", ".mp4")
                                output_filename = os.path.basename(output_path)
                                ext = "mp4"

                            if success:
                                with open(output_path, "rb") as f:
                                    video_data = f.read()
                                
                                base64_video = base64.b64encode(video_data).decode("utf-8")
                                mime_type = f"video/{ext}"

                                print(f"[OK] Video compiled successfully: {output_path} ({len(video_data)/(1024*1024):.2f} MB)")

                                await websocket.send(json.dumps({
                                    "status": "encoding_done",
                                    "base64": base64_video,
                                    "mimeType": mime_type,
                                    "filename": output_filename,
                                    "warning": warning if warning else None
                                }))
                            else:
                                print(f"[XATO] FFmpeg compilation failed: {warning}")
                                await websocket.send(json.dumps({
                                    "status": "encoding_error",
                                    "message": f"FFmpeg compilation failed: {warning}"
                                }))
                        finally:
                            # GUARANTEED cleanup under all conditions! Stops disk usage leaks completely
                            try:
                                if os.path.exists(frames_dir):
                                    shutil.rmtree(frames_dir)
                                    print("[CLEANUP] Deleted temporary frames folder.")
                            except Exception as cleanup_err:
                                print(f"[!] Warning: Frames folder could not be deleted: {cleanup_err}")

                    elif cmd == "cancel_offline":
                        if session.get("active"):
                            session["active"] = False
                            frames_dir = session.get("frames_dir")
                            print(f"\n[CANCEL] Rendering cancelled by user.")
                            try:
                                if frames_dir and os.path.exists(frames_dir):
                                    shutil.rmtree(frames_dir)
                                    print("[CLEANUP] Deleted temporary frames folder.")
                            except Exception as cleanup_err:
                                print(f"[!] Warning: Frames folder could not be deleted: {cleanup_err}")

                    elif cmd == "ping":
                        await websocket.send(json.dumps({"status": "pong"}))

                except json.JSONDecodeError:
                    pass

            # Handle binary image data (incoming frames)
            elif isinstance(message, bytes) and session["active"]:
                fc = session["frame_count"]
                is_transparent = (session["bgType"] == "transparent")
                ext = "png" if is_transparent else "jpg"
                fpath = os.path.join(session["frames_dir"], f"frame_{fc:06d}.{ext}")

                with open(fpath, "wb") as f:
                    f.write(message)
                
                session["frame_count"] = fc + 1

                # Display simple console counter every 10 frames
                if (fc + 1) % 10 == 0:
                    secs = (fc + 1) / session["fps"]
                    sz_kb = len(message) / 1024
                    print(f"  Frame {fc+1:5d} | {secs:6.1f}s | {sz_kb:.0f}KB saved   ", end="\r")

    except Exception as e:
        err = str(e).lower()
        if "close" not in err and "1000" not in err and "1001" not in err:
            print(f"\n[!] WebSocket Error: {e}")
    finally:
        # Check for uncompiled frames if connection drops unexpectedly
        if session.get("active"):
            fc = session.get("frame_count", 0)
            print(f"\n[!] Connection lost before stop command. Cleaned up {fc} uncompiled frames.")
            if session.get("frames_dir") and os.path.exists(session["frames_dir"]):
                try:
                    shutil.rmtree(session["frames_dir"])
                except:
                    pass
        print("[-] Client disconnected.")

def is_port_open(port):
    """Check if the local dev server port is open"""
    for host in ('127.0.0.1', 'localhost'):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                if s.connect_ex((host, port)) == 0:
                    return True
        except:
            pass
    return False

async def start_ws():
    """Start websocket listener on port 8081"""
    try:
        import websockets
    except ImportError:
        print("\n[!] websockets library not found! Installing automatically...")
        subprocess.run([sys.executable, "-m", "pip", "install", "websockets"], check=True)
        import websockets

    server = await websockets.serve(
        ws_handler, "localhost", WS_PORT,
        max_size=100 * 1024 * 1024, # 100MB max message size for base64 responses
        ping_interval=30,
        ping_timeout=300
    )
    await server.wait_closed()

def start_static_server(port, directory):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)
            
        def log_message(self, format, *args):
            pass # Suppress logging to keep console clean

    def run_server():
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
            print(f"[SERVER] Static file server running on port {port} serving {directory}")
            httpd.serve_forever()

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

def start_ws_loop():
    """Target function to run WS asyncio loop inside a daemon thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(start_ws())

def main():
    print("=" * 60)
    print("      ✨ Text Animator PRO - Native Desktop App ✨")
    print("=" * 60)

    # 1. Verify FFmpeg is installed
    ffmpeg_path = os.path.join(SCRIPT_DIR, "ffmpeg.exe")
    if not os.path.exists(ffmpeg_path):
        ffmpeg_path = shutil.which("ffmpeg")
        
    if ffmpeg_path:
        print(f"[OK] FFmpeg found: {ffmpeg_path}")
    else:
        print("[!] Warning: FFmpeg not found in PATH or project directory!")
        print("    Please place 'ffmpeg.exe' in this directory or install globally: winget install Gyan.FFmpeg")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 2. Redirect Edge WebView2 user data/cache to project folder (fixes C: Drive bloat!)
    local_cache = os.path.join(SCRIPT_DIR, ".cache")
    os.makedirs(local_cache, exist_ok=True)
    os.environ["WEBVIEW2_USER_DATA_FOLDER"] = local_cache
    print(f"[DIR] Local Cache Folder: {local_cache}")

    # 3. Check and install websockets
    try:
        import websockets
    except ImportError:
        print("[!] websockets library not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "websockets"], check=True)

    # 4. Check and install pywebview
    try:
        import webview
    except ImportError:
        print("[!] pywebview library not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pywebview"], check=True)
        import webview

    # 5. Start WebSocket listener in a background daemon thread
    ws_thread = threading.Thread(target=start_ws_loop, daemon=True)
    ws_thread.start()
    print(f"[WS] WebSocket server active at ws://localhost:{WS_PORT}")

    # 6. Check and auto-launch Dev Server or Static Server
    deno_proc = None
    dist_dir = os.path.join(SCRIPT_DIR, "dist")
    
    if os.path.isdir(dist_dir):
        print("[SERVER] Found compiled 'dist' folder. Starting local static file server...")
        if not is_port_open(VITE_PORT):
            start_static_server(VITE_PORT, dist_dir)
            # Await server startup
            for _ in range(40):
                if is_port_open(VITE_PORT):
                    break
                time.sleep(0.1)
        else:
            print(f"[SERVER] Port {VITE_PORT} is already in use (possibly static server).")
    else:
        if not is_port_open(VITE_PORT):
            print("[SERVER] Starting background Deno Dev Server on port 5173...")
            deno_path = shutil.which("deno")
            if deno_path:
                log_file_path = os.path.join(SCRIPT_DIR, "deno_dev.log")
                try:
                    log_file = open(log_file_path, "w", encoding="utf-8")
                except Exception:
                    log_file = subprocess.DEVNULL

                # Spawn Deno in a background subprocess completely decoupled
                deno_proc = subprocess.Popen(
                    [deno_path, "task", "dev"],
                    cwd=SCRIPT_DIR,
                    stdout=log_file,
                    stderr=log_file,
                    shell=True if sys.platform == "win32" else False
                )
                if log_file != subprocess.DEVNULL:
                    log_file.close()

                # Await server startup (up to 30 seconds to support slower systems/virtual memory changes)
                print("[SERVER] Waiting for dev server to start", end="", flush=True)
                for i in range(60):
                    print(".", end="", flush=True)
                    if is_port_open(VITE_PORT):
                        print(" [OK]")
                        break
                    time.sleep(0.5)
                else:
                    print(" [TIMEOUT]")
                    print(f"[!] Dev server took too long to respond. Checking 'deno_dev.log' might help.")
            else:
                print("[!] Deno command not found in your PATH. Please start 'deno task dev' manually.")
        else:
            print("[SERVER] Deno dev server is already running on port 5173.")

    # 7. Start native OS desktop webview frame
    print("[APP] Launching Text Animator desktop window...")
    try:
        webview.create_window(
            title='Text Animator PRO',
            url=f'http://127.0.0.1:{VITE_PORT}',
            width=1280,
            height=720,
            resizable=True
        )
        # Disable private mode to preserve WebView2 local settings cache locally
        webview.start(private_mode=False)
    except Exception as e:
        print(f"[!] PyWebView failed to launch: {e}")
        print(f"Please open in browser instead: http://localhost:{VITE_PORT}")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
    finally:
        # Shut down Deno subprocess when desktop window is closed
        if deno_proc:
            print("\n[SERVER] Stopping Deno Dev Server...")
            deno_proc.terminate()
            deno_proc.wait()
        print("Application closed.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
