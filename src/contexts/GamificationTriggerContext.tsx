import { createContext, useContext, useCallback, useRef, ReactNode } from 'react';

export type GamificationTriggerType = 
  | 'onButtonClick'
  | 'onQuestionAnswer'
  | 'onSlideChange'
  | 'onFormComplete'
  | 'onPointsGained'
  | 'onItemAction';

interface TriggerListener {
  id: string;
  triggerType: GamificationTriggerType;
  callback: (data?: any) => void;
}

interface GamificationTriggerContextType {
  subscribe: (triggerType: GamificationTriggerType, callback: (data?: any) => void) => () => void;
  trigger: (triggerType: GamificationTriggerType, data?: any) => void;
}

const GamificationTriggerContext = createContext<GamificationTriggerContextType | undefined>(undefined);

export function GamificationTriggerProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef<Map<GamificationTriggerType, Set<TriggerListener>>>(new Map());
  const listenerIdCounter = useRef(0);

  const subscribe = useCallback((triggerType: GamificationTriggerType, callback: (data?: any) => void) => {
    const id = `listener-${listenerIdCounter.current++}`;
    const listener: TriggerListener = { id, triggerType, callback };

    if (!listenersRef.current.has(triggerType)) {
      listenersRef.current.set(triggerType, new Set());
    }
    listenersRef.current.get(triggerType)!.add(listener);

    // Retornar função de unsubscribe
    return () => {
      const listeners = listenersRef.current.get(triggerType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          listenersRef.current.delete(triggerType);
        }
      }
    };
  }, []);

  const trigger = useCallback((triggerType: GamificationTriggerType, data?: any) => {
    const listeners = listenersRef.current.get(triggerType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in gamification trigger listener for ${triggerType}:`, error);
        }
      });
    }
  }, []);

  return (
    <GamificationTriggerContext.Provider value={{ subscribe, trigger }}>
      {children}
    </GamificationTriggerContext.Provider>
  );
}

export function useGamificationTrigger() {
  const context = useContext(GamificationTriggerContext);
  if (context === undefined) {
    throw new Error('useGamificationTrigger must be used within a GamificationTriggerProvider');
  }
  return context;
}

