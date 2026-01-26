import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Layers, Image as ImageIcon, Video, Plus, X, Upload, Loader2, Music } from 'lucide-react';
import { useBuilder, BackgroundConfig } from '@/contexts/BuilderContext';
import { uploadFile } from '@/lib/media';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function BackgroundEditor() {
  const { selectedSlide, updateSlide, reel } = useBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para legenda e tag de áudio
  const [caption, setCaption] = useState(selectedSlide?.caption || '');
  const [audioTag, setAudioTag] = useState(selectedSlide?.audioTag || '');
  
  // Sincronizar quando slide mudar
  useEffect(() => {
    setCaption(selectedSlide?.caption || '');
    setAudioTag(selectedSlide?.audioTag || '');
  }, [selectedSlide?.id, selectedSlide?.caption, selectedSlide?.audioTag]);

  // Inicializar backgroundConfig a partir do backgroundColor ou uiConfig ou criar novo
  const getInitialConfig = useCallback((): BackgroundConfig => {
    // Primeiro verificar backgroundConfig direto
    if (selectedSlide?.backgroundConfig) {
      return selectedSlide.backgroundConfig;
    }
    // Depois verificar uiConfig.backgroundConfig
    if (selectedSlide?.uiConfig?.backgroundConfig) {
      return selectedSlide.uiConfig.backgroundConfig;
    }
    // Fallback para backgroundColor
    if (selectedSlide?.backgroundColor) {
      return {
        type: 'color',
        color: selectedSlide.backgroundColor,
      };
    }
    return {
      type: 'color',
      color: '#9333ea',
    };
  }, [selectedSlide?.backgroundConfig, selectedSlide?.uiConfig?.backgroundConfig, selectedSlide?.backgroundColor]);

  const [config, setConfig] = useState<BackgroundConfig>(() => {
    if (selectedSlide?.backgroundConfig) {
      return selectedSlide.backgroundConfig;
    }
    if (selectedSlide?.uiConfig?.backgroundConfig) {
      return selectedSlide.uiConfig.backgroundConfig;
    }
    if (selectedSlide?.backgroundColor) {
      return {
        type: 'color',
        color: selectedSlide.backgroundColor,
      };
    }
    return {
      type: 'color',
      color: '#9333ea',
    };
  });

  // Atualizar quando o slide mudar
  useEffect(() => {
    setConfig(getInitialConfig());
  }, [getInitialConfig]);

  const updateConfig = useCallback(
    (newConfig: BackgroundConfig) => {
      setConfig(newConfig);
      if (!selectedSlide || !reel) return;
      
      // Salvar no backgroundConfig e manter backgroundColor para compatibilidade
      updateSlide(selectedSlide.id, {
        backgroundConfig: newConfig,
        backgroundColor: newConfig.type === 'color' ? newConfig.color : undefined,
      });
    },
    [selectedSlide, reel, updateSlide]
  );

  // Tab: Cor
  const ColorTab = () => {
    const [localColor, setLocalColor] = useState(config.color || '#9333ea');
    const colorInputRef = useRef<HTMLInputElement>(null);
    const colorPickerRef = useRef<HTMLInputElement>(null);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isColorPickerInteracting = useRef(false);
    const colorPickerWrapperRef = useRef<HTMLDivElement>(null);

    // Sincronizar quando config mudar externamente
    useEffect(() => {
      setLocalColor(config.color || '#9333ea');
    }, [config.color]);

    // Atualizar cor do color picker sem re-renderizar durante o drag
    const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setLocalColor(newColor);
      
      // Limpar timeout anterior
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Atualizar com debounce para evitar travamentos
      updateTimeoutRef.current = setTimeout(() => {
        updateConfig({ ...config, color: newColor });
      }, 50);
    };

    // Atualizar cor do input de texto apenas quando perder o foco ou Enter
    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setLocalColor(newColor);
    };

    const handleColorInputBlur = () => {
      // Limpar timeout do color picker se houver
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateConfig({ ...config, color: localColor });
    };

    const handleColorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
        // Limpar timeout do color picker se houver
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateConfig({ ...config, color: localColor });
      }
    };

    // Cleanup timeout ao desmontar
    useEffect(() => {
      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      };
    }, []);

    return (
      <Accordion type="single" collapsible className="w-full" defaultValue="config">
        <AccordionItem value="config">
          <AccordionTrigger>Configurações de Cor</AccordionTrigger>
          <AccordionContent data-accordion-content>
            <div className="space-y-4">
              <div>
                <Label htmlFor="color">Cor</Label>
                <div 
                  ref={colorPickerWrapperRef}
                  className="flex gap-2 mt-2"
                  onMouseDown={(e) => {
                    // Prevenir que cliques no container fechem o accordion
                    const target = e.target as HTMLElement;
                    if (target.closest('input[type="color"]') || target === colorPickerRef.current) {
                      e.stopPropagation();
                      // Não usar preventDefault para permitir que o color picker nativo abra
                    }
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('input[type="color"]') || target === colorPickerRef.current) {
                      e.stopPropagation();
                    }
                  }}
                  onPointerDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('input[type="color"]') || target === colorPickerRef.current) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Input
                      ref={colorPickerRef}
                      id="color"
                      type="color"
                      value={localColor}
                      onChange={handleColorPickerChange}
                      onFocus={(e) => {
                        e.stopPropagation();
                        isColorPickerInteracting.current = true;
                      }}
                      onBlur={(e) => {
                        e.stopPropagation();
                        // Aguardar antes de permitir interação normal
                        setTimeout(() => {
                          isColorPickerInteracting.current = false;
                        }, 500);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // Não usar preventDefault aqui para permitir que o color picker nativo abra
                        isColorPickerInteracting.current = true;
                        
                        // Listener global para mouseup - capturar em qualquer lugar
                        const handleMouseUp = (event: MouseEvent) => {
                          // Se o mouseup foi no color picker ou dentro do accordion, não fazer nada ainda
                          const target = event.target as HTMLElement;
                          if (target.closest('[data-accordion-content]') || 
                              target.closest('input[type="color"]') ||
                              target === colorPickerRef.current ||
                              colorPickerWrapperRef.current?.contains(target)) {
                            return;
                          }
                          
                          // Aguardar um pouco antes de permitir interação normal
                          setTimeout(() => {
                            isColorPickerInteracting.current = false;
                          }, 500);
                          document.removeEventListener('mouseup', handleMouseUp, true);
                        };
                        document.addEventListener('mouseup', handleMouseUp, true);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        // Não usar preventDefault aqui para permitir que o color picker nativo abra
                        isColorPickerInteracting.current = true;
                        
                        const handleTouchEnd = (event: TouchEvent) => {
                          const target = event.target as HTMLElement;
                          if (target.closest('[data-accordion-content]') || 
                              target.closest('input[type="color"]') ||
                              target === colorPickerRef.current ||
                              colorPickerWrapperRef.current?.contains(target)) {
                            return;
                          }
                          
                          setTimeout(() => {
                            isColorPickerInteracting.current = false;
                          }, 500);
                          document.removeEventListener('touchend', handleTouchEnd, true);
                        };
                        document.addEventListener('touchend', handleTouchEnd, true);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                  </div>
                  <Input
                    ref={colorInputRef}
                    type="text"
                    value={localColor}
                    onChange={handleColorInputChange}
                    onBlur={handleColorInputBlur}
                    onKeyDown={handleColorInputKeyDown}
                    placeholder="#9333ea"
                    className="flex-1"
                  />
                </div>
              </div>
            
            <div>
              <Label className="text-xs mb-2 block">Cores Predefinidas</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  '#9333ea', '#E91E63', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
                  '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6',
                ].map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-8 h-8 rounded border-2 transition-all',
                      config.color === color ? 'border-primary scale-110' : 'border-border hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => updateConfig({ ...config, color })}
                  />
                ))}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
  };

  // Componente auxiliar para input de cor do gradiente
  const GradientStopColorInput = ({ stop, index, onUpdate }: { stop: { color: string; position: number }; index: number; onUpdate: (color: string) => void }) => {
    const [localColor, setLocalColor] = useState(stop.color);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isColorPickerInteracting = useRef(false);

    // Sincronizar quando stop.color mudar externamente
    useEffect(() => {
      setLocalColor(stop.color);
    }, [stop.color]);

    const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setLocalColor(newColor);
      
      // Limpar timeout anterior
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Atualizar com debounce para evitar travamentos
      updateTimeoutRef.current = setTimeout(() => {
        onUpdate(newColor);
      }, 50);
    };

    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalColor(e.target.value);
    };

    const handleColorInputBlur = () => {
      // Limpar timeout do color picker se houver
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      onUpdate(localColor);
    };

    const handleColorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        onUpdate(localColor);
      }
    };

    // Cleanup timeout ao desmontar
    useEffect(() => {
      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div className="flex gap-2">
        <Input
          type="color"
          value={localColor}
          onChange={handleColorPickerChange}
          onFocus={(e) => {
            e.stopPropagation();
            isColorPickerInteracting.current = true;
          }}
          onBlur={(e) => {
            e.stopPropagation();
            // Aguardar antes de permitir interação normal
            setTimeout(() => {
              isColorPickerInteracting.current = false;
            }, 300);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            isColorPickerInteracting.current = true;
            
            // Listener global para mouseup - capturar em qualquer lugar
            const handleMouseUp = (event: MouseEvent) => {
              // Se o mouseup foi no color picker ou dentro do accordion, não fazer nada ainda
              const target = event.target as HTMLElement;
              if (target.closest('[data-accordion-content]') || target.closest('input[type="color"]')) {
                return;
              }
              
              // Aguardar um pouco antes de permitir interação normal
              setTimeout(() => {
                isColorPickerInteracting.current = false;
              }, 500);
              document.removeEventListener('mouseup', handleMouseUp, true);
            };
            document.addEventListener('mouseup', handleMouseUp, true);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
            isColorPickerInteracting.current = true;
            
            const handleTouchEnd = (event: TouchEvent) => {
              const target = event.target as HTMLElement;
              if (target.closest('[data-accordion-content]') || target.closest('input[type="color"]')) {
                return;
              }
              
              setTimeout(() => {
                isColorPickerInteracting.current = false;
              }, 500);
              document.removeEventListener('touchend', handleTouchEnd, true);
            };
            document.addEventListener('touchend', handleTouchEnd, true);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className="w-16 h-8 p-1"
        />
        <Input
          type="text"
          value={localColor}
          onChange={handleColorInputChange}
          onBlur={handleColorInputBlur}
          onKeyDown={handleColorInputKeyDown}
          className="flex-1 text-xs"
        />
      </div>
    );
  };

  // Tab: Gradiente
  const GradientTab = () => {
    const gradient = config.gradient || {
      direction: 'linear',
      angle: 90,
      stops: [
        { color: '#9333ea', position: 0 },
        { color: '#E91E63', position: 100 },
      ],
    };

    const addStop = () => {
      const newStops = [
        ...gradient.stops,
        { color: '#ffffff', position: gradient.stops.length * 50 },
      ];
      updateConfig({
        ...config,
        gradient: { ...gradient, stops: newStops },
      });
    };

    const removeStop = (index: number) => {
      if (gradient.stops.length <= 2) {
        toast.error('Gradiente precisa de pelo menos 2 cores');
        return;
      }
      const newStops = gradient.stops.filter((_, i) => i !== index);
      updateConfig({
        ...config,
        gradient: { ...gradient, stops: newStops },
      });
    };

    const updateStop = (index: number, updates: Partial<{ color: string; position: number }>) => {
      const newStops = gradient.stops.map((stop, i) =>
        i === index ? { ...stop, ...updates } : stop
      );
      updateConfig({
        ...config,
        gradient: { ...gradient, stops: newStops },
      });
    };

    // Gerar CSS do gradiente para preview
    const getGradientCSS = () => {
      const stops = gradient.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
      if (gradient.direction === 'linear') {
        return `linear-gradient(${gradient.angle}deg, ${stops})`;
      } else if (gradient.direction === 'radial') {
        return `radial-gradient(circle, ${stops})`;
      } else {
        return `conic-gradient(from ${gradient.angle}deg, ${stops})`;
      }
    };

    return (
      <Accordion type="single" collapsible className="w-full" defaultValue="config">
        <AccordionItem value="config">
          <AccordionTrigger>Configurações de Gradiente</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label>Direção</Label>
                <Select
                  value={gradient.direction}
                  onValueChange={(value: 'linear' | 'radial' | 'conic') =>
                    updateConfig({
                      ...config,
                      gradient: { ...gradient, direction: value },
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                    <SelectItem value="conic">Cônico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {gradient.direction === 'linear' && (
                <div>
                  <Label>Ângulo: {gradient.angle}°</Label>
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[gradient.angle || 90]}
                    onValueChange={([value]) =>
                      updateConfig({
                        ...config,
                        gradient: { ...gradient, angle: value },
                      })
                    }
                    className="mt-2"
                  />
                </div>
              )}

              {/* Preview do gradiente */}
              <div>
                <Label className="text-xs mb-2 block">Preview</Label>
                <div
                  className="w-full h-20 rounded-lg border"
                  style={{ background: getGradientCSS() }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs">Cores do Gradiente</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStop}
                    className="h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar Cor
                  </Button>
                </div>
                <div className="space-y-3">
                  {gradient.stops.map((stop, index) => (
                    <div key={index} className="space-y-2 p-2 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Cor {index + 1}</span>
                        {gradient.stops.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStop(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <GradientStopColorInput
                        stop={stop}
                        index={index}
                        onUpdate={(color) => updateStop(index, { color })}
                      />
                      <div>
                        <Label className="text-xs">Posição: {stop.position}%</Label>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[stop.position]}
                          onValueChange={([value]) => updateStop(index, { position: value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  // Tab: Imagem
  const ImageTab = () => {
    const image = config.image || {
      url: '',
      position: 'center',
      repeat: 'no-repeat',
      size: 'cover',
      opacity: 1,
    };

    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [opacityValue, setOpacityValue] = useState((image.opacity || 1) * 100);

    // Sincronizar opacityValue quando image.opacity mudar externamente
    useEffect(() => {
      setOpacityValue((image.opacity || 1) * 100);
    }, [image.opacity]);

    const handleFileUpload = async (file: File) => {
      if (!file) return;

      try {
        setIsUploading(true);
        const url = await uploadFile(file);
        updateConfig({
          ...config,
          image: { ...image, url },
        });
        toast.success('Imagem enviada com sucesso!');
      } catch (error: any) {
        toast.error('Erro ao enviar imagem: ' + (error.message || 'Erro desconhecido'));
      } finally {
        setIsUploading(false);
      }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFileUpload(file);
      }
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        await handleFileUpload(file);
      } else {
        toast.error('Por favor, arraste uma imagem válida');
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    };

    return (
      <Accordion type="single" collapsible className="w-full" defaultValue="config">
        <AccordionItem value="config">
          <AccordionTrigger>Configurações de Imagem</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label>Upload de Imagem</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                {image.url ? (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Imagem carregada</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Enviando...' : 'Trocar Imagem'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateConfig({
                          ...config,
                          image: { ...image, url: '' },
                        })}
                        disabled={isUploading}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-border",
                      isUploading && "opacity-50 pointer-events-none"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {isUploading ? 'Enviando imagem...' : 'Arraste uma imagem aqui'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ou clique para selecionar
                    </p>
                  </div>
                )}
              </div>

              {image.url && (
                <div className="space-y-4 pt-2 border-t">
                    <div>
                      <Label>Posição</Label>
                      <Select
                        value={image.position || 'center'}
                        onValueChange={(value: any) =>
                          updateConfig({
                            ...config,
                            image: { ...image, position: value },
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="top">Topo</SelectItem>
                          <SelectItem value="bottom">Inferior</SelectItem>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                          <SelectItem value="cover">Cobrir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Repetir</Label>
                      <Select
                        value={image.repeat || 'no-repeat'}
                        onValueChange={(value: any) =>
                          updateConfig({
                            ...config,
                            image: { ...image, repeat: value },
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-repeat">Não repetir</SelectItem>
                          <SelectItem value="repeat">Repetir</SelectItem>
                          <SelectItem value="repeat-x">Repetir horizontal</SelectItem>
                          <SelectItem value="repeat-y">Repetir vertical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tamanho</Label>
                      <Select
                        value={image.size || 'cover'}
                        onValueChange={(value: any) =>
                          updateConfig({
                            ...config,
                            image: { ...image, size: value },
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cobrir</SelectItem>
                          <SelectItem value="contain">Conter</SelectItem>
                          <SelectItem value="auto">Automático</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Opacidade: {Math.round(opacityValue)}%</Label>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[opacityValue]}
                        onValueChange={([value]) => {
                          // Atualizar apenas o estado local durante o drag (sem salvar)
                          setOpacityValue(value);
                        }}
                        onValueCommit={([value]) => {
                          // Salvar apenas quando soltar o slider
                          updateConfig({
                            ...config,
                            image: { ...image, opacity: value / 100 },
                          });
                        }}
                        className="mt-2"
                      />
                    </div>
                  </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  // Tab: Vídeo
  const VideoTab = () => {
    const video = config.video || {
      url: '',
      autoplay: true,
      loop: true,
      muted: true,
      opacity: 1,
    };

    const [isDragging, setIsDragging] = useState(false);
    const [opacityValue, setOpacityValue] = useState((video.opacity || 1) * 100);
    const [fakeProgressSpeedValue, setFakeProgressSpeedValue] = useState(((video.fakeProgressSpeed || 1.5) * 100));
    const [fakeProgressSlowdownStartValue, setFakeProgressSlowdownStartValue] = useState(((video.fakeProgressSlowdownStart || 0.9) * 100));

    // Sincronizar opacityValue quando video.opacity mudar externamente
    useEffect(() => {
      setOpacityValue((video.opacity || 1) * 100);
    }, [video.opacity]);

    // Sincronizar fakeProgressSpeedValue quando video.fakeProgressSpeed mudar externamente
    useEffect(() => {
      setFakeProgressSpeedValue(((video.fakeProgressSpeed || 1.5) * 100));
    }, [video.fakeProgressSpeed]);

    // Sincronizar fakeProgressSlowdownStartValue quando video.fakeProgressSlowdownStart mudar externamente
    useEffect(() => {
      setFakeProgressSlowdownStartValue(((video.fakeProgressSlowdownStart || 0.9) * 100));
    }, [video.fakeProgressSlowdownStart]);

    // Usar hook useVideoUpload para processamento correto de vídeos
    const { uploadVideo, status, progress: uploadProgress, isUploading, isTranscoding } = useVideoUpload({
      onComplete: (result) => {
        if (result.playbackUrl) {
          updateConfig({
            ...config,
            video: { 
              ...video, 
              url: result.playbackUrl,
            },
          });
          // Toast já é mostrado pelo hook
        }
      },
      onError: (error) => {
        // Toast já é mostrado pelo hook
      },
    });

    const handleFileUpload = async (file: File) => {
      if (!file) return;

      // Validar tipo de arquivo
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validVideoTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use MP4, WebM ou MOV');
        return;
      }

      // Validar tamanho (200MB)
      const maxSize = 200 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 200MB');
        return;
      }

      try {
        // Vídeos de background são sempre verticais (1080x1920)
        await uploadVideo(file, 'vertical');
      } catch (error: any) {
        // Erro já foi tratado no hook
      }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFileUpload(file);
      }
      // Limpar input
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        await handleFileUpload(file);
      } else {
        toast.error('Por favor, arraste um vídeo válido');
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    };

    return (
      <Accordion type="single" collapsible className="w-full" defaultValue="config">
        <AccordionItem value="config">
          <AccordionTrigger>Configurações de Vídeo</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label>Upload de Vídeo</Label>
                <div className="text-xs text-muted-foreground mt-1 mb-2">
                  Tamanho recomendado: 1080x1920 | Tamanho máximo: 200MB
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading || isTranscoding}
                />
                {/* Barra de progresso durante upload/transcoding */}
                {(isUploading || isTranscoding) && (
                  <div className="mt-2 space-y-2">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <p className="text-sm font-medium">
                          {isUploading ? 'Enviando vídeo...' : isTranscoding ? 'Processando vídeo...' : 'Concluído'}
                        </p>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {uploadProgress}%
                      </p>
                    </div>
                  </div>
                )}
                {video.url && !isUploading && !isTranscoding && (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Vídeo carregado</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading || isTranscoding}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Trocar Vídeo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateConfig({
                          ...config,
                          video: { ...video, url: '' },
                        })}
                        disabled={isUploading || isTranscoding}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
                {!video.url && !isUploading && !isTranscoding && (
                  <div
                    className={cn(
                      "mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-border"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Arraste um vídeo aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ou clique para selecionar
                    </p>
                  </div>
                )}
              </div>

              {video.url && (
                <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoplay">Reproduzir automaticamente</Label>
                        <Switch
                          id="autoplay"
                          checked={video.autoplay}
                          onCheckedChange={(checked) =>
                            updateConfig({
                              ...config,
                              video: { ...video, autoplay: checked },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Opacidade: {Math.round(opacityValue)}%</Label>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[opacityValue]}
                        onValueChange={([value]) => {
                          // Atualizar apenas o estado local durante o drag (sem salvar)
                          setOpacityValue(value);
                        }}
                        onValueCommit={([value]) => {
                          // Salvar apenas quando soltar o slider
                          updateConfig({
                            ...config,
                            video: { ...video, opacity: value / 100 },
                          });
                        }}
                        className="mt-2"
                      />
                    </div>

                    {/* Configurações de Barrinha de Progresso */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showProgressBar">Mostrar Barrinha de Progresso</Label>
                        <Switch
                          id="showProgressBar"
                          checked={video.showProgressBar || false}
                          onCheckedChange={(checked) =>
                            updateConfig({
                              ...config,
                              video: { 
                                ...video, 
                                showProgressBar: checked,
                                // Desabilitar fake progress se barrinha for desabilitada
                                fakeProgress: checked ? (video.fakeProgress || false) : false,
                              },
                            })
                          }
                        />
                      </div>

                      {video.showProgressBar && (
                        <>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="fakeProgress">Fake Progress</Label>
                            <Switch
                              id="fakeProgress"
                              checked={video.fakeProgress || false}
                              onCheckedChange={(checked) =>
                                updateConfig({
                                  ...config,
                                  video: { 
                                    ...video, 
                                    fakeProgress: checked,
                                    fakeProgressSpeed: checked ? (video.fakeProgressSpeed || 1.5) : undefined,
                                    fakeProgressSlowdownStart: checked ? (video.fakeProgressSlowdownStart || 0.9) : undefined,
                                  },
                                })
                              }
                            />
                          </div>

                          {video.fakeProgress && (
                            <>
                              <div>
                                <Label>Velocidade do Fake Progress: {fakeProgressSpeedValue.toFixed(0)}%</Label>
                                <Slider
                                  min={100}
                                  max={300}
                                  step={10}
                                  value={[fakeProgressSpeedValue]}
                                  onValueChange={([value]) => {
                                    // Atualizar apenas o estado local durante o drag (sem salvar)
                                    setFakeProgressSpeedValue(value);
                                  }}
                                  onValueCommit={([value]) => {
                                    // Salvar apenas quando soltar o slider
                                    updateConfig({
                                      ...config,
                                      video: { ...video, fakeProgressSpeed: value / 100 },
                                    });
                                  }}
                                  className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {fakeProgressSpeedValue.toFixed(0)}% = {(fakeProgressSpeedValue / 100 - 1) * 100 > 0 ? `${((fakeProgressSpeedValue / 100) - 1) * 100}% mais rápido` : 'velocidade normal'}
                                </p>
                              </div>

                              <div>
                                <Label>Início da Desaceleração: {Math.round(fakeProgressSlowdownStartValue)}%</Label>
                                <Slider
                                  min={50}
                                  max={100}
                                  step={5}
                                  value={[fakeProgressSlowdownStartValue]}
                                  onValueChange={([value]) => {
                                    // Atualizar apenas o estado local durante o drag (sem salvar)
                                    setFakeProgressSlowdownStartValue(value);
                                  }}
                                  onValueCommit={([value]) => {
                                    // Salvar apenas quando soltar o slider
                                    updateConfig({
                                      ...config,
                                      video: { ...video, fakeProgressSlowdownStart: value / 100 },
                                    });
                                  }}
                                  className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  A barrinha começa a desacelerar aos {Math.round(fakeProgressSlowdownStartValue)}% do vídeo
                                </p>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  if (!selectedSlide) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-sm">Selecione um slide para configurar o fundo</p>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      color: 'Cor Sólida',
      gradient: 'Gradiente',
      image: 'Imagem',
      video: 'Vídeo',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'color':
        return <Palette className="w-4 h-4" />;
      case 'gradient':
        return <Layers className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Seletor de tipo com dropdown elegante */}
      <div className="space-y-2">
        <Label>Tipo de Fundo</Label>
        <Select
          value={config.type}
          onValueChange={(value) =>
            updateConfig({
              ...config,
              type: value as BackgroundConfig['type'],
            })
          }
        >
          <SelectTrigger className="w-full h-11">
            <div className="flex items-center gap-2">
              {getTypeIcon(config.type)}
              <SelectValue>{getTypeLabel(config.type)}</SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">
              <div className="flex items-center gap-2 ml-4">
                <Palette className="w-4 h-4" />
                <span>Cor Sólida</span>
              </div>
            </SelectItem>
            <SelectItem value="gradient">
              <div className="flex items-center gap-2 ml-4">
                <Layers className="w-4 h-4" />
                <span>Gradiente</span>
              </div>
            </SelectItem>
            <SelectItem value="image">
              <div className="flex items-center gap-2 ml-4">
                <ImageIcon className="w-4 h-4" />
                <span>Imagem</span>
              </div>
            </SelectItem>
            <SelectItem value="video">
              <div className="flex items-center gap-2 ml-4">
                <Video className="w-4 h-4" />
                <span>Vídeo</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conteúdo baseado no tipo selecionado */}
      <div className="mt-4 pt-4 border-t border-border/50">
        {config.type === 'color' && <ColorTab />}
        {config.type === 'gradient' && <GradientTab />}
        {config.type === 'image' && <ImageTab />}
        {config.type === 'video' && <VideoTab />}
      </div>

      {/* Legenda */}
      {reel?.socialConfig?.showCaptions && (
        <div className="mt-6 pt-6 border-t border-border/50 space-y-2">
          <Label htmlFor="caption">Legenda do Slide</Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
            }}
            onBlur={() => {
              if (selectedSlide) {
                updateSlide(selectedSlide.id, { caption: caption || undefined });
              }
            }}
            placeholder="Adicione uma legenda para este slide... (use #hashtags)"
            rows={3}
            className="w-full resize-none"
            maxLength={40}
          />
          <p className="text-xs text-muted-foreground">
            {caption.length}/40 caracteres. Use #hashtags para destacar palavras-chave.
          </p>
        </div>
      )}

      {/* Tag de Áudio (apenas para slides com vídeo) */}
      {(config.type === 'video' || selectedSlide?.backgroundConfig?.type === 'video' || selectedSlide?.uiConfig?.backgroundConfig?.type === 'video') && (
        <div className="mt-6 pt-6 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="audioTag">Tag de Áudio</Label>
          </div>
          <Input
            id="audioTag"
            value={audioTag}
            onChange={(e) => {
              setAudioTag(e.target.value);
            }}
            onBlur={() => {
              if (selectedSlide) {
                updateSlide(selectedSlide.id, { audioTag: audioTag || undefined });
              }
            }}
            placeholder="Nome do som original"
            className="w-full"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {audioTag.length}/100 caracteres. Nome do som que aparece abaixo do nome de usuário.
          </p>
        </div>
      )}

      {/* Ocultar Elementos Sociais */}
      {reel?.socialConfig?.enabled && (
        <div className="mt-6 pt-6 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="hideSocialElements">Ocultar Elementos Sociais neste Slide</Label>
            <Switch
              id="hideSocialElements"
              checked={selectedSlide?.hideSocialElements || false}
              onCheckedChange={(checked) => {
                if (selectedSlide) {
                  updateSlide(selectedSlide.id, { hideSocialElements: checked });
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Quando habilitado, os elementos sociais (avatar, curtidas, comentários, compartilhar, nome de usuário, legenda, tag de áudio) ficarão ocultos apenas neste slide.
          </p>
        </div>
      )}

      {/* Ocultar Barra de Progresso de Gamificação */}
      {reel?.gamificationConfig?.enabled && reel?.gamificationConfig?.elements?.pointsProgress?.enabled && (
        <div className="mt-6 pt-6 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="hideGamificationProgress">Ocultar Barra de Progresso de Gamificação neste Slide</Label>
            <Switch
              id="hideGamificationProgress"
              checked={selectedSlide?.hideGamificationProgress || false}
              onCheckedChange={(checked) => {
                if (selectedSlide) {
                  updateSlide(selectedSlide.id, { hideGamificationProgress: checked });
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Quando habilitado, a barra de progresso de pontos da gamificação ficará oculta apenas neste slide.
          </p>
        </div>
      )}

    </div>
  );
}
