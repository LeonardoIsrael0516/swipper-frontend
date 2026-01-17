import { useState, useEffect, useCallback } from 'react';
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
import { Plus, Trash2, GripVertical, Copy } from 'lucide-react';
import { IconEmojiSelector } from './IconEmojiSelector';

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
const generateId = () => `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface PlansElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function PlansElementEditor({ element, tab }: PlansElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  // Estados - Conteúdo
  const [plans, setPlans] = useState(config.plans || []);
  const [currency, setCurrency] = useState(config.currency ?? 'R$');

  // Estados - Design - Cores de texto
  const [planNameColor, setPlanNameColor] = useState(config.planNameColor ?? '#ffffff');
  const [priceColor, setPriceColor] = useState(config.priceColor ?? '#ffffff');
  const [originalPriceColor, setOriginalPriceColor] = useState(config.originalPriceColor ?? '#999999');
  const [currencyColor, setCurrencyColor] = useState(config.currencyColor);
  const [periodColor, setPeriodColor] = useState(config.periodColor ?? '#cccccc');
  const [descriptionColor, setDescriptionColor] = useState(config.descriptionColor ?? '#cccccc');
  const [alternativePaymentColor, setAlternativePaymentColor] = useState(config.alternativePaymentColor ?? '#cccccc');

  // Estados - Design - Botão
  const [buttonColorType, setButtonColorType] = useState<'solid' | 'gradient'>(config.buttonColorType ?? 'solid');
  const [buttonBackgroundColor, setButtonBackgroundColor] = useState(config.buttonBackgroundColor ?? '#000000');
  const [buttonGradient, setButtonGradient] = useState(config.buttonGradient ?? {
    direction: 'to right',
    color1: '#000000',
    color2: '#1a1a1a',
  });
  const [buttonTextColor, setButtonTextColor] = useState(config.buttonTextColor ?? '#ffffff');
  const [buttonStrokeEnabled, setButtonStrokeEnabled] = useState(config.buttonStrokeEnabled ?? false);
  const [buttonStrokeColor, setButtonStrokeColor] = useState(config.buttonStrokeColor ?? '#000000');
  const [buttonStrokeWidth, setButtonStrokeWidth] = useState(config.buttonStrokeWidth ?? 0);
  const [buttonBorderRadius, setButtonBorderRadius] = useState(config.buttonBorderRadius ?? 12);
  const [buttonPadding, setButtonPadding] = useState(config.buttonPadding ?? { top: 14, right: 28, bottom: 14, left: 28 });

  // Estados - Design - Card
  const [cardBackgroundType, setCardBackgroundType] = useState<'solid' | 'gradient' | 'image'>(config.cardBackgroundType ?? 'solid');
  const [cardBackgroundColor, setCardBackgroundColor] = useState(config.cardBackgroundColor ?? '#ffffff');
  const [cardBackgroundGradient, setCardBackgroundGradient] = useState(config.cardBackgroundGradient ?? {
    direction: 'to right',
    color1: '#ffffff',
    color2: '#f5f5f5',
  });
  const [cardBackgroundImage, setCardBackgroundImage] = useState(config.cardBackgroundImage ?? '');
  const [cardBackgroundOverlayEnabled, setCardBackgroundOverlayEnabled] = useState(config.cardBackgroundOverlay?.enabled ?? false);
  const [cardBackgroundOverlayColor, setCardBackgroundOverlayColor] = useState(config.cardBackgroundOverlay?.color ?? '#000000');
  const [cardBackgroundOverlayOpacity, setCardBackgroundOverlayOpacity] = useState(config.cardBackgroundOverlay?.opacity !== undefined ? config.cardBackgroundOverlay.opacity : 0.5);
  const [cardStrokeEnabled, setCardStrokeEnabled] = useState(config.cardStrokeEnabled ?? false);
    const [cardStrokeColor, setCardStrokeColor] = useState(config.cardStrokeColor ?? '#b3b3b3');
  const [cardStrokeWidth, setCardStrokeWidth] = useState(config.cardStrokeWidth ?? 1);
  const [cardBorderRadius, setCardBorderRadius] = useState(config.cardBorderRadius ?? 12);
  const [cardPadding, setCardPadding] = useState(config.cardPadding ?? { top: 16, right: 16, bottom: 16, left: 16 });
  const [cardShadow, setCardShadow] = useState(config.cardShadow ?? false);
  const [cardShadowColor, setCardShadowColor] = useState(config.cardShadowColor ?? 'rgba(0, 0, 0, 0.1)');

  // Estados - Design - Badge
  const [badgeBackgroundColor, setBadgeBackgroundColor] = useState(config.badgeBackgroundColor ?? '#000000');
  const [badgeTextColor, setBadgeTextColor] = useState(config.badgeTextColor ?? '#ffffff');
  const [badgePosition, setBadgePosition] = useState<'top' | 'bottom'>(config.badgePosition ?? 'top');

  // Estados - Layout
  const [gap, setGap] = useState(config.gap ?? 16);

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    setPlans(normalizedConfig.plans || []);
    setCurrency(normalizedConfig.currency ?? 'R$');
    setPlanNameColor(normalizedConfig.planNameColor ?? '#ffffff');
    setPriceColor(normalizedConfig.priceColor ?? '#ffffff');
    setOriginalPriceColor(normalizedConfig.originalPriceColor ?? '#999999');
    setCurrencyColor(normalizedConfig.currencyColor);
    setPeriodColor(normalizedConfig.periodColor ?? '#cccccc');
    setDescriptionColor(normalizedConfig.descriptionColor ?? '#cccccc');
    setAlternativePaymentColor(normalizedConfig.alternativePaymentColor ?? '#cccccc');
    setButtonColorType(normalizedConfig.buttonColorType ?? 'solid');
    setButtonBackgroundColor(normalizedConfig.buttonBackgroundColor ?? '#000000');
    setButtonGradient(normalizedConfig.buttonGradient ?? {
      direction: 'to right',
      color1: '#000000',
      color2: '#1a1a1a',
    });
    setButtonTextColor(normalizedConfig.buttonTextColor ?? '#ffffff');
    setButtonStrokeEnabled(normalizedConfig.buttonStrokeEnabled ?? false);
    setButtonStrokeColor(normalizedConfig.buttonStrokeColor ?? '#000000');
    setButtonStrokeWidth(normalizedConfig.buttonStrokeWidth ?? 0);
    setButtonBorderRadius(normalizedConfig.buttonBorderRadius ?? 12);
    setButtonPadding(normalizedConfig.buttonPadding ?? { top: 14, right: 28, bottom: 14, left: 28 });
    setCardBackgroundType(normalizedConfig.cardBackgroundType ?? 'solid');
    setCardBackgroundColor(normalizedConfig.cardBackgroundColor ?? '#ffffff');
    setCardBackgroundGradient(normalizedConfig.cardBackgroundGradient ?? {
      direction: 'to right',
      color1: '#ffffff',
      color2: '#f5f5f5',
    });
    setCardBackgroundImage(normalizedConfig.cardBackgroundImage ?? '');
    setCardBackgroundOverlayEnabled(normalizedConfig.cardBackgroundOverlay?.enabled ?? false);
    setCardBackgroundOverlayColor(normalizedConfig.cardBackgroundOverlay?.color ?? '#000000');
    setCardBackgroundOverlayOpacity(normalizedConfig.cardBackgroundOverlay?.opacity !== undefined ? normalizedConfig.cardBackgroundOverlay.opacity : 0.5);
    setCardStrokeEnabled(normalizedConfig.cardStrokeEnabled ?? false);
    setCardStrokeColor(normalizedConfig.cardStrokeColor ?? '#b3b3b3');
    setCardStrokeWidth(normalizedConfig.cardStrokeWidth ?? 1);
    setCardBorderRadius(normalizedConfig.cardBorderRadius ?? 12);
    setCardPadding(normalizedConfig.cardPadding ?? { top: 16, right: 16, bottom: 16, left: 16 });
    setCardShadow(normalizedConfig.cardShadow ?? false);
    setCardShadowColor(normalizedConfig.cardShadowColor ?? 'rgba(0, 0, 0, 0.1)');
    setBadgeBackgroundColor(normalizedConfig.badgeBackgroundColor ?? '#000000');
    setBadgeTextColor(normalizedConfig.badgeTextColor ?? '#ffffff');
    setBadgePosition(normalizedConfig.badgePosition ?? 'top');
    setGap(normalizedConfig.gap ?? 16);
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        plans,
        currency,
        planNameColor,
        priceColor,
        originalPriceColor,
        currencyColor,
        periodColor,
        descriptionColor,
        alternativePaymentColor,
        buttonColorType,
        buttonBackgroundColor,
        buttonGradient,
        buttonTextColor,
        buttonStrokeEnabled,
        buttonStrokeColor,
        buttonStrokeWidth,
        buttonBorderRadius,
        buttonPadding,
        cardBackgroundType,
        cardBackgroundColor,
        cardBackgroundGradient,
        cardBackgroundImage,
        cardBackgroundOverlay: {
          enabled: cardBackgroundOverlayEnabled,
          color: cardBackgroundOverlayColor,
          opacity: cardBackgroundOverlayOpacity,
        },
        cardStrokeEnabled,
        cardStrokeColor,
        cardStrokeWidth,
        cardBorderRadius,
        cardPadding,
        cardShadow,
        cardShadowColor,
        badgeBackgroundColor,
        badgeTextColor,
        badgePosition,
        gap,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plans,
    currency,
    planNameColor,
    priceColor,
    originalPriceColor,
    currencyColor,
    periodColor,
    descriptionColor,
    alternativePaymentColor,
    buttonColorType,
    buttonBackgroundColor,
    buttonGradient,
    buttonTextColor,
    buttonStrokeEnabled,
    buttonStrokeColor,
    buttonStrokeWidth,
    buttonBorderRadius,
    buttonPadding,
    cardBackgroundType,
    cardBackgroundColor,
    cardBackgroundGradient,
    cardBackgroundImage,
    cardBackgroundOverlayEnabled,
    cardBackgroundOverlayColor,
    cardBackgroundOverlayOpacity,
    cardStrokeEnabled,
    cardStrokeColor,
    cardStrokeWidth,
    cardBorderRadius,
    cardPadding,
    cardShadow,
    cardShadowColor,
    badgeBackgroundColor,
    badgeTextColor,
    badgePosition,
    gap,
    element.id,
  ]);

  const addPlan = () => {
    const newPlan = {
      id: generateId(),
      name: 'Plano Premium',
      price: 29.90,
      originalPrice: 159.90,
      currency: currency,
      period: '',
      description: '',
      alternativePayment: '',
      isPopular: false,
      buttonTitle: 'COMPRAR',
      buttonUrl: '',
      buttonOpenInNewTab: true,
      buttonIcon: '',
    };
    setPlans([...plans, newPlan]);
  };

  const removePlan = (planId: string) => {
    setPlans(plans.filter((plan: any) => plan.id !== planId));
  };

  const duplicatePlan = (planId: string) => {
    const planToDuplicate = plans.find((plan: any) => plan.id === planId);
    if (!planToDuplicate) return;

    const duplicatedPlan = {
      ...planToDuplicate,
      id: generateId(),
      name: `${planToDuplicate.name || 'Plano'} (cópia)`,
    };

    const planIndex = plans.findIndex((plan: any) => plan.id === planId);
    const newPlans = [...plans];
    newPlans.splice(planIndex + 1, 0, duplicatedPlan);
    setPlans(newPlans);
  };

  const updatePlan = useCallback((planId: string, updates: Partial<any>) => {
    setPlans((prevPlans) => 
      prevPlans.map((plan: any) => 
        plan.id === planId ? { ...plan, ...updates } : plan
      )
    );
  }, []);

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

    const oldIndex = plans.findIndex((plan: any) => plan.id === active.id);
    const newIndex = plans.findIndex((plan: any) => plan.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setPlans(arrayMove(plans, oldIndex, newIndex));
  };

  // Componente SortablePlanItem
  function SortablePlanItem({ plan, planIndex, updatePlan, removePlan, duplicatePlan }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: plan.id,
    });

    // Estado local para o input de URL para evitar scroll jump
    const [localButtonUrl, setLocalButtonUrl] = useState(plan.buttonUrl || '');

    // Sincronizar estado local quando o plan muda externamente
    useEffect(() => {
      setLocalButtonUrl(plan.buttonUrl || '');
    }, [plan.buttonUrl]);

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <AccordionItem value={plan.id} className="border rounded-lg px-3">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">
                  {plan.name || `Plano ${planIndex + 1}`}
                </span>
                {!plan.name && (
                  <span className="text-xs text-muted-foreground">
                    (sem nome)
                  </span>
                )}
                {plan.isPopular && (
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded">
                    MAIS POPULAR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePlan(plan.id);
                  }}
                  className="h-6 w-6 p-0"
                  title="Duplicar plano"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePlan(plan.id);
                  }}
                  className="h-6 w-6 p-0"
                  title="Excluir plano"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 space-y-3">
            <div>
              <Label>Nome do Plano</Label>
              <Input
                value={plan.name || ''}
                onChange={(e) => updatePlan(plan.id, { name: e.target.value })}
                placeholder="Plano Premium"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Preço</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plan.price || ''}
                  onChange={(e) => updatePlan(plan.id, { price: parseFloat(e.target.value) || 0 })}
                  placeholder="29.90"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Preço Anterior (Opcional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plan.originalPrice || ''}
                  onChange={(e) => updatePlan(plan.id, { originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="159.90"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Moeda</Label>
                <Input
                  value={plan.currency || currency}
                  onChange={(e) => updatePlan(plan.id, { currency: e.target.value })}
                  placeholder="R$"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Período (Opcional)</Label>
                <Input
                  value={plan.period || ''}
                  onChange={(e) => updatePlan(plan.id, { period: e.target.value })}
                  placeholder="/mês, /ano"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Descrição (Opcional)</Label>
              <Textarea
                value={plan.description || ''}
                onChange={(e) => updatePlan(plan.id, { description: e.target.value })}
                placeholder="Descrição do plano"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label>Pagamento Alternativo (Opcional)</Label>
              <Input
                value={plan.alternativePayment || ''}
                onChange={(e) => updatePlan(plan.id, { alternativePayment: e.target.value })}
                placeholder="ou R$ 159 avista"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Badge "MAIS POPULAR"</Label>
              <Switch
                checked={plan.isPopular || false}
                onCheckedChange={(checked) => updatePlan(plan.id, { isPopular: checked })}
              />
            </div>

            <div className="border-t pt-3 space-y-3">
              <h4 className="text-sm font-semibold">Botão</h4>
              
              <div>
                <Label>Título do Botão</Label>
                <Input
                  value={plan.buttonTitle || 'COMPRAR'}
                  onChange={(e) => updatePlan(plan.id, { buttonTitle: e.target.value })}
                  placeholder="COMPRAR"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Ícone/Emoji (Opcional)</Label>
                <IconEmojiSelector
                  value={plan.buttonIcon || ''}
                  onChange={(value) => updatePlan(plan.id, { buttonIcon: value })}
                />
              </div>

              <div>
                <Label>URL do Botão</Label>
                <Input
                  type="url"
                  value={localButtonUrl}
                  onChange={(e) => {
                    setLocalButtonUrl(e.target.value);
                  }}
                  onBlur={(e) => {
                    // Atualizar o estado global apenas ao perder o foco para evitar scroll jump
                    updatePlan(plan.id, { buttonUrl: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    // Atualizar ao pressionar Enter
                    if (e.key === 'Enter') {
                      updatePlan(plan.id, { buttonUrl: localButtonUrl });
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="https://exemplo.com/checkout"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Abrir em Nova Aba</Label>
                <Switch
                  checked={plan.buttonOpenInNewTab !== false}
                  onCheckedChange={(checked) => updatePlan(plan.id, { buttonOpenInNewTab: checked })}
                />
              </div>
            </div>

          </AccordionContent>
        </AccordionItem>
      </div>
    );
  }

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Configurações Gerais</h4>
          
          <div>
            <Label htmlFor="currency">Moeda Padrão</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="R$"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Moeda padrão para todos os planos (pode ser sobrescrita por plano)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Planos</h4>
          </div>

          {plans.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={plans.map((p: any) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <Accordion type="multiple" className="w-full space-y-2">
                  {plans.map((plan: any, index: number) => (
                    <SortablePlanItem
                      key={plan.id}
                      plan={plan}
                      planIndex={index}
                      updatePlan={updatePlan}
                      removePlan={removePlan}
                      duplicatePlan={duplicatePlan}
                    />
                  ))}
                </Accordion>
              </SortableContext>
            </DndContext>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPlan}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Plano
          </Button>
        </div>
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      {/* Cores de Texto */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Cores de Texto</h4>
        
        <div>
          <Label htmlFor="planNameColor">Cor do Nome do Plano</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="planNameColor"
              type="color"
              value={planNameColor}
              onChange={(e) => setPlanNameColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={planNameColor}
              onChange={(e) => setPlanNameColor(e.target.value)}
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
          <Label htmlFor="alternativePaymentColor">Cor do Pagamento Alternativo</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="alternativePaymentColor"
              type="color"
              value={alternativePaymentColor}
              onChange={(e) => setAlternativePaymentColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={alternativePaymentColor}
              onChange={(e) => setAlternativePaymentColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Design do Card */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Fundo do Card</h4>
        
        <div>
          <Label htmlFor="cardBackgroundType">Tipo de Fundo</Label>
          <Select value={cardBackgroundType} onValueChange={(value: 'solid' | 'gradient' | 'image') => setCardBackgroundType(value)}>
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

        {cardBackgroundType === 'solid' && (
          <div>
            <Label htmlFor="cardBackgroundColor">Cor de Fundo</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="cardBackgroundColor"
                type="color"
                value={cardBackgroundColor}
                onChange={(e) => setCardBackgroundColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={cardBackgroundColor}
                onChange={(e) => setCardBackgroundColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {cardBackgroundType === 'gradient' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="cardGradientDirection">Direção do Gradiente</Label>
              <Select
                value={cardBackgroundGradient.direction}
                onValueChange={(value) => setCardBackgroundGradient({ ...cardBackgroundGradient, direction: value })}
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
              <Label htmlFor="cardGradientColor1">Cor 1</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="cardGradientColor1"
                  type="color"
                  value={cardBackgroundGradient.color1}
                  onChange={(e) => setCardBackgroundGradient({ ...cardBackgroundGradient, color1: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={cardBackgroundGradient.color1}
                  onChange={(e) => setCardBackgroundGradient({ ...cardBackgroundGradient, color1: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cardGradientColor2">Cor 2</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="cardGradientColor2"
                  type="color"
                  value={cardBackgroundGradient.color2}
                  onChange={(e) => setCardBackgroundGradient({ ...cardBackgroundGradient, color2: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={cardBackgroundGradient.color2}
                  onChange={(e) => setCardBackgroundGradient({ ...cardBackgroundGradient, color2: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {cardBackgroundType === 'image' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="cardBackgroundImage">URL da Imagem</Label>
              <Input
                id="cardBackgroundImage"
                type="url"
                value={cardBackgroundImage}
                onChange={(e) => setCardBackgroundImage(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cardBackgroundOverlayEnabled">Overlay</Label>
              <Switch
                id="cardBackgroundOverlayEnabled"
                checked={cardBackgroundOverlayEnabled}
                onCheckedChange={setCardBackgroundOverlayEnabled}
              />
            </div>

            {cardBackgroundOverlayEnabled && (
              <>
                <div>
                  <Label htmlFor="cardBackgroundOverlayColor">Cor do Overlay</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="cardBackgroundOverlayColor"
                      type="color"
                      value={cardBackgroundOverlayColor}
                      onChange={(e) => setCardBackgroundOverlayColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={cardBackgroundOverlayColor}
                      onChange={(e) => setCardBackgroundOverlayColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardBackgroundOverlayOpacity">Opacidade do Overlay: {Math.round(cardBackgroundOverlayOpacity * 100)}%</Label>
                  <Slider
                    id="cardBackgroundOverlayOpacity"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[cardBackgroundOverlayOpacity]}
                    onValueChange={([value]) => setCardBackgroundOverlayOpacity(value)}
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>
        )}

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
              placeholder="rgba(0, 0, 0, 0.1)"
              className="mt-1"
            />
          </div>
        )}
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

      {/* Design do Badge "MAIS POPULAR" */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Badge "MAIS POPULAR"</h4>
        
        <div>
          <Label htmlFor="badgeBackgroundColor">Cor de Fundo</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="badgeBackgroundColor"
              type="color"
              value={badgeBackgroundColor}
              onChange={(e) => setBadgeBackgroundColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={badgeBackgroundColor}
              onChange={(e) => setBadgeBackgroundColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="badgeTextColor">Cor do Texto</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="badgeTextColor"
              type="color"
              value={badgeTextColor}
              onChange={(e) => setBadgeTextColor(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={badgeTextColor}
              onChange={(e) => setBadgeTextColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="badgePosition">Posição</Label>
          <Select value={badgePosition} onValueChange={(value: 'top' | 'bottom') => setBadgePosition(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Topo</SelectItem>
              <SelectItem value="bottom">Inferior</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Layout */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Layout</h4>
        
        <div>
          <Label htmlFor="gap">Espaçamento Entre Planos: {gap}px</Label>
          <Slider
            id="gap"
            min={0}
            max={50}
            step={1}
            value={[gap]}
            onValueChange={([value]) => setGap(value)}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

