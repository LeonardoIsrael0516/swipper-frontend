import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Type,
  Image,
  Video,
  Music,
  Timer,
  LayoutGrid,
  FileText,
  List,
  CheckSquare,
  DollarSign,
  CreditCard,
  HelpCircle,
  TrendingUp,
  FormInput,
  Star,
  Circle,
  BarChart3,
  Palette,
  Grid3x3,
  GripVertical,
  Paintbrush,
  Minus,
} from 'lucide-react';
import { useBuilder } from '@/contexts/BuilderContext';

const elements = [
  { type: 'TEXT', icon: Type, label: 'Texto' },
  { type: 'IMAGE', icon: Image, label: 'Imagem' },
  { type: 'VIDEO', icon: Video, label: 'Vídeo' },
  { type: 'AUDIO', icon: Music, label: 'Áudio' },
  { type: 'TIMER', icon: Timer, label: 'Timer' },
  { type: 'CAROUSEL', icon: LayoutGrid, label: 'Carrossel' },
  { type: 'BUTTON', icon: FileText, label: 'Botão' },
  { type: 'ACCORDION', icon: List, label: 'Accordion' },
  { type: 'BENEFITS', icon: CheckSquare, label: 'Comparativo' },
  { type: 'PRICE', icon: DollarSign, label: 'Preço' },
  { type: 'PLANS', icon: CreditCard, label: 'Planos' },
  { type: 'QUESTIONNAIRE', icon: HelpCircle, label: 'Question' },
  { type: 'QUESTION_GRID', icon: Grid3x3, label: 'Question Grid' },
  { type: 'PROGRESS', icon: TrendingUp, label: 'Progresso' },
  { type: 'FORM', icon: FormInput, label: 'Formulário' },
  { type: 'FEEDBACK', icon: Star, label: 'Reviews' },
  { type: 'CIRCULAR', icon: Circle, label: 'Dash' },
  { type: 'CHART', icon: BarChart3, label: 'Gráfico' },
  { type: 'SCORE', icon: Minus, label: 'Score' },
  { type: 'SPACING', icon: GripVertical, label: 'Espaçamento' },
];

export function ElementsPalette() {
  const { addElement, selectedSlide, setIsEditingBackground, setSelectedElement, hasAvailableSpace, setSelectedTab } = useBuilder();

  const handleAddElement = async (elementType: string) => {
    if (!selectedSlide) return;
    await addElement(elementType);
  };

  const handleEditBackground = () => {
    setIsEditingBackground(true);
    setSelectedElement(null);
  };

  return (
    <div className="basis-64 min-w-[200px] max-w-[256px] border-r border-border/50 bg-background flex flex-col h-full overflow-y-auto">
      {/* Botão Tema - Separado no topo */}
      <div className="flex-shrink-0 p-3 lg:p-4 border-b border-border/50">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 h-10 hover:bg-surface-hover hover:text-foreground border-2"
          onClick={() => setSelectedTab('theme')}
        >
          <Paintbrush className="w-4 h-4" />
          <span className="text-sm font-medium">Geral</span>
        </Button>
      </div>

      {/* Seção Elementos */}
      <div className="flex-1 p-1 lg:p-4">
        <h2 className="text-sm font-semibold mb-2 lg:mb-4 px-1 lg:px-0 text-center lg:text-left">Elementos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 lg:gap-2 justify-items-center lg:justify-items-stretch">
          {/* Botão Fundo */}
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-2 h-auto py-3 w-full lg:w-full max-w-[120px] lg:max-w-none hover:bg-surface-hover hover:text-foreground"
            onClick={handleEditBackground}
            disabled={!selectedSlide}
          >
            <Palette className="w-5 h-5" />
            <span className="text-xs">Fundo</span>
          </Button>
          
          {/* Outros elementos */}
          {elements.map((element) => {
            const Icon = element.icon;
            const isDisabled = !selectedSlide || !hasAvailableSpace;
            
            const tooltipMessage = !selectedSlide
              ? 'Selecione um slide para adicionar elementos'
              : !hasAvailableSpace
              ? 'Limite de altura atingido. Remova elementos existentes para adicionar novos.'
              : '';

            // Para elementos desabilitados, usar wrapper div para tooltip funcionar
            if (isDisabled && tooltipMessage) {
              return (
                <Tooltip key={element.type} delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-full relative cursor-not-allowed"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col items-center gap-2 h-auto py-3 opacity-50 cursor-not-allowed w-full lg:w-full max-w-[120px] lg:max-w-none pointer-events-none"
                        disabled
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{element.label}</span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="z-50" sideOffset={8}>
                    <p className="text-xs max-w-[200px] text-center whitespace-normal">
                      {tooltipMessage}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Button
                key={element.type}
                variant="outline"
                size="sm"
                className="flex flex-col items-center gap-2 h-auto py-3 w-full lg:w-full max-w-[120px] lg:max-w-none hover:bg-surface-hover hover:text-foreground"
                onClick={() => handleAddElement(element.type)}
                disabled={isDisabled}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{element.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

