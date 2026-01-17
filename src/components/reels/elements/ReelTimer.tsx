import { useEffect, useState } from 'react';

interface ReelTimerProps {
  type: 'countdown' | 'stopwatch';
  initialSeconds?: number;
  onComplete?: () => void;
  className?: string;
}

export function ReelTimer({
  type,
  initialSeconds = 60,
  onComplete,
  className = '',
}: ReelTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (type === 'countdown') {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        } else {
          return prev + 1;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, type, onComplete]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`bg-black/60 backdrop-blur-md rounded-full px-6 py-3 text-white font-bold text-xl ${className}`}
    >
      {formatTime(seconds)}
    </div>
  );
}

