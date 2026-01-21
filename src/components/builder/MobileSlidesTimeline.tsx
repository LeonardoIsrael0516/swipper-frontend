import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Copy, Trash2, MoreVertical, GripVertical } from 'lucide-react';
import { useBuilder, Slide } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';
import { BackgroundConfig } from '@/contexts/BuilderContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Função helper para normalizar backgroundConfig
const normalizeBackgroundConfig = (bgConfig: any): BackgroundConfig | undefined => {
  if (!bgConfig) return undefined;
  
  if (typeof bgConfig === 'string') {
    try {
      bgConfig = JSON.parse(bgConfig);
    } catch {
      return undefined;
    }
  }
  
  if (typeof bgConfig === 'object' && bgConfig !== null) {
    return bgConfig as BackgroundConfig;
  }
  
  return undefined;
};

// Função para renderizar estilo de background
const getBackgroundStyle = (slide: Slide) => {
  let bgConfig: BackgroundConfig | undefined = undefined;
  
  if (slide.backgroundConfig) {
    bgConfig = normalizeBackgroundConfig(slide.backgroundConfig);
  }
  
  if (!bgConfig && slide.uiConfig?.backgroundConfig) {
    bgConfig = normalizeBackgroundConfig(slide.uiConfig.backgroundConfig);
  }
  
  if (!bgConfig && slide.backgroundColor) {
    return {
      backgroundColor: slide.backgroundColor,
    };
  }

  if (!bgConfig) {
    return {
      background: 'linear-gradient(to bottom right, #a855f7, #E91E63)',
    };
  }

  switch (bgConfig.type) {
    case 'color':
      return {
        backgroundColor: bgConfig.color || '#9333ea',
      };

    case 'gradient':
      if (!bgConfig.gradient) break;
      const { gradient } = bgConfig;
      const stops = gradient.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
      
      if (gradient.direction === 'linear') {
        return {
          background: `linear-gradient(${gradient.angle || 90}deg, ${stops})`,
        };
      } else if (gradient.direction === 'radial') {
        return {
          background: `radial-gradient(circle, ${stops})`,
        };
      } else {
        return {
          background: `conic-gradient(from ${gradient.angle || 0}deg, ${stops})`,
        };
      }

    case 'image':
      if (!bgConfig.image?.url) break;
      return {
        backgroundImage: `url(${bgConfig.image.url})`,
        backgroundPosition: bgConfig.image.position || 'center',
        backgroundRepeat: bgConfig.image.repeat || 'no-repeat',
        backgroundSize: bgConfig.image.size || 'cover',
      };

    case 'video':
      // Para vídeo, usar uma cor sólida como placeholder
      return {
        backgroundColor: '#E91E63',
      };
  }

  return {
    background: 'linear-gradient(to bottom right, #a855f7, #E91E63)',
  };
};

function SortableSlideItem({ slide, isSelected, isEditing, editingValue, setEditingValue, inputRef, onStartEdit, onSaveEdit, onCancelEdit, onKeyDown, onDuplicate, onDelete, onSelect, getBackgroundStyle }: {
  slide: Slide;
  isSelected: boolean;
  isEditing: boolean;
  editingValue: string;
  setEditingValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onStartEdit: (slide: Slide, e?: React.MouseEvent) => void;
  onSaveEdit: (slideId: string) => Promise<void>;
  onCancelEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent, slideId: string) => void;
  onDuplicate: (slideId: string, e?: React.MouseEvent) => void;
  onDelete: (slideId: string, e?: React.MouseEvent) => void;
  onSelect: (slide: Slide) => void;
  getBackgroundStyle: (slide: Slide) => React.CSSProperties;
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
    ...getBackgroundStyle(slide),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex-shrink-0 w-20 h-12 rounded-md border-2 transition-all relative overflow-hidden',
        isSelected
          ? 'border-primary ring-1 ring-primary/20'
          : 'border-border/50'
      )}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      {isEditing ? (
        <div className="absolute inset-0 z-10 p-1">
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
            maxLength={50}
            className="h-full text-[10px] px-1 bg-background/95"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <>
          <button
            onClick={() => onSelect(slide)}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-medium py-0.5 px-1 text-center leading-tight truncate">
              {slide.question || `Slide ${slide.order}`}
            </div>
          </button>
          
          <div className="absolute top-0 left-0 z-10 p-0.5">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-white/80 hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3 h-3" />
            </div>
          </div>
          
          <div className="absolute top-0 right-0 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-white hover:bg-black/40"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem onClick={(e) => onStartEdit(slide, e)}>
                  <Pencil className="w-3 h-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => onDuplicate(slide.id, e)}>
                  <Copy className="w-3 h-3 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => onDelete(slide.id, e)}
                  className="text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}

export function MobileSlidesTimeline() {
  const { reel, selectedSlide, setSelectedSlide, addSlide, duplicateSlide, removeSlide, updateSlide, reorderSlides } = useBuilder();
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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

  // Handlers
  const handleStartEdit = (slide: Slide, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSlideId(slide.id);
    setEditingValue(slide.question || '');
  };

  const handleSaveEdit = async (slideId: string) => {
    if (!reel) return;
    const trimmedValue = editingValue.trim();
    try {
      await updateSlide(slideId, { question: trimmedValue || '' });
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

  const handleKeyDown = (e: React.KeyboardEvent, slideId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(slideId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleDuplicate = async (slideId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await duplicateSlide(slideId);
    } catch (error: any) {
      toast.error('Erro ao duplicar: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleDelete = async (slideId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (reel && reel.slides.length <= 1) {
      toast.error('Não é possível excluir o último slide');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este slide?')) {
      try {
        await removeSlide(slideId);
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  if (!reel) {
    return null;
  }

  const slides = reel.slides || [];

  return (
    <div className="h-16 px-2 py-1.5 flex items-center gap-2 overflow-x-auto hide-scrollbar">
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
          items={slides.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-center gap-2">
            {slides.map((slide) => {
              const isSelected = selectedSlide?.id === slide.id;
              const isEditing = editingSlideId === slide.id;

              return (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  inputRef={inputRef}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onKeyDown={handleKeyDown}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onSelect={setSelectedSlide}
                  getBackgroundStyle={getBackgroundStyle}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Botão Adicionar Slide */}
      <button
        onClick={() => addSlide()}
        className="flex-shrink-0 w-20 h-12 rounded-md border-2 border-dashed border-border/50 hover:border-border hover:bg-surface-hover transition-all flex items-center justify-center"
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
