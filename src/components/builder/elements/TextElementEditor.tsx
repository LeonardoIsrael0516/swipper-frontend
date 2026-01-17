import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

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

interface TextElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function TextElementEditor({ element, tab }: TextElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [content, setContent] = useState(config.content || '');
  const [alignment, setAlignment] = useState(config.alignment || 'left');
  const [textColor, setTextColor] = useState(config.textColor || '#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor || 'transparent');
  const [fontWeight, setFontWeight] = useState(config.fontWeight || 'normal');
  const [padding, setPadding] = useState(config.padding || { top: 0, right: 0, bottom: 0, left: 0 });
  const [borderRadius, setBorderRadius] = useState(config.borderRadius || 0);

  // Sincronizar conteúdo quando element mudar externamente
  // IMPORTANTE: Quando o elemento muda (novo ID), resetar TODOS os campos para evitar herança
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    // Se é um elemento diferente, resetar todos os campos com os valores do novo elemento
    setContent(normalizedConfig.content || '');
    setAlignment(normalizedConfig.alignment || 'left');
    setTextColor(normalizedConfig.textColor || '#FFFFFF');
    setBackgroundColor(normalizedConfig.backgroundColor || 'transparent');
    setFontWeight(normalizedConfig.fontWeight || 'normal');
    setPadding(normalizedConfig.padding || { top: 0, right: 0, bottom: 0, left: 0 });
    setBorderRadius(normalizedConfig.borderRadius || 0);
  }, [element.id]);

  // Salvar automaticamente com debounce (sem causar loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        content,
        alignment,
        textColor,
        backgroundColor,
        fontWeight,
        padding,
        borderRadius,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    content,
    alignment,
    textColor,
    backgroundColor,
    fontWeight,
    padding,
    borderRadius,
    element.id,
  ]);

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="content">Conteúdo</Label>
          <RichTextEditor value={content} onChange={setContent} />
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
            value={backgroundColor === 'transparent' ? '#000000' : backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value || 'transparent')}
            className="flex-1"
            placeholder="transparent"
          />
        </div>
      </div>
    </div>
  );
}

