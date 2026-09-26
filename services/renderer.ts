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

// ─── OFFLINE MOBILE VIDEO EXPORT ────────────────────────────

export async function renderVideoMobile(
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
) {
  await document.fonts.ready;

  const overlayEl = getOverlayElement();
  if (!overlayEl) throw new Error("Stage overlay element not found");

  const fontCSS = await fetchGoogleFontCSS();

  let sourceBlob: Blob;

  // Determine output resolution dimensions based on Aspect Ratio and Quality
  let targetW = 1080;
  let targetH = 1920; // Default 9:16 vertical portrait
  
  if (options.aspectRatio === '9:16') {
    if (options.quality === 'UHD') { targetW = 2160; targetH = 3840; }
    else if (options.quality === 'HD') { targetW = 720; targetH = 1280; }
    else { targetW = 1080; targetH = 1920; }
  } else if (options.aspectRatio === '1:1') {
    if (options.quality === 'UHD') { targetW = 2160; targetH = 2160; }
    else if (options.quality === 'HD') { targetW = 720; targetH = 720; }
    else { targetW = 1080; targetH = 1080; }
  } else { // 16:9
    if (options.quality === 'UHD') { targetW = 3840; targetH = 2160; }
    else if (options.quality === 'HD') { targetW = 1280; targetH = 720; }
    else { targetW = 1920; targetH = 1080; }
  }

  let targetBitrate = 8_000_000;
  if (options.quality === "UHD") targetBitrate = 20_000_000;
  else if (options.quality === "HD") targetBitrate = 4_000_000;

  // ─── SOLID/GRADIENT/TRANSPARENT/MEDIA STILL VIDEO GENERATION ───
  if (options.bgType === 'media' && media && media.type === 'video') {
    const response = await fetch(media.dataUrl);
    sourceBlob = await response.blob();
  } else {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = targetW;
    bgCanvas.height = targetH;
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
      ctx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
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
        width: targetW,
        height: targetH,
        fit: 'contain',
        bitrate: targetBitrate,
        process: async (sample: any) => {
          if (signal?.aborted) {
            throw new Error("Render cancelled");
          }
          const w = sample.displayWidth || targetW;
          const h = sample.displayHeight || targetH;

          if (!renderCanvas) {
            renderCanvas = document.createElement('canvas');
            renderCanvas.width = w;
            renderCanvas.height = h;
            renderCtx = renderCanvas.getContext('2d', { alpha: true })!;

            const previewH = overlayEl.offsetHeight || 540;
            overlayPixelRatio = h / previewH;
          }

          if (isWebM) {
            renderCtx!.clearRect(0, 0, w, h);
          } else {
            sample.draw(renderCtx!, 0, 0);
          }

          timeController.forceSetTime(sample.timestamp);
          await singleRAF();

          try {
            const overlayCanvas = await captureOverlay(overlayEl, fontCSS, overlayPixelRatio);
            renderCtx!.drawImage(overlayCanvas, 0, 0, w, h);
            
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
    const fileName = `TextAnimator_${Date.now()}.${isWebM ? 'webm' : 'mp4'}`;
    const flowResult = await Flow.save({
      base64,
      mimeType,
      name: fileName
    });

    return { flowResult, dataUrl, mimeType, fileName };
  } finally {
    timeController.isLocked = false;
  }
}
