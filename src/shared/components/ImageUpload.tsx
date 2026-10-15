import React, { useRef, useState } from 'react';
import { Button } from './Button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fitImageForGallery } from '@/shared/lib/imageProcessing';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  className?: string;
  bucket?: string;
  aspectRatio?: '4:5' | '16:9' | '1:1' | '4:3';
  autoFitForGallery?: boolean;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  className, 
  bucket = 'images',
  aspectRatio = '4:5',
  autoFitForGallery
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Automatically enable gallery aspect ratio and fit if bucket is 'covers' or autoFitForGallery is set
  const isGalleryCard = autoFitForGallery || bucket === 'covers' || aspectRatio === '4:5';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File too large (max 20MB)");
        return;
      }
      try {
        setIsUploading(true);

        // Normalize any image format (Story 9:16, Landscape 16:9, Square 1:1)
        // into a uniform 4:5 card height (1080 x 1350) with safe headroom (no chopped heads!)
        if (isGalleryCard) {
          file = await fitImageForGallery(file, {
            aspectRatio: 4 / 5,
            targetWidth: 1080,
            targetHeight: 1350,
            alignment: 'bottom',
            headroom: 0.05,
            format: 'image/png',
          });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || (file.type === 'image/png' ? 'png' : 'jpg');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const contentType = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg');

        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { contentType, upsert: true });

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
              <span className="text-[11px] font-medium text-amber-500">Fitting to 4:5 & Uploading...</span>
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
                    PNG Cutout Recommended
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

