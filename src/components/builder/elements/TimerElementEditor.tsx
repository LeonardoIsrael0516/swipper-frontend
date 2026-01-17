import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
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

interface TimerElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function TimerElementEditor({ element, tab }: TimerElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [title, setTitle] = useState(config.title || 'Oferta especial');
  const [duration, setDuration] = useState(config.duration || 300);
  const [remainingText, setRemainingText] = useState(config.remainingText || 'restantes');
  const [finalMessage, setFinalMessage] = useState(config.finalMessage || 'Última chance de aproveitar esta oferta!');
  const [textColor, setTextColor] = useState(config.textColor || '#ff0026');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor || '#ffe5e5');
  const [borderRadius, setBorderRadius] = useState(config.borderRadius || 12);
  const [padding, setPadding] = useState(config.padding || { top: 16, right: 16, bottom: 16, left: 16 });

  // Sincronizar conteúdo quando element mudar externamente
  // IMPORTANTE: Quando o elemento muda (novo ID), resetar TODOS os campos para evitar herança
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    // Se é um elemento diferente, resetar todos os campos com os valores do novo elemento
    setTitle(normalizedConfig.title || 'Oferta especial');
    setDuration(normalizedConfig.duration || 300);
    setRemainingText(normalizedConfig.remainingText || 'restantes');
    setFinalMessage(normalizedConfig.finalMessage || 'Última chance de aproveitar esta oferta!');
    setTextColor(normalizedConfig.textColor || '#ff0026');
    setBackgroundColor(normalizedConfig.backgroundColor || '#ffe5e5');
    setBorderRadius(normalizedConfig.borderRadius || 12);
    setPadding(normalizedConfig.padding || { top: 16, right: 16, bottom: 16, left: 16 });
  }, [element.id]);

  // Salvar automaticamente com debounce (sem causar loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        title,
        duration,
        remainingText,
        finalMessage,
        textColor,
        backgroundColor,
        borderRadius,
        padding,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    duration,
    remainingText,
    finalMessage,
    textColor,
    backgroundColor,
    borderRadius,
    padding,
    element.id,
  ]);

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Oferta especial"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="duration">Duração (segundos)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 300)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.floor(duration / 60)} min {duration % 60} seg
          </p>
        </div>

        <div>
          <Label htmlFor="remainingText">Texto "Restantes"</Label>
          <Input
            id="remainingText"
            value={remainingText}
            onChange={(e) => setRemainingText(e.target.value)}
            placeholder="restantes"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="finalMessage">Mensagem Final</Label>
          <Textarea
            id="finalMessage"
            value={finalMessage}
            onChange={(e) => setFinalMessage(e.target.value)}
            placeholder="Última chance de aproveitar esta oferta!"
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="borderRadius">Borda Arredondada: {borderRadius}px</Label>
        <Slider
          id="borderRadius"
          min={0}
          max={100}
          step={1}
          value={[borderRadius]}
          onValueChange={([value]) => setBorderRadius(value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Espaço Interno (Padding)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <Label htmlFor="paddingTop" className="text-xs">
              Topo
            </Label>
            <Input
              id="paddingTop"
              type="number"
              min={0}
              value={padding.top || 0}
              onChange={(e) => setPadding({ ...padding, top: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="paddingRight" className="text-xs">
              Direita
            </Label>
            <Input
              id="paddingRight"
              type="number"
              min={0}
              value={padding.right || 0}
              onChange={(e) => setPadding({ ...padding, right: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="paddingBottom" className="text-xs">
              Inferior
            </Label>
            <Input
              id="paddingBottom"
              type="number"
              min={0}
              value={padding.bottom || 0}
              onChange={(e) => setPadding({ ...padding, bottom: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="paddingLeft" className="text-xs">
              Esquerda
            </Label>
            <Input
              id="paddingLeft"
              type="number"
              min={0}
              value={padding.left || 0}
              onChange={(e) => setPadding({ ...padding, left: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="textColorDesign">Cor do Texto</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="textColorDesign"
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="backgroundColorDesign">Cor de Fundo</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="backgroundColorDesign"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

