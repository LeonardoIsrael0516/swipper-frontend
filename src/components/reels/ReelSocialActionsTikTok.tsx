import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, UserPlus } from 'lucide-react';
import { useReelLikes } from '@/hooks/useReelLikes';
import { SocialConfig } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';

interface ReelSocialActionsTikTokProps {
  reelId: string;
  socialConfig?: SocialConfig;
}

export function ReelSocialActionsTikTok({
  reelId,
  socialConfig,
}: ReelSocialActionsTikTokProps) {
  const { likes, isLiked, like, unlike } = useReelLikes(reelId);
  const initialLikes = socialConfig?.initialLikes || 0;
  // Inicializar com valor inicial se disponível, senão 0
  const [displayLikes, setDisplayLikes] = useState<number>(initialLikes);
  const [displayComments, setDisplayComments] = useState<number>(() => {
    return socialConfig?.initialComments || 0;
  });
  const incrementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fakeIncrementCountRef = useRef<number>(0); // Contador de incrementos fake

  // Inicializar comentários quando socialConfig mudar
  useEffect(() => {
    if (socialConfig?.initialComments !== undefined && socialConfig.initialComments !== null) {
      setDisplayComments(socialConfig.initialComments);
    }
  }, [socialConfig?.initialComments]);

  // Atualizar curtidas quando likes reais ou isLiked mudarem
  useEffect(() => {
    const baseLikes = initialLikes > 0 ? initialLikes : 0;
    // Quando curtiu, somar likes reais (1) ao valor atual
    // Quando não curtiu, likes reais é 0
    const realLikes = isLiked ? likes : 0;
    setDisplayLikes(baseLikes + fakeIncrementCountRef.current + realLikes);
  }, [likes, isLiked, initialLikes]);

  // Incremento progressivo (fake) para curtidas e comentários
  useEffect(() => {
    if (!socialConfig?.enabled) return;

    const interval = socialConfig.incrementInterval || 3; // padrão 3 segundos

    incrementIntervalRef.current = setInterval(() => {
      // Incrementar curtidas fake (apenas visual) - sempre incrementa
      if (socialConfig.showLike) {
        fakeIncrementCountRef.current += 1;
        // Atualizar displayLikes baseado na fórmula: base + fake + real
        // Usar setDisplayLikes com função para garantir que usa valores atualizados
        setDisplayLikes(() => {
          const baseLikes = initialLikes > 0 ? initialLikes : 0;
          const realLikes = isLiked ? likes : 0;
          return baseLikes + fakeIncrementCountRef.current + realLikes;
        });
      }

      // Incrementar comentários fake (apenas visual)
      if (socialConfig.showComment) {
        setDisplayComments((prev) => prev + 1);
      }
    }, interval * 1000);

    return () => {
      if (incrementIntervalRef.current) {
        clearInterval(incrementIntervalRef.current);
      }
    };
  }, [socialConfig, isLiked, likes, initialLikes]);


  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlike();
      } else {
        await like();
        // O displayLikes será atualizado pelo useEffect quando likes mudar
      }
    } catch (error) {
      // Erro já é tratado no hook
    }
  };

  const handleComment = () => {
    // Fake - apenas visual
    setDisplayComments((prev) => prev + 1);
  };

  const handleShare = () => {
    // Fake - apenas visual
    if (navigator.share) {
      navigator.share({
        title: 'Compartilhar',
        text: 'Confira este swipper!',
        url: window.location.href,
      }).catch(() => {
        // Ignorar erro de compartilhamento
      });
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(window.location.href).catch(() => {
        // Ignorar erro
      });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!socialConfig?.enabled) {
    return null;
  }

  return (
    <div className="absolute right-3 bottom-32 flex flex-col gap-4 z-40">
      {/* Avatar com botão + */}
      {socialConfig.showAvatar && (
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white overflow-hidden">
              {socialConfig.avatarUrl ? (
                <img
                  src={socialConfig.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback para gradiente se a imagem falhar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full bg-gray-300';
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
            <button
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center hover:bg-red-600 transition-colors"
              onClick={() => {
                // Fake - apenas visual
              }}
            >
              <UserPlus className="w-2 h-2 text-white drop-shadow-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Botão de Curtir */}
      {socialConfig.showLike && (
        <button
          onClick={handleLike}
          className="flex flex-col items-center text-white group transition-all duration-200"
        >
          <div
              className={cn(
              'w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all duration-200',
              isLiked && 'scale-110'
            )}
          >
            <Heart
              className={cn(
                'w-[17px] h-[17px] transition-colors drop-shadow-md',
                isLiked ? 'text-red-500 fill-red-500' : 'text-white'
              )}
              fill={isLiked ? 'currentColor' : 'none'}
            />
          </div>
          <span className="text-[8.5px] mt-0.5 font-medium text-white drop-shadow-md">{formatNumber(displayLikes)}</span>
        </button>
      )}

      {/* Botão de Comentar */}
      {socialConfig.showComment && (
        <button
          onClick={handleComment}
          className="flex flex-col items-center text-white group transition-all duration-200"
        >
          <div className="w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all duration-200 group-hover:scale-105">
            <MessageCircle className="w-[17px] h-[17px] text-white drop-shadow-md" />
          </div>
          <span className="text-[8.5px] mt-0.5 font-medium text-white drop-shadow-md">{formatNumber(displayComments)}</span>
        </button>
      )}

      {/* Botão de Compartilhar */}
      {socialConfig.showShare && (
        <button
          onClick={handleShare}
          className="flex flex-col items-center text-white group transition-all duration-200"
        >
          <div className="w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all duration-200 group-hover:scale-105">
            <Share2 className="w-[17px] h-[17px] text-white drop-shadow-md" />
          </div>
        </button>
      )}
    </div>
  );
}

