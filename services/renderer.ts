import { Input, Output, Conversion, Mp4OutputFormat, WebMOutputFormat, BufferTarget, BlobSource, ALL_FORMATS } from "mediabunny";
import { Flow } from "flow-sdk";
import { toCanvas } from "html-to-image";
import { timeController } from "./TimeController";
import { MediaAsset, TextConfig } from "../types";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    parts.push(String.fromCharCode.apply(null, chunk as unknown as number[]));
  }
  return btoa(parts.join(''));
}

function doubleRAF(): Promise<void> {
  return new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

function singleRAF(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

const STYLE_WHITELIST = [
  'font-family', 'font-size', 'font-weight', 'font-style',
  'letter-spacing', 'line-height', 'text-align', 'white-space',
  'color', 'text-decoration', 'text-transform',
  'display', 'position', 'top', 'left', 'right', 'bottom',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin', 'padding', 'box-sizing', 'overflow',
  'opacity', 'visibility', 'background', 'background-color',
  'border', 'border-radius', 'box-shadow',
  'transform', 'transform-origin',
  'flex', 'flex-direction', 'align-items', 'justify-content', 'gap',
  'z-index', 'pointer-events',
];

function visibleFilter(node: HTMLElement): boolean {
  if (node.nodeType !== 1) return true;
  const s = node.style;
  if (s && s.display === 'none') return false;
  return true;
}

function getOverlayElement(): HTMLElement | null {
  return document.getElementById("stage-overlays");
}

function hasAnimatedContent(configs: TextConfig[]): boolean {
  return configs.some(c => c.effect !== 'none' || (c.outEffect && c.outEffect !== 'none'));
}

async function fetchGoogleFontCSS(): Promise<string> {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .filter(el => (el as HTMLLinkElement).href?.includes('fonts.googleapis.com'));

  if (links.length === 0) return '';

  const cssChunks: string[] = [];

  for (const link of links) {
    try {
      const res = await fetch((link as HTMLLinkElement).href, {
        headers: { 'Accept': 'text/css' }
      });
      const css = await res.text();

      const urlRegex = new RegExp('url\\((https?:\\/\\/[^)]+)\\)', 'g');
      let inlined = css;
      const matches = [...css.matchAll(urlRegex)];

      for (const match of matches) {
        try {
          const fontRes = await fetch(match[1]);
          const fontBuf = await fontRes.arrayBuffer();
          const b64 = arrayBufferToBase64(fontBuf);
          const mime = match[1].includes('.woff2') ? 'font/woff2'
            : match[1].includes('.woff') ? 'font/woff'
              : 'font/truetype';
          inlined = inlined.replace(match[0], 'url(data:' + mime + ';base64,' + b64 + ')');
        } catch {
          // ignore
        }
      }

      cssChunks.push(inlined);
    } catch {
      // ignore
    }
  }

  return cssChunks.join(String.fromCharCode(10));
}

async function captureOverlay(
  overlayEl: HTMLElement,
  fontCSS: string,
  pixelRatio: number
): Promise<HTMLCanvasElement> {
  return toCanvas(overlayEl, {
    fontEmbedCSS: fontCSS || undefined,
    width: overlayEl.offsetWidth,
    height: overlayEl.offsetHeight,
    pixelRatio,
    skipAutoScale: true,
    includeStyleProperties: STYLE_WHITELIST,
    preferredFontFormat: 'woff2',
    filter: visibleFilter,
  });
}

async function generateStillVideo(
  bgCanvas: HTMLCanvasElement,
  durationSec: number,
  fps: number = 24
): Promise<Blob> {
  const ctx = bgCanvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, bgCanvas.width, bgCanvas.height);

  const stream = bgCanvas.captureStream(0);
  const videoTrack = stream.getVideoTracks()[0] as any;

  let mimeType = 'video/webm;codecs=vp8';
  if (typeof MediaRecorder.isTypeSupported === 'function' && !MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    let redrawInterval: ReturnType<typeof setInterval>;

    mediaRecorder.onstop = () => {
      clearInterval(redrawInterval);
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
    mediaRecorder.onerror = reject;
    mediaRecorder.start();

    redrawInterval = setInterval(() => {
      ctx.putImageData(imageData, 0, 0);
      if (videoTrack.requestFrame) videoTrack.requestFrame();
    }, 1000 / fps);

    setTimeout(() => {
      mediaRecorder.stop();
      stream.getTracks().forEach(t => t.stop());
    }, durationSec * 1000);
  });
}

// ─── VIDEO EXPORT ───────────────────────────────────────────

export async function renderVideo(
  media: MediaAsset | null,
  configs: TextConfig[],
  onProgress: (p: number) => void,
  options: {
    resolution: "720p" | "1080p" | "4K";
    fps: 24 | 25 | 30 | 60;
    bgType: 'transparent' | 'solid' | 'gradient' | 'media';
    bgColor1: string;
    bgColor2: string;
    bgGradientAngle: number;
  },
  signal?: AbortSignal,
  totalDuration: number = 8
) {
  // Smart export: only export as image if the source is an image AND no animated content
  if (options.bgType === 'media' && media && media.type === "image" && !hasAnimatedContent(configs)) {
    return await renderImageOverlay(media, configs);
  }

  // Ensure all Google Fonts are loaded before capture
  await document.fonts.ready;

  const overlayEl = getOverlayElement();
  if (!overlayEl) throw new Error("Stage overlay element not found");

  const fontCSS = await fetchGoogleFontCSS();

  let sourceBlob: Blob;
  let isPortrait = false;

  // Determine output resolution dimensions
  const targetSize = options.resolution === "4K" ? 2160 : options.resolution === "720p" ? 720 : 1080;
  let targetBitrate = 8_000_000;
  if (options.resolution === "4K") {
    targetBitrate = options.fps === 60 ? 30_000_000 : 20_000_000;
  } else if (options.resolution === "720p") {
    targetBitrate = options.fps === 60 ? 6_000_000 : 4_000_000;
  } else {
    targetBitrate = options.fps === 60 ? 12_000_000 : 8_000_000;
  }

  if (options.bgType === 'media' && media && media.type === 'video') {
    const sourceVideo = document.querySelector('video[src]') as HTMLVideoElement | null;
    const srcW = sourceVideo?.videoWidth || 1280;
    const srcH = sourceVideo?.videoHeight || 720;
    isPortrait = srcH > srcW;
  }

  // ─── SOLID/GRADIENT/TRANSPARENT/MEDIA STILL VIDEO GENERATION ───
  if (options.bgType === 'media' && media && media.type === 'video') {
    const response = await fetch(media.dataUrl);
    sourceBlob = await response.blob();
  } else {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = isPortrait ? 1080 : 1920;
    bgCanvas.height = isPortrait ? 1920 : 1080;
    const ctx = bgCanvas.getContext('2d')!;

    if (options.bgType === 'transparent') {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    } else if (options.bgType === 'solid') {
      ctx.fillStyle = options.bgColor1;
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    } else if (options.bgType === 'gradient') {
      const angleRad = (options.bgGradientAngle * Math.PI) / 180;
      const width = bgCanvas.width;
      const height = bgCanvas.height;
      const length = Math.abs(width * Math.cos(angleRad)) + Math.abs(height * Math.sin(angleRad));
      const x1 = width / 2 - (Math.cos(angleRad) * length) / 2;
      const y1 = height / 2 - (Math.sin(angleRad) * length) / 2;
      const x2 = width / 2 + (Math.cos(angleRad) * length) / 2;
      const y2 = height / 2 + (Math.sin(angleRad) * length) / 2;

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, options.bgColor1);
      gradient.addColorStop(1, options.bgColor2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else if (options.bgType === 'media' && media && media.type === 'image') {
      const img = new Image();
      img.src = media.dataUrl;
      await img.decode();
      bgCanvas.width = img.width;
      bgCanvas.height = img.height;
      const imgCtx = bgCanvas.getContext('2d')!;
      imgCtx.drawImage(img, 0, 0);
    }

    onProgress(0.02);
    sourceBlob = await generateStillVideo(bgCanvas, totalDuration, options.fps);
    onProgress(0.05);
  }

  // ─── UNIFIED MEDIABUNNY OFFLINE FRAME-BY-FRAME TRANSCODER ───
  const isWebM = options.bgType === 'transparent';
  
  const input = new Input({ source: new BlobSource(sourceBlob), formats: ALL_FORMATS });
  const output = new Output({
    format: isWebM ? new WebMOutputFormat() : new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new BufferTarget()
  });

  timeController.isLocked = true;

  let renderCanvas: HTMLCanvasElement | null = null;
  let renderCtx: CanvasRenderingContext2D | null = null;
  let overlayPixelRatio = 1;

  try {
    const conversion = await Conversion.init({
      input,
      output,
      video: {
        forceTranscode: true,
        frameRate: options.fps,
        ...(isPortrait ? { width: targetSize } : { height: targetSize }),
        fit: 'contain',
        bitrate: targetBitrate,
        process: async (sample: any) => {
          if (signal?.aborted) {
            throw new Error("Render cancelled");
          }
          const w = sample.displayWidth;
          const h = sample.displayHeight;

          if (!renderCanvas) {
            renderCanvas = document.createElement('canvas');
            renderCanvas.width = w;
            renderCanvas.height = h;
            renderCtx = renderCanvas.getContext('2d', { alpha: true })!;

            const previewH = overlayEl.offsetHeight || 540;
            overlayPixelRatio = h / previewH; // Dynamic exact scaling factor for crisp output
          }

          if (isWebM) {
            renderCtx!.clearRect(0, 0, w, h); // Keep transparency
          } else {
            sample.draw(renderCtx!, 0, 0); // Draw background
          }

          timeController.forceSetTime(sample.timestamp);
          await singleRAF();

          try {
            const overlayCanvas = await captureOverlay(overlayEl, fontCSS, overlayPixelRatio);
            renderCtx!.drawImage(overlayCanvas, 0, 0, w, h);
            
            // EXPLICITLY FREE GPU MEMORY & PREVENT VIRTUAL MEMORY BLOAT
            overlayCanvas.width = 0;
            overlayCanvas.height = 0;
          } catch (captureErr) {
            console.warn('Overlay capture failed for frame at', sample.timestamp, captureErr);
          }

          return renderCanvas;
        }
      }
    });

    if (!conversion.isValid) throw new Error("Invalid conversion");
    conversion.onProgress = (p) => {
      onProgress(0.05 + p * 0.95);
    };
    await conversion.execute();

    const buffer = output.target.buffer;
    const videoBlob = new Blob([buffer], { type: isWebM ? "video/webm" : "video/mp4" });
    const dataUrl = URL.createObjectURL(videoBlob);
    const mimeType = isWebM ? "video/webm" : "video/mp4";

    const base64 = arrayBufferToBase64(buffer);
    const flowResult = await Flow.save({
      base64,
      mimeType,
      name: `TextOverlays_${Date.now()}.${isWebM ? 'webm' : 'mp4'}`
    });

    return { flowResult, dataUrl, mimeType };
  } finally {
    timeController.isLocked = false;
  }
}

// ─── IMAGE EXPORT ───────────────────────────────────────────

export async function renderImageOverlay(media: MediaAsset, configs?: TextConfig[]) {
  await document.fonts.ready;

  const overlayEl = getOverlayElement();

  const img = new Image();
  img.src = media.dataUrl;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(img, 0, 0);

  if (overlayEl && configs && configs.length > 0) {
    const fontCSS = await fetchGoogleFontCSS();
    const previewH = overlayEl.offsetHeight || 540;
    const pixelRatio = img.height / previewH;

    timeController.isLocked = true;
    timeController.forceSetTime(0);
    await doubleRAF();

    try {
      const overlayCanvas = await captureOverlay(overlayEl, fontCSS, pixelRatio);
      ctx.drawImage(overlayCanvas, 0, 0, img.width, img.height);
    } catch (captureErr) {
      console.warn('Overlay capture failed for image export', captureErr);
    } finally {
      timeController.isLocked = false;
    }
  }

  const dataUrl = canvas.toDataURL("image/png");
  const mimeType = "image/png";

  let flowResult;
  try {
    const base64 = dataUrl.split(',')[1];
    flowResult = await Flow.save({ base64, mimeType, name: `TextOverlays_${Date.now()}.png` });
  } catch { }

  return { flowResult, dataUrl, mimeType };
}

export async function renderVideoPython(
  ws: WebSocket,
  media: MediaAsset | null,
  configs: TextConfig[],
  onProgress: (p: number) => void,
  options: {
    aspectRatio: '16:9' | '9:16' | '1:1';
    quality: 'HD' | 'FullHD' | 'UHD';
    fps: 24 | 25 | 30 | 60;
    bgType: 'transparent' | 'solid' | 'gradient' | 'media';
    bgColor1: string;
    bgColor2: string;
    bgGradientAngle: number;
  },
  signal?: AbortSignal,
  totalDuration: number = 8
): Promise<{ dataUrl: string; mimeType: string }> {
  const fps = options.fps;
  const totalFrames = Math.floor(totalDuration * fps);
  const isTransparent = options.bgType === 'transparent';

  // Calculate target resolution width and height based on Aspect Ratio and Quality
  let targetW = 1920;
  let targetH = 1080;
  
  const isVertical = options.aspectRatio === '9:16';
  const isSquare = options.aspectRatio === '1:1';

  if (isSquare) {
    if (options.quality === 'UHD') { targetW = 3840; targetH = 3840; }
    else if (options.quality === 'HD') { targetW = 1080; targetH = 1080; }
    else { targetW = 1920; targetH = 1920; }
  } else if (isVertical) {
    if (options.quality === 'UHD') { targetW = 2160; targetH = 3840; }
    else if (options.quality === 'HD') { targetW = 720; targetH = 1280; }
    else { targetW = 1080; targetH = 1920; }
  } else { // 16:9
    if (options.quality === 'UHD') { targetW = 3840; targetH = 2160; }
    else if (options.quality === 'HD') { targetW = 1280; targetH = 720; }
    else { targetW = 1920; targetH = 1080; }
  }

  // Start offline render on the Python backend
  ws.send(JSON.stringify({
    cmd: "start_offline",
    width: targetW,
    height: targetH,
    fps: fps,
    bgType: options.bgType
  }));

  timeController.isLocked = true;

  // Yield to event loop to allow React DOM, state hooks, and AnimeJS timelines to fully rebuild and synchronize!
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const overlayEl = getOverlayElement();
    if (!overlayEl) throw new Error("Stage overlay element not found");

    const fontCSS = await fetchGoogleFontCSS();
    const previewH = overlayEl.offsetHeight || 540;
    const overlayPixelRatio = targetH / previewH;

    // Offscreen rendering canvas for composition
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = targetW;
    renderCanvas.height = targetH;
    const renderCtx = renderCanvas.getContext('2d', { alpha: isTransparent })!;

    const videoEl = document.querySelector('video') as HTMLVideoElement | null;

    let bgImg: HTMLImageElement | null = null;
    if (options.bgType === 'media' && media && media.type === 'image') {
      bgImg = new Image();
      bgImg.src = media.dataUrl;
      await new Promise((resolve) => {
        bgImg!.onload = resolve;
        bgImg!.onerror = resolve;
      });
    }

    // Offline Frame Loop
    for (let f = 0; f < totalFrames; f++) {
      if (signal?.aborted) {
        try {
          ws.send(JSON.stringify({ cmd: "cancel_offline" }));
        } catch (e) {
          console.error("Failed to send cancel_offline to websocket:", e);
        }
        throw new Error("Render cancelled");
      }

      const timestamp = f / fps;
      timeController.forceSetTime(timestamp);

      // Force two frames so anime.js and DOM redraw perfectly
      await doubleRAF();

      renderCtx.clearRect(0, 0, targetW, targetH);

      // 1. Draw solid, gradient, image or video background
      if (options.bgType === 'solid') {
        renderCtx.fillStyle = options.bgColor1;
        renderCtx.fillRect(0, 0, targetW, targetH);
      } else if (options.bgType === 'gradient') {
        const angleRad = (options.bgGradientAngle * Math.PI) / 180;
        const length = Math.abs(targetW * Math.cos(angleRad)) + Math.abs(targetH * Math.sin(angleRad));
        const x1 = targetW / 2 - (Math.cos(angleRad) * length) / 2;
        const y1 = targetH / 2 - (Math.sin(angleRad) * length) / 2;
        const x2 = targetW / 2 + (Math.cos(angleRad) * length) / 2;
        const y2 = targetH / 2 + (Math.sin(angleRad) * length) / 2;

        const gradient = renderCtx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, options.bgColor1);
        gradient.addColorStop(1, options.bgColor2);
        renderCtx.fillStyle = gradient;
        renderCtx.fillRect(0, 0, targetW, targetH);
      } else if (options.bgType === 'media' && media) {
        if (media.type === 'image' && bgImg) {
          const imgRatio = bgImg.width / bgImg.height;
          const targetRatio = targetW / targetH;
          let drawW = targetW;
          let drawH = targetH;
          let drawX = 0;
          let drawY = 0;
          if (imgRatio > targetRatio) {
            drawW = targetH * imgRatio;
            drawX = (targetW - drawW) / 2;
          } else {
            drawH = targetW / imgRatio;
            drawY = (targetH - drawH) / 2;
          }
          renderCtx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        } else if (media.type === 'video' && videoEl) {
          const vidRatio = (videoEl.videoWidth || 1280) / (videoEl.videoHeight || 720);
          const targetRatio = targetW / targetH;
          let drawW = targetW;
          let drawH = targetH;
          let drawX = 0;
          let drawY = 0;
          if (vidRatio > targetRatio) {
            drawW = targetH * vidRatio;
            drawX = (targetW - drawW) / 2;
          } else {
            drawH = targetW / vidRatio;
            drawY = (targetH - drawH) / 2;
          }
          renderCtx.drawImage(videoEl, drawX, drawY, drawW, drawH);
        }
      }

      // 2. Draw text overlays on top
      const overlayCanvas = await captureOverlay(overlayEl, fontCSS, overlayPixelRatio);
      renderCtx.drawImage(overlayCanvas, 0, 0, targetW, targetH);

      // EXPLICITLY FREE GPU MEMORY & PREVENT VIRTUAL MEMORY BLOAT
      overlayCanvas.width = 0;
      overlayCanvas.height = 0;

      // 3. Extract blob and stream to Python Websocket
      const mimeType = isTransparent ? 'image/png' : 'image/jpeg';
      const quality = isTransparent ? undefined : 0.95;

      const blob = await new Promise<Blob>((resolve) => {
        renderCanvas.toBlob((b) => resolve(b!), mimeType, quality);
      });

      ws.send(blob);

      onProgress(f / totalFrames);
    }

    // Finish render pipeline
    ws.send(JSON.stringify({
      cmd: "stop_offline",
      fps: fps,
      width: targetW,
      height: targetH
    }));

    // Await encoding complete from WebSocket
    return new Promise<{ dataUrl: string, mimeType: string }>((resolve, reject) => {
      const originalOnMessage = ws.onmessage;

      const timeoutId = setTimeout(() => {
        ws.onmessage = originalOnMessage;
        reject(new Error("Encoding timeout"));
      }, 180000); // 3 minutes timeout

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'encoding_done') {
            clearTimeout(timeoutId);
            ws.onmessage = originalOnMessage;

            // Base64 bytes to Blob URL
            const byteCharacters = atob(data.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: data.mimeType });
            const dataUrl = URL.createObjectURL(blob);

            resolve({ dataUrl, mimeType: data.mimeType });
          } else if (data.status === 'encoding_error') {
            clearTimeout(timeoutId);
            ws.onmessage = originalOnMessage;
            reject(new Error(data.message || "Encoding error"));
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      };
    });

  } finally {
    timeController.isLocked = false;
  }
}