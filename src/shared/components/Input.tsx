import React from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-[12px] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-[12px] file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 !text-[#1a1f3c] !bg-[#fdf6e3] placeholder:!text-[#5a5340] !border-foreground caret-[#c8102e]",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-[10px] text-destructive">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
