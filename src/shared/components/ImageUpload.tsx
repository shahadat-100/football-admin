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
  aspectRatio?: '16:9' | '1:1' | '4:3';
  autoFitForGallery?: boolean;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  className, 
  bucket = 'images',
  aspectRatio,
  autoFitForGallery
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Automatically enable gallery aspect ratio and fit if bucket is 'covers' or autoFitForGallery is set
  const isGalleryCover = autoFitForGallery || bucket === 'covers' || aspectRatio === '16:9';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("File too large (max 15MB)");
        return;
      }
      try {
        setIsUploading(true);

        // Normalize & center-crop to perfect gallery dimensions (16:9 standard: 1200x675)
        if (isGalleryCover) {
          file = await fitImageForGallery(file, {
            aspectRatio: 16 / 9,
            targetWidth: 1200,
            targetHeight: 675,
            quality: 0.88,
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

  const containerDimensions = isGalleryCover 
    ? 'w-full max-w-sm aspect-[16/9] min-h-[140px]' 
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
        <div className={`relative ${containerDimensions} rounded-lg overflow-hidden border border-border group bg-neutral-900/50`}>
          <img 
            src={value} 
            alt="Upload preview" 
            className={`w-full h-full ${isGalleryCover ? 'object-cover' : 'object-contain'}`} 
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
          className={`${containerDimensions} rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground transition-colors ${isUploading ? 'opacity-70 cursor-not-allowed bg-muted/50' : 'hover:bg-muted/50'}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 mb-2 opacity-50 animate-spin" />
              <span className="text-[11px] font-medium">Processing & Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-[11px] font-medium">
                {isGalleryCover ? 'Upload Gallery Cover (16:9)' : 'Upload Image'}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

