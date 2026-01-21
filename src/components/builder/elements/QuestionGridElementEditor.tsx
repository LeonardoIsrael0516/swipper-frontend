import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import React from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { Plus, Trash2, GripVertical, Upload, Loader2, X, Copy } from 'lucide-react';
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
const generateId = () => `question-grid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Componente SortableItem movido para fora para evitar recriação
const SortableQuestionGridItem = React.memo(({ item, itemIndex, updateItem, removeItem, duplicateItem, isUploading, setIsUploading, reel }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <AccordionItem
          value={item.id}
          className="border rounded-lg px-3"
        >
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
                  {item.title || `Item ${itemIndex + 1}`}
                </span>
                {!item.title && (
                  <span className="text-xs text-muted-foreground">
                    (sem título)
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
                    duplicateItem(item.id);
                  }}
                  className="h-6 w-6 p-0"
                  title="Duplicar item"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="h-6 w-6 p-0"
                  title="Excluir item"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 space-y-3">
            <div>
              <Label htmlFor={`item-image-${item.id}`} className="text-xs font-semibold mb-2 block">
                Imagem (acima)
              </Label>
              <input
                ref={(el) => {
                  if (el) {
                    (el as any).dataset.itemId = item.id;
                  }
                }}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                  if (!validImageTypes.includes(file.type)) {
                    toast.error('Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP)');
                    return;
                  }

                  const maxSize = 10 * 1024 * 1024;
                  if (file.size > maxSize) {
                    toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
                    return;
                  }

                  setIsUploading(true);
                  try {
                    const url = await uploadFile(file);
                    
                    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
                      throw new Error('URL inválida retornada do servidor.');
                    }
                    
                    updateItem(item.id, { imageUrl: url });
                    toast.success('Imagem enviada com sucesso!');
                  } catch (error: any) {
                    toast.error('Erro ao fazer upload: ' + (error.message || 'Erro desconhecido'));
                  } finally {
                    setIsUploading(false);
                    if (e.target) {
                      e.target.value = '';
                    }
                  }
                }}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
              
              {item.imageUrl ? (
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-lg border border-border max-h-32 object-contain"
                    onError={() => {
                      toast.error('Erro ao carregar imagem');
                    }}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const input = document.querySelector(`input[data-item-id="${item.id}"]`) as HTMLInputElement;
                        input?.click();
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Trocar
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => updateItem(item.id, { imageUrl: undefined })}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-border transition-colors"
                    onClick={() => {
                      const input = document.querySelector(`input[data-item-id="${item.id}"]`) as HTMLInputElement;
                      !isUploading && input?.click();
                    }}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {isUploading ? 'Enviando...' : 'Clique para fazer upload'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const input = document.querySelector(`input[data-item-id="${item.id}"]`) as HTMLInputElement;
                      input?.click();
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Imagem
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t pt-3 mt-3">
              <Label htmlFor={`item-title-${item.id}`} className="text-xs">
                Título * (abaixo da imagem)
              </Label>
              <Input
                id={`item-title-${item.id}`}
                value={item.title || ''}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Título do item"
              />
            </div>

            <div>
              <Label htmlFor={`item-description-${item.id}`} className="text-xs">
                Descrição (abaixo do título)
              </Label>
              <Input
                id={`item-description-${item.id}`}
                value={item.description || ''}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Descrição opcional do item"
              />
            </div>

            {/* Configuração de Ação */}
            <div className="border-t pt-3 mt-3 space-y-3">
              <Label className="text-xs font-semibold mb-2 block">Ação ao Clicar</Label>
              <Select
                value={item.actionType || 'none'}
                onValueChange={(value: 'none' | 'slide' | 'url') => {
                  const updates: any = { actionType: value };
                  if (value === 'none') {
                    updates.slideId = undefined;
                    updates.url = undefined;
                    updates.openInNewTab = undefined;
                  } else if (value === 'slide') {
                    updates.url = undefined;
                    updates.openInNewTab = undefined;
                  } else if (value === 'url') {
                    updates.slideId = undefined;
                    if (updates.openInNewTab === undefined) {
                      updates.openInNewTab = true;
                    }
                  }
                  updateItem(item.id, updates);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="url">URL Personalizada</SelectItem>
                </SelectContent>
              </Select>

              {item.actionType === 'slide' && reel?.slides && (
                <div>
                  <Label htmlFor={`item-slide-${item.id}`} className="text-xs">
                    Slide de Destino
                  </Label>
                  <Select
                    value={item.slideId || ''}
                    onValueChange={(value) => updateItem(item.id, { slideId: value })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Selecione um slide" />
                    </SelectTrigger>
                    <SelectContent>
                      {reel.slides.map((slide: any, index: number) => (
                        <SelectItem key={slide.id} value={slide.id}>
                          Slide {index + 1}: {slide.question || `Slide ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    O fluxo visual sempre tem prioridade. Este será usado apenas se não houver conexão no fluxo.
                  </p>
                </div>
              )}

              {item.actionType === 'url' && (
                <>
                  <div>
                    <Label htmlFor={`item-url-${item.id}`} className="text-xs">
                      URL
                    </Label>
                    <Input
                      id={`item-url-${item.id}`}
                      type="url"
                      value={item.url || ''}
                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                      className="mt-1 h-8 text-sm"
                      placeholder="https://exemplo.com"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`item-openInNewTab-${item.id}`} className="text-xs">
                      Abrir em Nova Aba
                    </Label>
                    <Switch
                      id={`item-openInNewTab-${item.id}`}
                      checked={item.openInNewTab !== false}
                      onCheckedChange={(checked) => updateItem(item.id, { openInNewTab: checked })}
                    />
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </div>
    );
});

SortableQuestionGridItem.displayName = 'SortableQuestionGridItem';

interface QuestionGridElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function QuestionGridElementEditor({ element, tab }: QuestionGridElementEditorProps) {
  const { updateElement, reel } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [items, setItems] = useState(config.items || []);
  const [multipleSelection, setMultipleSelection] = useState(config.multipleSelection ?? false);
  const [lockSlide, setLockSlide] = useState(config.lockSlide ?? false);
  const [delayEnabled, setDelayEnabled] = useState(config.delayEnabled || false);
  const [delaySeconds, setDelaySeconds] = useState(config.delaySeconds || 0);
  const [hideSocialElementsOnDelay, setHideSocialElementsOnDelay] = useState(config.hideSocialElementsOnDelay || false);
  const [gap, setGap] = useState(config.gap ?? 12);
  const [borderRadius, setBorderRadius] = useState(config.borderRadius ?? 12);
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor || '#ffffff');
  const [textColor, setTextColor] = useState(config.textColor || '#000000');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState(config.selectedBackgroundColor || '#007bff');
  const [selectedTextColor, setSelectedTextColor] = useState(config.selectedTextColor || '#ffffff');
  const [borderColor, setBorderColor] = useState(config.borderColor || '#e5e7eb');
  const [borderWidth, setBorderWidth] = useState(config.borderWidth ?? 1);
  const [isUploading, setIsUploading] = useState(false);

  // Ref para rastrear última versão sincronizada do uiConfig
  const lastSyncedConfigRef = useRef<string>('');
  
  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    const configStr = JSON.stringify(normalizedConfig);
    
    if (lastSyncedConfigRef.current === configStr) {
      return;
    }
    
    lastSyncedConfigRef.current = configStr;
    
    // Normalizar items - incluindo campos de ação
    const normalizedItems = Array.isArray(normalizedConfig.items) 
      ? normalizedConfig.items.map((item: any) => ({
          id: item.id || generateId(),
          imageUrl: item.imageUrl && typeof item.imageUrl === 'string' ? item.imageUrl.trim() : undefined,
          title: item.title && typeof item.title === 'string' ? item.title.trim() : '',
          description: item.description && typeof item.description === 'string' ? item.description.trim() : '',
          actionType: item.actionType || 'none',
          slideId: item.slideId,
          url: item.url,
          openInNewTab: item.openInNewTab !== false,
        }))
      : [];
    
    setItems(normalizedItems);
    setMultipleSelection(normalizedConfig.multipleSelection ?? false);
    setLockSlide(normalizedConfig.lockSlide ?? false);
    setDelayEnabled(normalizedConfig.delayEnabled || false);
    setDelaySeconds(normalizedConfig.delaySeconds || 0);
    setHideSocialElementsOnDelay(normalizedConfig.hideSocialElementsOnDelay || false);
    setGap(normalizedConfig.gap ?? 12);
    setBorderRadius(normalizedConfig.borderRadius ?? 12);
    setBackgroundColor(normalizedConfig.backgroundColor || '#ffffff');
    setTextColor(normalizedConfig.textColor || '#000000');
    setSelectedBackgroundColor(normalizedConfig.selectedBackgroundColor || '#007bff');
    setSelectedTextColor(normalizedConfig.selectedTextColor || '#ffffff');
    setBorderColor(normalizedConfig.borderColor || '#e5e7eb');
    setBorderWidth(normalizedConfig.borderWidth ?? 1);
  }, [element.id, element.uiConfig]);

  // Ref para rastrear último estado salvo
  const lastSavedStateRef = useRef<string>('');
  
  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const configToSave = {
        items: items.map((item: any) => ({
          id: item.id || generateId(),
          imageUrl: item.imageUrl,
          title: item.title || '',
          description: item.description || '',
          actionType: item.actionType || 'none',
          slideId: item.slideId,
          url: item.url,
          openInNewTab: item.openInNewTab !== false,
        })),
        layout: 'grid', // Fixo
        multipleSelection,
        lockSlide,
        delayEnabled,
        delaySeconds,
        hideSocialElementsOnDelay,
        gap,
        borderRadius,
        backgroundColor,
        textColor,
        selectedBackgroundColor,
        selectedTextColor,
        borderColor,
        borderWidth,
      };
      
      const configStr = JSON.stringify(configToSave);
      if (lastSavedStateRef.current === configStr) {
        return;
      }
      
      lastSavedStateRef.current = configStr;
      
      updateElement(element.id, configToSave).then(() => {
        lastSavedStateRef.current = configStr;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    items,
    multipleSelection,
    lockSlide,
    delayEnabled,
    delaySeconds,
    hideSocialElementsOnDelay,
    gap,
    borderRadius,
    backgroundColor,
    textColor,
    selectedBackgroundColor,
    selectedTextColor,
    borderColor,
    borderWidth,
    element.id,
    updateElement,
  ]);

  const addItem = () => {
    const itemNumber = items.length + 1;
    const newItem = {
      id: generateId(),
      imageUrl: undefined,
      title: `Opção ${itemNumber}`,
      description: `Descrição da opção ${itemNumber}`,
    };
    setItems([...items, newItem]);
  };

  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((item: any) => item.id !== itemId));
  }, []);

  const duplicateItem = useCallback((itemId: string) => {
    setItems((prevItems) => {
      const itemToDuplicate = prevItems.find((item: any) => item.id === itemId);
      if (!itemToDuplicate) return prevItems;

      const duplicatedItem = {
        ...itemToDuplicate,
        id: generateId(),
        title: `${itemToDuplicate.title || 'Item'} (cópia)`,
      };

      const itemIndex = prevItems.findIndex((item: any) => item.id === itemId);
      const newItems = [...prevItems];
      newItems.splice(itemIndex + 1, 0, duplicatedItem);
      return newItems;
    });
  }, []);

  const updateItem = useCallback((itemId: string, updates: Partial<any>) => {
    setItems((prevItems) => prevItems.map((item: any) => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
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

    const oldIndex = items.findIndex((item: any) => item.id === active.id);
    const newIndex = items.findIndex((item: any) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setItems(arrayMove(items, oldIndex, newIndex));
  };

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div className="border-b pb-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            <p>Layout: Grid de 2 colunas (fixo)</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="multipleSelection" className="text-sm font-semibold">
              Múltiplas Seleções
            </Label>
            <Switch
              id="multipleSelection"
              checked={multipleSelection}
              onCheckedChange={setMultipleSelection}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lockSlide" className="text-sm font-semibold">
              Travar Slide
            </Label>
            <Switch
              id="lockSlide"
              checked={lockSlide}
              onCheckedChange={setLockSlide}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="delayEnabled" className="text-sm font-semibold">
              Delay
            </Label>
            <Switch
              id="delayEnabled"
              checked={delayEnabled}
              onCheckedChange={(checked) => {
                setDelayEnabled(checked);
                if (checked && delaySeconds < 1) {
                  setDelaySeconds(1);
                }
              }}
            />
          </div>

          {delayEnabled && (
            <div>
              <Label htmlFor="delaySeconds">Segundos do Delay: {delaySeconds}s</Label>
              <Slider
                id="delaySeconds"
                min={1}
                max={120}
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
              Quando a grade aparecer (após o delay), os elementos sociais (botões de ação, nome de usuário e legenda) serão ocultados automaticamente.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label>Itens da Grade</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum item adicionado</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={addItem}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Item
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item: any) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion type="multiple" className="w-full space-y-2">
                {items.map((item: any, itemIndex: number) => (
                  <SortableQuestionGridItem
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    duplicateItem={duplicateItem}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                    reel={reel}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gap">Espaçamento: {gap}px</Label>
        <Slider
          id="gap"
          min={0}
          max={24}
          step={1}
          value={[gap]}
          onValueChange={([value]) => setGap(value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="borderRadius">Borda Arredondada: {borderRadius}px</Label>
        <Slider
          id="borderRadius"
          min={0}
          max={24}
          step={1}
          value={[borderRadius]}
          onValueChange={([value]) => setBorderRadius(value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="borderWidth">Espessura da Borda: {borderWidth}px</Label>
        <Slider
          id="borderWidth"
          min={0}
          max={4}
          step={1}
          value={[borderWidth]}
          onValueChange={([value]) => setBorderWidth(value)}
          className="mt-2"
        />
      </div>

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

      <div>
        <Label htmlFor="textColor">Cor do Texto</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="textColor"
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
        <Label htmlFor="selectedBackgroundColor">Cor de Fundo (Selecionado)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="selectedBackgroundColor"
            type="color"
            value={selectedBackgroundColor}
            onChange={(e) => setSelectedBackgroundColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={selectedBackgroundColor}
            onChange={(e) => setSelectedBackgroundColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="selectedTextColor">Cor do Texto (Selecionado)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="selectedTextColor"
            type="color"
            value={selectedTextColor}
            onChange={(e) => setSelectedTextColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={selectedTextColor}
            onChange={(e) => setSelectedTextColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="borderColor">Cor da Borda</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="borderColor"
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

    </div>
  );
}

