import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Copy, Trash2, X, Check, Pencil, GripVertical } from 'lucide-react';
import { useBuilder, Slide } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

function SortableSlideItem({ slide, isSelected, confirmingDelete, setConfirmingDelete, editingSlideId, setEditingSlideId, editingValue, setEditingValue, inputRef, onStartEdit, onSaveEdit, onCancelEdit, onKeyDown, onDuplicate, onDelete, onSelect }: {
  slide: Slide;
  isSelected: boolean;
  confirmingDelete: string | null;
  setConfirmingDelete: (id: string | null) => void;
  editingSlideId: string | null;
  setEditingSlideId: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onStartEdit: (slide: Slide, e?: React.MouseEvent) => void;
  onSaveEdit: (slideId: string) => Promise<void>;
  onCancelEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, slideId: string) => void;
  onDuplicate: (slideId: string) => void;
  onDelete: (slideId: string) => void;
  onSelect: (slide: Slide) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'w-full rounded-lg transition-colors relative group',
        isSelected
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-surface hover:bg-surface-hover'
      )}
    >
      {confirmingDelete === slide.id ? (
        <div className="p-3">
          <div className="text-sm font-medium mb-2 text-center">
            Excluir este card?
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={async () => {
                await onDelete(slide.id);
                setConfirmingDelete(null);
              }}
            >
              <Check className="w-3 h-3 mr-1" />
              Sim
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmingDelete(null)}
            >
              <X className="w-3 h-3 mr-1" />
              Não
            </Button>
          </div>
        </div>
      ) : editingSlideId === slide.id ? (
        <div className="p-3">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Input
                ref={inputRef}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => onKeyDown(e, slide.id)}
                onBlur={() => {
                  const trimmedValue = editingValue.trim();
                  const currentValue = slide.question || '';
                  if (trimmedValue !== currentValue) {
                    onSaveEdit(slide.id);
                  } else {
                    onCancelEdit();
                  }
                }}
                placeholder={`Slide ${slide.order}`}
                maxLength={100}
                className="h-7 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {(slide.elements || []).length} elemento{(slide.elements || []).length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onSelect(slide)}
          className="w-full text-left p-3 cursor-pointer"
        >
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div 
              className="flex-1 min-w-0"
              onDoubleClick={(e) => onStartEdit(slide, e)}
            >
              <div className="text-sm font-medium truncate">
                {slide.question || `Slide ${slide.order}`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(slide.elements || []).length} elemento{(slide.elements || []).length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-surface-hover hover:text-foreground"
                onClick={(e) => onStartEdit(slide, e)}
                title="Editar nome"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-surface-hover hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(slide.id);
                }}
                title="Duplicar card"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(slide.id);
                }}
                title="Excluir card"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BuilderSidebar() {
  const { reel, selectedSlide, setSelectedSlide, addSlide, duplicateSlide, removeSlide, updateSlide, reorderSlides } = useBuilder();
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-focus no input quando entrar em modo de edição
  useEffect(() => {
    if (editingSlideId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSlideId]);

  // Handlers para edição
  const handleStartEdit = (slide: Slide, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevenir seleção do slide
    setEditingSlideId(slide.id);
    setEditingValue(slide.question || '');
  };

  const handleSaveEdit = async (slideId: string) => {
    if (!reel) return;

    const trimmedValue = editingValue.trim();
    
    try {
      await updateSlide(slideId, {
        question: trimmedValue || '',
      });
      
      setEditingSlideId(null);
      setEditingValue('');
      toast.success('Nome do slide atualizado');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleCancelEdit = () => {
    setEditingSlideId(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, slideId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(slideId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  if (!reel) {
    return (
      <div className="basis-64 min-w-[200px] max-w-[256px] border-r border-border/50 bg-background p-4">
        <p className="text-sm text-muted-foreground">Nenhum reel carregado</p>
      </div>
    );
  }

  return (
    <div className="basis-64 min-w-[200px] max-w-[256px] border-r border-border/50 bg-background flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-sm font-semibold mb-2">Etapas</h2>
        <Button
          onClick={() => addSlide()}
          size="sm"
          className="w-full gradient-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Card
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={async (event: DragEndEvent) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
              await reorderSlides(active.id as string, over.id as string);
            }
          }}
        >
          <SortableContext
            items={(reel.slides || []).map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {(reel.slides || []).map((slide) => (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  isSelected={selectedSlide?.id === slide.id}
                  confirmingDelete={confirmingDelete}
                  setConfirmingDelete={setConfirmingDelete}
                  editingSlideId={editingSlideId}
                  setEditingSlideId={setEditingSlideId}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  inputRef={inputRef}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onKeyDown={handleKeyDown}
                  onDuplicate={duplicateSlide}
                  onDelete={removeSlide}
                  onSelect={setSelectedSlide}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

