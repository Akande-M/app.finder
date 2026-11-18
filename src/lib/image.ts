/**
 * Shrink a photo before upload: phone photos are 3–12 MB, the model needs ~1024px.
 * Smaller uploads are faster on mobile data and use fewer free-tier tokens.
 */
export async function compressImage(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  const source: CanvasImageSource & { width: number; height: number } = bitmap ?? (await loadImg(file));
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const w = Math.round(source.width * scale);
  const h = Math.round(source.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(source, 0, 0, w, h);
  bitmap?.close();
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image"));
    img.src = URL.createObjectURL(file);
  });
}
