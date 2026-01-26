import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Copy, Trash2, X, Check, Pencil, GripVertical, Tag, Palette, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useBuilder, Slide } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Cores predefinidas para tags
const TAG_COLORS = [
  { value: null, label: 'Sem cor', color: 'transparent' },
  { value: '#ef4444', label: 'Vermelho', color: '#ef4444' },
  { value: '#f97316', label: 'Laranja', color: '#f97316' },
  { value: '#eab308', label: 'Amarelo', color: '#eab308' },
  { value: '#22c55e', label: 'Verde', color: '#22c55e' },
  { value: '#06b6d4', label: 'Ciano', color: '#06b6d4' },
  { value: '#3b82f6', label: 'Azul', color: '#3b82f6' },
  { value: '#8b5cf6', label: 'Roxo', color: '#8b5cf6' },
  { value: '#ec4899', label: 'Rosa', color: '#ec4899' },
  { value: '#6b7280', label: 'Cinza', color: '#6b7280' },
];

function SortableSlideItem({ slide, isSelected, confirmingDelete, setConfirmingDelete, editingSlideId, setEditingSlideId, editingValue, setEditingValue, inputRef, onStartEdit, onSaveEdit, onCancelEdit, onKeyDown, onDuplicate, onDelete, onSelect, onUpdateTagColor, reel, folders, onMoveToFolder }: {
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
  onUpdateTagColor: (slideId: string, color: string | null) => Promise<void>;
  reel: any;
  folders: SlideFolder[];
  onMoveToFolder: (slideId: string, folderId: string | null) => Promise<void>;
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

  // Obter cor da tag do slide (armazenada em uiConfig.tagColor)
  const tagColor = slide.uiConfig?.tagColor || null;
  const tagColorObj = TAG_COLORS.find(c => c.value === tagColor) || TAG_COLORS[0];

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
        <div className="p-2">
          <div className="text-xs font-medium mb-2 text-center">
            Excluir este card?
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 text-xs h-7"
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
              className="flex-1 text-xs h-7"
              onClick={() => setConfirmingDelete(null)}
            >
              <X className="w-3 h-3 mr-1" />
              Não
            </Button>
          </div>
        </div>
      ) : editingSlideId === slide.id ? (
        <div className="p-2">
          <div className="flex items-start gap-1.5">
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
                className="h-7 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onSelect(slide)}
          className="w-full text-left p-2 cursor-pointer"
        >
          <div className="flex items-start gap-1.5">
            <div
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            {/* Indicador de cor da tag */}
            {tagColor && (
              <div
                className="mt-0.5 w-3 h-3 rounded-full flex-shrink-0 border border-border/50"
                style={{ backgroundColor: tagColor }}
                title={tagColorObj.label}
              />
            )}
            <div 
              className="flex-1 min-w-0"
              onDoubleClick={(e) => onStartEdit(slide, e)}
            >
              <div className="text-xs font-medium truncate">
                {slide.question || `Slide ${slide.order}`}
              </div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-surface-hover hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    title="Tag de cor"
                  >
                    <Tag className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold mb-2">Cor da tag</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.value || 'none'}
                          onClick={() => onUpdateTagColor(slide.id, color.value)}
                          className={cn(
                            "w-8 h-8 rounded border-2 transition-all hover:scale-110",
                            tagColor === color.value
                              ? "border-foreground ring-2 ring-offset-1"
                              : "border-border/50"
                          )}
                          style={{
                            backgroundColor: color.color === 'transparent' ? 'var(--muted)' : color.color,
                          }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-surface-hover hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    title="Mais opções"
                  >
                    <X className="w-3 h-3 rotate-45" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEdit(slide, e);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Editar nome
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(slide.id);
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  {reel && folders.length > 0 && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToFolder(slide.id, null);
                        }}
                      >
                        Mover para: Sem pasta
                      </DropdownMenuItem>
                      {folders.map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToFolder(slide.id, folder.id);
                          }}
                        >
                          Mover para: {folder.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingDelete(slide.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SlideFolder {
  id: string;
  name: string;
  order: number;
  collapsed?: boolean;
}

// Componente para tornar uma pasta droppable
function DroppableFolder({ folderId, children, isOver }: { folderId: string; children: React.ReactNode; isOver?: boolean }) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `folder-${folderId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors rounded-lg",
        (isOver || isDroppableOver) && "bg-primary/10 border-primary border-2"
      )}
    >
      {children}
    </div>
  );
}

// Componente para área droppable "Sem pasta"
function DroppableUnassigned({ children, isOver }: { children: React.ReactNode; isOver?: boolean }) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: 'folder-unassigned',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors",
        (isOver || isDroppableOver) && "bg-primary/10 border-primary border-2 rounded-lg p-2"
      )}
    >
      {children}
    </div>
  );
}

export function BuilderSidebar() {
  const { reel, selectedSlide, setSelectedSlide, setSelectedElement, addSlide, duplicateSlide, removeSlide, updateSlide, reorderSlides, setReel } = useBuilder();
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpdateTagColor = async (slideId: string, color: string | null) => {
    if (!reel) return;
    
    try {
      // Obter uiConfig atual do slide
      const slide = reel.slides.find((s) => s.id === slideId);
      if (!slide) return;
      
      const currentUiConfig = slide.uiConfig || {};
      const updatedUiConfig = {
        ...currentUiConfig,
        tagColor: color,
      };
      
      await updateSlide(slideId, {
        uiConfig: updatedUiConfig,
      });
      
      toast.success('Cor da tag atualizada');
    } catch (error: any) {
      toast.error('Erro ao salvar cor: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // Obter pastas do reel (armazenadas em reel.uiConfig.folders)
  const folders = useMemo(() => {
    if (!reel) return [];
    const foldersConfig = reel.uiConfig?.folders || [];
    return (foldersConfig as SlideFolder[]).sort((a, b) => a.order - b.order);
  }, [reel]);

  // Organizar slides por pasta
  const slidesByFolder = useMemo(() => {
    if (!reel) return { folders: new Map<string, Slide[]>(), unassigned: [] as Slide[] };
    
    const folderMap = new Map<string, Slide[]>();
    const unassigned: Slide[] = [];
    
    reel.slides.forEach((slide) => {
      const folderId = slide.uiConfig?.folderId;
      if (folderId) {
        if (!folderMap.has(folderId)) {
          folderMap.set(folderId, []);
        }
        folderMap.get(folderId)!.push(slide);
      } else {
        unassigned.push(slide);
      }
    });
    
    // Ordenar slides dentro de cada pasta
    folderMap.forEach((slides) => {
      slides.sort((a, b) => a.order - b.order);
    });
    unassigned.sort((a, b) => a.order - b.order);
    
    return { folders: folderMap, unassigned };
  }, [reel]);

  const updateReelUiConfig = async (updatedUiConfig: any) => {
    if (!reel) return;
    
    // Guardar uiConfig anterior para reverter em caso de erro
    const previousUiConfig = reel.uiConfig;
    
    // Atualizar estado local imediatamente
    const updatedReel = {
      ...reel,
      uiConfig: updatedUiConfig,
    };
    setReel(updatedReel);
    
    // Salvar no backend
    try {
      const response = await api.patch(`/reels/${reel.id}`, {
        uiConfig: updatedUiConfig,
      });
      
      // Atualizar com dados retornados do backend para garantir sincronização
      const reelData = (response as any).data || response;
      if (reelData) {
        setReel({ ...updatedReel, uiConfig: normalizeUiConfig(reelData.uiConfig || updatedUiConfig) });
      }
    } catch (error: any) {
      console.error('Erro ao salvar uiConfig:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      toast.error('Erro ao salvar configurações: ' + errorMessage);
      // Reverter mudança local em caso de erro
      setReel({ ...reel, uiConfig: previousUiConfig });
    }
  };

  const handleCreateFolder = async () => {
    if (!reel || !newFolderName.trim()) return;
    
    try {
      const currentUiConfig = reel.uiConfig || {};
      const currentFolders = (currentUiConfig.folders || []) as SlideFolder[];
      const newFolder: SlideFolder = {
        id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newFolderName.trim(),
        order: currentFolders.length,
        collapsed: false,
      };
      
      const updatedFolders = [...currentFolders, newFolder];
      const updatedUiConfig = {
        ...currentUiConfig,
        folders: updatedFolders,
      };
      
      await updateReelUiConfig(updatedUiConfig);
      
      setNewFolderName('');
      setCreatingFolder(false);
      toast.success('Pasta criada');
    } catch (error: any) {
      toast.error('Erro ao criar pasta: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!reel || !editingFolderName.trim()) return;
    
    try {
      const currentUiConfig = reel.uiConfig || {};
      const currentFolders = (currentUiConfig.folders || []) as SlideFolder[];
      const updatedFolders = currentFolders.map((f) =>
        f.id === folderId ? { ...f, name: editingFolderName.trim() } : f
      );
      
      const updatedUiConfig = {
        ...currentUiConfig,
        folders: updatedFolders,
      };
      
      await updateReelUiConfig(updatedUiConfig);
      
      setEditingFolderId(null);
      setEditingFolderName('');
      toast.success('Pasta renomeada');
    } catch (error: any) {
      toast.error('Erro ao renomear pasta: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!reel) return;
    
    try {
      // Mover slides da pasta para "unassigned" (remover folderId)
      const slidesInFolder = slidesByFolder.folders.get(folderId) || [];
      for (const slide of slidesInFolder) {
        const currentUiConfig = slide.uiConfig || {};
        const updatedUiConfig = {
          ...currentUiConfig,
          folderId: undefined,
        };
        await updateSlide(slide.id, { uiConfig: updatedUiConfig });
      }
      
      // Remover pasta
      const currentUiConfig = reel.uiConfig || {};
      const currentFolders = (currentUiConfig.folders || []) as SlideFolder[];
      const updatedFolders = currentFolders.filter((f) => f.id !== folderId);
      
      const updatedUiConfig = {
        ...currentUiConfig,
        folders: updatedFolders,
      };
      
      await updateReelUiConfig(updatedUiConfig);
      
      toast.success('Pasta removida');
    } catch (error: any) {
      toast.error('Erro ao remover pasta: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleToggleFolder = (folderId: string) => {
    if (!reel) return;
    
    const currentUiConfig = reel.uiConfig || {};
    const currentFolders = (currentUiConfig.folders || []) as SlideFolder[];
    const updatedFolders = currentFolders.map((f) =>
      f.id === folderId ? { ...f, collapsed: !(f.collapsed !== false) } : f
    );
    
    const updatedUiConfig = {
      ...currentUiConfig,
      folders: updatedFolders,
    };
    
    updateReelUiConfig(updatedUiConfig);
  };

  // Função auxiliar para calcular ordem hierárquica baseada na estrutura visual atual
  // Esta função recalcula a ordem baseada na posição visual na sidebar (pastas + ordem dentro das pastas)
  const calculateHierarchicalOrder = (slides: Slide[]): Slide[] => {
    if (!reel) return slides;
    
    const folders = (reel.uiConfig?.folders || []).sort((a: any, b: any) => a.order - b.order);
    const folderMap = new Map<string, Slide[]>();
    const unassigned: Slide[] = [];
    
    // Criar um mapa de posição no array original para manter a ordem relativa após o movimento
    const positionMap = new Map<string, number>();
    slides.forEach((slide, index) => {
      positionMap.set(slide.id, index);
    });

    // Organizar slides por pasta baseado na estrutura atual
    slides.forEach((slide) => {
      const folderId = slide.uiConfig?.folderId;
      if (folderId) {
        if (!folderMap.has(folderId)) {
          folderMap.set(folderId, []);
        }
        folderMap.get(folderId)!.push(slide);
      } else {
        unassigned.push(slide);
      }
    });

    // Ordenar slides dentro de cada pasta pela posição no array (não pela ordem antiga!)
    folderMap.forEach((folderSlides) => {
      folderSlides.sort((a, b) => {
        const posA = positionMap.get(a.id) ?? 0;
        const posB = positionMap.get(b.id) ?? 0;
        return posA - posB;
      });
    });
    unassigned.sort((a, b) => {
      const posA = positionMap.get(a.id) ?? 0;
      const posB = positionMap.get(b.id) ?? 0;
      return posA - posB;
    });

    // Criar ordem hierárquica: pastas em ordem, depois slides sem pasta
    const hierarchicalOrder: Slide[] = [];
    folders.forEach((folder: any) => {
      const folderSlides = folderMap.get(folder.id) || [];
      hierarchicalOrder.push(...folderSlides);
    });
    hierarchicalOrder.push(...unassigned);

    // Atualizar ordem de cada slide baseado na ordem hierárquica
    // O primeiro slide da primeira pasta terá order = 1
    return hierarchicalOrder.map((slide, index) => ({
      ...slide,
      order: index + 1,
    }));
  };

  const handleMoveSlideToFolder = async (slideId: string, folderId: string | null, targetSlideId?: string) => {
    if (!reel) return;
    
    try {
      const slide = reel.slides.find((s) => s.id === slideId);
      if (!slide) return;
      
      const currentUiConfig = slide.uiConfig || {};
      const updatedUiConfig = {
        ...currentUiConfig,
        folderId: folderId || undefined,
      };
      
      // Se foi especificado um slide de destino, calcular a nova ordem antes de atualizar
      let updatedSlides = [...reel.slides];
      
      if (targetSlideId && targetSlideId !== slideId) {
        // Primeiro atualizar o folderId
        updatedSlides = updatedSlides.map((s) =>
          s.id === slideId ? { ...s, uiConfig: updatedUiConfig } : s
        );
        
        // Encontrar o índice do slide de destino na lista completa
        const targetIndex = updatedSlides.findIndex((s) => s.id === targetSlideId);
        const activeIndex = updatedSlides.findIndex((s) => s.id === slideId);
        
        if (targetIndex !== -1 && activeIndex !== -1) {
          // Remover o slide da posição atual
          const [movedSlide] = updatedSlides.splice(activeIndex, 1);
          // Inserir logo após o slide de destino
          const newIndex = activeIndex < targetIndex ? targetIndex : targetIndex + 1;
          updatedSlides.splice(newIndex, 0, movedSlide);
        }
      } else {
        // Apenas atualizar o folderId sem reordenar
        updatedSlides = updatedSlides.map((s) =>
          s.id === slideId ? { ...s, uiConfig: updatedUiConfig } : s
        );
      }
      
      // Recalcular ordem hierárquica baseada na estrutura visual
      updatedSlides = calculateHierarchicalOrder(updatedSlides);
      
      // Atualizar estado local imediatamente para feedback visual
      setReel({ ...reel, slides: updatedSlides });
      
      // Salvar no backend
      await updateSlide(slideId, {
        uiConfig: updatedUiConfig,
      });
      
      // Se houve reordenação, salvar a nova ordem no backend
      if (targetSlideId && targetSlideId !== slideId) {
        try {
          await api.patch(`/reels/${reel.id}/slides/reorder`, {
            slides: updatedSlides.map((s) => ({ id: s.id, order: s.order })),
          });
        } catch (error: any) {
          console.error('Erro ao reordenar slides:', error);
        }
      }
      
      toast.success('Slide movido');
    } catch (error: any) {
      toast.error('Erro ao mover slide: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // Auto-focus no input de pasta
  useEffect(() => {
    if ((editingFolderId || creatingFolder) && folderInputRef.current) {
      folderInputRef.current.focus();
      folderInputRef.current.select();
    }
  }, [editingFolderId, creatingFolder]);

  if (!reel) {
    return (
      <div className="basis-56 min-w-[180px] max-w-[224px] border-r border-border/50 bg-background p-4">
        <p className="text-sm text-muted-foreground">Nenhum reel carregado</p>
      </div>
    );
  }

  return (
    <div className="basis-56 min-w-[180px] max-w-[224px] border-r border-border/50 bg-background flex flex-col">
      <div className="p-3 border-b border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold">Etapas</h2>
          <Button
            onClick={() => setCreatingFolder(true)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            title="Criar pasta"
          >
            <Folder className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button
          onClick={() => addSlide()}
          size="sm"
          className="w-full gradient-primary text-primary-foreground text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Adicionar Card
        </Button>
        {creatingFolder && (
          <div className="flex gap-1">
            <Input
              ref={folderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              placeholder="Nome da pasta"
              className="h-7 text-xs"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => {
                setCreatingFolder(false);
                setNewFolderName('');
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 hide-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over) return;
            
            const activeId = active.id as string;
            const overId = over.id as string;
            
            // Verificar se foi solto diretamente sobre uma pasta
            if (typeof overId === 'string' && overId.startsWith('folder-')) {
              const folderId = overId.replace('folder-', '');
              
              // Se for "folder-unassigned", mover para fora da pasta (null)
              if (folderId === 'unassigned') {
                await handleMoveSlideToFolder(activeId, null);
              } else {
                // Mover para a pasta específica
                await handleMoveSlideToFolder(activeId, folderId);
              }
              return;
            }
            
            // Se foi solto sobre um slide, verificar se esse slide está em uma pasta
            const targetSlide = reel?.slides.find((s) => s.id === overId);
            const activeSlide = reel?.slides.find((s) => s.id === activeId);
            
            if (targetSlide && activeSlide) {
              const targetFolderId = targetSlide.uiConfig?.folderId;
              const activeFolderId = activeSlide.uiConfig?.folderId;
              
              // Se o slide de destino está em uma pasta diferente da do slide ativo
              // mover o slide arrastado para a pasta do destino E reordenar para ficar logo após o slide de destino
              if (targetFolderId !== activeFolderId) {
                await handleMoveSlideToFolder(activeId, targetFolderId || null, overId);
                return;
              }
              
              // Se ambos estão na mesma pasta (ou ambos sem pasta), fazer reordenação normal
              if (activeId !== overId) {
                await reorderSlides(activeId, overId);
              }
              return;
            }
            
            // Fallback: reordenação normal se não encontrou os slides
            if (activeId !== overId) {
              await reorderSlides(activeId, overId);
            }
          }}
        >
          <SortableContext
            items={(() => {
              // Criar lista de IDs na ordem hierárquica visual (pastas + slides dentro das pastas + slides sem pasta)
              const hierarchicalIds: string[] = [];
              
              // Adicionar slides das pastas em ordem
              folders.forEach((folder) => {
                const folderSlides = slidesByFolder.folders.get(folder.id) || [];
                folderSlides.forEach((slide) => {
                  hierarchicalIds.push(slide.id);
                });
              });
              
              // Adicionar slides sem pasta
              slidesByFolder.unassigned.forEach((slide) => {
                hierarchicalIds.push(slide.id);
              });
              
              return hierarchicalIds;
            })()}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {/* Renderizar pastas com seus slides */}
              {folders.map((folder) => {
                const folderSlides = slidesByFolder.folders.get(folder.id) || [];
                const isCollapsed = folder.collapsed !== false;
                
                return (
                  <DroppableFolder key={folder.id} folderId={folder.id}>
                    <Collapsible
                      open={!isCollapsed}
                      onOpenChange={() => handleToggleFolder(folder.id)}
                    >
                      <div className="rounded-lg border border-border/50 bg-surface">
                      <CollapsibleTrigger className="w-full p-2 flex items-center justify-between hover:bg-surface-hover transition-colors min-h-[40px]">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {isCollapsed ? (
                            <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          )}
                          <Folder className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          {editingFolderId === folder.id ? (
                            <Input
                              ref={folderInputRef}
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameFolder(folder.id);
                                } else if (e.key === 'Escape') {
                                  setEditingFolderId(null);
                                  setEditingFolderName('');
                                }
                              }}
                              onBlur={() => {
                                if (editingFolderName.trim()) {
                                  handleRenameFolder(folder.id);
                                } else {
                                  setEditingFolderId(null);
                                  setEditingFolderName('');
                                }
                              }}
                              className="h-6 text-xs flex-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-xs font-medium truncate flex-1" onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}>
                              {folder.name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({folderSlides.length})
                          </span>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 hover:bg-surface-hover hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                            title="Renomear pasta"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Remover pasta? Os slides serão movidos para fora da pasta.')) {
                                handleDeleteFolder(folder.id);
                              }
                            }}
                            title="Remover pasta"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-2 pb-2 space-y-1">
                          {folderSlides.map((slide) => (
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
                              onSelect={(slide) => {
                        setSelectedSlide(slide);
                        setSelectedElement(null); // Limpar elemento selecionado para mostrar editor de lógica
                      }}
                              onUpdateTagColor={handleUpdateTagColor}
                              reel={reel}
                              folders={folders}
                              onMoveToFolder={handleMoveSlideToFolder}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                  </DroppableFolder>
                );
              })}
              
              {/* Renderizar slides sem pasta */}
              <DroppableUnassigned>
                {slidesByFolder.unassigned.length > 0 ? (
                  <div className="space-y-1">
                    {slidesByFolder.unassigned.map((slide) => (
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
                        onSelect={(slide) => {
                          setSelectedSlide(slide);
                          setSelectedElement(null); // Limpar elemento selecionado para mostrar editor de lógica
                        }}
                        onUpdateTagColor={handleUpdateTagColor}
                        reel={reel}
                        folders={folders}
                        onMoveToFolder={handleMoveSlideToFolder}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[40px]" />
                )}
              </DroppableUnassigned>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

