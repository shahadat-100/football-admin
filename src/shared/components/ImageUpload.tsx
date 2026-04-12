import React, { useRef } from 'react';
import { Button } from './Button';
import { fileToBase64 } from '../lib/utils';
import { ImagePlus, X } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (base64: string) => void;
  onRemove: () => void;
  className?: string;
}

export function ImageUpload({ value, onChange, onRemove, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large (max 5MB)");
        return;
      }
      try {
        const b64 = await fileToBase64(file);
        onChange(b64);
      } catch (err) {
        console.error(err);
      }
    }
  };

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
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border group">
          <img src={value} alt="Upload preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button type="button" variant="danger" size="sm" onClick={onRemove}>
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <ImagePlus className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-[11px] font-medium">Upload Image</span>
        </button>
      )}
    </div>
  );
}
