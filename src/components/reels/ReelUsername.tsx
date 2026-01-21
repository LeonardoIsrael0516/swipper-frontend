import { SocialConfig } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';

interface ReelUsernameProps {
  socialConfig?: SocialConfig;
  className?: string;
}

export function ReelUsername({ socialConfig, className }: ReelUsernameProps) {
  if (!socialConfig?.enabled || !socialConfig?.showUsername || !socialConfig?.username) {
    return null;
  }

  return (
    <div className={cn('absolute left-3 bottom-16 z-40', className)}>
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold text-xs drop-shadow-lg">
          @{socialConfig.username}
        </span>
      </div>
    </div>
  );
}

