import React from 'react';

interface StarRatingProps {
  rating: number; // 1-5
  style: 'normal' | '3d';
  color?: string;
  size?: number;
  className?: string;
}

export function StarRating({ 
  rating, 
  style, 
  color = '#FFD700', 
  size = 20,
  className = '' 
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const renderStar = (index: number, type: 'full' | 'half' | 'empty') => {
    if (style === '3d') {
      return (
        <svg
          key={index}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={type === 'full' ? 'url(#star-gradient-3d)' : type === 'half' ? 'url(#star-gradient-3d-half)' : 'none'}
          stroke={type === 'empty' ? color : 'none'}
          strokeWidth="1"
          className={className}
          style={{
            filter: type !== 'empty' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
            transform: type !== 'empty' ? 'perspective(100px) rotateX(-10deg)' : 'none',
          }}
        >
          <defs>
            <linearGradient id="star-gradient-3d" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="50%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="star-gradient-3d-half" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="50%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    } else {
      // Normal style
      return (
        <svg
          key={index}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={type === 'full' ? color : type === 'half' ? 'none' : 'none'}
          stroke={color}
          strokeWidth="1"
          className={className}
        >
          {type === 'half' ? (
            <>
              <defs>
                <linearGradient id={`star-half-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="50%" stopColor={color} stopOpacity="1" />
                  <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={`url(#star-half-${index})`}
              />
            </>
          ) : (
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          )}
        </svg>
      );
    }
  };

  return (
    <div className="flex items-center gap-0.5" style={{ display: 'inline-flex' }}>
      {Array.from({ length: fullStars }).map((_, i) => renderStar(i, 'full'))}
      {hasHalfStar && renderStar(fullStars, 'half')}
      {Array.from({ length: emptyStars }).map((_, i) => renderStar(fullStars + (hasHalfStar ? 1 : 0) + i, 'empty'))}
    </div>
  );
}

