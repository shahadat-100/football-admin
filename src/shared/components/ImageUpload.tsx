import React, { useRef, useState } from 'react';
import { Button } from './Button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fitImageForGallery, compressImageClientSide } from '@/shared/lib/imageProcessing';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  className?: string;
  bucket?: string;
  aspectRatio?: '4:5' | '16:9' | '1:1' | '4:3';
  autoFitForGallery?: boolean;
  maxWidth?: number;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  className, 
  bucket = 'images',
  aspectRatio,
  autoFitForGallery,
  maxWidth
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Enable portrait cutout aspect ratio (4:5) when requested or when bucket is covers
  const isGalleryCard = Boolean(autoFitForGallery || aspectRatio === '4:5' || bucket === 'covers');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File too large (max 20MB)");
        return;
      }
      try {
        setIsUploading(true);

        if (isGalleryCard) {
          // Normalize to 4:5 with safe headroom and WebP compression
          file = await fitImageForGallery(file, {
            aspectRatio: 4 / 5,
            targetWidth: maxWidth || 1080,
            targetHeight: Math.round((maxWidth || 1080) * (5 / 4)),
            alignment: 'bottom',
            headroom: 0.05,
            format: 'image/webp',
            quality: 0.80,
          });
        } else {
          // Determine target max dimension:
          // Avatars (1:1 / images): 800px
          // Banners / News: 1200px
          // Covers: 1600px
          const targetMaxWidth = maxWidth || (bucket === 'covers' ? 1600 : (aspectRatio === '1:1' ? 800 : 1200));
          file = await compressImageClientSide(file, {
            maxWidth: targetMaxWidth,
            maxHeight: targetMaxWidth,
            quality: 0.80,
            targetSizeKb: 150,
          });
        }

        const uniqueSuffix = Math.random().toString(36).substring(2, 9);
        const fileName = `${Date.now()}-${uniqueSuffix}.webp`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: true
          });

        if (error) {
          console.error("Upload error:", error);
          alert(`Failed to upload image to '${bucket}' bucket: ` + error.message);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        onChange(publicUrl);
      } catch (err: any) {
        console.error(err);
        alert("Upload failed: " + (err?.message || 'Unknown error'));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const containerDimensions = isGalleryCard 
    ? 'w-full max-w-[220px] aspect-[4/5] min-h-[240px]' 
    : 'w-32 h-32';

  return (
    <div className={className}>
      <input 
        type="file" 
        accept="image/jpeg,image/png,image/webp" 
        className="hidden" 
        ref={inputRef}
        onChange={handleFile}
      />
      
      {value ? (
        <div className={`relative ${containerDimensions} rounded-xl overflow-hidden border border-border group bg-neutral-900/60 shadow-md`}>
          <img 
            src={value} 
            alt="Upload preview" 
            loading="lazy"
            decoding="async"
            className={`w-full h-full ${isGalleryCard ? 'object-contain object-bottom' : 'object-contain'}`} 
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button type="button" variant="danger" size="sm" onClick={onRemove}>
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className={`${containerDimensions} rounded-xl border-2 border-dashed border-border/70 flex flex-col items-center justify-center text-muted-foreground transition-all ${isUploading ? 'opacity-70 cursor-not-allowed bg-muted/50' : 'hover:bg-muted/40 hover:border-amber-500/50'}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 mb-2 opacity-50 animate-spin text-amber-500" />
              <span className="text-[11px] font-medium text-amber-500">Optimizing & Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 mb-2 opacity-50 group-hover:text-amber-500" />
              <span className="text-[11px] font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                {isGalleryCard ? 'Upload Gallery Card' : 'Upload Image'}
              </span>
              {isGalleryCard && (
                <>
                  <span className="text-[10.5px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mt-1.5">
                    4:5 (1080 × 1350)
                  </span>
                  <span className="text-[9.5px] text-muted-foreground/80 mt-1 text-center px-2">
                    WebP / PNG Cutout
                  </span>
                </>
              )}
            </>
          )}
        </button>
      )}
    </div>
  );
}
