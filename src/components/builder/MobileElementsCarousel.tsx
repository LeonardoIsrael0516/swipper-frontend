import { Button } from '@/components/ui/button';
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
  Paintbrush,
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
];

interface MobileElementsCarouselProps {
  onElementAdded?: () => void;
}

export function MobileElementsCarousel({ onElementAdded }: MobileElementsCarouselProps) {
  const { addElement, selectedSlide, setIsEditingBackground, setSelectedElement, hasAvailableSpace, setSelectedTab } = useBuilder();

  const handleAddElement = async (elementType: string) => {
    if (!selectedSlide) return;
    await addElement(elementType);
    onElementAdded?.();
  };

  const handleEditBackground = () => {
    setIsEditingBackground(true);
    setSelectedElement(null);
    onElementAdded?.();
  };

  const isDisabled = !selectedSlide || !hasAvailableSpace;

  return (
    <div className="px-2 overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-2 py-1">
        {/* Botão Tema */}
        <button
          onClick={() => setSelectedTab('theme')}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-lg border-2 border-border/50 bg-background hover:bg-surface-hover hover:border-border transition-all"
        >
          <Paintbrush className="w-4 h-4 text-foreground" />
          <span className="text-[10px] font-medium text-foreground leading-tight">Tema</span>
        </button>
        {/* Botão Fundo */}
        <button
          onClick={handleEditBackground}
          disabled={!selectedSlide}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-lg border border-border/50 bg-background hover:bg-surface-hover hover:border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Palette className="w-4 h-4 text-foreground" />
          <span className="text-[10px] font-medium text-foreground leading-tight">Fundo</span>
        </button>

        {/* Elementos */}
        {elements.map((element) => {
          const Icon = element.icon;
          const elementDisabled = isDisabled && element.type !== 'TEXT';

          return (
            <button
              key={element.type}
              onClick={() => handleAddElement(element.type)}
              disabled={elementDisabled}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-lg border border-border/50 bg-background hover:bg-surface-hover hover:border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon className="w-4 h-4 text-foreground" />
              <span className="text-[10px] font-medium text-foreground leading-tight">{element.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

