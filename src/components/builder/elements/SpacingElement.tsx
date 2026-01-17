import { SlideElement } from '@/contexts/BuilderContext';
import { GripVertical } from 'lucide-react';

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

interface SpacingElementProps {
  element: SlideElement;
  isInBuilder?: boolean;
}

export function SpacingElement({ element, isInBuilder = false }: SpacingElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const { height = 20 } = config;

  // Se estiver no builder, mostrar placeholder suave
  if (isInBuilder) {
    const displayHeight = Math.max(height, 24);
    return (
      <div
        style={{
          height: `${displayHeight}px`,
          width: '100%',
          minHeight: '24px',
          border: '2px dashed rgba(148, 163, 184, 0.5)',
          borderRadius: '8px',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
          margin: '4px 0',
        }}
      >
        <div 
          className="flex items-center gap-2 text-xs font-medium" 
          style={{ 
            color: 'rgba(71, 85, 105, 0.9)',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
          }}
        >
          <GripVertical className="w-4 h-4" style={{ color: 'rgba(71, 85, 105, 0.8)' }} />
          <span>Espaçamento {height}px</span>
        </div>
      </div>
    );
  }

  // Na visualização pública, apenas o espaço vazio
  // Garantir que tenha altura mínima e seja sempre medido corretamente
  return (
    <div
      style={{
        height: `${height}px`,
        minHeight: `${height}px`,
        width: '100%',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}

