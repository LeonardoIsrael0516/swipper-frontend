import { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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
import { X, StickyNote, Palette, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slide, SlideElement } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
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

// Componente de edge customizado com botão de deletar e label
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, data }: EdgeProps) {
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

  const edgeData = data as { label?: string; type?: string } | undefined;
  const label = edgeData?.label || '';
  const labelType = edgeData?.type || ''; // 'option' | 'element' | 'element-item'

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
          className="nodrag nopan flex flex-col items-center gap-1"
        >
          {label && (
            <div
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium shadow-sm border max-w-[120px] truncate",
                labelType === 'option' 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-blue-50 text-blue-700 border-blue-200"
              )}
              title={label}
            >
              {label}
            </div>
          )}
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

// Interface para Sticky Note
interface StickyNoteData {
  id: string;
  title: string;
  color: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

// Componente de Sticky Note
function StickyNoteNode({ data, selected }: { data: StickyNoteData & { onUpdate?: (data: Partial<StickyNoteData>) => void; onResizeStart?: () => void; onResizeEnd?: () => void }; selected: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { deleteElements } = useReactFlow();

  useEffect(() => {
    setTitle(data.title);
  }, [data.title]);

  const handleSave = () => {
    if (data.onUpdate) {
      data.onUpdate({ title });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id: `sticky-note-${data.id}` }] });
  };

  const handleColorChange = (color: string) => {
    if (data.onUpdate) {
      data.onUpdate({ color });
    }
    setShowColorPicker(false);
  };

  return (
    <div
      className="rounded-lg shadow-lg border-2 border-gray-300 relative"
      style={{
        backgroundColor: data.color,
        width: data.width,
        height: data.height,
        minWidth: 300,
        minHeight: 200,
        zIndex: 0,
      }}
    >
      {/* Botões de ação (aparecem quando selecionado) */}
      {selected && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-white hover:bg-white/90 shadow-md border border-gray-200"
            onClick={() => setIsEditing(!isEditing)}
            title="Editar"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-700" />
          </Button>
          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 bg-white hover:bg-white/90 shadow-md border border-gray-200"
                title="Escolher cor"
              >
                <Palette className="w-3.5 h-3.5 text-gray-700" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <Label className="text-xs mb-2">Cor da Nota</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  '#FEF3C7', '#DBEAFE', '#FCE7F3', '#E0E7FF',
                  '#D1FAE5', '#FED7AA', '#E5E7EB', '#F3E8FF',
                  '#FEF2F2', '#ECFDF5', '#F0FDF4', '#FFFBEB',
                  '#F0F9FF', '#FDF2F8', '#F5F3FF', '#ECFEFF',
                ].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      data.color === color ? 'border-primary scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-white hover:bg-white/90 shadow-md border border-gray-200"
            onClick={handleDelete}
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-700" />
          </Button>
        </div>
      )}
      
      {/* Handles de redimensionamento */}
      {selected && (
        <>
          {/* Canto superior esquerdo */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-30 resize-handle nodrag nopan"
            style={{ transform: 'translate(-50%, -50%)' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (data.onResizeStart) data.onResizeStart();
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = data.width;
              const startHeight = data.height;
              const startPosX = data.position.x;
              const startPosY = data.position.y;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                const deltaX = startX - moveEvent.clientX;
                const deltaY = startY - moveEvent.clientY;
                const newWidth = Math.max(300, startWidth + deltaX);
                const newHeight = Math.max(200, startHeight + deltaY);
                const newPosX = startPosX - deltaX;
                const newPosY = startPosY - deltaY;

                if (data.onUpdate) {
                  data.onUpdate({
                    width: newWidth,
                    height: newHeight,
                    position: { x: newPosX, y: newPosY },
                  });
                }
              };

              const handleMouseUp = () => {
                if (data.onResizeEnd) data.onResizeEnd();
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="w-full h-full bg-white border-2 border-gray-600 rounded-full shadow-md" />
          </div>
          {/* Canto superior direito */}
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-30 resize-handle nodrag nopan"
            style={{ transform: 'translate(50%, -50%)' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (data.onResizeStart) data.onResizeStart();
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = data.width;
              const startHeight = data.height;
              const startPosY = data.position.y;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                const deltaX = moveEvent.clientX - startX;
                const deltaY = startY - moveEvent.clientY;
                const newWidth = Math.max(300, startWidth + deltaX);
                const newHeight = Math.max(200, startHeight + deltaY);
                const newPosY = startPosY - deltaY;

                if (data.onUpdate) {
                  data.onUpdate({
                    width: newWidth,
                    height: newHeight,
                    position: { x: data.position.x, y: newPosY },
                  });
                }
              };

              const handleMouseUp = () => {
                if (data.onResizeEnd) data.onResizeEnd();
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="w-full h-full bg-white border-2 border-gray-600 rounded-full shadow-md" />
          </div>
          {/* Canto inferior esquerdo */}
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-30 resize-handle nodrag nopan"
            style={{ transform: 'translate(-50%, 50%)' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (data.onResizeStart) data.onResizeStart();
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = data.width;
              const startHeight = data.height;
              const startPosX = data.position.x;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                const deltaX = startX - moveEvent.clientX;
                const deltaY = moveEvent.clientY - startY;
                const newWidth = Math.max(300, startWidth + deltaX);
                const newHeight = Math.max(200, startHeight + deltaY);
                const newPosX = startPosX - deltaX;

                if (data.onUpdate) {
                  data.onUpdate({
                    width: newWidth,
                    height: newHeight,
                    position: { x: newPosX, y: data.position.y },
                  });
                }
              };

              const handleMouseUp = () => {
                if (data.onResizeEnd) data.onResizeEnd();
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="w-full h-full bg-white border-2 border-gray-600 rounded-full shadow-md" />
          </div>
          {/* Canto inferior direito */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 resize-handle nodrag nopan"
            style={{ transform: 'translate(50%, 50%)' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (data.onResizeStart) data.onResizeStart();
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = data.width;
              const startHeight = data.height;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                const newWidth = Math.max(300, startWidth + deltaX);
                const newHeight = Math.max(200, startHeight + deltaY);

                if (data.onUpdate) {
                  data.onUpdate({
                    width: newWidth,
                    height: newHeight,
                  });
                }
              };

              const handleMouseUp = () => {
                if (data.onResizeEnd) data.onResizeEnd();
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="w-full h-full bg-white border-2 border-gray-600 rounded-full shadow-md" />
          </div>
        </>
      )}

      {/* Conteúdo editável */}
      <div className="p-4 h-full flex flex-col">
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="text-sm font-semibold bg-white/90 w-full"
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            autoFocus
          />
        ) : (
          <div
            className="text-sm font-semibold text-gray-900 cursor-text"
            onDoubleClick={() => setIsEditing(true)}
          >
            {title || 'Duplo clique para editar'}
          </div>
        )}
      </div>
    </div>
  );
}

// Tipos de nós
const nodeTypes: NodeTypes = {
  slide: SlideNode,
  'sticky-note': StickyNoteNode,
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
  onStickyNoteChange?: (stickyNotes: StickyNoteData[]) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  reelId?: string;
  reel?: any; // Para acessar reel.uiConfig.flowStickyNotes
}

export function FlowCanvas({ slides, onConnect, onDisconnect, onNodePositionChange, onStickyNoteChange, initialNodes = [], initialEdges = [], reelId, reel }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newStickyNoteColor, setNewStickyNoteColor] = useState('#FEF3C7');

  // Carregar sticky notes do reel.uiConfig
  const stickyNotes = useMemo(() => {
    if (!reel?.uiConfig?.flowStickyNotes) return [];
    return (reel.uiConfig.flowStickyNotes as StickyNoteData[]) || [];
  }, [reel]);

  // Handler para atualizar dados de sticky note
  const handleStickyNoteDataChange = useCallback((nodeId: string, data: Partial<StickyNoteData>) => {
    if (!nodeId.startsWith('sticky-note-')) return;
    
    const stickyNoteId = nodeId.replace('sticky-note-', '');
    const updatedStickyNotes = stickyNotes.map((note) =>
      note.id === stickyNoteId ? { ...note, ...data } : note
    );
    
    if (onStickyNoteChange) {
      onStickyNoteChange(updatedStickyNotes);
    }
  }, [stickyNotes, onStickyNoteChange]);

  // Estado para controlar se está redimensionando
  const [isResizingNote, setIsResizingNote] = useState<string | null>(null);

  // Converter sticky notes para nós
  const stickyNoteNodes = useMemo(() => {
    return stickyNotes.map((note) => ({
      id: `sticky-note-${note.id}`,
      type: 'sticky-note',
      position: note.position,
      data: {
        ...note,
        onUpdate: (updatedData: Partial<StickyNoteData>) => {
          handleStickyNoteDataChange(`sticky-note-${note.id}`, updatedData);
        },
        onResizeStart: () => setIsResizingNote(note.id),
        onResizeEnd: () => setIsResizingNote(null),
      },
      style: {
        width: note.width || 400,
        height: note.height || 300,
        zIndex: 0, // Garantir que sticky notes fiquem atrás dos edges
      },
      draggable: isResizingNote !== note.id, // Desabilitar drag quando estiver redimensionando esta nota
      selectable: true,
      deletable: true,
      resizable: false, // Desabilitar redimensionamento padrão do ReactFlow, vamos fazer manual
      zIndex: 0, // Garantir que sticky notes fiquem atrás dos edges
    } as Node));
  }, [stickyNotes, handleStickyNoteDataChange, isResizingNote]);

  // Converter slides para nós
  const slideNodes = useMemo(() => {
    return slides.map((slide) => {
      const slideId = slide.id;
      const position = (slide.uiConfig?.flowPosition as { x?: number; y?: number }) || {
        x: slide.order * 400,
        y: 100,
      };

      // Verificar se o slide está dentro de uma sticky note
      const parentStickyNote = stickyNotes.find((note) => 
        note.id && slide.uiConfig?.stickyNoteId === note.id
      );
      const parentId = parentStickyNote ? `sticky-note-${parentStickyNote.id}` : undefined;

      return {
        id: `slide-${slideId}`,
        type: 'slide',
        position: { x: position.x || slide.order * 400, y: position.y || 100 },
        data: {
          slide,
          label: slide.question || `Slide ${slide.order}`,
          reelId,
        },
        parentId,
        extent: parentId ? 'parent' : undefined,
      } as Node;
    });
  }, [slides, reelId, stickyNotes]);

  // Converter conexões (logicNext) para edges com labels
  const connectionEdges = useMemo(() => {
    const edgeList: Edge[] = [];

    slides.forEach((slide) => {
      const slideId = slide.id;
      const logicNext = slide.logicNext || {};

      // Conexões de elementos
      if (logicNext.elements) {
        Object.entries(logicNext.elements).forEach(([elementKey, targetSlideId]) => {
          // elementKey pode ser elementId ou elementId-itemId
          let label = '';
          let labelType = 'element';
          
          // Tentar obter label do elemento ou item
          if (elementKey.includes('-item-')) {
            const [elementId, , itemId] = elementKey.split('-item-');
            const element = slide.elements?.find((el) => el.id === elementId);
            if (element) {
              const config = normalizeUiConfig(element.uiConfig);
              const items = config.items || [];
              const item = items.find((it: any) => it.id === itemId);
              if (item) {
                label = item.title || item.text || `Item ${itemId.substring(0, 6)}`;
                labelType = 'element-item';
              }
            }
          } else {
            const element = slide.elements?.find((el) => el.id === elementKey);
            if (element) {
              const elementType = element.elementType;
              if (elementType === 'BUTTON') {
                const config = normalizeUiConfig(element.uiConfig);
                label = config.text || 'Botão';
              } else {
                label = elementType.replace('_', ' ');
              }
            }
          }
          
          edgeList.push({
            id: `edge-element-${elementKey}-${targetSlideId}`,
            source: `slide-${slideId}`,
            sourceHandle: `element-${elementKey}`,
            target: `slide-${targetSlideId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2, zIndex: 10 },
            data: { label, type: labelType },
            zIndex: 10, // Garantir que edges fiquem acima das sticky notes
          });
        });
      }

      // Conexões de opções
      if (logicNext.options) {
        Object.entries(logicNext.options).forEach(([optionId, targetSlideId]) => {
          // Obter label da opção
          const option = slide.options?.find((opt) => opt.id === optionId);
          const label = option 
            ? `${option.emoji || ''} ${option.text}`.trim() || `Opção ${optionId.substring(0, 6)}`
            : `Opção ${optionId.substring(0, 6)}`;
          
          edgeList.push({
            id: `edge-option-${optionId}-${targetSlideId}`,
            source: `slide-${slideId}`,
            sourceHandle: `option-${optionId}`,
            target: `slide-${targetSlideId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2, zIndex: 10 },
            data: { label, type: 'option' },
            zIndex: 10, // Garantir que edges fiquem acima das sticky notes
          });
        });
      }
    });

    return edgeList;
  }, [slides]);

  // Atualizar nós quando slides ou sticky notes mudarem
  useEffect(() => {
    const allNodes = [...stickyNoteNodes, ...slideNodes];
    setNodes(allNodes);
  }, [stickyNoteNodes, slideNodes, setNodes]);

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

  // Handler para adicionar sticky note
  const handleAddStickyNote = useCallback(() => {
    // Usar posição padrão (será ajustada quando o ReactFlow estiver disponível)
    const newStickyNote: StickyNoteData = {
      id: `sticky-${Date.now()}`,
      title: 'Nova Nota',
      color: newStickyNoteColor,
      position: { x: 0, y: 0 },
      width: 400,
      height: 300,
    };

    const updatedStickyNotes = [...stickyNotes, newStickyNote];
    
    if (onStickyNoteChange) {
      onStickyNoteChange(updatedStickyNotes);
    }
  }, [stickyNotes, newStickyNoteColor, onStickyNoteChange]);

  // Handler para atualizar posição de sticky note
  const handleStickyNotePositionChange = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!nodeId.startsWith('sticky-note-')) return;
    
    const stickyNoteId = nodeId.replace('sticky-note-', '');
    const updatedStickyNotes = stickyNotes.map((note) =>
      note.id === stickyNoteId ? { ...note, position } : note
    );
    
    if (onStickyNoteChange) {
      onStickyNoteChange(updatedStickyNotes);
    }
  }, [stickyNotes, onStickyNoteChange]);

  // Componente interno para acessar ReactFlow context
  function AddStickyNoteButton() {
    const { getViewport } = useReactFlow();
    const { theme } = useTheme();
    
    const handleAdd = () => {
      const viewport = getViewport();
      
      // Calcular posição central da viewport
      const centerX = -viewport.x / viewport.zoom + window.innerWidth / 2 / viewport.zoom;
      const centerY = -viewport.y / viewport.zoom + window.innerHeight / 2 / viewport.zoom;

      const newStickyNote: StickyNoteData = {
        id: `sticky-${Date.now()}`,
        title: 'Nova Nota',
        color: newStickyNoteColor,
        position: { x: centerX - 200, y: centerY - 150 },
        width: 400,
        height: 300,
      };

      const updatedStickyNotes = [...stickyNotes, newStickyNote];
      
      if (onStickyNoteChange) {
        onStickyNoteChange(updatedStickyNotes);
      }
    };

    return (
      <div className="absolute top-4 right-4 z-10">
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 w-8 p-0 shadow-sm",
            theme === 'light' 
              ? "bg-white hover:bg-gray-100 border border-gray-300 text-gray-900" 
              : "bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-100"
          )}
          onClick={handleAdd}
          title="Adicionar nota adesiva"
        >
          <StickyNote className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
        connectionRadius={20}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          
          // Detectar mudanças em sticky notes (posição e dados)
          changes.forEach((change) => {
            if ('id' in change) {
              const changeId = change.id as string;
              if (changeId?.startsWith('sticky-note-')) {
                if (change.type === 'position' && 'position' in change) {
                  const node = nodes.find((n) => n.id === changeId);
                  if (node && change.position) {
                    handleStickyNotePositionChange(changeId, change.position);
                  }
                } else if (change.type === 'remove') {
                  // Quando uma sticky note é removida, atualizar a lista
                  const stickyNoteId = changeId.replace('sticky-note-', '');
                  const updatedStickyNotes = stickyNotes.filter((note) => note.id !== stickyNoteId);
                  if (onStickyNoteChange) {
                    onStickyNoteChange(updatedStickyNotes);
                  }
                } else if (change.type === 'select' && 'selected' in change && change.selected) {
                  // Quando uma sticky note é selecionada, verificar se há mudanças nos dados
                  const node = nodes.find((n) => n.id === changeId);
                  if (node && node.data) {
                    const nodeData = node.data as unknown as StickyNoteData;
                    const existingNote = stickyNotes.find((n) => n.id === nodeData.id);
                    if (existingNote && existingNote.title !== nodeData.title) {
                      handleStickyNoteDataChange(changeId, {
                        title: nodeData.title,
                      });
                    }
                  }
                }
              }
            }
          });
        }}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnectCallback}
        onNodeDragStart={(event, node) => {
          // Se estiver redimensionando, prevenir o drag
          const target = event.target as HTMLElement;
          if (target && (target.closest('.nodrag') || target.closest('.resize-handle'))) {
            // Cancelar o drag se estiver redimensionando
            event.preventDefault();
            return;
          }
        }}
        onNodeDragStop={(event, node) => {
          if (onNodePositionChange && node.id.startsWith('slide-')) {
            const slideId = node.id.replace('slide-', '');
            onNodePositionChange(slideId, node.position);
          } else if (node.id.startsWith('sticky-note-')) {
            handleStickyNotePositionChange(node.id, node.position);
          }
        }}
        nodeDragThreshold={5}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        defaultEdgeOptions={{ zIndex: 1 }} // Edges ficam acima das sticky notes
        snapToGrid={false}
        snapGrid={[15, 15]}
      >
        <Background />
        <Controls />
        <AddStickyNoteButton />
      </ReactFlow>
    </div>
  );
}
