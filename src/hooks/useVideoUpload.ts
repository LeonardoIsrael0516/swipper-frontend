import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export type VideoUploadStatus = 'idle' | 'uploading' | 'transcoding' | 'completed' | 'error';

export interface VideoUploadResult {
  videoId: string;
  status: VideoUploadStatus;
  streamId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
}

interface UseVideoUploadOptions {
  onComplete?: (result: VideoUploadResult) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // Intervalo para polling de status (ms)
}

export function useVideoUpload(options: UseVideoUploadOptions = {}) {
  const { onComplete, onError, pollInterval = 10000 } = options; // Aumentado de 3s para 10s

  const [status, setStatus] = useState<VideoUploadStatus>('idle');
  const [result, setResult] = useState<VideoUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoIdRef = useRef<string | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const pollStartTimeRef = useRef<number | null>(null);
  const MAX_POLL_ATTEMPTS = 60; // Máximo de 60 tentativas (10 minutos com intervalo de 10s)
  const MAX_POLL_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos

  const pollVideoStatus = useCallback(
    async (videoId: string) => {
      // Verificar limite de tentativas
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        if (import.meta.env.DEV) {
          console.warn(`[useVideoUpload] Maximum poll attempts (${MAX_POLL_ATTEMPTS}) reached for videoId: ${videoId}`);
        }
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setStatus('error');
        const errorMessage = 'Timeout: O processamento do vídeo está demorando mais que o esperado';
        if (onError) {
          onError(errorMessage);
        }
        toast.error(errorMessage);
        return;
      }

      // Verificar timeout máximo (10 minutos)
      if (pollStartTimeRef.current) {
        const elapsed = Date.now() - pollStartTimeRef.current;
        if (elapsed > MAX_POLL_DURATION) {
          if (import.meta.env.DEV) {
            console.warn(`[useVideoUpload] Maximum poll duration (${MAX_POLL_DURATION}ms) reached for videoId: ${videoId}`);
          }
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setStatus('error');
          const errorMessage = 'Timeout: O processamento do vídeo está demorando mais que o esperado';
          if (onError) {
            onError(errorMessage);
          }
          toast.error(errorMessage);
          return;
        }
      }

      try {
        if (import.meta.env.DEV) {
          console.log(`[useVideoUpload] Polling status for videoId: ${videoId} (attempt ${pollAttemptsRef.current}/${MAX_POLL_ATTEMPTS})`);
        }
        
        const response = await api.get(`/media/videos/${videoId}/status`);
        const data = (response as any).data || response;

        if (import.meta.env.DEV) {
          console.log(`[useVideoUpload] Status response:`, data);
        }

      const currentStatus: VideoUploadStatus =
        data.status === 'completed'
          ? 'completed'
          : data.status === 'failed'
            ? 'error'
            : data.status === 'processing' || data.status === 'pending'
              ? 'transcoding'
              : 'transcoding';

      // Atualizar progress baseado no status
      if (currentStatus === 'transcoding') {
        // Durante transcodificação, incrementar progress gradualmente
        // Se ainda está pending, incrementar mais devagar (30% -> 50%)
        // Se está processing, incrementar mais rápido (50% -> 90%)
        setProgress((prev) => {
          if (data.status === 'pending') {
            // Pending: 30% -> 50% lentamente
            return Math.min(prev + 2, 50);
          } else {
            // Processing: 50% -> 90% mais rápido
            return Math.min(Math.max(prev, 50) + 5, 90);
          }
        });
      }

      setStatus(currentStatus);
      setResult({
        videoId: data.videoId,
        status: currentStatus,
        streamId: data.streamId,
        playbackUrl: data.playbackUrl,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        width: data.width,
        height: data.height,
        error: data.error,
      });

        if (currentStatus === 'completed') {
          // Parar polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Resetar contadores
          pollAttemptsRef.current = 0;
          pollStartTimeRef.current = null;

          // Progress completo
          setProgress(100);

          if (onComplete) {
            onComplete({
              videoId: data.videoId,
              status: 'completed',
              streamId: data.streamId,
              playbackUrl: data.playbackUrl,
              thumbnailUrl: data.thumbnailUrl,
              duration: data.duration,
              width: data.width,
              height: data.height,
            });
          }

          toast.success('Vídeo processado com sucesso!');
        } else if (currentStatus === 'error') {
          // Parar polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Resetar contadores
          pollAttemptsRef.current = 0;
          pollStartTimeRef.current = null;

          const errorMessage = data.error || 'Erro ao processar vídeo';
          setResult((prev) => (prev ? { ...prev, error: errorMessage } : null));

          if (onError) {
            onError(errorMessage);
          }

          toast.error(`Erro ao processar vídeo: ${errorMessage}`);
        }
      } catch (error: any) {
        // Erro ao obter status - pode ser que o vídeo ainda não foi criado no Redis
        // Ou pode ser um erro temporário - continuar tentando por um tempo
        if (import.meta.env.DEV) {
          console.error('Error polling video status:', error);
        }
        
        // Se o erro é "Vídeo não encontrado" e já tentamos algumas vezes, pode ser problema
        // Mas vamos continuar tentando por enquanto (pode ser que o job ainda não processou)
      }
    },
    [onComplete, onError],
  );

  const uploadVideo = useCallback(
    async (file: File, orientation?: 'horizontal' | 'vertical') => {
      if (!file) {
        throw new Error('Arquivo não fornecido');
      }

      // Validar tipo de arquivo
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validVideoTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use MP4, WebM ou MOV');
      }

      // Validar tamanho (200MB)
      const maxSize = 200 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 200MB');
      }

      setStatus('uploading');
      setProgress(0);
      setResult(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
        const token = localStorage.getItem('accessToken');

        // 1. Obter URL de upload direto do backend
        if (import.meta.env.DEV) {
          console.log('[useVideoUpload] Requesting direct upload URL...');
        }

        const uploadUrlResponse = await fetch(`${apiUrl}/media/videos/direct-upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ maxDurationSeconds: 3600 }),
        });

        if (!uploadUrlResponse.ok) {
          const errorData = await uploadUrlResponse.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || 'Erro ao obter URL de upload');
        }

        const uploadUrlData = await uploadUrlResponse.json();
        const { uploadURL, videoId } = uploadUrlData.data || uploadUrlData;

        if (!uploadURL || !videoId) {
          throw new Error('Resposta inválida do servidor: URL de upload não encontrada');
        }

        if (import.meta.env.DEV) {
          console.log('[useVideoUpload] Direct upload URL received:', { uploadURL, videoId });
        }

        // 2. Fazer upload direto para Cloudflare Stream
        return new Promise<{ videoId: string; status: VideoUploadStatus }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Rastrear progresso do upload
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              // Upload vai de 0% a 30% do progresso total
              const uploadProgress = Math.round((event.loaded / event.total) * 30);
              setProgress(uploadProgress);
            }
          });

          xhr.addEventListener('load', async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                videoIdRef.current = videoId;
                setStatus('transcoding');
                setProgress(30); // Upload completo (30%), agora transcodificando (30-100%)

                // Iniciar polling de status
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                }

                // Resetar contadores
                pollAttemptsRef.current = 0;
                pollStartTimeRef.current = Date.now();

                // Polling imediato e depois a cada intervalo
                if (import.meta.env.DEV) {
                  console.log(`[useVideoUpload] Starting polling for videoId: ${videoId}, interval: ${pollInterval}ms, max attempts: ${MAX_POLL_ATTEMPTS}, max duration: ${MAX_POLL_DURATION}ms`);
                }
                
                pollVideoStatus(videoId);
                pollIntervalRef.current = setInterval(() => {
                  if (videoIdRef.current) {
                    if (import.meta.env.DEV) {
                      console.log(`[useVideoUpload] Polling interval tick for videoId: ${videoIdRef.current}`);
                    }
                    pollVideoStatus(videoIdRef.current);
                  } else {
                    if (import.meta.env.DEV) {
                      console.warn(`[useVideoUpload] videoIdRef is null, clearing interval`);
                    }
                    if (pollIntervalRef.current) {
                      clearInterval(pollIntervalRef.current);
                      pollIntervalRef.current = null;
                    }
                  }
                }, pollInterval);

                resolve({
                  videoId,
                  status: 'transcoding' as VideoUploadStatus,
                });
              } catch (error: any) {
                setStatus('error');
                setProgress(0);
                const errorMessage = error.message || 'Erro ao processar resposta do servidor';
                if (onError) {
                  onError(errorMessage);
                }
                toast.error(errorMessage);
                reject(error);
              }
            } else {
              // Erro HTTP
              let errorMessage = `Erro ao fazer upload: ${xhr.statusText}`;
              try {
                const errorData = JSON.parse(xhr.responseText);
                errorMessage = errorData.message || errorData.error || errorMessage;
              } catch {
                // Ignorar erro ao parsear JSON
              }
              
              setStatus('error');
              setProgress(0);
              if (onError) {
                onError(errorMessage);
              }
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener('error', () => {
            setStatus('error');
            setProgress(0);
            const errorMessage = 'Erro de conexão ao fazer upload. Verifique sua conexão e tente novamente.';
            if (onError) {
              onError(errorMessage);
            }
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          });

          xhr.addEventListener('abort', () => {
            setStatus('error');
            setProgress(0);
            const errorMessage = 'Upload cancelado';
            if (onError) {
              onError(errorMessage);
            }
            reject(new Error(errorMessage));
          });

          xhr.addEventListener('timeout', () => {
            setStatus('error');
            setProgress(0);
            const errorMessage = 'Upload demorou muito tempo. O arquivo pode ser muito grande.';
            if (onError) {
              onError(errorMessage);
            }
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          });

          // Configurar e enviar requisição diretamente para Cloudflare Stream
          xhr.open('POST', uploadURL);
          
          // Configurar timeout de 10 minutos para arquivos grandes
          xhr.timeout = 10 * 60 * 1000; // 10 minutos
          
          // Criar FormData para upload
          const formData = new FormData();
          formData.append('file', file);
          
          // Adicionar listener para debug
          if (import.meta.env.DEV) {
            xhr.addEventListener('loadstart', () => {
              console.log('Direct upload started:', file.name, file.size);
            });
            xhr.addEventListener('loadend', () => {
              console.log('Direct upload finished, status:', xhr.status);
            });
          }
          
          xhr.send(formData);
        });
      } catch (error: any) {
        setStatus('error');
        setProgress(0);
        const errorMessage = error.message || 'Erro ao fazer upload do vídeo';

        if (onError) {
          onError(errorMessage);
        }

        toast.error(errorMessage);
        throw error;
      }
    },
    [pollVideoStatus, pollInterval, onError],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setProgress(0);
    videoIdRef.current = null;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Resetar contadores
    pollAttemptsRef.current = 0;
    pollStartTimeRef.current = null;
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      // Resetar contadores
      pollAttemptsRef.current = 0;
      pollStartTimeRef.current = null;
    };
  }, []);

  return {
    status,
    result,
    progress,
    uploadVideo,
    reset,
    isUploading: status === 'uploading',
    isTranscoding: status === 'transcoding',
    isCompleted: status === 'completed',
    isError: status === 'error',
  };
}

