const MAX_EDGE = 2048;

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|avif|svg)$/i.test(file.name);
}

export function takeImageFile(files: FileList | File[] | null | undefined): File | null {
  if (!files) return null;
  for (const file of files) {
    if (isImageFile(file)) return file;
  }
  return null;
}

function drawToCanvas(source: CanvasImageSource, sw: number, sh: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh, 1));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the photo");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the photo"));
    img.src = url;
  });
}

export async function rasterizeImage(blob: Blob): Promise<HTMLCanvasElement> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = drawToCanvas(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    return canvas;
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const img = await loadHtmlImage(url);
      return drawToCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
