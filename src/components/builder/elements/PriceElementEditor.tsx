import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { Plus, Trash2, GripVertical, Copy, Upload, Loader2 } from 'lucide-react';
import { IconEmojiSelector } from './IconEmojiSelector';
import { uploadFile } from '@/lib/media';
import { toast } from 'sonner';

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

// Função para gerar ID único
const generateId = () => `benefit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface PriceElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function PriceElementEditor({ element, tab }: PriceElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados - Conteúdo
  const [price, setPrice] = useState(config.price ?? 99);
  const [currency, setCurrency] = useState(config.currency ?? 'R$');
  const [period, setPeriod] = useState(config.period ?? '');
  const [originalPrice, setOriginalPrice] = useState(config.originalPrice);
  const [discount, setDiscount] = useState(config.discount);
  const [title, setTitle] = useState(config.title ?? '');
  const [subtitle, setSubtitle] = useState(config.subtitle ?? '');
  const [description, setDescription] = useState(config.description ?? '');
  const [benefits, setBenefits] = useState(config.benefits ?? []);
  const [showBenefits, setShowBenefits] = useState(config.showBenefits ?? false);
  const [buttonTitle, setButtonTitle] = useState(config.buttonTitle ?? 'Comprar Agora');
  const [buttonUrl, setButtonUrl] = useState(config.buttonUrl ?? '');
  const [buttonOpenInNewTab, setButtonOpenInNewTab] = useState(config.buttonOpenInNewTab !== false);
  const [buttonIcon, setButtonIcon] = useState(config.buttonIcon ?? '');

  // Estados - Design
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient' | 'image'>(config.backgroundType ?? 'solid');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor ?? '#1a1a1a');
  const [backgroundGradient, setBackgroundGradient] = useState(config.backgroundGradient ?? {
    direction: 'to right',
    color1: '#1a1a1a',
    color2: '#2a2a2a',
  });
  const [backgroundImage, setBackgroundImage] = useState(config.backgroundImage ?? '');
  const [backgroundOverlayEnabled, setBackgroundOverlayEnabled] = useState(config.backgroundOverlay?.enabled ?? false);
  const [backgroundOverlayColor, setBackgroundOverlayColor] = useState(config.backgroundOverlay?.color ?? '#000000');
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(config.backgroundOverlay?.opacity !== undefined ? config.backgroundOverlay.opacity : 0.5);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [titleColor, setTitleColor] = useState(config.titleColor ?? '#ffffff');
  const [subtitleColor, setSubtitleColor] = useState(config.subtitleColor ?? '#cccccc');
  const [priceColor, setPriceColor] = useState(config.priceColor ?? '#ffffff');
  const [originalPriceColor, setOriginalPriceColor] = useState(config.originalPriceColor ?? '#999999');
  const [currencyColor, setCurrencyColor] = useState(config.currencyColor);
  const [periodColor, setPeriodColor] = useState(config.periodColor ?? '#cccccc');
  const [descriptionColor, setDescriptionColor] = useState(config.descriptionColor ?? '#cccccc');
  const [benefitsTextColor, setBenefitsTextColor] = useState(config.benefitsTextColor ?? '#ffffff');
  const [buttonColorType, setButtonColorType] = useState<'solid' | 'gradient'>(config.buttonColorType ?? 'solid');
  const [buttonBackgroundColor, setButtonBackgroundColor] = useState(config.buttonBackgroundColor ?? '#25D366');
  const [buttonGradient, setButtonGradient] = useState(config.buttonGradient ?? {
    direction: 'to right',
    color1: '#25D366',
    color2: '#20B858',
  });
  const [buttonTextColor, setButtonTextColor] = useState(config.buttonTextColor ?? '#ffffff');
  const [buttonStrokeEnabled, setButtonStrokeEnabled] = useState(config.buttonStrokeEnabled ?? false);
  const [buttonStrokeColor, setButtonStrokeColor] = useState(config.buttonStrokeColor ?? '#000000');
  const [buttonStrokeWidth, setButtonStrokeWidth] = useState(config.buttonStrokeWidth ?? 0);
  const [buttonBorderRadius, setButtonBorderRadius] = useState(config.buttonBorderRadius ?? 12);
  const [buttonPadding, setButtonPadding] = useState(config.buttonPadding ?? { top: 14, right: 28, bottom: 14, left: 28 });
  const [cardStrokeEnabled, setCardStrokeEnabled] = useState(config.cardStrokeEnabled ?? false);
  const [cardStrokeColor, setCardStrokeColor] = useState(config.cardStrokeColor ?? '#333333');
  const [cardStrokeWidth, setCardStrokeWidth] = useState(config.cardStrokeWidth ?? 1);
  const [cardBorderRadius, setCardBorderRadius] = useState(config.cardBorderRadius ?? 16);
  const [cardPadding, setCardPadding] = useState(config.cardPadding ?? { top: 24, right: 24, bottom: 24, left: 24 });
  const [cardShadow, setCardShadow] = useState(config.cardShadow !== false);
  const [cardShadowColor, setCardShadowColor] = useState(config.cardShadowColor ?? 'rgba(0, 0, 0, 0.3)');

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    setPrice(normalizedConfig.price ?? 99);
    setCurrency(normalizedConfig.currency ?? 'R$');
    setPeriod(normalizedConfig.period ?? '');
    setOriginalPrice(normalizedConfig.originalPrice);
    setDiscount(normalizedConfig.discount);
    setTitle(normalizedConfig.title ?? '');
    setSubtitle(normalizedConfig.subtitle ?? '');
    setDescription(normalizedConfig.description ?? '');
    setBenefits(normalizedConfig.benefits ?? []);
    setShowBenefits(normalizedConfig.showBenefits ?? false);
    setButtonTitle(normalizedConfig.buttonTitle ?? 'Comprar Agora');
    setButtonUrl(normalizedConfig.buttonUrl ?? '');
    setButtonOpenInNewTab(normalizedConfig.buttonOpenInNewTab !== false);
    setButtonIcon(normalizedConfig.buttonIcon ?? '');
    setBackgroundType(normalizedConfig.backgroundType ?? 'solid');
    setBackgroundColor(normalizedConfig.backgroundColor ?? '#1a1a1a');
    setBackgroundGradient(normalizedConfig.backgroundGradient ?? {
      direction: 'to right',
      color1: '#1a1a1a',
      color2: '#2a2a2a',
    });
    setBackgroundImage(normalizedConfig.backgroundImage ?? '');
    setBackgroundOverlayEnabled(normalizedConfig.backgroundOverlay?.enabled ?? false);
    setBackgroundOverlayColor(normalizedConfig.backgroundOverlay?.color ?? '#000000');
    setBackgroundOverlayOpacity(normalizedConfig.backgroundOverlay?.opacity !== undefined ? normalizedConfig.backgroundOverlay.opacity : 0.5);
    setTitleColor(normalizedConfig.titleColor ?? '#ffffff');
    setSubtitleColor(normalizedConfig.subtitleColor ?? '#cccccc');
    setPriceColor(normalizedConfig.priceColor ?? '#ffffff');
    setOriginalPriceColor(normalizedConfig.originalPriceColor ?? '#999999');
    setCurrencyColor(normalizedConfig.currencyColor);
    setPeriodColor(normalizedConfig.periodColor ?? '#cccccc');
    setDescriptionColor(normalizedConfig.descriptionColor ?? '#cccccc');
    setBenefitsTextColor(normalizedConfig.benefitsTextColor ?? '#ffffff');
    setButtonColorType(normalizedConfig.buttonColorType ?? 'solid');
    setButtonBackgroundColor(normalizedConfig.buttonBackgroundColor ?? '#25D366');
    setButtonGradient(normalizedConfig.buttonGradient ?? {
      direction: 'to right',
      color1: '#25D366',
      color2: '#20B858',
    });
    setButtonTextColor(normalizedConfig.buttonTextColor ?? '#ffffff');
    setButtonStrokeEnabled(normalizedConfig.buttonStrokeEnabled ?? false);
    setButtonStrokeColor(normalizedConfig.buttonStrokeColor ?? '#000000');
    setButtonStrokeWidth(normalizedConfig.buttonStrokeWidth ?? 0);
    setButtonBorderRadius(normalizedConfig.buttonBorderRadius ?? 12);
    setButtonPadding(normalizedConfig.buttonPadding ?? { top: 14, right: 28, bottom: 14, left: 28 });
    setCardStrokeEnabled(normalizedConfig.cardStrokeEnabled ?? false);
    setCardStrokeColor(normalizedConfig.cardStrokeColor ?? '#333333');
    setCardStrokeWidth(normalizedConfig.cardStrokeWidth ?? 1);
    setCardBorderRadius(normalizedConfig.cardBorderRadius ?? 16);
    setCardPadding(normalizedConfig.cardPadding ?? { top: 24, right: 24, bottom: 24, left: 24 });
    setCardShadow(normalizedConfig.cardShadow !== false);
    setCardShadowColor(normalizedConfig.cardShadowColor ?? 'rgba(0, 0, 0, 0.3)');
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        price,
        currency,
        period,
        originalPrice,
        discount,
        title,
        subtitle,
        description,
        benefits,
        showBenefits,
        buttonTitle,
        buttonUrl,
        buttonOpenInNewTab,
        buttonIcon,
        backgroundType,
        backgroundColor,
        backgroundGradient,
        backgroundImage,
        backgroundOverlay: {
          enabled: backgroundOverlayEnabled,
          color: backgroundOverlayColor,
          opacity: backgroundOverlayOpacity,
        },
        titleColor,
        subtitleColor,
        priceColor,
        originalPriceColor,
        currencyColor,
        periodColor,
        descriptionColor,
        benefitsTextColor,
        buttonColorType,
        buttonBackgroundColor,
        buttonGradient,
        buttonTextColor,
        buttonStrokeEnabled,
        buttonStrokeColor,
        buttonStrokeWidth,
        buttonBorderRadius,
        buttonPadding,
        cardStrokeEnabled,
        cardStrokeColor,
        cardStrokeWidth,
        cardBorderRadius,
        cardPadding,
        cardShadow,
        cardShadowColor,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    price,
    currency,
    period,
    originalPrice,
    discount,
    title,
    subtitle,
    description,
    benefits,
    showBenefits,
    buttonTitle,
    buttonUrl,
    buttonOpenInNewTab,
    buttonIcon,
    backgroundType,
    backgroundColor,
    backgroundGradient,
    backgroundImage,
    backgroundOverlayEnabled,
    backgroundOverlayColor,
    backgroundOverlayOpacity,
    titleColor,
    subtitleColor,
    priceColor,
    originalPriceColor,
    currencyColor,
    periodColor,
    descriptionColor,
    benefitsTextColor,
    buttonColorType,
    buttonBackgroundColor,
    buttonGradient,
    buttonTextColor,
    buttonStrokeEnabled,
    buttonStrokeColor,
    buttonStrokeWidth,
    buttonBorderRadius,
    buttonPadding,
    cardStrokeEnabled,
    cardStrokeColor,
    cardStrokeWidth,
    cardBorderRadius,
    cardPadding,
    cardShadow,
    cardShadowColor,
    element.id,
  ]);

  const addBenefit = () => {
    const newBenefit = {
      id: generateId(),
      text: 'Novo benefício',
      icon: '',
    };
    setBenefits([...benefits, newBenefit]);
  };

  const removeBenefit = (benefitId: string) => {
    setBenefits(benefits.filter((benefit: any) => benefit.id !== benefitId));
  };

  const duplicateBenefit = (benefitId: string) => {
    const benefitToDuplicate = benefits.find((benefit: any) => benefit.id === benefitId);
    if (!benefitToDuplicate) return;

    const duplicatedBenefit = {
      ...benefitToDuplicate,
      id: generateId(),
      text: `${benefitToDuplicate.text || 'Benefício'} (cópia)`,
    };

    const benefitIndex = benefits.findIndex((benefit: any) => benefit.id === benefitId);
    const newBenefits = [...benefits];
    newBenefits.splice(benefitIndex + 1, 0, duplicatedBenefit);
    setBenefits(newBenefits);
  };

  const updateBenefit = (benefitId: string, updates: Partial<any>) => {
    setBenefits(benefits.map((benefit: any) => 
      benefit.id === benefitId ? { ...benefit, ...updates } : benefit
    ));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = benefits.findIndex((benefit: any) => benefit.id === active.id);
    const newIndex = benefits.findIndex((benefit: any) => benefit.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setBenefits(arrayMove(benefits, oldIndex, newIndex));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const url = await uploadFile(file);
      
      // Validar URL antes de salvar
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('URL inválida retornada do servidor. Verifique a configuração do R2.');
      }
      
      setBackgroundImage(url);
      
      // Atualizar elemento imediatamente
      await updateElement(element.id, {
        backgroundImage: url,
        backgroundOverlay: {
          enabled: backgroundOverlayEnabled,
          color: backgroundOverlayColor,
          opacity: backgroundOverlayOpacity,
        },
      });
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer upload: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingImage(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Componente SortableBenefitItem
  function SortableBenefitItem({ benefit, benefitIndex, updateBenefit, removeBenefit, duplicateBenefit }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: benefit.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <AccordionItem value={benefit.id}>
          <AccordionTrigger className="py-2">
            <div className="flex items-center gap-2 flex-1">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">
                {benefit.text || `Benefício ${benefitIndex + 1}`}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div>
              <Label>Texto do Benefício</Label>
              <Input
                value={benefit.text || ''}
                onChange={(e) => updateBenefit(benefit.id, { text: e.target.value })}
                placeholder="Texto do benefício"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Ícone/Emoji (Opcional)</Label>
              <IconEmojiSelector
                value={benefit.icon || ''}
                onChange={(value) => updateBenefit(benefit.id, { icon: value })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => duplicateBenefit(benefit.id)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeBenefit(benefit.id)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remover
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </div>
    );
  }

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        {/* Preços */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Preços</h4>
          
          <div>
            <Label htmlFor="price">Preço Principal</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="99.00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="currency">Moeda</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="R$"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="period">Período (Opcional)</Label>
            <Input
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="/mês, /ano, etc"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="originalPrice">Preço Anterior (Opcional)</Label>
            <Input
              id="originalPrice"
              type="number"
              min="0"
              step="0.01"
              value={originalPrice || ''}
              onChange={(e) => setOriginalPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="997.00"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Será exibido riscado para mostrar desconto
            </p>
          </div>

          <div>
            <Label htmlFor="discount">Desconto % (Opcional)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={discount || ''}
              onChange={(e) => setDiscount(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="90"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se não informado, será calculado automaticamente baseado no preço anterior
            </p>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Informações</h4>
          
          <div>
            <Label htmlFor="title">Título (Opcional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do card"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subtitle">Subtítulo (Opcional)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtítulo"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do produto/oferta"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Lista de Benefícios */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Lista de Benefícios</h4>
            <div className="flex items-center gap-2">
              <Switch
                checked={showBenefits}
                onCheckedChange={setShowBenefits}
              />
              <Label className="text-xs">Mostrar</Label>
            </div>
          </div>

          {showBenefits && (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={benefits.map((b: any) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Accordion type="multiple" className="w-full">
                    {benefits.map((benefit: any, index: number) => (
                      <SortableBenefitItem
                        key={benefit.id}
                        benefit={benefit}
                        benefitIndex={index}
                        updateBenefit={updateBenefit}
                        removeBenefit={removeBenefit}
                        duplicateBenefit={duplicateBenefit}
                      />
                    ))}
                  </Accordion>
                </SortableContext>
              </DndContext>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBenefit}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Benefício
              </Button>
            </>
          )}
        </div>

        {/* Botão de Compra */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Botão de Compra</h4>
          
          <div>
            <Label htmlFor="buttonTitle">Título do Botão</Label>
            <Input
              id="buttonTitle"
              value={buttonTitle}
              onChange={(e) => setButtonTitle(e.target.value)}
              placeholder="Comprar Agora"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="buttonIcon">Ícone/Emoji (Opcional)</Label>
            <IconEmojiSelector
              value={buttonIcon}
              onChange={setButtonIcon}
            />
          </div>

          <div>
            <Label htmlFor="buttonUrl">URL do Botão</Label>
            <Input
              id="buttonUrl"
              type="url"
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
              placeholder="https://exemplo.com/checkout"
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="buttonOpenInNewTab">Abrir em Nova Aba</Label>
            <Switch
              id="buttonOpenInNewTab"
              checked={buttonOpenInNewTab}
              onCheckedChange={setButtonOpenInNewTab}
            />
          </div>
        </div>
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      {/* Fundo do Card */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Fundo do Card</h4>
        
        <div>
          <Label htmlFor="backgroundType">Tipo de Fundo</Label>
          <Select value={backgroundType} onValueChange={(value: 'solid' | 'gradient' | 'image') => setBackgroundType(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Cor Única</SelectItem>
              <SelectItem value="gradient">Gradiente</SelectItem>
              <SelectItem value="image">Imagem</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {backgroundType === 'solid' && (
          <div>
            <Label htmlFor="backgroundColor">Cor de Fundo</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="backgroundColor"
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
        )}

        {backgroundType === 'gradient' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="gradientDirection">Direção do Gradiente</Label>
              <Select
                value={backgroundGradient.direction}
                onValueChange={(value) => setBackgroundGradient({ ...backgroundGradient, direction: value })}
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
                  <SelectItem value="radial">○ Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gradientColor1">Cor 1</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="gradientColor1"
                  type="color"
                  value={backgroundGradient.color1}
                  onChange={(e) => setBackgroundGradient({ ...backgroundGradient, color1: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={backgroundGradient.color1}
                  onChange={(e) => setBackgroundGradient({ ...backgroundGradient, color1: e.target.value })}
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
                  value={backgroundGradient.color2}
                  onChange={(e) => setBackgroundGradient({ ...backgroundGradient, color2: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={backgroundGradient.color2}
                  onChange={(e) => setBackgroundGradient({ ...backgroundGradient, color2: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {backgroundType === 'image' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="backgroundImage">Imagem de Fundo</Label>
              <div className="mt-1 space-y-2">
                <input
                  ref={fileInputRef}
                  id="backgroundImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {backgroundImage ? 'Alterar Imagem' : 'Upload Imagem'}
                    </>
                  )}
                </Button>
                {backgroundImage && (
                  <div className="relative">
                    <img
                      src={backgroundImage}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setBackgroundImage('');
                        updateElement(element.id, {
                          backgroundImage: '',
                        });
                      }}
                      className="absolute top-2 right-2"
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="backgroundOverlayEnabled">Overlay</Label>
              <Switch
                id="backgroundOverlayEnabled"
                checked={backgroundOverlayEnabled}
                onCheckedChange={setBackgroundOverlayEnabled}
              />
            </div>

            {backgroundOverlayEnabled && (
              <>
                <div>
                  <Label htmlFor="backgroundOverlayColor">Cor do Overlay</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="backgroundOverlayColor"
                      type="color"
                      value={backgroundOverlayColor}
                      onChange={(e) => setBackgroundOverlayColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={backgroundOverlayColor}
                      onChange={(e) => setBackgroundOverlayColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundOverlayOpacity">Opacidade do Overlay: {Math.round(backgroundOverlayOpacity * 100)}%</Label>
                  <Slider
                    id="backgroundOverlayOpacity"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[backgroundOverlayOpacity]}
                    onValueChange={([value]) => setBackgroundOverlayOpacity(value)}
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cores de Texto */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Cores de Texto</h4>
        
        <div>
          <Label htmlFor="titleColor">Cor do Título</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="titleColor"
              type="color"
              value={titleColor}
              onChange={(e) => setTitleColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={titleColor}
              onChange={(e) => setTitleColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="subtitleColor">Cor do Subtítulo</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="subtitleColor"
              type="color"
              value={subtitleColor}
              onChange={(e) => setSubtitleColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={subtitleColor}
              onChange={(e) => setSubtitleColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="priceColor">Cor do Preço</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="priceColor"
              type="color"
              value={priceColor}
              onChange={(e) => setPriceColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={priceColor}
              onChange={(e) => setPriceColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="originalPriceColor">Cor do Preço Anterior</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="originalPriceColor"
              type="color"
              value={originalPriceColor}
              onChange={(e) => setOriginalPriceColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={originalPriceColor}
              onChange={(e) => setOriginalPriceColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="currencyColor">Cor da Moeda (Opcional)</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="currencyColor"
              type="color"
              value={currencyColor || priceColor}
              onChange={(e) => setCurrencyColor(e.target.value || undefined)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={currencyColor || ''}
              onChange={(e) => setCurrencyColor(e.target.value || undefined)}
              placeholder="Usa cor do preço se vazio"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="periodColor">Cor do Período</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="periodColor"
              type="color"
              value={periodColor}
              onChange={(e) => setPeriodColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={periodColor}
              onChange={(e) => setPeriodColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="descriptionColor">Cor da Descrição</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="descriptionColor"
              type="color"
              value={descriptionColor}
              onChange={(e) => setDescriptionColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={descriptionColor}
              onChange={(e) => setDescriptionColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="benefitsTextColor">Cor dos Benefícios</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="benefitsTextColor"
              type="color"
              value={benefitsTextColor}
              onChange={(e) => setBenefitsTextColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={benefitsTextColor}
              onChange={(e) => setBenefitsTextColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Design do Botão */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Design do Botão</h4>
        
        <div>
          <Label htmlFor="buttonColorType">Tipo de Cor do Botão</Label>
          <Select value={buttonColorType} onValueChange={(value: 'solid' | 'gradient') => setButtonColorType(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Cor Única</SelectItem>
              <SelectItem value="gradient">Gradiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {buttonColorType === 'solid' ? (
          <div>
            <Label htmlFor="buttonBackgroundColor">Cor de Fundo do Botão</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="buttonBackgroundColor"
                type="color"
                value={buttonBackgroundColor}
                onChange={(e) => setButtonBackgroundColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={buttonBackgroundColor}
                onChange={(e) => setButtonBackgroundColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="buttonGradientDirection">Direção do Gradiente</Label>
              <Select
                value={buttonGradient.direction}
                onValueChange={(value) => setButtonGradient({ ...buttonGradient, direction: value })}
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
                  <SelectItem value="radial">○ Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="buttonGradientColor1">Cor 1</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="buttonGradientColor1"
                  type="color"
                  value={buttonGradient.color1}
                  onChange={(e) => setButtonGradient({ ...buttonGradient, color1: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={buttonGradient.color1}
                  onChange={(e) => setButtonGradient({ ...buttonGradient, color1: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="buttonGradientColor2">Cor 2</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="buttonGradientColor2"
                  type="color"
                  value={buttonGradient.color2}
                  onChange={(e) => setButtonGradient({ ...buttonGradient, color2: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={buttonGradient.color2}
                  onChange={(e) => setButtonGradient({ ...buttonGradient, color2: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="buttonTextColor">Cor do Texto do Botão</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="buttonTextColor"
              type="color"
              value={buttonTextColor}
              onChange={(e) => setButtonTextColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={buttonTextColor}
              onChange={(e) => setButtonTextColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="buttonStrokeEnabled">Borda do Botão</Label>
          <Switch
            id="buttonStrokeEnabled"
            checked={buttonStrokeEnabled}
            onCheckedChange={setButtonStrokeEnabled}
          />
        </div>

        {buttonStrokeEnabled && (
          <>
            <div>
              <Label htmlFor="buttonStrokeColor">Cor da Borda</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="buttonStrokeColor"
                  type="color"
                  value={buttonStrokeColor}
                  onChange={(e) => setButtonStrokeColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={buttonStrokeColor}
                  onChange={(e) => setButtonStrokeColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buttonStrokeWidth">Espessura da Borda: {buttonStrokeWidth}px</Label>
              <Slider
                id="buttonStrokeWidth"
                min={0}
                max={10}
                step={1}
                value={[buttonStrokeWidth]}
                onValueChange={([value]) => setButtonStrokeWidth(value)}
                className="mt-2"
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="buttonBorderRadius">Raio da Borda: {buttonBorderRadius}px</Label>
          <Slider
            id="buttonBorderRadius"
            min={0}
            max={50}
            step={1}
            value={[buttonBorderRadius]}
            onValueChange={([value]) => setButtonBorderRadius(value)}
            className="mt-2"
          />
        </div>

        <div className="space-y-2">
          <Label>Espaçamento Interno do Botão</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="buttonPaddingTop" className="text-xs">Topo: {buttonPadding.top}px</Label>
              <Slider
                id="buttonPaddingTop"
                min={0}
                max={50}
                step={1}
                value={[buttonPadding.top]}
                onValueChange={([value]) => setButtonPadding({ ...buttonPadding, top: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="buttonPaddingRight" className="text-xs">Direita: {buttonPadding.right}px</Label>
              <Slider
                id="buttonPaddingRight"
                min={0}
                max={50}
                step={1}
                value={[buttonPadding.right]}
                onValueChange={([value]) => setButtonPadding({ ...buttonPadding, right: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="buttonPaddingBottom" className="text-xs">Baixo: {buttonPadding.bottom}px</Label>
              <Slider
                id="buttonPaddingBottom"
                min={0}
                max={50}
                step={1}
                value={[buttonPadding.bottom]}
                onValueChange={([value]) => setButtonPadding({ ...buttonPadding, bottom: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="buttonPaddingLeft" className="text-xs">Esquerda: {buttonPadding.left}px</Label>
              <Slider
                id="buttonPaddingLeft"
                min={0}
                max={50}
                step={1}
                value={[buttonPadding.left]}
                onValueChange={([value]) => setButtonPadding({ ...buttonPadding, left: value })}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Design do Card */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Design do Card</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="cardStrokeEnabled">Borda do Card</Label>
          <Switch
            id="cardStrokeEnabled"
            checked={cardStrokeEnabled}
            onCheckedChange={setCardStrokeEnabled}
          />
        </div>

        {cardStrokeEnabled && (
          <>
            <div>
              <Label htmlFor="cardStrokeColor">Cor da Borda</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="cardStrokeColor"
                  type="color"
                  value={cardStrokeColor}
                  onChange={(e) => setCardStrokeColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={cardStrokeColor}
                  onChange={(e) => setCardStrokeColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cardStrokeWidth">Espessura da Borda: {cardStrokeWidth}px</Label>
              <Slider
                id="cardStrokeWidth"
                min={0}
                max={10}
                step={1}
                value={[cardStrokeWidth]}
                onValueChange={([value]) => setCardStrokeWidth(value)}
                className="mt-2"
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="cardBorderRadius">Raio da Borda: {cardBorderRadius}px</Label>
          <Slider
            id="cardBorderRadius"
            min={0}
            max={50}
            step={1}
            value={[cardBorderRadius]}
            onValueChange={([value]) => setCardBorderRadius(value)}
            className="mt-2"
          />
        </div>

        <div className="space-y-2">
          <Label>Espaçamento Interno do Card</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cardPaddingTop" className="text-xs">Topo: {cardPadding.top}px</Label>
              <Slider
                id="cardPaddingTop"
                min={0}
                max={100}
                step={1}
                value={[cardPadding.top]}
                onValueChange={([value]) => setCardPadding({ ...cardPadding, top: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cardPaddingRight" className="text-xs">Direita: {cardPadding.right}px</Label>
              <Slider
                id="cardPaddingRight"
                min={0}
                max={100}
                step={1}
                value={[cardPadding.right]}
                onValueChange={([value]) => setCardPadding({ ...cardPadding, right: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cardPaddingBottom" className="text-xs">Baixo: {cardPadding.bottom}px</Label>
              <Slider
                id="cardPaddingBottom"
                min={0}
                max={100}
                step={1}
                value={[cardPadding.bottom]}
                onValueChange={([value]) => setCardPadding({ ...cardPadding, bottom: value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cardPaddingLeft" className="text-xs">Esquerda: {cardPadding.left}px</Label>
              <Slider
                id="cardPaddingLeft"
                min={0}
                max={100}
                step={1}
                value={[cardPadding.left]}
                onValueChange={([value]) => setCardPadding({ ...cardPadding, left: value })}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="cardShadow">Sombra do Card</Label>
          <Switch
            id="cardShadow"
            checked={cardShadow}
            onCheckedChange={setCardShadow}
          />
        </div>

        {cardShadow && (
          <div>
            <Label htmlFor="cardShadowColor">Cor da Sombra</Label>
            <Input
              id="cardShadowColor"
              type="text"
              value={cardShadowColor}
              onChange={(e) => setCardShadowColor(e.target.value)}
              placeholder="rgba(0, 0, 0, 0.3)"
              className="mt-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}

