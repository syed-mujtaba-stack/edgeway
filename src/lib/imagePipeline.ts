/**
 * Client-side image pipeline: any upload is normalised to the exact two widths
 * the site already ships (1200w / 2400w) as WebP, with EXIF/metadata stripped
 * for free because we re-encode through a canvas.
 */
export type ProcessedImage = {
  width: number;
  height: number;
  /** 2400w (or original if smaller) */
  full: Blob;
  /** 1200w */
  small: Blob;
  previewUrl: string;
};

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = URL.createObjectURL(file);
  });
}

function draw(source: ImageBitmap | HTMLImageElement, targetWidth: number) {
  const srcW = "width" in source ? source.width : 0;
  const srcH = "height" in source ? source.height : 0;
  const scale = Math.min(1, targetWidth / srcW);
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  return { canvas, w, h };
}

function toBlob(canvas: HTMLCanvasElement, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image"))),
      "image/webp",
      quality,
    );
  });
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Please use a JPG, PNG, WebP or AVIF image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That file is over 12 MB. Please use a smaller image.");
  }

  const bitmap = await loadBitmap(file);

  const full = draw(bitmap, 2400);
  const fullBlob = await toBlob(full.canvas);

  // derive 1200w from the already-scaled canvas so quality stays consistent
  const smallSource = await createImageBitmap(full.canvas);
  const small = draw(smallSource, 1200);
  const smallBlob = await toBlob(small.canvas);

  if ("close" in bitmap) bitmap.close();
  smallSource.close?.();

  return {
    width: full.w,
    height: full.h,
    full: fullBlob,
    small: smallBlob,
    previewUrl: URL.createObjectURL(fullBlob),
  };
}

/** Human-readable byte size, used in the admin UI. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
