import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

export interface PointsConfig {
  pointsPerAnswer?: number;
  pointsPerCorrectAnswer?: number;
  pointsPerWrongAnswer?: number;
  pointsPerFormComplete?: number;
  pointsPerSlideVisit?: number;
  timeBonusEnabled?: boolean;
  timeBonusMultiplier?: number;
  streakEnabled?: boolean;
  streakMultiplier?: number;
}

export interface PointsGain {
  id: string;
  points: number;
  reason: string;
  timestamp: number;
}

interface PointsContextType {
  totalPoints: number;
  currentStreak: number;
  pointsHistory: PointsGain[];
  config: PointsConfig;
  setConfig: (config: PointsConfig) => void;
  addPoints: (points: number, reason: string) => void;
  resetPoints: () => void;
  subscribeToPointsGained: (callback: (points: number, reason: string) => void) => () => void;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children, reelConfig }: { children: ReactNode; reelConfig?: any }) {
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<PointsGain[]>([]);
  
  // Usar configuração do reel se disponível, senão usar padrões
  const defaultConfig: PointsConfig = reelConfig?.gamificationConfig?.pointsConfig
    ? {
        pointsPerAnswer: reelConfig.gamificationConfig.pointsConfig.pointsPerAnswer || 10,
        pointsPerCorrectAnswer: reelConfig.gamificationConfig.pointsConfig.pointsPerCorrectAnswer || 20,
        pointsPerWrongAnswer: reelConfig.gamificationConfig.pointsConfig.pointsPerWrongAnswer || 5,
        pointsPerFormComplete: reelConfig.gamificationConfig.pointsConfig.pointsPerFormComplete || 50,
        pointsPerSlideVisit: reelConfig.gamificationConfig.pointsConfig.pointsPerSlideVisit || 5,
        timeBonusEnabled: false,
        timeBonusMultiplier: 1.5,
        streakEnabled: false,
        streakMultiplier: 2,
      }
    : {
        pointsPerAnswer: 10,
        pointsPerCorrectAnswer: 20,
        pointsPerWrongAnswer: 5,
        pointsPerFormComplete: 50,
        pointsPerSlideVisit: 5,
        timeBonusEnabled: false,
        timeBonusMultiplier: 1.5,
        streakEnabled: false,
        streakMultiplier: 2,
      };

  const [config, setConfig] = useState<PointsConfig>(defaultConfig);
  
  // Atualizar config quando reelConfig mudar
  useEffect(() => {
    if (reelConfig?.gamificationConfig?.pointsConfig) {
      setConfig({
        pointsPerAnswer: reelConfig.gamificationConfig.pointsConfig.pointsPerAnswer || 10,
        pointsPerCorrectAnswer: reelConfig.gamificationConfig.pointsConfig.pointsPerCorrectAnswer || 20,
        pointsPerWrongAnswer: reelConfig.gamificationConfig.pointsConfig.pointsPerWrongAnswer || 5,
        pointsPerFormComplete: reelConfig.gamificationConfig.pointsConfig.pointsPerFormComplete || 50,
        pointsPerSlideVisit: reelConfig.gamificationConfig.pointsConfig.pointsPerSlideVisit || 5,
        timeBonusEnabled: false,
        timeBonusMultiplier: 1.5,
        streakEnabled: false,
        streakMultiplier: 2,
      });
    }
  }, [reelConfig]);
  const listenersRef = useRef<Set<(points: number, reason: string) => void>>(new Set());

  const subscribeToPointsGained = useCallback((callback: (points: number, reason: string) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const addPoints = useCallback((points: number, reason: string) => {
    if (points <= 0) return;

    setTotalPoints((prev) => {
      const newTotal = prev + points;
      
      // Adicionar ao histórico
      const gain: PointsGain = {
        id: `${Date.now()}-${Math.random()}`,
        points,
        reason,
        timestamp: Date.now(),
      };
      
      setPointsHistory((prevHistory) => [...prevHistory, gain]);
      
      // Chamar todos os listeners
      listenersRef.current.forEach((listener) => {
        listener(points, reason);
      });
      
      return newTotal;
    });
  }, []);

  const resetPoints = useCallback(() => {
    setTotalPoints(0);
    setCurrentStreak(0);
    setPointsHistory([]);
  }, []);

  const updateConfig = useCallback((newConfig: PointsConfig) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <PointsContext.Provider
      value={{
        totalPoints,
        currentStreak,
        pointsHistory,
        config,
        setConfig: updateConfig,
        addPoints,
        resetPoints,
        subscribeToPointsGained,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}

