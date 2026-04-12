import React, { useEffect } from 'react';
import { Button } from './Button';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  isOpen: boolean;
  wide?: boolean;
}

export function Modal({ title, onClose, children, isOpen, wide }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:pt-10 overflow-y-auto w-full h-full">
      <div
        className={cn(
          "bg-card border border-border rounded-xl shadow-xl w-full",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="font-semibold text-[15px]">{title}</h2>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
