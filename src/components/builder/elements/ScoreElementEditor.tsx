import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { uploadFile } from '@/lib/media';
import { toast } from 'sonner';
import { GripVertical, Copy, Trash2, Plus, Upload, Loader2, Image as ImageIcon } from 'lucide-react';

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
const generateId = () => `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ScoreElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function ScoreElementEditor({ element, tab }: ScoreElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(config.title || 'HOJE');
  const [imageUrl, setImageUrl] = useState(config.imageUrl || null);
  const [showImage, setShowImage] = useState(config.showImage !== undefined ? config.showImage : true);
  const [imageSize, setImageSize] = useState(config.imageSize !== undefined ? config.imageSize : 100);
  const [titleColor, setTitleColor] = useState(config.titleColor || '#22c55e');
  // Normalizar itens para garantir que textColor seja preto se não estiver definido
  const normalizedInitialItems = (config.items || []).map((item: any) => ({
    ...item,
    textColor: item.textColor || '#000000',
  }));
  const [items, setItems] = useState(normalizedInitialItems);
  const [isUploading, setIsUploading] = useState(false);

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    setTitle(normalizedConfig.title || 'HOJE');
    setImageUrl(normalizedConfig.imageUrl || null);
    setShowImage(normalizedConfig.showImage !== undefined ? normalizedConfig.showImage : true);
    setImageSize(normalizedConfig.imageSize !== undefined ? normalizedConfig.imageSize : 100);
    setTitleColor(normalizedConfig.titleColor || '#22c55e');
    // Normalizar itens para garantir que textColor seja preto se não estiver definido
    const normalizedItems = (normalizedConfig.items || []).map((item: any) => ({
      ...item,
      textColor: item.textColor || '#000000',
    }));
    setItems(normalizedItems);
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        title,
        imageUrl,
        showImage,
        imageSize,
        titleColor,
        items,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, imageUrl, showImage, imageSize, titleColor, items, element.id]);

  const addItem = () => {
    const newItem = {
      id: generateId(),
      title: 'Nível de Potência Vocal',
      value: 'Fraco',
      percentage: 20,
      progressColor: '#ef4444',
      backgroundColor: '#e5e7eb',
      textColor: '#000000', // Preto por padrão
    };
    // Garantir que o textColor seja explicitamente preto
    if (!newItem.textColor || newItem.textColor === '#ffffff' || newItem.textColor === 'white') {
      newItem.textColor = '#000000';
    }
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
    };

    const itemIndex = items.findIndex((item: any) => item.id === itemId);
    const newItems = [...items];
    newItems.splice(itemIndex + 1, 0, duplicatedItem);
    setItems(newItems);
  };

  const updateItem = useCallback((itemId: string, updates: Partial<any>) => {
    setItems((prevItems) => prevItems.map((item: any) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        // Se textColor não foi definido ou está vazio/branco, usar preto como padrão
        if (!updatedItem.textColor || updatedItem.textColor === '' || updatedItem.textColor === '#ffffff' || updatedItem.textColor === 'white') {
          updatedItem.textColor = '#000000';
        }
        return updatedItem;
      }
      return item;
    }));
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      
      setImageUrl(url);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer upload: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

  // Componente SortableItem para cada item do score
  function SortableScoreItem({ item, itemIndex, updateItem, removeItem, duplicateItem }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const [localTitle, setLocalTitle] = useState(item.title || '');
    const [localValue, setLocalValue] = useState(item.value || '');
    const [localPercentage, setLocalPercentage] = useState(item.percentage ?? 20);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const valueInputRef = useRef<HTMLInputElement>(null);
    const percentageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const isTitleFocused = document.activeElement === titleInputRef.current;
      const isValueFocused = document.activeElement === valueInputRef.current;
      const isPercentageFocused = document.activeElement === percentageInputRef.current;

      if (item.title !== localTitle && !isTitleFocused) {
        setLocalTitle(item.title || '');
      }
      if (item.value !== localValue && !isValueFocused) {
        setLocalValue(item.value || '');
      }
      if (item.percentage !== localPercentage && !isPercentageFocused) {
        setLocalPercentage(item.percentage ?? 20);
      }
    }, [item.title, item.value, item.percentage]);

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
                ref={titleInputRef}
                id={`item-title-${item.id}`}
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={(e) => updateItem(item.id, { title: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Título do item"
              />
            </div>

            <div>
              <Label htmlFor={`item-value-${item.id}`} className="text-xs">
                Valor/Descrição
              </Label>
              <Input
                ref={valueInputRef}
                id={`item-value-${item.id}`}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={(e) => updateItem(item.id, { value: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Valor ou descrição"
              />
            </div>

            <div>
              <Label htmlFor={`item-percentage-${item.id}`} className="text-xs">
                Porcentagem: {localPercentage}%
              </Label>
              <Input
                ref={percentageInputRef}
                id={`item-percentage-${item.id}`}
                type="number"
                min={0}
                max={100}
                value={localPercentage}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  setLocalPercentage(value);
                }}
                onBlur={(e) => {
                  const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  updateItem(item.id, { percentage: value });
                }}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </div>
    );
  }

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="HOJE"
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="showImage">Mostrar Imagem</Label>
            <Switch
              id="showImage"
              checked={showImage}
              onCheckedChange={setShowImage}
            />
          </div>
        </div>

        {showImage && (
          <div>
            <Label>Imagem</Label>
            <div className="mt-1 space-y-2">
              {imageUrl ? (
                <>
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-auto rounded-lg border border-border"
                      style={{ width: `${imageSize}%`, margin: '0 auto', display: 'block' }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setImageUrl(null)}
                    >
                      Remover
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="imageSize" className="text-xs">
                      Tamanho da Imagem: {imageSize}%
                    </Label>
                    <Slider
                      id="imageSize"
                      min={25}
                      max={100}
                      step={5}
                      value={[imageSize]}
                      onValueChange={([value]) => setImageSize(value)}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>25%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-border">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar Imagem
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label>Itens de Progresso</Label>
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
                  <SortableScoreItem
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    duplicateItem={duplicateItem}
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

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Adicione itens na aba Configurações para personalizar as cores</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any, itemIndex: number) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  {item.title || `Item ${itemIndex + 1}`}
                </Label>
              </div>

              <div>
                <Label className="text-xs">Cor do Progresso</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Cor da barra de progresso
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={item.progressColor || '#ef4444'}
                    onChange={(e) => updateItem(item.id, { progressColor: e.target.value })}
                    className="w-16 h-8"
                  />
                  <Input
                    type="text"
                    value={item.progressColor || '#ef4444'}
                    onChange={(e) => updateItem(item.id, { progressColor: e.target.value })}
                    className="flex-1 h-8 text-xs"
                    placeholder="#ef4444"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Cor de Fundo</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Cor de fundo da barra de progresso
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={item.backgroundColor || '#e5e7eb'}
                    onChange={(e) => updateItem(item.id, { backgroundColor: e.target.value })}
                    className="w-16 h-8"
                  />
                  <Input
                    type="text"
                    value={item.backgroundColor || '#e5e7eb'}
                    onChange={(e) => updateItem(item.id, { backgroundColor: e.target.value })}
                    className="flex-1 h-8 text-xs"
                    placeholder="#e5e7eb"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Cor do Texto</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Cor dos textos (título, valor e porcentagem)
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={item.textColor || '#000000'}
                    onChange={(e) => updateItem(item.id, { textColor: e.target.value })}
                    className="w-16 h-8"
                  />
                  <Input
                    type="text"
                    value={item.textColor || '#000000'}
                    onChange={(e) => updateItem(item.id, { textColor: e.target.value })}
                    className="flex-1 h-8 text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

