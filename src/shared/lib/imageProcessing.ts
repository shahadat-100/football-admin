/**
 * Image processing utilities for normalizing and optimizing uploads.
 * 
 * Ensures uploaded photos fit cleanly into gallery cards and banners
 * without stretching, distortion, or excessive file sizes.
 */

export interface ImageFitOptions {
  /** Target aspect ratio width / height (e.g. 16/9, 4/3, 1). Default is 16/9 for gallery/covers. */
  aspectRatio?: number;
  /** Maximum target width in pixels. Default is 1200px. */
  targetWidth?: number;
  /** Maximum target height in pixels. Computed from aspectRatio if omitted. */
  targetHeight?: number;
  /** Output compression quality from 0.1 to 1.0. Default is 0.88. */
  quality?: number;
  /** Output MIME type. Default is 'image/jpeg' for maximum compatibility. */
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Resizes and center-crops an uploaded image file using HTML5 Canvas
 * so that it conforms to a uniform gallery aspect ratio and height.
 *
 * @param file The raw input File from an <input type="file">
 * @param options Dimension and quality settings
 * @returns A Promise resolving to a standardized, optimized File
 */
export async function fitImageForGallery(
  file: File,
  options: ImageFitOptions = {}
): Promise<File> {
  const targetRatio = options.aspectRatio || 16 / 9;
  const {
    targetWidth = 1200,
    targetHeight = Math.round(targetWidth / targetRatio),
    quality = 0.88,
    format = file.type === 'image/png' ? 'image/png' : 'image/jpeg',
  } = options;

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

      // Calculate scale to cover canvas (aspect-fill)
      const scale = Math.max(targetWidth / naturalW, targetHeight / naturalH);
      const scaledW = naturalW * scale;
      const scaledH = naturalH * scale;

      // Center crop offsets
      const offsetX = (targetWidth - scaledW) / 2;
      const offsetY = (targetHeight - scaledH) / 2;

      // Create high-resolution canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original file if canvas context is unavailable
        return resolve(file);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear & draw centered
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          const fileExt = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
          const originalBase = file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${originalBase}-gallery.${fileExt}`;

          const optimizedFile = new File([blob], newFileName, {
            type: format,
            lastModified: Date.now(),
          });

          resolve(optimizedFile);
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
