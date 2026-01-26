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
  ShoppingCart,
  Trophy,
} from 'lucide-react';
import { useBuilder } from '@/contexts/BuilderContext';
import { Badge } from '@/components/ui/badge';

const elementCategories = [
  {
    name: 'Mídia e Conteúdo',
    elements: [
      { type: 'TEXT', icon: Type, label: 'Texto' },
      { type: 'IMAGE', icon: Image, label: 'Imagem' },
      { type: 'VIDEO', icon: Video, label: 'Vídeo' },
      { type: 'AUDIO', icon: Music, label: 'Áudio' },
    ],
  },
  {
    name: 'Quiz',
    elements: [
      { type: 'QUESTIONNAIRE', icon: HelpCircle, label: 'Questionário' },
      { type: 'QUESTION_GRID', icon: Grid3x3, label: 'Question Grid' },
    ],
  },
  {
    name: 'Ação',
    elements: [
      { type: 'BUTTON', icon: FileText, label: 'Botão' },
      { type: 'FORM', icon: FormInput, label: 'Formulário' },
      { type: 'CHECKOUT', icon: ShoppingCart, label: 'Checkout', comingSoon: true },
    ],
  },
  {
    name: 'Layout',
    elements: [
      { type: 'CAROUSEL', icon: LayoutGrid, label: 'Carrossel' },
      { type: 'ACCORDION', icon: List, label: 'Accordion' },
      { type: 'SPACING', icon: GripVertical, label: 'Espaçamento' },
    ],
  },
  {
    name: 'Dados e Métricas',
    elements: [
      { type: 'PROGRESS', icon: TrendingUp, label: 'Progresso' },
      { type: 'CHART', icon: BarChart3, label: 'Gráfico' },
      { type: 'CIRCULAR', icon: Circle, label: 'Dash' },
      { type: 'SCORE', icon: Minus, label: 'Score' },
      { type: 'TIMER', icon: Timer, label: 'Timer' },
    ],
  },
  {
    name: 'Comercial',
    elements: [
      { type: 'PRICE', icon: DollarSign, label: 'Preço' },
      { type: 'PLANS', icon: CreditCard, label: 'Planos' },
      { type: 'BENEFITS', icon: CheckSquare, label: 'Comparativo' },
    ],
  },
  {
    name: 'Feedback',
    elements: [
      { type: 'FEEDBACK', icon: Star, label: 'Reviews' },
    ],
  },
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
    <div className="basis-48 min-w-[160px] max-w-[192px] border-r border-border/50 bg-background flex flex-col h-full overflow-y-auto hide-scrollbar">
      {/* Botões de Configuração - Separados no topo */}
      <div className="flex-shrink-0 p-1 lg:p-4 border-b border-border/50 space-y-1">
        <Button
          variant="outline"
          size="sm"
          className="flex flex-row items-center justify-start gap-2 h-auto py-2 w-full hover:bg-surface-hover hover:text-foreground relative rounded-sm"
          onClick={() => setSelectedTab('theme')}
        >
          <Paintbrush className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs">Geral</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-row items-center justify-start gap-2 h-auto py-2 w-full hover:bg-surface-hover hover:text-foreground relative rounded-sm"
          onClick={() => setSelectedTab('gamification')}
        >
          <Trophy className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs">Gamificação</span>
        </Button>
      </div>

      {/* Seção Elementos */}
      <div className="flex-1 p-1 lg:p-4">
        <h2 className="text-sm font-semibold mb-2 lg:mb-4 px-1 lg:px-0 text-center lg:text-left">Elementos</h2>
        <div className="space-y-4">
          {/* Botão Fundo */}
          <div>
            <Button
              variant="outline"
              size="sm"
              className="flex flex-row items-center justify-start gap-2 h-auto py-2 w-full hover:bg-surface-hover hover:text-foreground relative rounded-sm"
              onClick={handleEditBackground}
              disabled={!selectedSlide}
            >
              <Palette className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Fundo</span>
            </Button>
          </div>
          
          {/* Elementos por categoria */}
          {elementCategories.map((category) => (
            <div key={category.name} className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wide">
                {category.name}
              </h3>
              <div className="space-y-1">
                {category.elements.map((element) => {
                  const Icon = element.icon;
                  const isComingSoon = element.comingSoon === true;
                  const isDisabled = !selectedSlide || !hasAvailableSpace || isComingSoon;
                  
                  const tooltipMessage = !selectedSlide
                    ? 'Selecione um slide para adicionar elementos'
                    : !hasAvailableSpace
                    ? 'Limite de altura atingido. Remova elementos existentes para adicionar novos.'
                    : isComingSoon
                    ? 'Em breve'
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
                              className="flex flex-row items-center justify-start gap-2 h-auto py-2 opacity-50 cursor-not-allowed w-full pointer-events-none relative rounded-sm"
                              disabled
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-xs">{element.label}</span>
                              {isComingSoon && (
                                <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4">
                                  Em breve
                                </Badge>
                              )}
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
                      className="flex flex-row items-center justify-start gap-2 h-auto py-2 w-full hover:bg-surface-hover hover:text-foreground relative rounded-sm"
                      onClick={() => handleAddElement(element.type)}
                      disabled={isDisabled}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{element.label}</span>
                      {isComingSoon && (
                        <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4">
                          Em breve
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

