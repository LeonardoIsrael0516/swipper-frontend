import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useBuilder } from '@/contexts/BuilderContext';
import { SettingsPage } from './SettingsPage';

interface MobileSettingsOverlayProps {
  onClose: () => void;
}

export function MobileSettingsOverlay({ onClose }: MobileSettingsOverlayProps) {
  const { setSelectedTab } = useBuilder();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Aguardar animação antes de fechar
    setTimeout(() => {
      setSelectedTab('edit');
      onClose();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 bg-background z-50 flex flex-col transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
        <h3 className="text-sm font-semibold">Configurações</h3>
        <Button size="sm" variant="ghost" onClick={handleClose} className="h-7 w-7 p-0">
          <Check className="w-4 h-4" />
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        <SettingsPage />
      </div>
    </div>
  );
}

