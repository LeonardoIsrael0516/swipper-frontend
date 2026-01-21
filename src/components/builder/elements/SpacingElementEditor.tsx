import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';

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

interface SpacingElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

// Limite máximo fixo de espaçamento
const MAX_SPACING = 500;

export function SpacingElementEditor({ element, tab }: SpacingElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [height, setHeight] = useState(config.height || 20);

  // Sincronizar altura quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    const newHeight = Math.round(normalizedConfig.height || 20);
    setHeight(newHeight);
    
    // Se a altura atual exceder o máximo, ajustar
    if (newHeight > MAX_SPACING) {
      setHeight(MAX_SPACING);
    }
  }, [element.id]);

  // Salvar automaticamente com debounce (sem causar loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        height,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, element.id]);

  // Elemento de espaçamento não tem conteúdo, apenas design
  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          O elemento de espaçamento não possui conteúdo. Configure o tamanho na aba Design.
        </p>
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="height">
          Tamanho do Espaçamento: {Math.round(height)}px
          <span className="text-xs text-muted-foreground ml-2">
            (Máx: {MAX_SPACING}px)
          </span>
        </Label>
        <Slider
          id="height"
          min={0}
          max={MAX_SPACING}
          step={1}
          value={[height]}
          onValueChange={([value]) => {
            const clampedValue = Math.round(Math.min(value, MAX_SPACING));
            setHeight(clampedValue);
          }}
          className="mt-2"
        />
        {height > MAX_SPACING * 0.75 && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 Espaçamentos muito grandes podem fazer o conteúdo ser reduzido automaticamente no mobile.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="heightInput">Valor Exato (px)</Label>
        <Input
          id="heightInput"
          type="number"
          min={0}
          max={MAX_SPACING}
          value={Math.round(height)}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (!isNaN(value) && value >= 0) {
              const clampedValue = Math.round(Math.min(value, MAX_SPACING));
              setHeight(clampedValue);
            }
          }}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Máximo permitido: {MAX_SPACING}px
        </p>
      </div>
    </div>
  );
}

