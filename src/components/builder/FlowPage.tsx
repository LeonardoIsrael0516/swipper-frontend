import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Layout, Trash2 } from 'lucide-react';
import { useBuilder } from '@/contexts/BuilderContext';
import { FlowCanvas } from './FlowCanvas';
import { toast } from 'sonner';
import dagre from 'dagre';

export function FlowPage() {
  const { reel, saveFlowConnections, updateSlide, isLoading } = useBuilder();
  const [pendingConnections, setPendingConnections] = useState<Record<string, Record<string, any>>>({});
  const [pendingPositions, setPendingPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Inicializar pendingConnections com logicNext existente
  const initialConnections = useMemo(() => {
    if (!reel) return {};
    const connections: Record<string, Record<string, any>> = {};
    reel.slides.forEach((slide) => {
      if (slide.logicNext) {
        connections[slide.id] = slide.logicNext;
      }
    });
    return connections;
  }, [reel]);

  const handleConnect = useCallback((connections: Record<string, Record<string, any>>) => {
    setPendingConnections((prev) => {
      // Fazer merge profundo para preservar todas as conexões existentes
      const merged: Record<string, Record<string, any>> = { ...prev };
      
      // Para cada slide nas novas conexões, fazer merge profundo
      Object.entries(connections).forEach(([slideId, newLogicNext]) => {
        const existingLogicNext = merged[slideId] || {};
        
        // Fazer merge profundo do logicNext
        const mergedLogicNext: Record<string, any> = {
          ...existingLogicNext,
        };
        
        // Preservar elementos existentes e adicionar/atualizar novos
        if (newLogicNext.elements) {
          mergedLogicNext.elements = {
            ...(existingLogicNext.elements || {}),
            ...newLogicNext.elements,
          };
        } else if (existingLogicNext.elements) {
          // Se não há novos elementos, preservar os existentes
          mergedLogicNext.elements = existingLogicNext.elements;
        }
        
        // Preservar opções existentes e adicionar/atualizar novas
        if (newLogicNext.options) {
          mergedLogicNext.options = {
            ...(existingLogicNext.options || {}),
            ...newLogicNext.options,
          };
        } else if (existingLogicNext.options) {
          // Se não há novas opções, preservar as existentes
          mergedLogicNext.options = existingLogicNext.options;
        }
        
        // defaultNext pode ser sobrescrito se vier nas novas conexões
        if (newLogicNext.defaultNext !== undefined) {
          mergedLogicNext.defaultNext = newLogicNext.defaultNext;
        } else if (existingLogicNext.defaultNext !== undefined) {
          mergedLogicNext.defaultNext = existingLogicNext.defaultNext;
        }
        
        merged[slideId] = mergedLogicNext;
      });
      
      return merged;
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleDisconnect = useCallback((edgeId: string) => {
    if (!reel) return;

    // Parsear edgeId para determinar qual conexão remover
    // Formato: edge-default-{slideId}-{targetSlideId}
    // Formato: edge-element-{elementKey}-{targetSlideId}
    // Formato: edge-option-{optionId}-{targetSlideId}
    
    let slideId: string | null = null;
    let connectionKey: string | null = null;
    let connectionType: 'defaultNext' | 'elements' | 'options' | null = null;
    let targetSlideId: string | null = null;

    // Encontrar o slide que contém essa edge procurando em todos os slides
    for (const slide of reel.slides) {
      const logicNext = slide.logicNext || {};
      
      if (edgeId.startsWith('edge-default-')) {
        // Formato: edge-default-{slideId}-{targetSlideId}
        const prefix = `edge-default-${slide.id}-`;
        if (edgeId.startsWith(prefix)) {
          targetSlideId = edgeId.replace(prefix, '');
          if (logicNext.defaultNext === targetSlideId) {
            slideId = slide.id;
            connectionType = 'defaultNext';
            break;
          }
        }
      } else if (edgeId.startsWith('edge-element-')) {
        // Formato: edge-element-{elementKey}-{targetSlideId}
        const afterPrefix = edgeId.replace('edge-element-', '');
        // Procurar qual elementKey corresponde a essa edge
        if (logicNext.elements) {
          for (const [elementKey, targetId] of Object.entries(logicNext.elements)) {
            const expectedId = `edge-element-${elementKey}-${targetId}`;
            if (expectedId === edgeId) {
              slideId = slide.id;
              connectionType = 'elements';
              connectionKey = elementKey;
              targetSlideId = targetId as string;
              break;
            }
          }
        }
        if (slideId) break;
      } else if (edgeId.startsWith('edge-option-')) {
        // Formato: edge-option-{optionId}-{targetSlideId}
        const afterPrefix = edgeId.replace('edge-option-', '');
        // Procurar qual optionId corresponde a essa edge
        if (logicNext.options) {
          for (const [optionId, targetId] of Object.entries(logicNext.options)) {
            const expectedId = `edge-option-${optionId}-${targetId}`;
            if (expectedId === edgeId) {
              slideId = slide.id;
              connectionType = 'options';
              connectionKey = optionId;
              targetSlideId = targetId as string;
              break;
            }
          }
        }
        if (slideId) break;
      }
    }

    if (!slideId || !connectionType) {
      console.warn('Não foi possível encontrar o slide para a edge:', edgeId);
      return;
    }

    // Criar nova conexão sem a conexão removida
    setPendingConnections((prev) => {
      const currentLogicNext = prev[slideId!] || reel.slides.find((s) => s.id === slideId)?.logicNext || {};
      const newLogicNext = { ...currentLogicNext };

      if (connectionType === 'defaultNext') {
        delete newLogicNext.defaultNext;
      } else if (connectionType === 'elements' && newLogicNext.elements) {
        const newElements = { ...newLogicNext.elements };
        delete newElements[connectionKey!];
        if (Object.keys(newElements).length === 0) {
          delete newLogicNext.elements;
        } else {
          newLogicNext.elements = newElements;
        }
      } else if (connectionType === 'options' && newLogicNext.options) {
        const newOptions = { ...newLogicNext.options };
        delete newOptions[connectionKey!];
        if (Object.keys(newOptions).length === 0) {
          delete newLogicNext.options;
        } else {
          newLogicNext.options = newOptions;
        }
      }

      // Se logicNext ficou vazio, garantir que seja um objeto vazio para salvar no backend
      if (Object.keys(newLogicNext).length === 0) {
        return {
          ...prev,
          [slideId!]: {},
        };
      }

      return {
        ...prev,
        [slideId!]: newLogicNext,
      };
    });

    setHasUnsavedChanges(true);
  }, [reel]);

  const handleSave = useCallback(async () => {
    if (!reel || (Object.keys(pendingConnections).length === 0 && Object.keys(pendingPositions).length === 0)) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }

    try {
      // Salvar conexões
      if (Object.keys(pendingConnections).length > 0) {
        await saveFlowConnections(pendingConnections);
      }

      // Salvar posições
      if (Object.keys(pendingPositions).length > 0) {
        const positionUpdates = Object.entries(pendingPositions).map(async ([slideId, position]) => {
          const slide = reel.slides.find((s) => s.id === slideId);
          if (!slide) return;

          const currentUiConfig = slide.uiConfig || {};
          const updatedUiConfig = {
            ...currentUiConfig,
            flowPosition: position,
          };
          await updateSlide(slideId, { uiConfig: updatedUiConfig });
        });
        await Promise.all(positionUpdates);
      }

      setPendingConnections({});
      setPendingPositions({});
      setHasUnsavedChanges(false);
      toast.success('Alterações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
    }
  }, [reel, pendingConnections, pendingPositions, saveFlowConnections, updateSlide]);

  const handleOrganize = useCallback(() => {
    if (!reel) return;

    // Organizar cards um ao lado do outro, centralizados horizontalmente
    const cardWidth = 320; // Largura dos cards (max-w-[320px])
    const spacing = 200; // Espaçamento horizontal entre cards
    const fixedY = 300; // Posição Y fixa (centralizada verticalmente)
    
    // Ordenar slides por ordem
    const sortedSlides = [...reel.slides].sort((a, b) => a.order - b.order);
    
    if (sortedSlides.length === 0) return;
    
    // Calcular largura total necessária
    const totalWidth = sortedSlides.length * cardWidth + (sortedSlides.length - 1) * spacing;
    
    // Posição inicial X para centralizar
    // O primeiro card começa em: -(largura_total / 2) + (largura_card / 2)
    const startX = -(totalWidth / 2) + (cardWidth / 2);

    // Calcular posições para cada slide
    const newPositions: Record<string, { x: number; y: number }> = {};
    sortedSlides.forEach((slide, index) => {
      const x = startX + index * (cardWidth + spacing);
      newPositions[slide.id] = { x, y: fixedY };
    });

    // Atualizar estado local imediatamente
    setPendingPositions((prev) => ({ ...prev, ...newPositions }));
    setHasUnsavedChanges(true);

    // Atualizar posições no backend (isso atualizará o reel no contexto)
    const positionUpdates = Object.entries(newPositions).map(async ([slideId, position]) => {
      const slide = reel.slides.find((s) => s.id === slideId);
      if (!slide) return;

      const currentUiConfig = slide.uiConfig || {};
      const updatedUiConfig = {
        ...currentUiConfig,
        flowPosition: position,
      };
      await updateSlide(slideId, { uiConfig: updatedUiConfig });
    });

    Promise.all(positionUpdates).then(() => {
      toast.success('Layout organizado com sucesso!');
    }).catch((error) => {
      toast.error('Erro ao organizar layout: ' + (error.message || 'Erro desconhecido'));
    });
  }, [reel, updateSlide]);

  const handleNodePositionChange = useCallback(
    (slideId: string, position: { x: number; y: number }) => {
      if (!reel) return;
      
      setPendingPositions((prev) => ({
        ...prev,
        [slideId]: position,
      }));
      setHasUnsavedChanges(true);
    },
    [reel],
  );

  const handleClearConnections = useCallback(async () => {
    if (!reel) return;

    if (!confirm('Tem certeza que deseja limpar todas as conexões? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const connections: Record<string, Record<string, any>> = {};
      reel.slides.forEach((slide) => {
        connections[slide.id] = {};
      });
      await saveFlowConnections(connections);
      setPendingConnections({});
      setPendingPositions({});
      setHasUnsavedChanges(false);
      toast.success('Conexões limpas com sucesso!');
    } catch (error) {
      // Error já é tratado no saveFlowConnections
    }
  }, [reel, saveFlowConnections]);

  if (!reel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Nenhum quiz carregado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header com botões de ação */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Fluxo do Swipper</h2>
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">(alterações não salvas)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar fluxo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOrganize}
            disabled={isLoading}
          >
            <Layout className="w-4 h-4 mr-2" />
            Organizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConnections}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar conexões
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <FlowCanvas
          slides={reel.slides}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onNodePositionChange={handleNodePositionChange}
          reelId={reel.id}
        />
      </div>
    </div>
  );
}

