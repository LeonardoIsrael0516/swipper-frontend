import { useEffect, useRef } from 'react';

/**
 * Hook para gerenciar Screen Wake Lock API
 * Mantém a tela acesa quando há mídia (vídeo/áudio) tocando
 */
export function useWakeLock(isMediaPlaying: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Verificar se a API está disponível
    if (!('wakeLock' in navigator)) {
      // Wake Lock API não está disponível (navegador não suporta)
      return;
    }

    const requestWakeLock = async () => {
      try {
        // Solicitar wake lock
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = wakeLock;

        // Listener para quando o wake lock é liberado (ex: usuário minimiza a página)
        wakeLock.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch (err) {
        // Wake lock pode falhar por várias razões (ex: bateria baixa, permissões)
        // Silenciosamente falhar
        if (import.meta.env.DEV) {
          console.debug('[useWakeLock] Falha ao solicitar wake lock:', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (err) {
          // Wake lock já foi liberado ou não está mais ativo
          if (import.meta.env.DEV) {
            console.debug('[useWakeLock] Falha ao liberar wake lock:', err);
          }
        }
      }
    };

    // Solicitar wake lock quando mídia estiver tocando
    if (isMediaPlaying) {
      requestWakeLock();
    } else {
      // Liberar wake lock quando mídia parar
      releaseWakeLock();
    }

    // Cleanup: liberar wake lock quando componente desmontar ou mídia parar
    return () => {
      releaseWakeLock();
    };
  }, [isMediaPlaying]);

  // Função para liberar wake lock manualmente (útil quando página perde foco)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && wakeLockRef.current) {
        // Página perdeu foco, liberar wake lock
        wakeLockRef.current.release().catch(() => {
          // Ignorar erros
        });
        wakeLockRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

