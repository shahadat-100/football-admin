import React from 'react';
import { cn } from '../lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
      ghost: "bg-transparent text-primary hover:bg-muted/50",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };
    const sizes = {
      sm: "h-8 px-3 text-[11px]",
      md: "h-9 px-4 text-[13px]",
      lg: "h-10 px-8 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-1.5",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
