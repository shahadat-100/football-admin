/**
 * Image processing utilities for normalizing player and gallery photos.
 * 
 * Ensures that regardless of input format (Story 9:16, Landscape 16:9, Square 1:1),
 * the output image is standardized to the exact static gallery height and aspect ratio (4:5),
 * ensuring the player's head and features are NEVER cut off.
 */

export interface ImageFitOptions {
  /** Target aspect ratio width / height. Default is 4/5 (0.8) for gallery cards and posters. */
  aspectRatio?: number;
  /** Target canvas width in pixels. Default is 1080px. */
  targetWidth?: number;
  /** Target canvas height in pixels. Default is 1350px (standard 4:5 poster height). */
  targetHeight?: number;
  /** Vertical alignment on the canvas: 'bottom' (recommended for cutouts/players) or 'center'. Default is 'bottom'. */
  alignment?: 'bottom' | 'center';
  /** Safe headroom factor from top (e.g. 0.05 = 5% padding so heads never touch or clip the top border). Default is 0.05. */
  headroom?: number;
  /** Output compression quality from 0.1 to 1.0. Default is 0.80 for WebP. */
  quality?: number;
  /** Output MIME type. Default is 'image/webp' to optimize storage and egress. */
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0, default 0.80
  targetSizeKb?: number; // default 150 KB
}

/**
 * Standardizes any uploaded image (Story, Landscape, Portrait, Square)
 * into a uniform static gallery height and aspect ratio with WebP compression.
 */
export async function fitImageForGallery(
  file: File,
  options: ImageFitOptions = {}
): Promise<File> {
  const targetRatio = options.aspectRatio ?? (4 / 5);
  const targetWidth = Math.min(options.targetWidth ?? 1080, 1600);
  const targetHeight = options.targetHeight ?? Math.round(targetWidth / targetRatio);
  const alignment = options.alignment ?? 'bottom';
  const headroom = options.headroom ?? 0.05;
  const quality = options.quality ?? 0.80;
  // Default to WebP to drastically reduce egress while preserving alpha transparency
  const format = options.format ?? 'image/webp';

  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      const availableH = targetHeight * (1 - headroom);
      const availableW = targetWidth;

      const scale = Math.min(availableW / naturalW, availableH / naturalH);
      const scaledW = Math.round(naturalW * scale);
      const scaledH = Math.round(naturalH * scale);

      const offsetX = Math.round((targetWidth - scaledW) / 2);
      let offsetY: number;
      if (alignment === 'bottom') {
        offsetY = Math.round(targetHeight - scaledH);
      } else {
        offsetY = Math.round((targetHeight - scaledH) / 2);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          const fileExt = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
          const originalBase = file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${originalBase}-gallery.${fileExt}`;

          const standardizedFile = new File([blob], newFileName, {
            type: format,
            lastModified: Date.now(),
          });

          resolve(standardizedFile);
        },
        format,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn('Could not process image in canvas, falling back to original file:', err);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an image client-side to WebP format, resizing within maxWidth/maxHeight,
 * and dynamically adjusting quality to stay under targetSizeKb (target: < 150 KB).
 */
export async function compressImageClientSide(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const maxWidth = options.maxWidth ?? 1200;
  const maxHeight = options.maxHeight ?? maxWidth;
  const targetSizeKb = options.targetSizeKb ?? 150;
  let quality = options.quality ?? 0.80;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Maintain aspect ratio without enlargement
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const exportBlob = (q: number): Promise<Blob | null> =>
        new Promise((res) => canvas.toBlob(res, 'image/webp', q));

      let blob = await exportBlob(quality);
      if (!blob) return resolve(file);

      // Iteratively reduce quality if file exceeds targetSizeKb
      while (blob.size > targetSizeKb * 1024 && quality > 0.45) {
        quality -= 0.1;
        const smallerBlob = await exportBlob(quality);
        if (smallerBlob) {
          blob = smallerBlob;
        } else {
          break;
        }
      }

      const originalBase = file.name.replace(/\.[^/.]+$/, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const newFileName = `${originalBase}-${uniqueSuffix}.webp`;

      const compressedFile = new File([blob], newFileName, {
        type: 'image/webp',
        lastModified: Date.now(),
      });

      resolve(compressedFile);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
