import React, { useState, useEffect, useRef } from 'react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { Plus, Trash2, GripVertical, Upload, Loader2, X, Image as ImageIcon, Copy } from 'lucide-react';
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
const generateId = () => `carousel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface CarouselElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function CarouselElementEditor({ element, tab }: CarouselElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [items, setItems] = useState(config.items || []);
  const [baseWidth, setBaseWidth] = useState(config.baseWidth ?? 300);
  const [autoplay, setAutoplay] = useState(config.autoplay ?? false);
  const [autoplayDelay, setAutoplayDelay] = useState(config.autoplayDelay ?? 3000);
  const [pauseOnHover, setPauseOnHover] = useState(config.pauseOnHover ?? false);
  const [loop, setLoop] = useState(config.loop ?? false);
  const [round, setRound] = useState(config.round ?? false);
  const [gap, setGap] = useState(config.gap ?? 16);
  const [borderRadius, setBorderRadius] = useState(config.borderRadius ?? 24);
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor ?? '#0d0716');
  const [borderColor, setBorderColor] = useState(config.borderColor ?? '#555');
  const [textColor, setTextColor] = useState(config.textColor ?? '#fff');
  const [isUploading, setIsUploading] = useState(false);

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    setItems(normalizedConfig.items || []);
    setBaseWidth(normalizedConfig.baseWidth ?? 300);
    setAutoplay(normalizedConfig.autoplay ?? false);
    setAutoplayDelay(normalizedConfig.autoplayDelay ?? 3000);
    setPauseOnHover(normalizedConfig.pauseOnHover ?? false);
    setLoop(normalizedConfig.loop ?? false);
    setRound(normalizedConfig.round ?? false);
    setGap(normalizedConfig.gap ?? 16);
    setBorderRadius(normalizedConfig.borderRadius ?? 24);
    setBackgroundColor(normalizedConfig.backgroundColor ?? '#0d0716');
    setBorderColor(normalizedConfig.borderColor ?? '#555');
    setTextColor(normalizedConfig.textColor ?? '#fff');
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        items,
        baseWidth,
        autoplay,
        autoplayDelay,
        pauseOnHover,
        loop,
        round,
        gap,
        borderRadius,
        backgroundColor,
        borderColor,
        textColor,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    items,
    baseWidth,
    autoplay,
    autoplayDelay,
    pauseOnHover,
    loop,
    round,
    gap,
    borderRadius,
    backgroundColor,
    borderColor,
    textColor,
    element.id,
  ]);


  const addItem = () => {
    const newItem = {
      id: generateId(),
      title: 'Novo Item',
      description: 'Descrição do item',
      icon: '',
      backgroundImage: '',
      overlay: {
        enabled: false,
        color: '#000000',
        opacity: 0.5,
      },
    };
    setItems([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item: any) => item.id !== itemId));
  };

  const duplicateItem = (itemId: string) => {
    const itemToDuplicate = items.find((item: any) => item.id === itemId);
    if (!itemToDuplicate) return;

    const duplicatedItem = {
      ...itemToDuplicate,
      id: generateId(),
      title: `${itemToDuplicate.title || 'Item'} (cópia)`,
    };

    const itemIndex = items.findIndex((item: any) => item.id === itemId);
    const newItems = [...items];
    newItems.splice(itemIndex + 1, 0, duplicatedItem);
    setItems(newItems);
  };

  const updateItem = (itemId: string, updates: Partial<any>) => {
    setItems(items.map((item: any) => 
      item.id === itemId ? { ...item, ...updates } : item
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

    const oldIndex = items.findIndex((item: any) => item.id === active.id);
    const newIndex = items.findIndex((item: any) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setItems(arrayMove(items, oldIndex, newIndex));
  };

  // Componente SortableItem para cada item do carrossel
  // Componente SortableItem para cada item do carrossel
  function SortableCarouselItem({ item, itemIndex, updateItem, removeItem, duplicateItem, isUploading }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id,
    });

    // Estado local para título e descrição para evitar desfoque
    const [localTitle, setLocalTitle] = useState(item.title || '');
    const [localDescription, setLocalDescription] = useState(item.description || '');
    const isTitleFocusedRef = useRef(false);
    const isDescriptionFocusedRef = useRef(false);

    // Sincronizar quando item mudar externamente (apenas se não estiver editando)
    useEffect(() => {
      if (!isTitleFocusedRef.current) {
        setLocalTitle(item.title || '');
      }
      if (!isDescriptionFocusedRef.current) {
        setLocalDescription(item.description || '');
      }
    }, [item.title, item.description]);

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
                Título
              </Label>
              <Input
                id={`item-title-${item.id}`}
                value={localTitle}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalTitle(newValue);
                }}
                onFocus={() => {
                  isTitleFocusedRef.current = true;
                }}
                onBlur={() => {
                  isTitleFocusedRef.current = false;
                  // Atualizar apenas ao sair do campo
                  updateItem(item.id, { title: localTitle });
                }}
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
                value={localDescription}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalDescription(newValue);
                }}
                onFocus={() => {
                  isDescriptionFocusedRef.current = true;
                }}
                onBlur={() => {
                  isDescriptionFocusedRef.current = false;
                  // Atualizar apenas ao sair do campo
                  updateItem(item.id, { description: localDescription });
                }}
                className="mt-1 h-8 text-sm"
                placeholder="Descrição do item"
              />
            </div>

            <div>
              <Label className="text-xs">Ícone</Label>
              <div className="mt-1">
                <IconEmojiSelector
                  value={item.icon || ''}
                  onChange={(value) => updateItem(item.id, { icon: value })}
                />
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <Label className="text-xs font-semibold">Imagem de Fundo</Label>
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
                      
                      updateItem(item.id, { backgroundImage: url });
                      toast.success('Imagem de fundo enviada com sucesso!');
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
                
                {item.backgroundImage ? (
                  <div className="relative">
                    <img
                      src={item.backgroundImage}
                      alt="Background preview"
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
                        onClick={() => updateItem(item.id, { backgroundImage: '' })}
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
                      <ImageIcon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
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

                {item.backgroundImage && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Overlay</Label>
                      <Switch
                        checked={item.overlay?.enabled || false}
                        onCheckedChange={(enabled) => 
                          updateItem(item.id, { 
                            overlay: { 
                              ...(item.overlay || { enabled: false, color: '#000000', opacity: 0.5 }),
                              enabled 
                            } 
                          })
                        }
                      />
                    </div>

                    {item.overlay?.enabled && (
                      <>
                        <div>
                          <Label className="text-xs">Cor do Overlay</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={item.overlay?.color || '#000000'}
                              onChange={(e) => 
                                updateItem(item.id, { 
                                  overlay: { 
                                    ...(item.overlay || { enabled: true, color: '#000000', opacity: 0.5 }),
                                    color: e.target.value 
                                  } 
                                })
                              }
                              className="w-16 h-8"
                            />
                            <Input
                              type="text"
                              value={item.overlay?.color || '#000000'}
                              onChange={(e) => 
                                updateItem(item.id, { 
                                  overlay: { 
                                    ...(item.overlay || { enabled: true, color: '#000000', opacity: 0.5 }),
                                    color: e.target.value 
                                  } 
                                })
                              }
                              className="flex-1 h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">
                            Opacidade: {Math.round((item.overlay?.opacity || 0.5) * 100)}%
                          </Label>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[Math.round((item.overlay?.opacity || 0.5) * 100)]}
                            onValueChange={([value]) => 
                              updateItem(item.id, { 
                                overlay: { 
                                  ...(item.overlay || { enabled: true, color: '#000000', opacity: 0.5 }),
                                  opacity: value / 100 
                                } 
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
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
        <div className="flex items-center justify-between">
          <Label>Itens do Carrossel</Label>
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
                  <SortableCarouselItem
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    duplicateItem={duplicateItem}
                    isUploading={isUploading}
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
        <Label htmlFor="baseWidth">Largura Base: {baseWidth}px</Label>
        <Slider
          id="baseWidth"
          min={100}
          max={500}
          step={10}
          value={[baseWidth]}
          onValueChange={([value]) => setBaseWidth(value)}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>100px</span>
          <span>500px</span>
        </div>
      </div>

      <div>
        <Label htmlFor="gap">Espaçamento: {gap}px</Label>
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="autoplay">Reprodução Automática</Label>
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={setAutoplay}
          />
        </div>

        {autoplay && (
          <div>
            <Label htmlFor="autoplayDelay">Intervalo (ms): {autoplayDelay}</Label>
            <Slider
              id="autoplayDelay"
              min={1000}
              max={10000}
              step={100}
              value={[autoplayDelay]}
              onValueChange={([value]) => setAutoplayDelay(value)}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1s</span>
              <span>10s</span>
            </div>
          </div>
        )}

        {autoplay && (
          <div className="flex items-center justify-between">
            <Label htmlFor="pauseOnHover">Pausar ao Passar Mouse</Label>
            <Switch
              id="pauseOnHover"
              checked={pauseOnHover}
              onCheckedChange={setPauseOnHover}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="loop">Loop Infinito</Label>
          <Switch
            id="loop"
            checked={loop}
            onCheckedChange={setLoop}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="round">Formato Circular</Label>
          <Switch
            id="round"
            checked={round}
            onCheckedChange={setRound}
          />
        </div>
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

    </div>
  );
}

