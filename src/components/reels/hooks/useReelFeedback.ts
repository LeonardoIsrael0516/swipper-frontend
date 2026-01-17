import { useCallback } from 'react';

interface FeedbackOptions {
  vibration?: boolean;
  sound?: boolean;
  animation?: 'scale' | 'bounce' | 'glow' | 'pulse';
}

export function useReelFeedback() {
  const triggerFeedback = useCallback((options: FeedbackOptions = {}) => {
    const { vibration = true, sound = false, animation = 'scale' } = options;

    // Haptic feedback (mobile)
    if (vibration && 'vibrate' in navigator) {
      navigator.vibrate(50); // 50ms vibration
    }

    // Sound feedback (optional - can be implemented later)
    if (sound) {
      // TODO: Implement sound feedback
    }

    // Return animation class for visual feedback
    return `animate-${animation}`;
  }, []);

  const triggerSuccess = useCallback(() => {
    triggerFeedback({ vibration: true, animation: 'bounce' });
  }, [triggerFeedback]);

  const triggerError = useCallback(() => {
    triggerFeedback({ vibration: true, animation: 'pulse' });
  }, [triggerFeedback]);

  const triggerLike = useCallback(() => {
    triggerFeedback({ vibration: true, animation: 'scale' });
  }, [triggerFeedback]);

  return {
    triggerFeedback,
    triggerSuccess,
    triggerError,
    triggerLike,
  };
}

