import os
import sys
import shutil
import subprocess

# Configure Windows console to display UTF-8 correctly
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

def run_cmd(cmd, cwd=None):
    print(f"\n[CMD] Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    res = subprocess.run(cmd, cwd=cwd, shell=True if sys.platform == "win32" else False)
    if res.returncode != 0:
        print(f"[!] Error: Command failed with return code {res.returncode}")
        return False
    return True

def main():
    print("=" * 70)
    print("      * TEXT ANIMATOR PRO - STANDALONE BUILD SCRIPT *")
    print("=" * 70)

    # 1. Compile the React + Vite Frontend
    print("\n[1/5] Compiling React frontend...")
    
    # Remove old builds if exist
    for folder in ("dist", "frontend_build"):
        if os.path.exists(folder):
            try:
                shutil.rmtree(folder)
                print(f"[CLEAN] Deleted existing '{folder}' folder.")
            except Exception as e:
                print(f"[!] Warning: could not delete old '{folder}' folder: {e}")

    # Build using Deno or NPM
    success = run_cmd("deno task build")
    if not success:
        print("[!] Deno build failed. Trying npm build...")
        success = run_cmd("npm run build")
        
    if not success:
        print("\n[XATO] React frontend compilation failed.")
        print("Please check your React typescript/linting errors and try again.")
        sys.exit(1)
        
    print("[OK] Frontend compiled successfully to 'dist/'!")

    # 2. Backup frontend build to temporary folder
    print("\n[2/5] Backing up frontend build...")
    try:
        shutil.move("dist", "frontend_build")
        print("[OK] Frontend build moved to 'frontend_build/'")
    except Exception as e:
        print(f"[XATO] Failed to move 'dist' to 'frontend_build': {e}")
        sys.exit(1)

    # 3. Verify PyInstaller is installed
    print("\n[3/5] Checking PyInstaller...")
    try:
        import PyInstaller
        print("[OK] PyInstaller is already installed.")
    except ImportError:
        print("[!] PyInstaller not found. Installing via pip...")
        if not run_cmd([sys.executable, "-m", "pip", "-q", "install", "pyinstaller"]):
            print("[XATO] PyInstaller installation failed.")
            sys.exit(1)

    # 4. Compile Python launcher with PyInstaller
    print("\n[4/5] Compiling Python Backend using PyInstaller...")
    
    # Check for custom icon
    icon_param = []
    icon_file = "app_icon.ico"
    png_icon = "app_icon.png"
    
    # Try converting PNG to ICO if ICO does not exist
    if not os.path.exists(icon_file) and os.path.exists(png_icon):
        print("[!] Found 'app_icon.png'. Converting to 'app_icon.ico'...")
        try:
            from PIL import Image
            img = Image.open(png_icon)
            img.save(icon_file, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
            print("[OK] Converted 'app_icon.png' to 'app_icon.ico' successfully!")
        except Exception as e:
            print(f"[!] Warning: Could not convert PNG to ICO: {e}")
            print("    Please install pillow (pip install pillow) or provide a native .ico file.")

    if os.path.exists(icon_file):
        print(f"[OK] Using custom icon: {icon_file}")
        icon_param = [f"--icon={icon_file}"]
    else:
        print("[!] No custom icon found ('app_icon.ico' or 'app_icon.png'). Using default icon.")

    # Compile in directory mode (--onedir) with no console window (--noconsole)
    pyinstaller_cmd = [
        "pyinstaller",
        "--onedir",
        "--noconsole",
        "--name=TextAnimator",
        "--clean"
    ] + icon_param + [
        "hd_renderer.py"
    ]
    if not run_cmd(pyinstaller_cmd):
        print("[XATO] PyInstaller compilation failed.")
        sys.exit(1)
        
    print("[OK] Python backend compiled successfully into 'dist/TextAnimator/'!")

    # 5. Move frontend build and prepare final folder
    print("\n[5/5] Finalizing standalone app package...")
    app_folder = os.path.join("dist", "TextAnimator")
    final_dist = os.path.join(app_folder, "dist")

    if os.path.exists("frontend_build"):
        try:
            # Move frontend static files into the executable folder
            shutil.move("frontend_build", final_dist)
            print("[OK] Bundled static assets into 'dist/TextAnimator/dist/'")
        except Exception as e:
            print(f"[XATO] Failed to bundle frontend build: {e}")
            sys.exit(1)

    # Create empty renders folder in the compiled package
    renders_dir = os.path.join(app_folder, "renders")
    os.makedirs(renders_dir, exist_ok=True)
    print(f"[DIR] Created renders directory: {renders_dir}")

    # Copy local ffmpeg and its DLLs if found in project folder
    ffmpeg_dir = "ffmpeg"
    local_ffmpeg_file = "ffmpeg.exe"
    
    copied_ffmpeg = False
    
    # 1. First check the 'ffmpeg' subfolder
    if os.path.isdir(ffmpeg_dir):
        source_exe = os.path.join(ffmpeg_dir, "ffmpeg.exe")
        if os.path.exists(source_exe):
            try:
                # Copy ffmpeg.exe
                shutil.copy(source_exe, os.path.join(app_folder, "ffmpeg.exe"))
                copied_ffmpeg = True
                print("[OK] Copied local 'ffmpeg.exe' from 'ffmpeg/' subfolder.")
                
                # Copy all .dll files so shared FFmpeg runs correctly on any PC!
                for item in os.listdir(ffmpeg_dir):
                    if item.lower().endswith(".dll"):
                        shutil.copy(os.path.join(ffmpeg_dir, item), os.path.join(app_folder, item))
                print("[OK] Copied shared FFmpeg DLL libraries to make it fully portable!")
            except Exception as e:
                print(f"[!] Warning: Could not copy FFmpeg from subfolder: {e}")
                
    # 2. Otherwise check the project root
    if not copied_ffmpeg and os.path.exists(local_ffmpeg_file):
        try:
            shutil.copy(local_ffmpeg_file, os.path.join(app_folder, "ffmpeg.exe"))
            copied_ffmpeg = True
            print("[OK] Copied 'ffmpeg.exe' from project root into app folder.")
            
            # Also copy any .dll files in the root that go with it just in case
            for item in os.listdir("."):
                if item.lower().endswith(".dll"):
                    shutil.copy(item, os.path.join(app_folder, item))
        except Exception as e:
            print(f"[!] Warning: Could not copy 'ffmpeg.exe' from root: {e}")

    if not copied_ffmpeg:
        print("[!] Note: No local 'ffmpeg.exe' found.")
        print("    If you want portable rendering (without installing FFmpeg on other PCs),")
        print("    simply copy your 'ffmpeg.exe' (and its DLLs if shared) into 'dist/TextAnimator/'.")

    # Clean up PyInstaller build artifacts
    for item in ("build", "TextAnimator.spec"):
        if os.path.exists(item):
            try:
                if os.path.isdir(item):
                    shutil.rmtree(item)
                else:
                    os.remove(item)
            except:
                pass

    print("\n" + "=" * 70)
    print("🎉 CONGRATULATIONS! STANDALONE BUNDLE CREATED SUCCESSFULLY! 🎉")
    print("=" * 70)
    print(f"Your portable, ready-to-run app folder is located at:")
    print(f"👉   {os.path.abspath(app_folder)}")
    print("\nDistribution Instructions:")
    print("1. Zip the 'TextAnimator' folder inside 'dist/'.")
    print("2. Send it to anyone on Windows!")
    print("3. They can run 'TextAnimator.exe' inside that folder directly.")
    print("4. No Deno, No Python, No Node.js, and No FFmpeg installation needed!")
    print("=" * 70)

if __name__ == "__main__":
    main()
