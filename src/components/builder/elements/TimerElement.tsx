import { useState, useEffect, useRef } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { Clock } from 'lucide-react';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
const normalizeUiConfig = (uiConfig: any): any => {
  if (!uiConfig) return {};
  if (typeof uiConfig === 'string') {
    try {
      return JSON.parse(uiConfig);
    } catch {
      return {};
    }
  }
  if (typeof uiConfig === 'object' && uiConfig !== null) {
    return uiConfig;
  }
  return {};
};

interface TimerElementProps {
  element: SlideElement;
  reelId?: string; // Opcional para permitir uso em diferentes contextos
}

// Função para formatar segundos em MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function TimerElement({ element, reelId }: TimerElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    title = 'Oferta especial',
    duration = 300, // 5 minutos padrão
    remainingText = 'restantes',
    finalMessage = 'Última chance de aproveitar esta oferta!',
    backgroundColor = '#ffe5e5', // Rosa claro padrão
    textColor = '#ff0026', // Vermelho padrão
    borderRadius = 12,
    padding = { top: 16, right: 16, bottom: 16, left: 16 },
  } = config;

  // Estado para o tempo restante
  const [remainingSeconds, setRemainingSeconds] = useState<number>(duration);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Chave do localStorage
  const storageKey = reelId 
    ? `timer_${element.id}_${reelId}`
    : `timer_${element.id}`;

  // Inicializar timer
  useEffect(() => {
    // Limpar interval anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Tentar recuperar timestamp salvo
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const { startTime, initialDuration } = JSON.parse(savedData);
        
        // Se a duração mudou, reiniciar o timer
        if (initialDuration !== duration) {
          const now = Date.now();
          startTimeRef.current = now;
          localStorage.setItem(storageKey, JSON.stringify({
            startTime: now,
            initialDuration: duration,
          }));
          setRemainingSeconds(duration);
          setIsExpired(false);
        } else {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, initialDuration - elapsed);
          
          if (remaining <= 0) {
            setIsExpired(true);
            setRemainingSeconds(0);
          } else {
            setRemainingSeconds(remaining);
            startTimeRef.current = startTime;
            setIsExpired(false);
          }
        }
      } catch (error) {
        // Se houver erro ao ler, iniciar novo timer
        const now = Date.now();
        startTimeRef.current = now;
        localStorage.setItem(storageKey, JSON.stringify({
          startTime: now,
          initialDuration: duration,
        }));
        setRemainingSeconds(duration);
        setIsExpired(false);
      }
    } else {
      // Primeira vez - iniciar novo timer
      const now = Date.now();
      startTimeRef.current = now;
      localStorage.setItem(storageKey, JSON.stringify({
        startTime: now,
        initialDuration: duration,
      }));
      setRemainingSeconds(duration);
      setIsExpired(false);
    }

    // Configurar interval para atualizar a cada segundo
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Limpar interval ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [storageKey, duration]);

  // Atualizar localStorage quando o tempo mudar
  useEffect(() => {
    if (startTimeRef.current && !isExpired) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      if (remaining > 0) {
        localStorage.setItem(storageKey, JSON.stringify({
          startTime: startTimeRef.current,
          initialDuration: duration,
        }));
      }
    }
  }, [remainingSeconds, storageKey, duration, isExpired]);

  const style: React.CSSProperties = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    padding: padding
      ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`
      : '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div style={style}>
      {isExpired ? (
        <>
          <div style={{ fontWeight: 'bold', fontSize: '18px', textAlign: 'center' }}>
            {title}
          </div>
          <div style={{ fontSize: '14px', textAlign: 'center', opacity: 0.9 }}>
            {finalMessage}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 'bold', fontSize: '18px', textAlign: 'center' }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Clock size={20} style={{ color: textColor }} />
            <span style={{ fontWeight: 'bold', fontSize: '20px' }}>
              {formatTime(remainingSeconds)}
            </span>
            <span style={{ fontSize: '14px', opacity: 0.8 }}>
              {remainingText}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

