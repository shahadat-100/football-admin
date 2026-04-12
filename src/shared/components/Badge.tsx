import React from 'react';
import { cn } from '../lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  bg?: string;
  c?: string;
}

export function Badge({ className, bg = '#1f2937', c = '#94a3b8', style, children, ...props }: BadgeProps) {
  return (
    <span
      style={{ backgroundColor: bg, color: c, ...style }}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
