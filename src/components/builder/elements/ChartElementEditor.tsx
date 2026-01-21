import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
const generateId = () => `chart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Cores padrão para novos itens
const DEFAULT_COLORS = [
  '#3b82f6', // azul
  '#ef4444', // vermelho
  '#10b981', // verde
  '#f59e0b', // laranja
  '#8b5cf6', // roxo
  '#E91E63', // rosa
  '#06b6d4', // ciano
  '#84cc16', // lima
];

interface ChartElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function ChartElementEditor({ element, tab }: ChartElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [chartType, setChartType] = useState(config.chartType || 'bar');
  const [items, setItems] = useState(config.items || []);
  const [height, setHeight] = useState(config.height ?? 300);
  const [showLegend, setShowLegend] = useState(config.showLegend ?? true);
  const [showGrid, setShowGrid] = useState(config.showGrid ?? true);
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor ?? 'transparent');
  const [textColor, setTextColor] = useState(config.textColor ?? '#000000');

  // Sincronizar apenas quando o elemento mudar (ID diferente), não quando uiConfig atualizar
  const prevElementIdRef = useRef(element.id);
  
  useEffect(() => {
    // Só sincronizar se o ID do elemento mudou (elemento diferente selecionado)
    if (prevElementIdRef.current !== element.id) {
      prevElementIdRef.current = element.id;
      const normalizedConfig = normalizeUiConfig(element.uiConfig);
      setChartType(normalizedConfig.chartType || 'bar');
      setItems(normalizedConfig.items || []);
      setHeight(normalizedConfig.height ?? 300);
      setShowLegend(normalizedConfig.showLegend ?? true);
      setShowGrid(normalizedConfig.showGrid ?? true);
      setBackgroundColor(normalizedConfig.backgroundColor ?? 'transparent');
      setTextColor(normalizedConfig.textColor ?? '#000000');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    // Não salvar na montagem inicial
    const timer = setTimeout(() => {
      updateElement(element.id, {
        chartType,
        items,
        height,
        showLegend,
        showGrid,
        backgroundColor,
        textColor,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chartType,
    items,
    height,
    showLegend,
    showGrid,
    backgroundColor,
    textColor,
    element.id,
  ]);

  const addItem = () => {
    const newItem = {
      id: generateId(),
      label: `Item ${items.length + 1}`,
      value: Math.floor(Math.random() * 50) + 10,
      color: DEFAULT_COLORS[items.length % DEFAULT_COLORS.length],
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
        label: `${itemToDuplicate.label || 'Item'} (cópia)`,
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

  // Componente SortableItem para cada item do gráfico
  const SortableChartItem = memo(function SortableChartItem({ item, itemIndex, updateItem, removeItem, duplicateItem }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: item.id,
    });
    
    // Estado local para manter o foco nos inputs
    const [localLabel, setLocalLabel] = useState(item.label || '');
    const [localValue, setLocalValue] = useState(item.value ?? 0);
    const [localColor, setLocalColor] = useState(item.color || '#3b82f6');
    
    // Refs para rastrear se os inputs estão focados
    const labelInputRef = useRef<HTMLInputElement>(null);
    const valueInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    
    // Sincronizar quando item mudar externamente (mas não durante digitação)
    useEffect(() => {
      // Só atualizar se o input não estiver focado
      const isLabelFocused = document.activeElement === labelInputRef.current;
      const isValueFocused = document.activeElement === valueInputRef.current;
      const isColorFocused = document.activeElement === colorInputRef.current;
      
      if (item.label !== localLabel && !isLabelFocused) {
        setLocalLabel(item.label || '');
      }
      if (item.value !== localValue && !isValueFocused) {
        setLocalValue(item.value ?? 0);
      }
      if (item.color !== localColor && !isColorFocused) {
        setLocalColor(item.color || '#3b82f6');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.label, item.value, item.color]);

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
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: item.color || '#3b82f6' }}
                />
                <span className="text-sm font-medium">
                  {item.label || `Item ${itemIndex + 1}`}
                </span>
                {!item.label && (
                  <span className="text-xs text-muted-foreground">
                    (sem nome)
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
              <Label htmlFor={`item-label-${item.id}`} className="text-xs">
                Nome
              </Label>
              <Input
                ref={labelInputRef}
                id={`item-label-${item.id}`}
                value={localLabel}
                onChange={(e) => {
                  setLocalLabel(e.target.value);
                }}
                onBlur={(e) => {
                  updateItem(item.id, { label: e.target.value });
                }}
                className="mt-1 h-8 text-sm"
                placeholder="Nome do item"
              />
            </div>

            <div>
              <Label htmlFor={`item-value-${item.id}`} className="text-xs">
                Valor
              </Label>
              <Input
                ref={valueInputRef}
                id={`item-value-${item.id}`}
                type="number"
                value={localValue}
                onChange={(e) => {
                  const numValue = parseFloat(e.target.value) || 0;
                  setLocalValue(numValue);
                }}
                onBlur={(e) => {
                  const numValue = parseFloat(e.target.value) || 0;
                  updateItem(item.id, { value: numValue });
                }}
                className="mt-1 h-8 text-sm"
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor={`item-color-${item.id}`} className="text-xs">
                Cor
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id={`item-color-${item.id}`}
                  type="color"
                  value={localColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalColor(value);
                    updateItem(item.id, { color: value });
                  }}
                  className="w-16 h-8"
                />
                <Input
                  ref={colorInputRef}
                  type="text"
                  value={localColor}
                  onChange={(e) => {
                    setLocalColor(e.target.value);
                  }}
                  onBlur={(e) => {
                    updateItem(item.id, { color: e.target.value });
                  }}
                  className="flex-1 h-8 text-xs"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Retornar true = props iguais, não re-renderizar
    // Retornar false = props diferentes, re-renderizar
    // Comparar apenas as propriedades do item que realmente importam para a renderização
    const itemChanged = (
      prevProps.item.id !== nextProps.item.id ||
      prevProps.item.label !== nextProps.item.label ||
      prevProps.item.value !== nextProps.item.value ||
      prevProps.item.color !== nextProps.item.color
    );
    
    const indexChanged = prevProps.itemIndex !== nextProps.itemIndex;
    
    // Se nada mudou, não re-renderizar (retornar true)
    return !itemChanged && !indexChanged;
  });

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="chart-type">Estilo do Gráfico</Label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger id="chart-type" className="mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barra</SelectItem>
              <SelectItem value="area">Linha</SelectItem>
              <SelectItem value="pie">Pizza</SelectItem>
              <SelectItem value="donut">Meia Pizza</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Itens do Gráfico</Label>
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
                  <SortableChartItem
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
        <Label htmlFor="height">Altura: {height}px</Label>
        <Slider
          id="height"
          min={200}
          max={600}
          step={10}
          value={[height]}
          onValueChange={([value]) => setHeight(value)}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>200px</span>
          <span>600px</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="showLegend">Mostrar Legenda</Label>
          <Switch
            id="showLegend"
            checked={showLegend}
            onCheckedChange={setShowLegend}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showGrid">Mostrar Grade</Label>
          <Switch
            id="showGrid"
            checked={showGrid}
            onCheckedChange={setShowGrid}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="backgroundColor">Cor de Fundo</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="backgroundColor"
            type="color"
            value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1"
            placeholder="transparent ou #ffffff"
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

