export const PORTRAIT_OUTPUT_SIZE = 256;
export const PORTRAIT_QUALITY = 0.8;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function decodeFile(file) {
  if (!file || !(file instanceof Blob)) {
    throw new Error('No file provided');
  }
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image is too large (max 10 MB)');
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // fall through to <img> fallback
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to decode image'));
      i.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    // The Image keeps the decoded pixels — safe to revoke after load.
    URL.revokeObjectURL(url);
  }
}

/**
 * Compute the cover-fit scale and clamp the offset so the image always
 * covers the viewport. Returns { scale, offset } where offset is in
 * viewport-pixel space (image top-left relative to viewport top-left).
 */
export function clampCoverOffset({ srcW, srcH, viewport, offset }) {
  if (!srcW || !srcH || !viewport) return { scale: 1, offset: { x: 0, y: 0 } };
  const scale = Math.max(viewport / srcW, viewport / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const minX = viewport - drawW; // <= 0
  const minY = viewport - drawH; // <= 0
  const x = Math.min(0, Math.max(minX, offset?.x ?? 0));
  const y = Math.min(0, Math.max(minY, offset?.y ?? 0));
  return { scale, offset: { x, y } };
}

/**
 * Draw the framed portrait to an offscreen canvas and return a JPEG data URL.
 *
 * @param {Object} args
 * @param {ImageBitmap|HTMLImageElement} args.source
 * @param {number} args.srcW
 * @param {number} args.srcH
 * @param {{x:number,y:number}} args.offset - image top-left relative to viewport top-left
 * @param {number} args.viewport - displayed viewport size in pixels (square)
 * @param {number} [args.output] - output size (defaults to PORTRAIT_OUTPUT_SIZE)
 * @param {number} [args.quality] - JPEG quality 0..1
 */
export function composePortrait({ source, srcW, srcH, offset, viewport, output = PORTRAIT_OUTPUT_SIZE, quality = PORTRAIT_QUALITY }) {
  const { scale, offset: clamped } = clampCoverOffset({ srcW, srcH, viewport, offset });
  // Convert viewport-space offset/scale into source-image crop rect.
  const sx = (-clamped.x) / scale;
  const sy = (-clamped.y) / scale;
  const sSize = viewport / scale;
  const canvas = document.createElement('canvas');
  canvas.width = output;
  canvas.height = output;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, output, output);
  ctx.drawImage(source, sx, sy, sSize, sSize, 0, 0, output, output);
  return canvas.toDataURL('image/jpeg', quality);
}
