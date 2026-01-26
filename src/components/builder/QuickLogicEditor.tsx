import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Zap, X } from 'lucide-react';
import { useBuilder, Slide } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickLogicEditorProps {
  slide: Slide;
}

export function QuickLogicEditor({ slide }: QuickLogicEditorProps) {
  const { reel, updateSlideLogicNext } = useBuilder();
  const [logicNext, setLogicNext] = useState(slide.logicNext || {});

  // Sincronizar com slide quando mudar
  useEffect(() => {
    setLogicNext(slide.logicNext || {});
  }, [slide.logicNext]);

  // Obter todas as opções e itens de questionários/question grids
  const allResponses = useMemo(() => {
    if (!reel) return [];

    const responses: Array<{
      id: string;
      type: 'option' | 'questionnaire-item' | 'question-grid-item';
      label: string;
      elementId?: string;
      currentDestination?: string;
    }> = [];

    // Opções do slide
    if (slide.options && slide.options.length > 0) {
      slide.options.forEach((option) => {
        responses.push({
          id: option.id,
          type: 'option',
          label: `${option.emoji || ''} ${option.text}`.trim() || `Opção ${option.id.substring(0, 8)}`,
          currentDestination: logicNext.options?.[option.id],
        });
      });
    }

    // Itens de questionários e question grids
    if (slide.elements) {
      slide.elements.forEach((element) => {
        if (element.elementType === 'QUESTIONNAIRE' || element.elementType === 'QUESTION_GRID') {
          const config = element.uiConfig || {};
          const items = config.items || [];
          
          items.forEach((item: any) => {
            const itemKey = `${element.id}-item-${item.id}`;
            responses.push({
              id: item.id,
              type: element.elementType === 'QUESTIONNAIRE' ? 'questionnaire-item' : 'question-grid-item',
              label: item.title || item.text || `Item ${item.id.substring(0, 8)}`,
              elementId: element.id,
              currentDestination: logicNext.elements?.[itemKey],
            });
          });
        }
      });
    }

    return responses;
  }, [reel, slide, logicNext]);

  const getTargetSlideName = (targetSlideId: string | null) => {
    if (!targetSlideId || !reel) return null;
    const targetSlide = reel.slides.find((s) => s.id === targetSlideId);
    if (!targetSlide) return null;
    const index = reel.slides.findIndex((s) => s.id === targetSlideId);
    return `Slide ${index + 1}: ${targetSlide.question || `Slide ${index + 1}`}`;
  };

  const handleUpdateDestination = async (
    responseId: string,
    type: 'option' | 'questionnaire-item' | 'question-grid-item',
    elementId: string | undefined,
    targetSlideId: string | null
  ) => {
    if (!reel) return;

    const updatedLogicNext = { ...logicNext };
    
    if (type === 'option') {
      if (!updatedLogicNext.options) {
        updatedLogicNext.options = {};
      }
      if (targetSlideId) {
        updatedLogicNext.options[responseId] = targetSlideId;
      } else {
        delete updatedLogicNext.options[responseId];
        if (Object.keys(updatedLogicNext.options).length === 0) {
          delete updatedLogicNext.options;
        }
      }
    } else if (type === 'questionnaire-item' || type === 'question-grid-item') {
      if (!updatedLogicNext.elements) {
        updatedLogicNext.elements = {};
      }
      const elementItemKey = elementId ? `${elementId}-item-${responseId}` : responseId;
      if (targetSlideId) {
        updatedLogicNext.elements[elementItemKey] = targetSlideId;
      } else {
        delete updatedLogicNext.elements[elementItemKey];
        if (Object.keys(updatedLogicNext.elements).length === 0) {
          delete updatedLogicNext.elements;
        }
      }
    }

    setLogicNext(updatedLogicNext);

    try {
      await updateSlideLogicNext(slide.id, updatedLogicNext);
      toast.success('Destino atualizado');
    } catch (error: any) {
      toast.error('Erro ao salvar destino: ' + (error.message || 'Erro desconhecido'));
      setLogicNext(logicNext); // Reverter em caso de erro
    }
  };

  if (!reel) {
    return (
      <div className="text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (allResponses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuração Rápida de Lógica</CardTitle>
          <CardDescription className="text-xs">
            Adicione opções de resposta ou itens de questionário para configurar os destinos
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Configuração Rápida de Lógica</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Configure rapidamente os destinos de todas as respostas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {allResponses.map((response) => {
          const targetSlideName = getTargetSlideName(response.currentDestination || null);
          
          return (
            <div
              key={`${response.type}-${response.id}`}
              className="p-3 border rounded-lg bg-surface space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs font-medium">
                    {response.type === 'option' && '📝 Opção'}
                    {response.type === 'questionnaire-item' && '📋 Questionário'}
                    {response.type === 'question-grid-item' && '🔲 Grid'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {response.label}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <Select
                  value={response.currentDestination || '__default__'}
                  onValueChange={(value) => 
                    handleUpdateDestination(
                      response.id,
                      response.type,
                      response.elementId,
                      value === '__default__' ? null : value
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Selecione o slide de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">
                      <span className="text-muted-foreground">Próximo slide (padrão)</span>
                    </SelectItem>
                    {reel.slides.map((s, idx) => (
                      <SelectItem key={s.id} value={s.id}>
                        Slide {idx + 1}: {s.question || `Slide ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {targetSlideName && (
                <div className="flex items-center gap-2 pl-7 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Vai para: {targetSlideName}</span>
                </div>
              )}
            </div>
          );
        })}
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="font-medium mb-1">💡 Dica:</p>
          <p>O fluxo visual sempre tem prioridade. Esta configuração será usada apenas se não houver conexão no fluxo.</p>
        </div>
      </CardContent>
    </Card>
  );
}
