import { ReactNode, CSSProperties } from 'react';
import { Button } from '@/components/ui/button';

interface ReelButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export function ReelButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  backgroundColor,
  textColor,
  borderColor,
  className = '',
  style,
  disabled = false,
}: ReelButtonProps) {
  const sizeClasses = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  const customStyle: CSSProperties = {
    ...(backgroundColor && { backgroundColor }),
    ...(textColor && { color: textColor }),
    ...(borderColor && { borderColor }),
    ...style,
  };

  if (variant === 'glass') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${sizeClasses[size]} rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium transition-all duration-200 hover:bg-white/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={customStyle}
      >
        {children}
      </button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={customStyle}
    >
      {children}
    </Button>
  );
}

