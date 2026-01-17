import { useRef, useEffect, useState } from 'react';

interface SwipeHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeState {
  isSwiping: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | null;
}

const SWIPE_THRESHOLD = 50; // Minimum distance in pixels to trigger swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger swipe

export function useSwipe(
  elementRef: React.RefObject<HTMLElement>,
  handlers: SwipeHandlers
): SwipeState {
  const [state, setState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setState({ isSwiping: true, direction: null });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Determine direction based on larger movement
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setState({
          isSwiping: true,
          direction: deltaX > 0 ? 'right' : 'left',
        });
      } else {
        setState({
          isSwiping: true,
          direction: deltaY > 0 ? 'down' : 'up',
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const deltaTime = touchEndRef.current.time - touchStartRef.current.time;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Check if swipe meets threshold
      if (distance > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absY > absX) {
          // Vertical swipe
          if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          } else if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          }
        } else {
          // Horizontal swipe
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        }
      }

      setState({ isSwiping: false, direction: null });
      touchStartRef.current = null;
      touchEndRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers]);

  return state;
}

