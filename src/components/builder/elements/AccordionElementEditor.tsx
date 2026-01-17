import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { Plus, Trash2, GripVertical, Copy } from 'lucide-react';

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
const generateId = () => `accordion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface AccordionElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function AccordionElementEditor({ element, tab }: AccordionElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [items, setItems] = useState(config.items || []);
  const [borderRadius, setBorderRadius] = useState(config.borderRadius ?? 8);
  const [dividerColor, setDividerColor] = useState(config.dividerColor ?? '#e5e7eb');
  const [textColor, setTextColor] = useState(config.textColor ?? '#000000');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor ?? '#ffffff');
  const [descriptionColor, setDescriptionColor] = useState(config.descriptionColor ?? '#666666');

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    setItems(normalizedConfig.items || []);
    setBorderRadius(normalizedConfig.borderRadius ?? 8);
    setDividerColor(normalizedConfig.dividerColor ?? '#e5e7eb');
    setTextColor(normalizedConfig.textColor ?? '#000000');
    setBackgroundColor(normalizedConfig.backgroundColor ?? '#ffffff');
    setDescriptionColor(normalizedConfig.descriptionColor ?? '#666666');
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        items,
        borderRadius,
        dividerColor,
        textColor,
        backgroundColor,
        descriptionColor,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    items,
    borderRadius,
    dividerColor,
    textColor,
    backgroundColor,
    descriptionColor,
    element.id,
  ]);

  const addItem = () => {
    const newItem = {
      id: generateId(),
      title: 'Novo Accordion',
      description: 'Descrição do accordion',
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

  // Componente SortableItem para cada item do accordion
  function SortableAccordionItem({ item, itemIndex, updateItem, removeItem, duplicateItem }: any) {
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
                Título
              </Label>
              <Input
                id={`item-title-${item.id}`}
                value={item.title || ''}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                className="mt-1 h-8 text-sm"
                placeholder="Título do accordion"
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
                placeholder="Descrição do accordion"
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
        <div className="flex items-center justify-between">
          <Label>Itens do Accordion</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Accordion
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
                  <SortableAccordionItem
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
        <Label htmlFor="dividerColor">Cor das Divisões</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="dividerColor"
            type="color"
            value={dividerColor}
            onChange={(e) => setDividerColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={dividerColor}
            onChange={(e) => setDividerColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="textColor">Cor do Texto/Título</Label>
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
    </div>
  );
}

