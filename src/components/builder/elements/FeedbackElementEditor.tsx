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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { Plus, Trash2, GripVertical, Upload, Loader2, X, Image as ImageIcon, Copy } from 'lucide-react';
import { uploadFile } from '@/lib/media';
import { toast } from 'sonner';

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
const generateId = () => `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface FeedbackElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function FeedbackElementEditor({ element, tab }: FeedbackElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);

  const [layout, setLayout] = useState(config.layout || 'list');
  const [reviews, setReviews] = useState(config.reviews || []);
  const [gap, setGap] = useState(config.gap ?? 16);
  const [borderRadius, setBorderRadius] = useState(config.borderRadius ?? 12);
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor ?? 'transparent');
  const [textColor, setTextColor] = useState(config.textColor ?? '#000000');
  const [starColor, setStarColor] = useState(config.starColor ?? '#FFD700');
  const [cardBackgroundColor, setCardBackgroundColor] = useState(config.cardBackgroundColor ?? '#ffffff');
  const [cardBorderColor, setCardBorderColor] = useState(config.cardBorderColor ?? '#e5e7eb');
  const [showProgress, setShowProgress] = useState(config.showProgress ?? true);
  const [showArrows, setShowArrows] = useState(config.showArrows ?? true);
  const [controlsColor, setControlsColor] = useState(config.controlsColor ?? '#000000');
  const [autoPlay, setAutoPlay] = useState(config.autoPlay ?? false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(config.autoPlayInterval ?? 5);
  const [isUploading, setIsUploading] = useState(false);

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    setLayout(normalizedConfig.layout || 'list');
    setReviews(normalizedConfig.reviews || []);
    setGap(normalizedConfig.gap ?? 16);
    setBorderRadius(normalizedConfig.borderRadius ?? 12);
    setBackgroundColor(normalizedConfig.backgroundColor ?? 'transparent');
    setTextColor(normalizedConfig.textColor ?? '#000000');
    setStarColor(normalizedConfig.starColor ?? '#FFD700');
    setCardBackgroundColor(normalizedConfig.cardBackgroundColor ?? '#ffffff');
    setCardBorderColor(normalizedConfig.cardBorderColor ?? '#e5e7eb');
    setShowProgress(normalizedConfig.showProgress ?? true);
    setShowArrows(normalizedConfig.showArrows ?? true);
    setControlsColor(normalizedConfig.controlsColor ?? '#000000');
    setAutoPlay(normalizedConfig.autoPlay ?? false);
    setAutoPlayInterval(normalizedConfig.autoPlayInterval ?? 5);
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        layout,
        reviews,
        gap,
        borderRadius,
        backgroundColor,
        textColor,
        starColor,
        cardBackgroundColor,
        cardBorderColor,
        showProgress,
        showArrows,
        controlsColor,
        autoPlay,
        autoPlayInterval,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layout,
    reviews,
    gap,
    borderRadius,
    backgroundColor,
    textColor,
    starColor,
    cardBackgroundColor,
    cardBorderColor,
    showProgress,
    showArrows,
    controlsColor,
    autoPlay,
    autoPlayInterval,
    element.id,
  ]);

  const addReview = () => {
    const newReview = {
      id: generateId(),
      name: 'Novo Cliente',
      stars: 5,
      description: 'Excelente produto! Recomendo.',
      avatar: undefined,
    };
    setReviews([...reviews, newReview]);
  };

  const removeReview = (reviewId: string) => {
    setReviews(reviews.filter((review: any) => review.id !== reviewId));
  };

  const duplicateReview = (reviewId: string) => {
    const reviewToDuplicate = reviews.find((review: any) => review.id === reviewId);
    if (!reviewToDuplicate) return;

    const duplicatedReview = {
      ...reviewToDuplicate,
      id: generateId(),
      name: `${reviewToDuplicate.name || 'Cliente'} (cópia)`,
    };

    const reviewIndex = reviews.findIndex((review: any) => review.id === reviewId);
    const newReviews = [...reviews];
    newReviews.splice(reviewIndex + 1, 0, duplicatedReview);
    setReviews(newReviews);
  };

  const updateReview = (reviewId: string, updates: Partial<any>) => {
    setReviews(
      reviews.map((review: any) =>
        review.id === reviewId ? { ...review, ...updates } : review
      )
    );
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

    const oldIndex = reviews.findIndex((review: any) => review.id === active.id);
    const newIndex = reviews.findIndex((review: any) => review.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setReviews(arrayMove(reviews, oldIndex, newIndex));
  };

  // Componente SortableReview para cada review
  function SortableReview({ review, reviewIndex, updateReview, removeReview, duplicateReview, isUploading }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: review.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // Usar estado local para evitar perda de foco
    const [localName, setLocalName] = useState(review.name || '');
    const [localDescription, setLocalDescription] = useState(review.description || '');

    // Sincronizar quando review mudar externamente
    useEffect(() => {
      setLocalName(review.name || '');
      setLocalDescription(review.description || '');
    }, [review.id, review.name, review.description]);

    // Debounce para atualizar o review
    useEffect(() => {
      const timer = setTimeout(() => {
        if (localName !== (review.name || '')) {
          updateReview(review.id, { name: localName });
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [localName, review.id, review.name, updateReview]);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (localDescription !== (review.description || '')) {
          updateReview(review.id, { description: localDescription });
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [localDescription, review.id, review.description, updateReview]);

    return (
      <div ref={setNodeRef} style={style}>
        <AccordionItem value={review.id} className="border rounded-lg px-3">
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
                  {review.name || `Review ${reviewIndex + 1}`}
                </span>
                {!review.name && (
                  <span className="text-xs text-muted-foreground">(sem nome)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateReview(review.id);
                  }}
                  className="h-6 w-6 p-0"
                  title="Duplicar review"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeReview(review.id);
                  }}
                  className="h-6 w-6 p-0"
                  title="Excluir review"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 space-y-3">
            <div>
              <Label htmlFor={`review-name-${review.id}`} className="text-xs">
                Nome
              </Label>
              <Input
                id={`review-name-${review.id}`}
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="mt-1 h-8 text-sm"
                placeholder="Nome do cliente"
              />
            </div>

            <div>
              <Label className="text-xs">
                Estrelas: {review.stars || 5}
              </Label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[review.stars || 5]}
                onValueChange={([value]) => updateReview(review.id, { stars: value })}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>5</span>
              </div>
            </div>

            <div>
              <Label htmlFor={`review-description-${review.id}`} className="text-xs">
                Descrição (Depoimento)
              </Label>
              <Textarea
                id={`review-description-${review.id}`}
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                className="mt-1 text-sm min-h-[80px]"
                placeholder="Depoimento do cliente"
              />
            </div>

            <div className="border-t pt-3 mt-3">
              <Label className="text-xs font-semibold">Avatar</Label>
              <div className="mt-2 space-y-2">
                <input
                  ref={(el) => {
                    if (el) {
                      (el as any).dataset.reviewId = review.id;
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

                      updateReview(review.id, { avatar: url });
                      toast.success('Avatar enviado com sucesso!');
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

                {review.avatar ? (
                  <div className="relative">
                    <img
                      src={review.avatar}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full border border-border object-cover"
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
                          const input = document.querySelector(
                            `input[data-review-id="${review.id}"]`
                          ) as HTMLInputElement;
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
                        onClick={() => updateReview(review.id, { avatar: undefined })}
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
                        const input = document.querySelector(
                          `input[data-review-id="${review.id}"]`
                        ) as HTMLInputElement;
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
                        const input = document.querySelector(
                          `input[data-review-id="${review.id}"]`
                        ) as HTMLInputElement;
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
                          Selecionar Avatar
                        </>
                      )}
                    </Button>
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
        <div>
          <Label htmlFor="layout">Tipo de Layout</Label>
          <Select value={layout} onValueChange={(value: 'list' | 'carousel') => setLayout(value)}>
            <SelectTrigger id="layout" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">Lista</SelectItem>
              <SelectItem value="carousel">Carrossel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Depoimentos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addReview}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Depoimento
          </Button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum depoimento adicionado</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={addReview}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Depoimento
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={reviews.map((review: any) => review.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion type="multiple" className="w-full space-y-2">
                {reviews.map((review: any, reviewIndex: number) => (
                  <SortableReview
                    key={review.id}
                    review={review}
                    reviewIndex={reviewIndex}
                    updateReview={updateReview}
                    removeReview={removeReview}
                    duplicateReview={duplicateReview}
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
        <Label htmlFor="starColor">Cor das Estrelas</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="starColor"
            type="color"
            value={starColor}
            onChange={(e) => setStarColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={starColor}
            onChange={(e) => setStarColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cardBackgroundColor">Cor de Fundo do Card</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="cardBackgroundColor"
            type="color"
            value={cardBackgroundColor}
            onChange={(e) => setCardBackgroundColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={cardBackgroundColor}
            onChange={(e) => setCardBackgroundColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cardBorderColor">Cor da Borda do Card</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="cardBorderColor"
            type="color"
            value={cardBorderColor}
            onChange={(e) => setCardBorderColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={cardBorderColor}
            onChange={(e) => setCardBorderColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {layout === 'carousel' && (
        <>
          <div className="flex items-center justify-between">
            <Label htmlFor="showProgress">Mostrar Progresso</Label>
            <Switch
              id="showProgress"
              checked={showProgress}
              onCheckedChange={setShowProgress}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showArrows">Mostrar Setas</Label>
            <Switch
              id="showArrows"
              checked={showArrows}
              onCheckedChange={setShowArrows}
            />
          </div>

          <div>
            <Label htmlFor="controlsColor">Cor dos Controles (Setas e Barrinha)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="controlsColor"
                type="color"
                value={controlsColor}
                onChange={(e) => setControlsColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={controlsColor}
                onChange={(e) => setControlsColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoPlay">Carrossel Automático</Label>
            <Switch
              id="autoPlay"
              checked={autoPlay}
              onCheckedChange={setAutoPlay}
            />
          </div>

          {autoPlay && (
            <div>
              <Label htmlFor="autoPlayInterval">Intervalo (segundos)</Label>
              <Input
                id="autoPlayInterval"
                type="number"
                min="1"
                value={autoPlayInterval}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1) {
                    setAutoPlayInterval(value);
                  }
                }}
                className="mt-1"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

