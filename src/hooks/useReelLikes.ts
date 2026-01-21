import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { generateVisitorId } from '@/lib/cookies';

interface UseReelLikesResult {
  likes: number;
  isLiked: boolean;
  isLoading: boolean;
  error: string | null;
  like: () => Promise<void>;
  unlike: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReelLikes(reelId: string | undefined): UseReelLikesResult {
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const visitorId = generateVisitorId();

  const fetchLikeCount = useCallback(async () => {
    if (!reelId) return;

    try {
      setIsLoading(true);
      setError(null);
      // Usar GET com query params
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/responses/reels/${reelId}/likes?visitorId=${encodeURIComponent(visitorId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar curtidas');
      }
      
      const data = await response.json();
      const result = (data as any).data || data;
      setLikes(result.count || 0);
      setIsLiked(result.isLiked || false);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar curtidas');
      // Não falhar silenciosamente - manter valores anteriores
    } finally {
      setIsLoading(false);
    }
  }, [reelId, visitorId]);

  useEffect(() => {
    fetchLikeCount();
  }, [fetchLikeCount]);

  const like = useCallback(async () => {
    if (!reelId || isLiked) return;

    try {
      setError(null);
      await api.publicPost(`/responses/reels/${reelId}/like`, {
        visitorId,
      });
      setIsLiked(true);
      setLikes((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Erro ao curtir');
      throw err;
    }
  }, [reelId, visitorId, isLiked]);

  const unlike = useCallback(async () => {
    if (!reelId || !isLiked) return;

    try {
      setError(null);
      // Usar fetch diretamente para DELETE público
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/responses/reels/${reelId}/like`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao descurtir');
      }
      
      setIsLiked(false);
      setLikes((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.message || 'Erro ao descurtir');
      throw err;
    }
  }, [reelId, visitorId, isLiked]);

  const refresh = useCallback(async () => {
    await fetchLikeCount();
  }, [fetchLikeCount]);

  return {
    likes,
    isLiked,
    isLoading,
    error,
    like,
    unlike,
    refresh,
  };
}

