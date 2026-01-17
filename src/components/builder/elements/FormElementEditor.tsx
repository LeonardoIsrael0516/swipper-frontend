import { useState, useEffect, useCallback, memo } from 'react';
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
const generateId = () => `form-field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Componente SortableField para cada campo do formulário (movido para fora para evitar recriação)
const SortableFormField = memo(function SortableFormField({ 
  field, 
  fieldIndex, 
  updateField, 
  removeField, 
  duplicateField 
}: any) {
  // Usar internalId para referências estáveis, não o ID editável
  const internalId = field.internalId || field.id;
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: internalId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(internalId, { title: e.target.value });
  }, [internalId, updateField]);

  const handlePlaceholderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(internalId, { placeholder: e.target.value });
  }, [internalId, updateField]);

  const handleIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(internalId, { id: e.target.value });
  }, [internalId, updateField]);

  const handleTypeChange = useCallback((value: 'text' | 'email' | 'tel' | 'number' | 'textarea') => {
    updateField(internalId, { type: value });
  }, [internalId, updateField]);

  const handleRequiredChange = useCallback((checked: boolean) => {
    updateField(internalId, { required: checked });
  }, [internalId, updateField]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateField(internalId);
  }, [internalId, duplicateField]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    removeField(internalId);
  }, [internalId, removeField]);

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem
        value={internalId}
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
                {field.title || `Campo ${fieldIndex + 1}`}
              </span>
              {!field.title && (
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
                onClick={handleDuplicate}
                className="h-6 w-6 p-0"
                title="Duplicar campo"
              >
                <Copy className="w-3 h-3 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0"
                title="Excluir campo"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 space-y-3">
          <div>
            <Label htmlFor={`field-title-${internalId}`} className="text-xs">
              Título
            </Label>
            <Input
              id={`field-title-${internalId}`}
              value={field.title || ''}
              onChange={handleTitleChange}
              className="mt-1 h-8 text-sm"
              placeholder="Título do campo"
            />
          </div>

          <div>
            <Label htmlFor={`field-type-${internalId}`} className="text-xs">
              Tipo
            </Label>
            <Select
              value={field.type || 'text'}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="tel">Telefone</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="textarea">Texto Longo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`field-required-${internalId}`} className="text-xs">
              Campo Obrigatório
            </Label>
            <Switch
              id={`field-required-${internalId}`}
              checked={field.required || false}
              onCheckedChange={handleRequiredChange}
            />
          </div>

          <div>
            <Label htmlFor={`field-placeholder-${internalId}`} className="text-xs">
              Placeholder
            </Label>
            <Input
              id={`field-placeholder-${internalId}`}
              value={field.placeholder || ''}
              onChange={handlePlaceholderChange}
              className="mt-1 h-8 text-sm"
              placeholder="Placeholder do campo"
            />
          </div>

          <div>
            <Label htmlFor={`field-id-${internalId}`} className="text-xs">
              ID do Campo
            </Label>
            <Input
              id={`field-id-${internalId}`}
              value={field.id || ''}
              onChange={handleIdChange}
              className="mt-1 h-8 text-sm"
              placeholder="ID do campo"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ID usado para identificar o campo nas respostas
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
});

interface FormElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function FormElementEditor({ element, tab }: FormElementEditorProps) {
  const { updateElement } = useBuilder();
  const rawConfig = normalizeUiConfig(element.uiConfig);
  // Migrar 'none' antigo para 'success'
  const config = {
    ...rawConfig,
    buttonDestination: rawConfig.buttonDestination === 'none' ? 'success' : rawConfig.buttonDestination,
  };

  const [fields, setFields] = useState(config.fields || []);
  // Botão sempre habilitado - não há mais opção de desabilitar
  const buttonEnabled = true;
  const [hideTitles, setHideTitles] = useState(config.hideTitles ?? false);
  const [buttonTitle, setButtonTitle] = useState(config.buttonTitle ?? 'Enviar');
  const [buttonDestination, setButtonDestination] = useState<'next-slide' | 'url' | 'success'>(config.buttonDestination ?? 'next-slide');
  const [buttonUrl, setButtonUrl] = useState(config.buttonUrl ?? '');
  const [buttonOpenInNewTab, setButtonOpenInNewTab] = useState(config.buttonOpenInNewTab ?? false);
  const [lockSlide, setLockSlide] = useState(config.lockSlide ?? false);
  const [gap, setGap] = useState(config.gap ?? 16);
  const [borderRadius, setBorderRadius] = useState(config.borderRadius ?? 8);
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor ?? '#ffffff');
  const [textColor, setTextColor] = useState(config.textColor ?? '#000000');
  const [borderColor, setBorderColor] = useState(config.borderColor ?? '#e5e7eb');
  const [placeholderColor, setPlaceholderColor] = useState(config.placeholderColor ?? '#999999');
  const [focusColor, setFocusColor] = useState(config.focusColor ?? '#007bff');
  const [buttonBackgroundColor, setButtonBackgroundColor] = useState(config.buttonBackgroundColor ?? '#007bff');
  const [buttonTextColor, setButtonTextColor] = useState(config.buttonTextColor ?? '#ffffff');
  const [inputHeight, setInputHeight] = useState(config.inputHeight ?? 48);
  const [inputPadding, setInputPadding] = useState(config.inputPadding ?? { top: 12, right: 16, bottom: 12, left: 16 });

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    // Garantir que todos os campos tenham internalId
    const fieldsWithInternalId = (normalizedConfig.fields || []).map((field: any) => ({
      ...field,
      internalId: field.internalId || field.id || generateId(),
    }));
    setFields(fieldsWithInternalId);
    // Botão sempre habilitado - não há mais opção de desabilitar
    setButtonTitle(normalizedConfig.buttonTitle ?? 'Enviar');
    setButtonDestination(normalizedConfig.buttonDestination ?? 'next-slide');
    setButtonUrl(normalizedConfig.buttonUrl ?? '');
    setButtonOpenInNewTab(normalizedConfig.buttonOpenInNewTab ?? false);
    setLockSlide(normalizedConfig.lockSlide ?? false);
    setGap(normalizedConfig.gap ?? 16);
    setBorderRadius(normalizedConfig.borderRadius ?? 8);
    setBackgroundColor(normalizedConfig.backgroundColor ?? '#ffffff');
    setTextColor(normalizedConfig.textColor ?? '#000000');
    setBorderColor(normalizedConfig.borderColor ?? '#e5e7eb');
    setPlaceholderColor(normalizedConfig.placeholderColor ?? '#999999');
    setFocusColor(normalizedConfig.focusColor ?? '#007bff');
    setButtonBackgroundColor(normalizedConfig.buttonBackgroundColor ?? '#007bff');
    setButtonTextColor(normalizedConfig.buttonTextColor ?? '#ffffff');
    setInputHeight(normalizedConfig.inputHeight ?? 48);
    setInputPadding(normalizedConfig.inputPadding ?? { top: 12, right: 16, bottom: 12, left: 16 });
    setHideTitles(normalizedConfig.hideTitles ?? false);
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        fields,
        buttonEnabled: true, // Sempre true - botão obrigatório
        hideTitles,
        buttonTitle,
        buttonDestination,
        buttonUrl,
        buttonOpenInNewTab,
        lockSlide,
        gap,
        borderRadius,
        backgroundColor,
        textColor,
        borderColor,
        placeholderColor,
        focusColor,
        buttonBackgroundColor,
        buttonTextColor,
        inputHeight,
        inputPadding,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fields,
    hideTitles,
    buttonTitle,
    buttonDestination,
    buttonUrl,
    buttonOpenInNewTab,
    lockSlide,
    gap,
    borderRadius,
    backgroundColor,
    textColor,
    borderColor,
    placeholderColor,
    focusColor,
    buttonBackgroundColor,
    buttonTextColor,
    inputHeight,
    inputPadding,
    element.id,
  ]);

  const addField = () => {
    const internalId = generateId();
    const newField = {
      internalId, // ID interno estável para keys e referências
      id: internalId, // ID editável (inicialmente igual ao internalId)
      title: 'Novo Campo',
      type: 'text',
      required: false,
      placeholder: 'Digite aqui...',
    };
    setFields([...fields, newField]);
  };


  const updateField = useCallback((internalId: string, updates: Partial<any>) => {
    setFields((prevFields) => 
      prevFields.map((field: any) => {
        const fieldInternalId = field.internalId || field.id;
        return fieldInternalId === internalId ? { ...field, ...updates } : field;
      })
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

    const oldIndex = fields.findIndex((field: any) => {
      const fieldInternalId = field.internalId || field.id;
      return fieldInternalId === active.id;
    });
    const newIndex = fields.findIndex((field: any) => {
      const fieldInternalId = field.internalId || field.id;
      return fieldInternalId === over.id;
    });

    if (oldIndex === -1 || newIndex === -1) return;

    setFields(arrayMove(fields, oldIndex, newIndex));
  };

  const removeFieldCallback = useCallback((internalId: string) => {
    setFields((prevFields) => 
      prevFields.filter((field: any) => {
        const fieldInternalId = field.internalId || field.id;
        return fieldInternalId !== internalId;
      })
    );
  }, []);

  const duplicateFieldCallback = useCallback((internalId: string) => {
    setFields((prevFields) => {
      const fieldToDuplicate = prevFields.find((field: any) => {
        const fieldInternalId = field.internalId || field.id;
        return fieldInternalId === internalId;
      });
      if (!fieldToDuplicate) return prevFields;

      const newInternalId = generateId();
      const duplicatedField = {
        ...fieldToDuplicate,
        internalId: newInternalId,
        id: fieldToDuplicate.id || newInternalId, // Manter o ID editável se existir
        title: `${fieldToDuplicate.title || 'Campo'} (cópia)`,
      };

      const fieldIndex = prevFields.findIndex((field: any) => {
        const fieldInternalId = field.internalId || field.id;
        return fieldInternalId === internalId;
      });
      const newFields = [...prevFields];
      newFields.splice(fieldIndex + 1, 0, duplicatedField);
      return newFields;
    });
  }, []);

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Campos do Formulário</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addField}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Campo
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum campo adicionado</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={addField}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Campo
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((field: any) => field.internalId || field.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion type="multiple" className="w-full space-y-2">
                {fields.map((field: any, fieldIndex: number) => (
                  <SortableFormField
                    key={field.internalId || field.id}
                    field={field}
                    fieldIndex={fieldIndex}
                    updateField={updateField}
                    removeField={removeFieldCallback}
                    duplicateField={duplicateFieldCallback}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        )}

        <div className="border-t pt-4 mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Ocultar Títulos</Label>
              <p className="text-xs text-muted-foreground">
                Oculta os títulos de todos os campos, mostrando apenas os placeholders
              </p>
            </div>
            <Switch
              checked={hideTitles}
              onCheckedChange={setHideTitles}
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-semibold">Botão de Envio</Label>
            <p className="text-xs text-muted-foreground">
              O botão de envio é sempre obrigatório e visível
            </p>

            <div className="mt-4">
              <Label htmlFor="buttonTitle">Título do Botão</Label>
              <Input
                id="buttonTitle"
                value={buttonTitle}
                onChange={(e) => setButtonTitle(e.target.value)}
                className="mt-1"
                placeholder="Enviar"
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="buttonDestination">Ação Após Envio</Label>
              <Select
                value={buttonDestination}
                onValueChange={(value: 'next-slide' | 'url' | 'success') => setButtonDestination(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next-slide">Próximo Slide</SelectItem>
                  <SelectItem value="url">URL Personalizada</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {buttonDestination === 'url' && (
              <>
                <div className="mt-4">
                  <Label htmlFor="buttonUrl">URL</Label>
                  <Input
                    id="buttonUrl"
                    type="url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://exemplo.com"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Label htmlFor="buttonOpenInNewTab">Abrir em Nova Aba</Label>
                  <Switch
                    id="buttonOpenInNewTab"
                    checked={buttonOpenInNewTab}
                    onCheckedChange={setButtonOpenInNewTab}
                  />
                </div>
              </>
            )}
          </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="lockSlide">Travar Slide</Label>
            <Switch
              id="lockSlide"
              checked={lockSlide}
              onCheckedChange={setLockSlide}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Só permite passar se campos obrigatórios preenchidos
          </p>
        </div>
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gap">Espaçamento entre Campos: {gap}px</Label>
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

      <div>
        <Label htmlFor="inputHeight">Altura dos Campos: {inputHeight}px</Label>
        <Slider
          id="inputHeight"
          min={32}
          max={80}
          step={1}
          value={[inputHeight]}
          onValueChange={([value]) => setInputHeight(value)}
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
        <Label htmlFor="placeholderColor">Cor do Placeholder</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="placeholderColor"
            type="color"
            value={placeholderColor}
            onChange={(e) => setPlaceholderColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={placeholderColor}
            onChange={(e) => setPlaceholderColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="focusColor">Cor do Foco</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="focusColor"
            type="color"
            value={focusColor}
            onChange={(e) => setFocusColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={focusColor}
            onChange={(e) => setFocusColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <Label className="text-sm font-semibold mb-4 block">Botão</Label>

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

        <div className="mt-4">
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
      </div>
    </div>
  );
}

