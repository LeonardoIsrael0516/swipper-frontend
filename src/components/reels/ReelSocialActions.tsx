import { useState } from 'react';
import { Heart, Eye } from 'lucide-react';
import { useReelFeedback } from './hooks/useReelFeedback';

interface ReelSocialActionsProps {
  initialLikes?: number;
  initialViews?: number;
  isLiked?: boolean;
  onLike?: (liked: boolean) => void;
}

export function ReelSocialActions({
  initialLikes = 0,
  initialViews = 0,
  isLiked = false,
  onLike,
}: ReelSocialActionsProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [views] = useState(initialViews);
  const { triggerLike } = useReelFeedback();

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    triggerLike();
    onLike?.(newLiked);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="absolute right-4 bottom-1/4 flex flex-col gap-6 z-40">
      {/* Views counter */}
      {views > 0 && (
        <div className="flex flex-col items-center text-white mb-2">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <span className="text-xs mt-1 font-medium">{formatNumber(views)}</span>
        </div>
      )}

      {/* Like button */}
      <button
        onClick={handleLike}
        className="flex flex-col items-center text-white group transition-all duration-200"
      >
        <div
          className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all duration-200 ${
            liked ? 'scale-110 animate-pulse-heart' : 'group-hover:scale-105'
          }`}
        >
          <Heart
            className={`w-6 h-6 transition-colors ${liked ? 'text-red-500' : 'text-white'}`}
            fill={liked ? 'currentColor' : 'none'}
          />
        </div>
        <span className="text-xs mt-1 font-medium">{formatNumber(likes)}</span>
      </button>
    </div>
  );
}

