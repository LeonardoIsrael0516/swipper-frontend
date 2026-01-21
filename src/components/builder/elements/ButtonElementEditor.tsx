import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface ButtonElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function ButtonElementEditor({ element, tab }: ButtonElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [title, setTitle] = useState(config.title || 'Clique aqui');
  const [destination, setDestination] = useState<'next-slide' | 'url'>(config.destination || 'next-slide');
  const [url, setUrl] = useState(config.url || '');
  const [openInNewTab, setOpenInNewTab] = useState(config.openInNewTab !== false); // default true
  const [delayEnabled, setDelayEnabled] = useState(config.delayEnabled || false);
  const [delaySeconds, setDelaySeconds] = useState(config.delaySeconds || 0);
  const [hideSocialElementsOnDelay, setHideSocialElementsOnDelay] = useState(config.hideSocialElementsOnDelay || false);
  const [lockSlide, setLockSlide] = useState(config.lockSlide || false);
  const [columnMode, setColumnMode] = useState(config.columnMode || false);
  const [pulseAnimation, setPulseAnimation] = useState(config.pulseAnimation || false);
  const [colorType, setColorType] = useState<'solid' | 'gradient'>(config.colorType || 'solid');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor || '#007bff');
  const [gradient, setGradient] = useState(config.gradient || {
    direction: 'to right',
    color1: '#007bff',
    color2: '#0056b3',
  });
  const [textColor, setTextColor] = useState(config.textColor || '#ffffff');
  const [strokeEnabled, setStrokeEnabled] = useState(config.strokeEnabled || false);
  const [strokeColor, setStrokeColor] = useState(config.strokeColor || '#000000');
  const [strokeWidth, setStrokeWidth] = useState(config.strokeWidth || 0);
  const [borderRadius, setBorderRadius] = useState(config.borderRadius || 8);
  const [padding, setPadding] = useState(config.padding || { top: 12, right: 24, bottom: 12, left: 24 });

  // Sincronizar conteúdo quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    setTitle(normalizedConfig.title || 'Clique aqui');
    setDestination(normalizedConfig.destination || 'next-slide');
    setUrl(normalizedConfig.url || '');
    setOpenInNewTab(normalizedConfig.openInNewTab !== false);
    setDelayEnabled(normalizedConfig.delayEnabled || false);
    setDelaySeconds(normalizedConfig.delaySeconds || 0);
    setHideSocialElementsOnDelay(normalizedConfig.hideSocialElementsOnDelay || false);
    setLockSlide(normalizedConfig.lockSlide || false);
    setColumnMode(normalizedConfig.columnMode || false);
    setPulseAnimation(normalizedConfig.pulseAnimation || false);
    setColorType(normalizedConfig.colorType || 'solid');
    setBackgroundColor(normalizedConfig.backgroundColor || '#007bff');
    setGradient(normalizedConfig.gradient || {
      direction: 'to right',
      color1: '#007bff',
      color2: '#0056b3',
    });
    setTextColor(normalizedConfig.textColor || '#ffffff');
    setStrokeEnabled(normalizedConfig.strokeEnabled || false);
    setStrokeColor(normalizedConfig.strokeColor || '#000000');
    setStrokeWidth(normalizedConfig.strokeWidth || 0);
    setBorderRadius(normalizedConfig.borderRadius || 8);
    setPadding(normalizedConfig.padding || { top: 12, right: 24, bottom: 12, left: 24 });
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        title,
        destination,
        url,
        openInNewTab,
        delayEnabled,
        delaySeconds,
        hideSocialElementsOnDelay,
        lockSlide,
        columnMode,
        pulseAnimation,
        colorType,
        backgroundColor,
        gradient,
        textColor,
        strokeEnabled,
        strokeColor,
        strokeWidth,
        borderRadius,
        padding,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    destination,
    url,
    openInNewTab,
    delayEnabled,
    delaySeconds,
    hideSocialElementsOnDelay,
    lockSlide,
    columnMode,
    pulseAnimation,
    colorType,
    backgroundColor,
    gradient,
    textColor,
    strokeEnabled,
    strokeColor,
    strokeWidth,
    borderRadius,
    padding,
    element.id,
  ]);

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título do Botão</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Clique aqui"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="destination">Destino</Label>
          <Select value={destination} onValueChange={(value: 'next-slide' | 'url') => setDestination(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="next-slide">Próximo Slide</SelectItem>
              <SelectItem value="url">URL Personalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {destination === 'url' && (
          <>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com"
                className="mt-1"
              />
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

        <div className="flex items-center justify-between">
          <Label htmlFor="delayEnabled">Ativar Delay</Label>
          <Switch
            id="delayEnabled"
            checked={delayEnabled}
            onCheckedChange={setDelayEnabled}
          />
        </div>

        {delayEnabled && (
          <div>
            <Label htmlFor="delaySeconds">Segundos do Delay: {delaySeconds}s</Label>
            <Slider
              id="delaySeconds"
              min={0}
              max={30}
              step={1}
              value={[delaySeconds]}
              onValueChange={([value]) => setDelaySeconds(value)}
              className="mt-2"
            />
          </div>
        )}

        {delayEnabled && (
          <div className="flex items-center justify-between">
            <Label htmlFor="hideSocialElementsOnDelay">Ocultar Elementos Sociais</Label>
            <Switch
              id="hideSocialElementsOnDelay"
              checked={hideSocialElementsOnDelay}
              onCheckedChange={setHideSocialElementsOnDelay}
            />
          </div>
        )}
        {delayEnabled && hideSocialElementsOnDelay && (
          <p className="text-xs text-muted-foreground">
            Quando o botão aparecer (após o delay), os elementos sociais (botões de ação, nome de usuário e legenda) serão ocultados automaticamente.
          </p>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="lockSlide">Travar Slide</Label>
          <Switch
            id="lockSlide"
            checked={lockSlide}
            onCheckedChange={setLockSlide}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Quando habilitado, impede que o usuário avance para o próximo slide sem clicar no botão.
        </p>

        <div className="flex items-center justify-between">
          <Label htmlFor="columnMode">Coluna</Label>
          <Switch
            id="columnMode"
            checked={columnMode}
            onCheckedChange={setColumnMode}
          />
        </div>
        {columnMode && (
          <p className="text-xs text-muted-foreground">
            Quando habilitado, o botão fica compacto e pode ficar lado a lado com outros botões em coluna.
          </p>
        )}
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="pulseAnimation">Animação Pulsante</Label>
        <Switch
          id="pulseAnimation"
          checked={pulseAnimation}
          onCheckedChange={setPulseAnimation}
        />
      </div>

      <div>
        <Label htmlFor="colorType">Tipo de Cor</Label>
        <Select value={colorType} onValueChange={(value: 'solid' | 'gradient') => setColorType(value)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Cor Única</SelectItem>
            <SelectItem value="gradient">Gradiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {colorType === 'solid' ? (
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
      ) : (
        <div className="space-y-3">
          <div>
            <Label htmlFor="gradientDirection">Direção do Gradiente</Label>
            <Select
              value={gradient.direction}
              onValueChange={(value) => setGradient({ ...gradient, direction: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to right">→ Direita</SelectItem>
                <SelectItem value="to left">← Esquerda</SelectItem>
                <SelectItem value="to top">↑ Topo</SelectItem>
                <SelectItem value="to bottom">↓ Baixo</SelectItem>
                <SelectItem value="to bottom right">↘ Diagonal Direita</SelectItem>
                <SelectItem value="to bottom left">↙ Diagonal Esquerda</SelectItem>
                <SelectItem value="to top right">↗ Diagonal Superior Direita</SelectItem>
                <SelectItem value="to top left">↖ Diagonal Superior Esquerda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gradientColor1">Cor 1</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="gradientColor1"
                type="color"
                value={gradient.color1}
                onChange={(e) => setGradient({ ...gradient, color1: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={gradient.color1}
                onChange={(e) => setGradient({ ...gradient, color1: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gradientColor2">Cor 2</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="gradientColor2"
                type="color"
                value={gradient.color2}
                onChange={(e) => setGradient({ ...gradient, color2: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={gradient.color2}
                onChange={(e) => setGradient({ ...gradient, color2: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

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

      <div className="flex items-center justify-between">
        <Label htmlFor="strokeEnabled">Ativar Stroke</Label>
        <Switch
          id="strokeEnabled"
          checked={strokeEnabled}
          onCheckedChange={setStrokeEnabled}
        />
      </div>

      {strokeEnabled && (
        <>
          <div>
            <Label htmlFor="strokeColor">Cor do Stroke</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="strokeColor"
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="strokeWidth">Largura do Stroke: {strokeWidth}px</Label>
            <Slider
              id="strokeWidth"
              min={0}
              max={10}
              step={1}
              value={[strokeWidth]}
              onValueChange={([value]) => setStrokeWidth(value)}
              className="mt-2"
            />
          </div>
        </>
      )}

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
    </div>
  );
}

