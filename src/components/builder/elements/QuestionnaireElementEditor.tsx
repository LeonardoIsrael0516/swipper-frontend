import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
const generateId = () => `questionnaire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Componente SortableItem movido para fora para evitar recriação
const SortableQuestionnaireItem = React.memo(({ item, itemIndex, updateItem, removeItem, duplicateItem, isUploading, setIsUploading }: any) => {
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
              <Label htmlFor={`item-title-${item.id}`} className="text-xs">
                Título *
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
                Descrição
              </Label>
              <Input
                id={`item-description-${item.id}`}
                value={item.description || ''}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Descrição opcional do item"
              />
            </div>

            <div className="border-t pt-3 mt-3">
              <Label className="text-xs font-semibold mb-2 block">Ícone à Esquerda</Label>
             <Select
               value={(() => {
                 // Detectar tipo baseado nos campos disponíveis (apenas emoji ou image)
                 if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
                   return 'image';
                 }
                 // Se iconType for 'icon', converter para 'emoji' como padrão
                 if (item.iconType === 'icon') {
                   return 'emoji';
                 }
                 return item.iconType === 'image' ? 'image' : 'emoji';
               })()}
               onValueChange={(value) => {
                 const updates: any = { iconType: value };
                 if (value === 'emoji') {
                   updates.emoji = item.emoji || '👍';
                   updates.imageUrl = '';
                   updates.icon = ''; // Limpar campo icon
                 } else if (value === 'image') {
                   updates.imageUrl = item.imageUrl || '';
                   updates.emoji = '';
                   updates.icon = ''; // Limpar campo icon
                 }
                 updateItem(item.id, updates);
               }}
             >
               <SelectTrigger className="h-8 text-xs">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="emoji">Emoji</SelectItem>
                 <SelectItem value="image">Imagem</SelectItem>
               </SelectContent>
             </Select>

             {(item.iconType === 'emoji' || item.iconType === 'icon' || !item.iconType) && (
               <div className="mt-2">
                 <IconEmojiSelector
                   value={item.emoji || ''}
                   onChange={(value) => {
                     updateItem(item.id, { 
                       emoji: value,
                       iconType: 'emoji',
                       icon: '', // Limpar campo icon
                       imageUrl: ''
                     });
                   }}
                   mode="emoji"
                 />
               </div>
             )}

             {item.iconType === 'image' && (
                <div className="mt-2 space-y-2">
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
                        className="w-full h-auto rounded-lg border border-border max-h-32 object-cover"
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
                          onClick={() => updateItem(item.id, { imageUrl: '' })}
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
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </div>
    );
});

SortableQuestionnaireItem.displayName = 'SortableQuestionnaireItem';

interface QuestionnaireElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function QuestionnaireElementEditor({ element, tab }: QuestionnaireElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [items, setItems] = useState(config.items || []);
  const [layout, setLayout] = useState<'list' | 'grid'>(config.layout || 'list');
  const [multipleSelection, setMultipleSelection] = useState(config.multipleSelection ?? false);
  const [lockSlide, setLockSlide] = useState(config.lockSlide ?? false);
  const [delayEnabled, setDelayEnabled] = useState(config.delayEnabled || false);
  const [delaySeconds, setDelaySeconds] = useState(config.delaySeconds || 0);
  const [endIcon, setEndIcon] = useState<'none' | 'arrow' | 'verified'>(() => {
    const icon = config.endIcon || 'none';
    // Se for 'check' ou 'custom', converter para 'none'
    if (icon === 'check' || icon === 'custom') {
      return 'none';
    }
    return icon as 'none' | 'arrow' | 'verified';
  });
  const [itemHeight, setItemHeight] = useState(config.itemHeight ?? 80);
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
  
  // Sincronizar quando element mudar externamente (usando comparação profunda de items)
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    // Serializar items atual para comparação
    const currentItemsStr = JSON.stringify(normalizedConfig.items || []);
    const configStr = JSON.stringify(normalizedConfig);
    
    // Só sincronizar se houver mudanças reais (evita loops)
    if (lastSyncedConfigRef.current === configStr) {
      return;
    }
    
    lastSyncedConfigRef.current = configStr;
    
    // Normalizar e sincronizar items
    const normalizedItems = Array.isArray(normalizedConfig.items) 
      ? normalizedConfig.items.map((item: any) => {
          // Se iconType for 'icon', converter para 'emoji' (opção removida)
          let detectedIconType = item.iconType;
          if (detectedIconType === 'icon') {
            detectedIconType = 'emoji';
          }
          
          // Detectar iconType baseado nos campos disponíveis (apenas emoji ou image)
          if (!detectedIconType || detectedIconType === 'icon') {
            if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
              detectedIconType = 'image';
            } else if (item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
              detectedIconType = 'emoji';
            } else if (!detectedIconType) {
              detectedIconType = 'emoji';
            }
          }
          
          return {
            ...item,
            iconType: detectedIconType || 'emoji',
            // Limpar campo icon (opção removida)
            icon: '',
          };
        })
      : [];
    
    setItems(normalizedItems);
    setLayout(normalizedConfig.layout || 'list');
    setMultipleSelection(normalizedConfig.multipleSelection ?? false);
    setLockSlide(normalizedConfig.lockSlide ?? false);
    setDelayEnabled(normalizedConfig.delayEnabled || false);
    setDelaySeconds(normalizedConfig.delaySeconds || 0);
    const icon = normalizedConfig.endIcon || 'none';
    setEndIcon((icon === 'check' || icon === 'custom') ? 'none' : (icon as 'none' | 'arrow' | 'verified'));
    setItemHeight(normalizedConfig.itemHeight ?? 80);
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
  
  // Salvar automaticamente com debounce (evita salvamentos desnecessários)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Normalizar itens antes de salvar (apenas emoji ou image, sem ícones)
      const normalizedItems = items.map((item: any) => {
        // Se iconType for 'icon', converter para 'emoji' (opção removida)
        let detectedIconType = item.iconType;
        if (detectedIconType === 'icon') {
          detectedIconType = 'emoji';
        }
        
        // Detectar iconType baseado nos campos disponíveis (apenas emoji ou image)
        if (!detectedIconType || detectedIconType === 'icon') {
          if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
            detectedIconType = 'image';
          } else if (item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
            detectedIconType = 'emoji';
          } else if (!detectedIconType) {
            detectedIconType = 'emoji';
          }
        }
        
        return {
          ...item,
          iconType: detectedIconType || 'emoji',
          // Limpar campo icon (opção removida)
          icon: '',
        };
      });
      
      const configToSave = {
        items: normalizedItems,
        layout,
        multipleSelection,
        lockSlide,
        delayEnabled,
        delaySeconds,
        endIcon,
        itemHeight,
        gap,
        borderRadius,
        backgroundColor,
        textColor,
        selectedBackgroundColor,
        selectedTextColor,
        borderColor,
        borderWidth,
      };
      
      // Serializar para comparação (evita salvamentos desnecessários)
      const configStr = JSON.stringify(configToSave);
      if (lastSavedStateRef.current === configStr) {
        return; // Sem mudanças, não salvar
      }
      
      lastSavedStateRef.current = configStr;
      
      updateElement(element.id, configToSave).then(() => {
        // Atualizar ref após salvar com sucesso (para evitar re-salvamento)
        lastSavedStateRef.current = configStr;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    items,
    layout,
    multipleSelection,
    lockSlide,
    delayEnabled,
    delaySeconds,
    endIcon,
    itemHeight,
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
    const newItem = {
      id: generateId(),
      title: 'Opção 1',
      description: '',
      iconType: 'emoji',
      emoji: '👍',
      icon: '',
      imageUrl: '',
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
          <div>
            <Label className="text-sm font-semibold">Layout</Label>
            <Select
              value={layout}
              onValueChange={(value: 'list' | 'grid') => setLayout(value)}
            >
              <SelectTrigger className="h-8 text-xs mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">Lista</SelectItem>
                <SelectItem value="grid">Grid (2 colunas)</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-semibold">Ícone no Final</Label>
            <div>
              <Select
                value={endIcon}
                onValueChange={(value: 'none' | 'arrow' | 'verified') => setEndIcon(value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem ícone</SelectItem>
                  <SelectItem value="arrow">Seta</SelectItem>
                  <SelectItem value="verified">Verificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>Itens do Questionário</Label>
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
                  <SortableQuestionnaireItem
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    duplicateItem={duplicateItem}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
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
        <Label htmlFor="itemHeight">Altura do Item: {itemHeight}px</Label>
        <Slider
          id="itemHeight"
          min={40}
          max={120}
          step={4}
          value={[itemHeight]}
          onValueChange={([value]) => setItemHeight(value)}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>40px</span>
          <span>120px</span>
        </div>
      </div>

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

