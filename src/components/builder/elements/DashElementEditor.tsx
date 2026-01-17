import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { GripVertical, Copy, Trash2, Plus } from 'lucide-react';

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
const generateId = () => `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface DashElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function DashElementEditor({ element, tab }: DashElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(config.columns ?? 2);
  const [defaultType, setDefaultType] = useState<'circular' | 'barra'>(config.defaultType || 'circular');
  const [items, setItems] = useState(config.items || []);

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    setColumns(normalizedConfig.columns ?? 2);
    setDefaultType(normalizedConfig.defaultType || 'circular');
    setItems(normalizedConfig.items || []);
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        columns,
        defaultType,
        items,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, defaultType, items, element.id]);

  const addItem = () => {
    const newItem = {
      id: generateId(),
      type: defaultType,
      percentage: 60,
      time: 5,
      description: 'Voce',
      backgroundColor: '#e5e7eb',
      transitionColor: '',
      color: '#007bff',
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
    };

    const itemIndex = items.findIndex((item: any) => item.id === itemId);
    const newItems = [...items];
    newItems.splice(itemIndex + 1, 0, duplicatedItem);
    setItems(newItems);
  };

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

  // Componente SortableItem para cada item do dash
  function SortableDashItem({ item, itemIndex, updateItem, removeItem, duplicateItem }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // Estado local para os inputs para evitar perda de foco
    const [localDescription, setLocalDescription] = useState(item.description || '');
    const [localPercentage, setLocalPercentage] = useState(item.percentage ?? 60);
    const [localTime, setLocalTime] = useState(item.time ?? 5);
    
    // Refs para rastrear se os inputs estão focados
    const descriptionInputRef = useRef<HTMLInputElement>(null);
    const percentageInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);
    
    // Sincronizar quando item mudar externamente (mas não durante digitação)
    useEffect(() => {
      // Só atualizar se o input não estiver focado
      const isDescriptionFocused = document.activeElement === descriptionInputRef.current;
      const isPercentageFocused = document.activeElement === percentageInputRef.current;
      const isTimeFocused = document.activeElement === timeInputRef.current;
      
      if (item.description !== localDescription && !isDescriptionFocused) {
        setLocalDescription(item.description || '');
      }
      if (item.percentage !== localPercentage && !isPercentageFocused) {
        setLocalPercentage(item.percentage ?? 60);
      }
      if (item.time !== localTime && !isTimeFocused) {
        setLocalTime(item.time ?? 5);
      }
    }, [item.description, item.percentage, item.time]);

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
                  {item.description || `Item ${itemIndex + 1}`}
                </span>
                {!item.description && (
                  <span className="text-xs text-muted-foreground">
                    (sem descrição)
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

            <div>
              <Label htmlFor={`item-time-${item.id}`} className="text-xs">
                Tempo (segundos)
              </Label>
              <Input
                ref={timeInputRef}
                id={`item-time-${item.id}`}
                type="number"
                min={1}
                value={localTime}
                onChange={(e) => {
                  const value = Math.max(1, Number(e.target.value) || 5);
                  setLocalTime(value);
                }}
                onBlur={(e) => {
                  const value = Math.max(1, Number(e.target.value) || 5);
                  updateItem(item.id, { time: value });
                }}
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor={`item-description-${item.id}`} className="text-xs">
                Descrição
              </Label>
              <Input
                ref={descriptionInputRef}
                id={`item-description-${item.id}`}
                value={localDescription}
                onChange={(e) => {
                  setLocalDescription(e.target.value);
                }}
                onBlur={(e) => {
                  updateItem(item.id, { description: e.target.value });
                }}
                className="mt-1 h-8 text-sm"
                placeholder="Descrição do item"
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
          <Label htmlFor="columns">Colunas</Label>
          <Select
            value={columns.toString()}
            onValueChange={(value) => setColumns(Number(value) as 1 | 2 | 3 | 4)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Coluna</SelectItem>
              <SelectItem value="2">2 Colunas</SelectItem>
              <SelectItem value="3">3 Colunas</SelectItem>
              <SelectItem value="4">4 Colunas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="defaultType">Tipo</Label>
          <Select
            value={defaultType}
            onValueChange={(value: 'circular' | 'barra') => {
              setDefaultType(value);
              // Atualizar todos os itens existentes para o novo tipo
              setItems(items.map((item: any) => ({
                ...item,
                type: value,
              })));
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circular">Círculo</SelectItem>
              <SelectItem value="barra">Barra</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Tipo aplicado a todos os itens
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Itens do Dash</Label>
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
                  <SortableDashItem
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
                  {item.description || `Item ${itemIndex + 1}`}
                </Label>
              </div>

              <div>
                <Label className="text-xs">Cor do Background</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Cor de fundo do elemento (atualmente cinza)
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
                <Label className="text-xs">Cor de Transição</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Cor durante o preenchimento/animação
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={item.transitionColor || item.color || '#007bff'}
                    onChange={(e) => updateItem(item.id, { transitionColor: e.target.value })}
                    className="w-16 h-8"
                  />
                  <Input
                    type="text"
                    value={item.transitionColor || item.color || '#007bff'}
                    onChange={(e) => updateItem(item.id, { transitionColor: e.target.value })}
                    className="flex-1 h-8 text-xs"
                    placeholder={item.color || '#007bff'}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Cor Final</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Cor quando o elemento está completamente preenchido (atualmente azul)
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={item.color || '#007bff'}
                    onChange={(e) => updateItem(item.id, { color: e.target.value })}
                    className="w-16 h-8"
                  />
                  <Input
                    type="text"
                    value={item.color || '#007bff'}
                    onChange={(e) => updateItem(item.id, { color: e.target.value })}
                    className="flex-1 h-8 text-xs"
                    placeholder="#007bff"
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

