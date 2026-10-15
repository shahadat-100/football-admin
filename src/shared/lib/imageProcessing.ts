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
  /** Output compression quality from 0.1 to 1.0. Default is 0.92. */
  quality?: number;
  /** Output MIME type. Default is 'image/png' to preserve transparency for cutouts. */
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
}

/**
 * Standardizes any uploaded image (Story, Landscape, Portrait, Square)
 * into a uniform static gallery height and aspect ratio.
 * 
 * Guarantees:
 * 1. Head is NEVER cut off (Safe Headroom & proportional fitting).
 * 2. Every single output image has the EXACT same dimensions (default: 1080 x 1350 / 4:5).
 * 3. Preserves transparent background for player cutouts.
 */
export async function fitImageForGallery(
  file: File,
  options: ImageFitOptions = {}
): Promise<File> {
  const targetRatio = options.aspectRatio ?? (4 / 5);
  const targetWidth = options.targetWidth ?? 1080;
  const targetHeight = options.targetHeight ?? Math.round(targetWidth / targetRatio); // 1350 for 1080 @ 4:5
  const alignment = options.alignment ?? 'bottom';
  const headroom = options.headroom ?? 0.05; // 5% safe breathing room at top
  const quality = options.quality ?? 0.92;
  const isInputPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const format = options.format ?? (isInputPng ? 'image/png' : 'image/png'); // Default to PNG to keep cutouts clean

  return new Promise((resolve) => {
    // Non-image files are returned as-is
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      // Available vertical space reserving safe headroom at top
      const availableH = targetHeight * (1 - headroom);
      const availableW = targetWidth;

      // Fit-contain scale factor so 100% of the image fits inside available area
      const scale = Math.min(availableW / naturalW, availableH / naturalH);
      const scaledW = Math.round(naturalW * scale);
      const scaledH = Math.round(naturalH * scale);

      // Horizontal centering
      const offsetX = Math.round((targetWidth - scaledW) / 2);

      // Vertical placement:
      // If 'bottom', player stands firmly on the bottom of the card with all headroom at the top
      // If 'center', centered vertically
      let offsetY: number;
      if (alignment === 'bottom') {
        offsetY = Math.round(targetHeight - scaledH);
      } else {
        offsetY = Math.round((targetHeight - scaledH) / 2);
      }

      // Create standardized canvas with exact target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Transparent base canvas for cutouts
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // If the image is a solid photo (e.g. JPEG without alpha), optional subtle dark/gradient backdrop
      // can be used, but for transparent cutouts, keeping it transparent allows the card template to show
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          const fileExt = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
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
