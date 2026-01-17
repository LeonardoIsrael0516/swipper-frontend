import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

interface ProgressElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function ProgressElementEditor({ element, tab }: ProgressElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [title, setTitle] = useState(config.title || 'Estamos criando o seu plano personalizado');
  const [progress, setProgress] = useState(config.progress ?? 100);
  const [duration, setDuration] = useState(config.duration ?? 5);
  const [destination, setDestination] = useState<'next-slide' | 'url'>(config.destination || 'next-slide');
  const [url, setUrl] = useState(config.url || '');
  const [openInNewTab, setOpenInNewTab] = useState(config.openInNewTab !== false); // default true
  const [layout, setLayout] = useState<'linear' | 'circular' | 'pulse'>(config.layout || 'linear');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor || '#ffffff');
  const [progressColor, setProgressColor] = useState(config.progressColor || '#007bff');
  const [textColor, setTextColor] = useState(config.textColor || '#000000');
  const [borderRadius, setBorderRadius] = useState(config.borderRadius ?? 12);
  const [padding, setPadding] = useState(config.padding || { top: 24, right: 24, bottom: 24, left: 24 });

  // Sincronizar conteúdo quando element mudar externamente
  // IMPORTANTE: Quando o elemento muda (novo ID), resetar TODOS os campos para evitar herança
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    setTitle(normalizedConfig.title || 'Estamos criando o seu plano personalizado');
    setProgress(normalizedConfig.progress ?? 100);
    setDuration(normalizedConfig.duration ?? 5);
    setDestination(normalizedConfig.destination || 'next-slide');
    setUrl(normalizedConfig.url || '');
    setOpenInNewTab(normalizedConfig.openInNewTab !== false);
    // Garantir que layout válido (remover rocket e wave se existirem)
    const validLayout = normalizedConfig.layout === 'circular' || normalizedConfig.layout === 'pulse' 
      ? normalizedConfig.layout 
      : 'linear';
    setLayout(validLayout);
    setBackgroundColor(normalizedConfig.backgroundColor || '#ffffff');
    setProgressColor(normalizedConfig.progressColor || '#007bff');
    setTextColor(normalizedConfig.textColor || '#000000');
    setBorderRadius(normalizedConfig.borderRadius ?? 12);
    setPadding(normalizedConfig.padding || { top: 24, right: 24, bottom: 24, left: 24 });
  }, [element.id]);

  // Salvar automaticamente com debounce (sem causar loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        title,
        progress,
        duration,
        destination,
        url,
        openInNewTab,
        layout,
        backgroundColor,
        progressColor,
        textColor,
        borderRadius,
        padding,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    progress,
    duration,
    destination,
    url,
    openInNewTab,
    layout,
    backgroundColor,
    progressColor,
    textColor,
    borderRadius,
    padding,
    element.id,
  ]);

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="layout">Layout</Label>
          <Select value={layout} onValueChange={(value: 'linear' | 'circular' | 'pulse') => setLayout(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Barra Horizontal</SelectItem>
              <SelectItem value="circular">Círculo</SelectItem>
              <SelectItem value="pulse">Loading Pulsante</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Escolha o estilo visual do progresso
          </p>
        </div>

        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Estamos criando o seu plano personalizado"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="progress">Progresso: {progress}%</Label>
          <Slider
            id="progress"
            min={0}
            max={100}
            step={1}
            value={[progress]}
            onValueChange={([value]) => setProgress(value)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Porcentagem final que o progresso alcançará (0-100%)
          </p>
        </div>

        <div>
          <Label htmlFor="duration">Duração (segundos)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            max={60}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(60, Number(e.target.value) || 5)))}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tempo em segundos para completar o progresso (1-60 segundos)
          </p>
        </div>

        <div>
          <Label>Destino ao Completar</Label>
          <RadioGroup
            value={destination}
            onValueChange={(value: 'next-slide' | 'url') => setDestination(value)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="next-slide" id="destination-next" />
              <Label htmlFor="destination-next" className="font-normal cursor-pointer">
                Próximo Slide
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="destination-url" />
              <Label htmlFor="destination-url" className="font-normal cursor-pointer">
                URL Personalizada
              </Label>
            </div>
          </RadioGroup>
        </div>

        {destination === 'url' && (
          <>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL para redirecionar quando o progresso completar
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="openInNewTab">Abrir em Nova Aba</Label>
              <Switch
                id="openInNewTab"
                checked={openInNewTab}
                onCheckedChange={setOpenInNewTab}
              />
            </div>
          </>
        )}
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

      <div>
        <Label htmlFor="progressColorDesign">Cor do Progresso</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="progressColorDesign"
            type="color"
            value={progressColor}
            onChange={(e) => setProgressColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={progressColor}
            onChange={(e) => setProgressColor(e.target.value)}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Cor da barra/círculo de progresso
        </p>
      </div>
    </div>
  );
}

