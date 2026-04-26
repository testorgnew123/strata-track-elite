/**
 * Apply a SingleStop watermark (project code + timestamp) to an image File
 * using a client-side <canvas>. Returns a new JPEG File.
 */
export async function watermarkImage(file: File, projectCode: string): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxW = 2000;
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, w, h);

  // Bottom gradient bar
  const barH = Math.max(56, Math.round(h * 0.08));
  const grad = ctx.createLinearGradient(0, h - barH, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - barH, w, barH);

  // Gold accent line
  ctx.fillStyle = "rgba(201, 169, 97, 0.95)";
  ctx.fillRect(0, h - barH, Math.round(w * 0.18), 3);

  // Text
  const fontSize = Math.max(14, Math.round(h * 0.022));
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `600 ${fontSize}px -apple-system, system-ui, sans-serif`;
  ctx.textBaseline = "alphabetic";

  const ts = new Date().toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const padX = Math.round(w * 0.025);
  const baseY = h - Math.round(barH * 0.32);

  ctx.fillText(`SingleStop · ${projectCode}`, padX, baseY - fontSize - 4);
  ctx.font = `400 ${Math.round(fontSize * 0.85)}px -apple-system, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(ts, padX, baseY);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.86),
  );
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}
