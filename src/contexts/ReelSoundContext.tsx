import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ReelSoundContextType {
  isSoundUnlocked: boolean;
  unlockSound: () => void;
}

const ReelSoundContext = createContext<ReelSoundContextType | undefined>(undefined);

export function ReelSoundProvider({ children }: { children: ReactNode }) {
  const [isSoundUnlocked, setIsSoundUnlocked] = useState(false);

  const unlockSound = useCallback(() => {
    setIsSoundUnlocked(true);
  }, []);

  return (
    <ReelSoundContext.Provider value={{ isSoundUnlocked, unlockSound }}>
      {children}
    </ReelSoundContext.Provider>
  );
}

export function useReelSound() {
  const context = useContext(ReelSoundContext);
  if (context === undefined) {
    throw new Error('useReelSound must be used within a ReelSoundProvider');
  }
  return context;
}

