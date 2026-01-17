import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', // Formato suportado pela maioria dos navegadores
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        setError('Erro durante a gravação: ' + (event.error?.message || 'Erro desconhecido'));
        toast.error('Erro durante a gravação');
      };

      // Iniciar gravação
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;

      // Atualizar duração a cada segundo
      durationIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000;
        setDuration(Math.floor(elapsed));
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar gravação');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Permissão de microfone negada. Por favor, permita o acesso ao microfone.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('Nenhum microfone encontrado. Verifique se há um microfone conectado.');
      } else {
        toast.error('Erro ao iniciar gravação: ' + (err.message || 'Erro desconhecido'));
      }
      
      // Limpar recursos
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isPaused]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      // Parar gravação
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Parar stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Limpar intervalo de duração
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Aguardar dados finais
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        startTimeRef.current = 0;
        pausedTimeRef.current = 0;
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        resolve(audioBlob);
      };

      // Timeout de segurança
      setTimeout(() => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsRecording(false);
          setIsPaused(false);
          setDuration(0);
          startTimeRef.current = 0;
          pausedTimeRef.current = 0;
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
          resolve(audioBlob);
        } else {
          resolve(null);
        }
      }, 1000);
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      // Adicionar o tempo decorrido desde o último start/resume ao tempo pausado total
      const elapsedSinceStart = Date.now() - startTimeRef.current;
      pausedTimeRef.current += elapsedSinceStart;
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      // Resetar o tempo de início para o momento atual
      startTimeRef.current = Date.now();
    }
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
  };
}

