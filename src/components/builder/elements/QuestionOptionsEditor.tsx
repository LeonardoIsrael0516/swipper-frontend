import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowRight, X } from 'lucide-react';
import { useBuilder, Slide } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuestionOptionsEditorProps {
  slide: Slide;
}

export function QuestionOptionsEditor({ slide }: QuestionOptionsEditorProps) {
  const { reel, updateSlide, updateSlideLogicNext } = useBuilder();
  const [options, setOptions] = useState(slide.options || []);
  const [logicNext, setLogicNext] = useState(slide.logicNext || {});

  // Sincronizar com slide quando mudar
  useEffect(() => {
    setOptions(slide.options || []);
    setLogicNext(slide.logicNext || {});
  }, [slide.options, slide.logicNext]);

  const handleAddOption = useCallback(() => {
    if (!reel) return;
    
    const newOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: `Opção ${(options.length + 1)}`,
      emoji: '',
      order: options.length,
    };
    
    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);
    
    // Salvar no backend - enviar apenas text e emoji (sem id, order será gerado no backend)
    updateSlide(slide.id, {
      options: updatedOptions.map((opt) => ({
        text: opt.text,
        emoji: opt.emoji || undefined,
      })) as any, // Backend espera CreateOptionDto[] que não tem id
    }).catch((error: any) => {
      toast.error('Erro ao adicionar opção: ' + (error.message || 'Erro desconhecido'));
      setOptions(options); // Reverter em caso de erro
    });
  }, [reel, options, slide.id, updateSlide]);

  const handleUpdateOption = useCallback((optionId: string, field: 'text' | 'emoji', value: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    );
    setOptions(updatedOptions);
    
    // Salvar no backend com debounce - enviar apenas text e emoji
    const timeoutId = setTimeout(() => {
      updateSlide(slide.id, {
        options: updatedOptions.map((opt) => ({
          text: opt.text,
          emoji: opt.emoji || undefined,
        })) as any, // Backend espera CreateOptionDto[] que não tem id
      }).catch((error: any) => {
        toast.error('Erro ao salvar opção: ' + (error.message || 'Erro desconhecido'));
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [options, slide.id, updateSlide]);

  const handleRemoveOption = useCallback(async (optionId: string) => {
    if (!reel) return;
    
    const updatedOptions = options.filter((opt) => opt.id !== optionId);
    setOptions(updatedOptions);
    
    // Remover conexão do logicNext se existir
    const updatedLogicNext = { ...logicNext };
    if (updatedLogicNext.options?.[optionId]) {
      delete updatedLogicNext.options[optionId];
      if (Object.keys(updatedLogicNext.options).length === 0) {
        delete updatedLogicNext.options;
      }
      setLogicNext(updatedLogicNext);
    }
    
    try {
      // Salvar opções atualizadas - enviar apenas text e emoji
      await updateSlide(slide.id, {
        options: updatedOptions.map((opt) => ({
          text: opt.text,
          emoji: opt.emoji || undefined,
        })) as any, // Backend espera CreateOptionDto[] que não tem id
      });
      
      if (Object.keys(updatedLogicNext).length !== Object.keys(logicNext).length) {
        await updateSlideLogicNext(slide.id, updatedLogicNext);
      }
      
      toast.success('Opção removida');
    } catch (error: any) {
      toast.error('Erro ao remover opção: ' + (error.message || 'Erro desconhecido'));
      setOptions(options); // Reverter em caso de erro
    }
  }, [reel, options, logicNext, slide.id, updateSlide, updateSlideLogicNext]);

  const handleUpdateDestination = useCallback(async (optionId: string, targetSlideId: string | null) => {
    if (!reel) return;
    
    const updatedLogicNext = { ...logicNext };
    if (!updatedLogicNext.options) {
      updatedLogicNext.options = {};
    }
    
    if (targetSlideId) {
      updatedLogicNext.options[optionId] = targetSlideId;
    } else {
      delete updatedLogicNext.options[optionId];
      if (Object.keys(updatedLogicNext.options).length === 0) {
        delete updatedLogicNext.options;
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
  }, [reel, logicNext, slide.id, updateSlideLogicNext]);

  const getTargetSlideName = useCallback((targetSlideId: string | null) => {
    if (!targetSlideId || !reel) return null;
    const targetSlide = reel.slides.find((s) => s.id === targetSlideId);
    if (!targetSlide) return null;
    const index = reel.slides.findIndex((s) => s.id === targetSlideId);
    return `Slide ${index + 1}: ${targetSlide.question || `Slide ${index + 1}`}`;
  }, [reel]);

  if (!reel) {
    return (
      <div className="text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Opções de Resposta</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Configure as opções e seus destinos
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddOption}
          className="h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Adicionar
        </Button>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          <p>Nenhuma opção adicionada</p>
          <p className="text-xs mt-1">Clique em "Adicionar" para criar uma opção</p>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option, index) => {
            const targetSlideId = logicNext.options?.[option.id] || null;
            const targetSlideName = getTargetSlideName(targetSlideId);
            
            return (
              <div
                key={option.id}
                className="p-3 border rounded-lg bg-surface space-y-2"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-8 flex-shrink-0">
                        {index + 1}
                      </span>
                      <Input
                        type="text"
                        placeholder="Emoji (opcional)"
                        value={option.emoji || ''}
                        onChange={(e) => handleUpdateOption(option.id, 'emoji', e.target.value)}
                        className="h-8 w-20 text-xs"
                        maxLength={2}
                      />
                      <Input
                        type="text"
                        placeholder="Texto da opção"
                        value={option.text}
                        onChange={(e) => handleUpdateOption(option.id, 'text', e.target.value)}
                        className="h-8 flex-1 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveOption(option.id)}
                        title="Remover opção"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 pl-10">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <Select
                        value={targetSlideId || '__default__'}
                        onValueChange={(value) => handleUpdateDestination(option.id, value === '__default__' ? null : value)}
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
                      <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>Vai para: {targetSlideName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {options.length > 0 && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p className="font-medium mb-1">💡 Dica:</p>
          <p>Configure o destino de cada resposta para criar fluxos personalizados. O fluxo visual sempre tem prioridade sobre esta configuração.</p>
        </div>
      )}
    </div>
  );
}
