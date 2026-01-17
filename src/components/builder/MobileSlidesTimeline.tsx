import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Copy, Trash2, MoreVertical } from 'lucide-react';
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
      background: 'linear-gradient(to bottom right, #a855f7, #ec4899)',
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
        backgroundColor: '#000000',
      };
  }

  return {
    background: 'linear-gradient(to bottom right, #a855f7, #ec4899)',
  };
};

export function MobileSlidesTimeline() {
  const { reel, selectedSlide, setSelectedSlide, addSlide, duplicateSlide, removeSlide, updateSlide } = useBuilder();
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

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
      {slides.map((slide) => {
        const isSelected = selectedSlide?.id === slide.id;
        const isEditing = editingSlideId === slide.id;

        return (
          <div
            key={slide.id}
            className={cn(
              'flex-shrink-0 w-20 h-12 rounded-md border-2 transition-all relative overflow-hidden',
              isSelected
                ? 'border-primary ring-1 ring-primary/20'
                : 'border-border/50'
            )}
            style={getBackgroundStyle(slide)}
          >
            {/* Overlay escuro para melhor contraste */}
            <div className="absolute inset-0 bg-black/20" />
            
            {isEditing ? (
              // Modo de edição
              <div className="absolute inset-0 z-10 p-1">
                <Input
                  ref={inputRef}
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, slide.id)}
                  onBlur={() => {
                    const trimmedValue = editingValue.trim();
                    const currentValue = slide.question || '';
                    if (trimmedValue !== currentValue) {
                      handleSaveEdit(slide.id);
                    } else {
                      handleCancelEdit();
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
                {/* Nome do slide */}
                <button
                  onClick={() => setSelectedSlide(slide)}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                >
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-medium py-0.5 px-1 text-center leading-tight truncate">
                    {slide.question || `Slide ${slide.order}`}
                  </div>
                </button>
                
                {/* Menu de ações */}
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
                      <DropdownMenuItem onClick={(e) => handleStartEdit(slide, e)}>
                        <Pencil className="w-3 h-3 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDuplicate(slide.id, e)}>
                        <Copy className="w-3 h-3 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleDelete(slide.id, e)}
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
      })}
      
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
