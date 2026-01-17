import { ReactNode, CSSProperties } from 'react';

interface ReelTextProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  animation?: 'fade-in' | 'slide-up' | 'bounce-in' | 'scale-in';
  className?: string;
  style?: CSSProperties;
}

export function ReelText({
  children,
  size = 'md',
  weight = 'normal',
  color,
  align = 'center',
  animation,
  className = '',
  style,
}: ReelTextProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const animationClass = animation ? `animate-${animation}` : '';

  return (
    <p
      className={`${sizeClasses[size]} ${weightClasses[weight]} ${alignClasses[align]} ${animationClass} ${className}`}
      style={{ color, ...style }}
    >
      {children}
    </p>
  );
}

