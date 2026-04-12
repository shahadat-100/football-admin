import React from 'react';
import { cn } from '../lib/cn';
import { avatarColor, initials } from '../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string | null;
  size?: number | string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name = '?', src, size = 44, ...props }, ref) => {
    const isNum = typeof size === 'number';
    const inlineStyle = isNum ? { width: size, height: size } : {};

    return (
      <div
        ref={ref}
        style={{
          ...inlineStyle,
          backgroundColor: src ? 'transparent' : avatarColor(name),
        }}
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden text-white font-bold",
          !isNum ? size : '',
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span style={{ fontSize: isNum ? (size as number) * 0.35 : 'inherit' }}>
            {initials(name)}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
