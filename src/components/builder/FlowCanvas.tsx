import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeTypes,
  NodeChange,
  applyNodeChanges,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  useReactFlow,
  EdgeProps,
  EdgeChange,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';
import { Slide, SlideElement } from '@/contexts/BuilderContext';
import { TextElement } from './elements/TextElement';
import { ImageElement } from './elements/ImageElement';
import { VideoElement } from './elements/VideoElement';
import { AudioElement } from './elements/AudioElement';
import { TimerElement } from './elements/TimerElement';
import { CarouselElement } from './elements/CarouselElement';
import { ButtonElement } from './elements/ButtonElement';
import { AccordionElement } from './elements/AccordionElement';
import { ComparativoElement } from './elements/ComparativoElement';
import { PriceElement } from './elements/PriceElement';
import { PlansElement } from './elements/PlansElement';
import { QuestionnaireElement } from './elements/QuestionnaireElement';
import { QuestionGridElement } from './elements/QuestionGridElement';
import { ProgressElement } from './elements/ProgressElement';
import { FormElement } from './elements/FormElement';
import { FeedbackElement } from './elements/FeedbackElement';
import { DashElement } from './elements/DashElement';
import { ChartElement } from './elements/ChartElement';
import { ScoreElement } from './elements/ScoreElement';
import { SpacingElement } from './elements/SpacingElement';

// Tipos de nós personalizados
interface SlideNodeData extends Record<string, unknown> {
  slide: Slide;
  label: string;
}

// Normalizar uiConfig
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

// Função para obter o componente do ícone do Lucide React
const getIconComponent = (iconName: string) => {
  if (!iconName || typeof iconName !== 'string') return null;
  const cleanIconName = iconName.trim();
  if (!cleanIconName) return null;
  const IconComponent = (LucideIcons as any)[cleanIconName];
  if (IconComponent && typeof IconComponent === 'function') {
    return IconComponent;
  }
  return null;
};

// Função para renderizar o ícone à esquerda do item (copiada do QuestionnaireElement)
const renderLeftIcon = (item: any) => {
  if (!item) return null;
  
  const iconValue = item.icon && typeof item.icon === 'string' ? item.icon.trim() : '';
  const hasIconValue = iconValue && iconValue.startsWith('icon:');
  
  let iconType = item.iconType;
  if (hasIconValue) {
    iconType = 'icon';
  } else if (!iconType) {
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
      iconType = 'image';
    } else if (item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
      iconType = 'emoji';
    } else {
      iconType = 'emoji';
    }
  }
  
  if (iconType === 'icon' || hasIconValue) {
    if (!iconValue) return null;
    const iconName = iconValue.startsWith('icon:') 
      ? iconValue.substring(5).trim() 
      : iconValue;
    if (!iconName) return null;
    const IconComponent = getIconComponent(iconName);
    if (IconComponent && typeof IconComponent === 'function') {
      const Icon = IconComponent;
      return <Icon className="w-5 h-5 flex-shrink-0" />;
    }
    return null;
  }
  
  if (iconType === 'emoji') {
    const emoji = item.emoji || '';
    if (!emoji || typeof emoji !== 'string') return null;
    const trimmedEmoji = emoji.trim();
    if (!trimmedEmoji) return null;
    return <span className="text-xl flex-shrink-0">{trimmedEmoji}</span>;
  }
  
  if (iconType === 'image') {
    const imageUrl = item.imageUrl || '';
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    const trimmedImageUrl = imageUrl.trim();
    if (!trimmedImageUrl) return null;
    return (
      <img 
        src={trimmedImageUrl} 
        alt="" 
        className="w-5 h-5 object-cover flex-shrink-0 rounded"
      />
    );
  }
  
  return null;
};

// Função helper para agrupar botões coluna consecutivos
const groupElements = (elements: SlideElement[]) => {
  const grouped: any[] = [];
  let currentGroup: any[] = [];

  elements.forEach((element, index) => {
    const config = normalizeUiConfig(element.uiConfig);
    const isColumnButton = element.elementType === 'BUTTON' && config.columnMode === true;

    if (isColumnButton) {
      currentGroup.push({ ...element, index });
    } else {
      if (currentGroup.length > 0) {
        grouped.push({ type: 'button-group', elements: currentGroup });
        currentGroup = [];
      }
      grouped.push({ type: 'single', element, index });
    }
  });

  if (currentGroup.length > 0) {
    grouped.push({ type: 'button-group', elements: currentGroup });
  }

  return grouped;
};

// Função para renderizar elementos (igual ao MobilePreview)
const renderElement = (element: SlideElement, reelId?: string) => {
  const normalizedElement = {
    ...element,
    uiConfig: normalizeUiConfig(element.uiConfig),
  };

  switch (normalizedElement.elementType) {
    case 'TEXT':
      return <TextElement key={element.id} element={normalizedElement} />;
    case 'IMAGE':
      return <ImageElement key={element.id} element={normalizedElement} />;
    case 'VIDEO':
      return <VideoElement key={element.id} element={normalizedElement} />;
    case 'AUDIO':
      return <AudioElement key={element.id} element={normalizedElement} />;
    case 'TIMER':
      return <TimerElement key={element.id} element={normalizedElement} reelId={reelId} />;
    case 'CAROUSEL':
      return <CarouselElement key={element.id} element={normalizedElement} />;
    case 'BUTTON':
      return <ButtonElement key={element.id} element={normalizedElement} isInBuilder={true} />;
    case 'ACCORDION':
      return <AccordionElement key={element.id} element={normalizedElement} />;
    case 'BENEFITS':
    case 'COMPARATIVO':
      return <ComparativoElement key={element.id} element={normalizedElement} />;
    case 'PRICE':
      return <PriceElement key={element.id} element={normalizedElement} isInBuilder={true} />;
    case 'PLANS':
      return <PlansElement key={element.id} element={normalizedElement} isInBuilder={true} />;
    case 'QUESTIONNAIRE':
      return <QuestionnaireElement key={element.id} element={normalizedElement} isInBuilder={true} />;
    case 'QUESTION_GRID':
      return <QuestionGridElement key={element.id} element={normalizedElement} isInBuilder={true} />;
    case 'PROGRESS':
      return <ProgressElement key={element.id} element={normalizedElement} />;
    case 'FORM':
      return <FormElement key={element.id} element={normalizedElement} />;
    case 'FEEDBACK':
      return <FeedbackElement key={element.id} element={normalizedElement} />;
    case 'CIRCULAR':
      return <DashElement key={element.id} element={normalizedElement} />;
    case 'CHART':
      return <ChartElement key={element.id} element={normalizedElement} />;
    case 'SCORE':
      return <ScoreElement key={element.id} element={normalizedElement} />;
    case 'SPACING':
      return <SpacingElement key={element.id} element={normalizedElement} />;
    default:
      return (
        <div key={element.id} className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-white/80">
            Elemento {normalizedElement.elementType} - Não implementado ainda
          </p>
        </div>
      );
  }
};

// Função para obter items de elementos multi-item
const getElementItems = (element: SlideElement): any[] => {
  const config = normalizeUiConfig(element.uiConfig);
  return config.items || [];
};

// Função para renderizar item individual de questionnaire/question grid (estilo real)
const renderQuestionnaireItem = (item: any, index: number, elementId: string, element: SlideElement) => {
  const config = normalizeUiConfig(element.uiConfig);
  const isQuestionGrid = element.elementType === 'QUESTION_GRID';
  
  if (isQuestionGrid) {
    // Renderizar como QuestionGrid (card com imagem)
    const {
      borderRadius = 12,
      backgroundColor = '#ffffff',
      textColor = '#000000',
      borderColor = '#e5e7eb',
      borderWidth = 1,
    } = config;
    
    const itemId = item.id || `item-${index}`;
    const itemTitle = item.title || item.text || `Item ${index + 1}`;
    const itemDescription = item.description || '';
    const imageUrl = item.imageUrl && typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '';
    
    const imagePlaceholderColor = '#f3f4f6';
    const imagePlaceholderBorderColor = '#d1d5db';
    
    const cardStyle: React.CSSProperties = {
      backgroundColor,
      color: textColor,
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: `${borderRadius}px`,
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '200px',
    };
    
    const imageContainerStyle: React.CSSProperties = {
      width: '100%',
      minHeight: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    };
    
    const placeholderStyle: React.CSSProperties = {
      width: '100%',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      backgroundColor: imagePlaceholderColor,
      border: `2px dashed ${imagePlaceholderBorderColor}`,
      borderRadius: '8px',
    };
    
    const imageStyle: React.CSSProperties = {
      width: '100%',
      height: 'auto',
      objectFit: 'contain',
      borderRadius: '8px',
    };
    
    return (
      <div key={itemId} className="relative" style={cardStyle}>
        {/* Container da Imagem */}
        <div style={imageContainerStyle}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={itemTitle}
              style={imageStyle}
            />
          ) : (
            <div style={placeholderStyle}>
              <span style={{ fontSize: '14px', color: imagePlaceholderBorderColor }}>Sem imagem</span>
            </div>
          )}
        </div>
        
        {/* Título e Descrição */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '16px', fontWeight: 500, color: textColor }}>
            {itemTitle}
          </span>
          {itemDescription && (
            <span style={{ fontSize: '14px', color: textColor, opacity: 0.7 }}>
              {itemDescription}
            </span>
          )}
        </div>
        
        <Handle
          type="source"
          position={Position.Right}
          id={`element-${elementId}-item-${itemId}`}
          className="!bg-blue-500 !border-2 !border-white !w-3 !h-3 !z-10"
          style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    );
  }
  
  // Renderizar como Questionnaire (lista horizontal)
  const {
    itemHeight = 80,
    borderRadius = 12,
    backgroundColor = '#ffffff',
    textColor = '#000000',
    borderColor = '#e5e7eb',
    borderWidth = 1,
  } = config;
  
  // Normalizar item (similar ao QuestionnaireElement)
  const iconValue = item.icon && typeof item.icon === 'string' ? item.icon : '';
  const hasValidIcon = iconValue && iconValue.trim().startsWith('icon:');
  
  let detectedIconType = item.iconType;
  if (hasValidIcon) {
    detectedIconType = 'icon';
  } else if (!detectedIconType || detectedIconType === 'icon') {
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
      detectedIconType = 'image';
    } else if (item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
      detectedIconType = 'emoji';
    } else if (!detectedIconType) {
      detectedIconType = 'emoji';
    }
  } else if (!detectedIconType && item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
    detectedIconType = 'image';
  } else if (!detectedIconType && item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
    detectedIconType = 'emoji';
  }
  
  const finalIconType = detectedIconType || 'emoji';
  
  const normalizedItem = {
    ...item,
    iconType: finalIconType,
    icon: iconValue || (item.icon !== undefined ? item.icon : ''),
    emoji: item.emoji && typeof item.emoji === 'string' ? item.emoji.trim() : '',
    imageUrl: item.imageUrl && typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '',
    title: item.title && typeof item.title === 'string' ? item.title.trim() : '',
    description: item.description && typeof item.description === 'string' ? item.description.trim() : '',
  };
  
  const itemId = normalizedItem.id || `item-${index}`;
  const itemTitle = normalizedItem.title || normalizedItem.text || `Item ${index + 1}`;
  const itemDescription = normalizedItem.description || '';
  
  const itemStyle: React.CSSProperties = {
    minHeight: `${itemHeight}px`,
    backgroundColor,
    color: textColor,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };
  
  return (
    <div key={itemId} className="relative" style={itemStyle}>
      {/* Ícone à esquerda */}
      {renderLeftIcon(normalizedItem)}
      
      {/* Conteúdo do item */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '16px', fontWeight: 500, color: textColor }}>
          {itemTitle}
        </span>
        {itemDescription && (
          <span style={{ fontSize: '14px', color: textColor, opacity: 0.7 }}>
            {itemDescription}
          </span>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id={`element-${elementId}-item-${itemId}`}
        className="!bg-blue-500 !border-2 !border-white !w-3 !h-3 !z-10"
        style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
};

// Componente de nó para Slide
function SlideNode({ data }: { data: SlideNodeData }) {
  const slide = data.slide;
  const title = slide.question || `Slide ${slide.order}`;
  const reelId = (data as any).reelId;
  
  // Ordenar elementos por order
  const sortedElements = useMemo(() => {
    return [...(slide.elements || [])].sort((a, b) => a.order - b.order);
  }, [slide.elements]);
  
  const options = slide.options || [];
  
  // Agrupar elementos
  const grouped = useMemo(() => groupElements(sortedElements), [sortedElements]);

  // Elementos interativos que podem ter conexões
  const interactiveElementTypes = ['BUTTON', 'QUESTIONNAIRE', 'QUESTION_GRID', 'FORM'];
  const multiItemElementTypes = ['QUESTIONNAIRE', 'QUESTION_GRID'];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 min-w-[280px] max-w-[320px] relative">
      {/* Handle de entrada na lateral esquerda */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-4 !h-4 !bg-gray-500 !border-2 !border-white !z-30 !rounded-full"
        style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      {/* Header do slide */}
      <div className="px-3 py-2 border-b border-gray-100 bg-white rounded-t-lg">
        <div className="text-xs font-semibold text-gray-800 line-clamp-2">{title}</div>
      </div>
      
      {/* Conteúdo do slide */}
      <div className="p-3 space-y-2 bg-gray-50 rounded-b-lg" style={{ backgroundColor: slide.backgroundColor || '#f9fafb' }}>
        {grouped.length === 0 && options.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-4">Vazio</div>
        )}
        {grouped.map((group, groupIndex) => {
          if (group.type === 'button-group') {
            return (
              <div key={`button-group-${groupIndex}`} className="flex gap-2 flex-wrap">
                {group.elements.map((element: SlideElement) => {
                  const normalizedElement = {
                    ...element,
                    uiConfig: normalizeUiConfig(element.uiConfig),
                  };
                  return (
                    <div key={element.id} className="relative flex-1 min-w-0">
                      {renderElement(element, reelId)}
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`element-${element.id}`}
                        className="!bg-blue-500 !border-2 !border-white !w-3 !h-3 !z-10"
                        style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          } else {
            const element = group.element;
            const normalizedElement = {
              ...element,
              uiConfig: normalizeUiConfig(element.uiConfig),
            };
            
            const isInteractive = interactiveElementTypes.includes(element.elementType);
            const hasMultipleItems = multiItemElementTypes.includes(element.elementType);
            const elementItems = hasMultipleItems ? getElementItems(element) : [];
            
            // Para elementos com múltiplos items, renderizar apenas os items (não o elemento completo)
            if (hasMultipleItems && elementItems.length > 0) {
              const config = normalizeUiConfig(element.uiConfig);
              const gap = config.gap || 12;
              return (
                <div key={element.id} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
                  {elementItems.map((item: any, itemIndex: number) => 
                    renderQuestionnaireItem(item, itemIndex, element.id, element)
                  )}
                </div>
              );
            }
            
            return (
              <div key={element.id} className="relative">
                {renderElement(element, reelId)}
                {isInteractive && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`element-${element.id}`}
                    className="!bg-blue-500 !border-2 !border-white !w-3 !h-3 !z-10"
                    style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                  />
                )}
              </div>
            );
          }
        })}
        
        {/* Opções (se houver) */}
        {options.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-gray-300">
            {options.map((option) => (
              <div key={option.id} className="relative">
                <div className="px-3 py-2 bg-green-50 border border-green-300 rounded text-xs text-gray-700">
                  {option.emoji && <span className="mr-2">{option.emoji}</span>}
                  {option.text}
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`option-${option.id}`}
                  className="!bg-green-500 !border-2 !border-white !w-3 !h-3 !z-10"
                  style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de edge customizado com botão de deletar
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const onEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ edges: [{ id }] });
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={onEdgeClick}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md transition-colors z-10"
            style={{ fontSize: '12px' }}
            title="Remover conexão"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Tipos de nós
const nodeTypes: NodeTypes = {
  slide: SlideNode,
};

// Tipos de edges
const edgeTypes = {
  smoothstep: CustomEdge,
  default: CustomEdge,
};

interface FlowCanvasProps {
  slides: Slide[];
  onConnect: (connections: Record<string, Record<string, any>>) => void;
  onDisconnect?: (edgeId: string) => void;
  onNodePositionChange?: (slideId: string, position: { x: number; y: number }) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  reelId?: string;
}

export function FlowCanvas({ slides, onConnect, onDisconnect, onNodePositionChange, initialNodes = [], initialEdges = [], reelId }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Converter slides para nós
  const slideNodes = useMemo(() => {
    return slides.map((slide) => {
      const slideId = slide.id;
      const position = (slide.uiConfig?.flowPosition as { x?: number; y?: number }) || {
        x: slide.order * 400,
        y: 100,
      };

      return {
        id: `slide-${slideId}`,
        type: 'slide',
        position: { x: position.x || slide.order * 400, y: position.y || 100 },
        data: {
          slide,
          label: slide.question || `Slide ${slide.order}`,
          reelId,
        },
      } as Node;
    });
  }, [slides, reelId]);

  // Converter conexões (logicNext) para edges
  const connectionEdges = useMemo(() => {
    const edgeList: Edge[] = [];

    slides.forEach((slide) => {
      const slideId = slide.id;
      const logicNext = slide.logicNext || {};

      // Conexões de elementos
      if (logicNext.elements) {
        Object.entries(logicNext.elements).forEach(([elementKey, targetSlideId]) => {
          // elementKey pode ser elementId ou elementId-itemId
          edgeList.push({
            id: `edge-element-${elementKey}-${targetSlideId}`,
            source: `slide-${slideId}`,
            sourceHandle: `element-${elementKey}`,
            target: `slide-${targetSlideId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
          });
        });
      }

      // Conexões de opções
      if (logicNext.options) {
        Object.entries(logicNext.options).forEach(([optionId, targetSlideId]) => {
          edgeList.push({
            id: `edge-option-${optionId}-${targetSlideId}`,
            source: `slide-${slideId}`,
            sourceHandle: `option-${optionId}`,
            target: `slide-${targetSlideId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 },
          });
        });
      }
    });

    return edgeList;
  }, [slides]);

  // Atualizar nós quando slides mudarem
  useEffect(() => {
    setNodes(slideNodes);
  }, [slideNodes, setNodes]);

  // Atualizar edges quando conexões mudarem
  useEffect(() => {
    setEdges(connectionEdges);
  }, [connectionEdges, setEdges]);

  // Handler para mudanças de edges (incluindo remoção)
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Aplicar mudanças às edges
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);

      // Detectar remoções de edges e notificar
      changes.forEach((change) => {
        if (change.type === 'remove' && change.id && onDisconnect) {
          onDisconnect(change.id);
        }
      });
    },
    [edges, setEdges, onDisconnect],
  );

  // Handler para mudanças de nós (incluindo posições)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Aplicar mudanças aos nós
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);

      // Detectar mudanças de posição
      changes.forEach((change) => {
        if (change.type === 'position' && change.id) {
          const nodeId = change.id;
          // Extrair slideId do nodeId (formato: slide-${slideId})
          if (nodeId.startsWith('slide-')) {
            const slideId = nodeId.replace('slide-', '');
            const node = updatedNodes.find((n) => n.id === nodeId);
            // Salvar quando a posição mudar (change.position existe)
            if (node && onNodePositionChange && change.position) {
              onNodePositionChange(slideId, change.position);
            } else if (node && onNodePositionChange) {
              // Fallback: usar posição do nó atualizado
              onNodePositionChange(slideId, node.position);
            }
          }
        }
      });
    },
    [nodes, setNodes, onNodePositionChange],
  );

  const onConnectCallback = useCallback(
    (params: Connection) => {
      // Validar conexão
      if (!params.source || !params.target) return;

      // Converter edge para connection
      setEdges((eds) => addEdge(params, eds));

      // Extrair informações da conexão
      const sourceId = params.source;
      const targetId = params.target;
      const sourceHandle = params.sourceHandle;

      // Determinar slide de origem
      let sourceSlideId: string | null = null;
      if (sourceId.startsWith('slide-')) {
        sourceSlideId = sourceId.replace('slide-', '');
      }

      if (!sourceSlideId || !sourceHandle) return;

      const targetSlideId = targetId.replace('slide-', '');

      // Construir objeto de conexões atualizado
      const connections: Record<string, Record<string, any>> = {};

      slides.forEach((slide) => {
        if (slide.id === sourceSlideId) {
          const logicNext = { ...(slide.logicNext || {}) };

          if (sourceHandle.startsWith('element-')) {
            // Pode ser element-${elementId} ou element-${elementId}-item-${itemId}
            const elementKey = sourceHandle.replace('element-', '');
            if (!logicNext.elements) logicNext.elements = {};
            logicNext.elements[elementKey] = targetSlideId;
          } else if (sourceHandle.startsWith('option-')) {
            const optionId = sourceHandle.replace('option-', '');
            if (!logicNext.options) logicNext.options = {};
            logicNext.options[optionId] = targetSlideId;
          }

          connections[slide.id] = logicNext;
        } else if (slide.logicNext) {
          connections[slide.id] = slide.logicNext;
        }
      });

      onConnect(connections);
    },
    [slides, setEdges, onConnect],
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnectCallback}
        onNodeDragStop={(event, node) => {
          if (onNodePositionChange && node.id.startsWith('slide-')) {
            const slideId = node.id.replace('slide-', '');
            onNodePositionChange(slideId, node.position);
          }
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
