import { useState, useRef, useEffect, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { SwipeHint } from '@/components/reels/SwipeHint';
import { ReelSlide, ReelSlideConfig } from '@/components/reels/ReelSlide';
import { ReelContent } from '@/components/reels/ReelContent';
import { ReelQuestion } from '@/components/reels/ReelQuestion';
import { ReelSocialActions } from '@/components/reels/ReelSocialActions';
import { ReelProgressBar } from '@/components/reels/ReelProgressBar';
import { useSwipe } from '@/components/reels/hooks/useSwipe';
import { useReelFeedback } from '@/components/reels/hooks/useReelFeedback';
import {
  ReelText,
  ReelTimer,
  ReelCarousel,
  ReelImage,
  ReelButton,
  ReelProgress,
  ReelAccordion,
  ReelBenefits,
  ReelPrice,
} from '@/components/reels/elements';

interface ReelCardData {
  id: number;
  type: string;
  config: ReelSlideConfig;
  content?: ReactNode;
  question?: {
    question: string;
    options: { id: string; text: string; emoji?: string }[];
  };
}

export default function Reels() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [muted, setMuted] = useState(true);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { triggerSuccess } = useReelFeedback();

  // Cards dinâmicos
  const reelCards: ReelCardData[] = [
    // Card 1: Texto
    {
      id: 1,
      type: 'text',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#667eea', '#764ba2', '#f093fb'],
        },
      },
      content: (
        <div className="text-center space-y-6">
          <ReelText size="4xl" weight="bold" animation="fade-in" color="#ffffff">
            Texto Animado
          </ReelText>
          <ReelText size="xl" weight="normal" animation="slide-up" color="#ffffff" style={{ animationDelay: '200ms' }}>
            Diferentes tamanhos e estilos
          </ReelText>
          <ReelText size="lg" weight="medium" animation="bounce-in" color="#ffffff" style={{ animationDelay: '400ms' }}>
            Com animações suaves
          </ReelText>
        </div>
      ),
      question: {
        question: 'Qual estilo de texto você prefere?',
        options: [
          { id: 'a', text: 'Grande e impactante', emoji: '💥' },
          { id: 'b', text: 'Elegante e discreto', emoji: '✨' },
        ],
      },
    },
    // Card 2: Timer
    {
      id: 2,
      type: 'timer',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#f093fb', '#f5576c', '#4facfe'],
        },
      },
      content: (
        <div className="text-center space-y-8">
          <ReelText size="3xl" weight="bold" color="#ffffff">
            Contador Regressivo
          </ReelText>
          <div className="flex justify-center">
            <ReelTimer type="countdown" initialSeconds={30} />
          </div>
          <ReelText size="lg" weight="normal" color="#ffffff">
            Tempo restante para decidir
          </ReelText>
        </div>
      ),
      question: {
        question: 'Você está com pressa?',
        options: [
          { id: 'a', text: 'Sim, preciso decidir rápido', emoji: '⚡' },
          { id: 'b', text: 'Não, posso pensar', emoji: '🤔' },
        ],
      },
    },
    // Card 3: Carrossel
    {
      id: 3,
      type: 'carousel',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#fa709a', '#fee140', '#30cfd0'],
        },
      },
      content: (
        <div className="w-full max-w-md mx-auto">
          <ReelText size="2xl" weight="bold" color="#ffffff" className="mb-6 text-center">
            Carrossel de Imagens
          </ReelText>
          <ReelCarousel
            items={[
              <div key="1" className="w-full h-64 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ReelText size="3xl">🖼️</ReelText>
              </div>,
              <div key="2" className="w-full h-64 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ReelText size="3xl">🎨</ReelText>
              </div>,
              <div key="3" className="w-full h-64 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ReelText size="3xl">📸</ReelText>
              </div>,
            ]}
            autoPlay={true}
            interval={3000}
            showControls={true}
          />
        </div>
      ),
      question: {
        question: 'Qual imagem você prefere?',
        options: [
          { id: 'a', text: 'Primeira', emoji: '1️⃣' },
          { id: 'b', text: 'Segunda', emoji: '2️⃣' },
          { id: 'c', text: 'Terceira', emoji: '3️⃣' },
        ],
      },
    },
    // Card 4: Imagem
    {
      id: 4,
      type: 'image',
      config: {
        backgroundGradient: {
          type: 'radial',
          colors: ['#a8edea', '#fed6e3', '#ffecd2'],
        },
      },
      content: (
        <div className="text-center space-y-6">
          <ReelText size="3xl" weight="bold" color="#333333">
            Imagem com Efeitos
          </ReelText>
          <div className="w-full max-w-sm mx-auto h-64 rounded-2xl overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <ReelText size="6xl">🎭</ReelText>
            </div>
          </div>
        </div>
      ),
      question: {
        question: 'Gostou do efeito?',
        options: [
          { id: 'a', text: 'Sim, muito!', emoji: '❤️' },
          { id: 'b', text: 'Mais ou menos', emoji: '😐' },
        ],
      },
    },
    // Card 5: Botões em Grid
    {
      id: 5,
      type: 'buttons-grid',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#667eea', '#764ba2'],
        },
      },
      content: (
        <div className="text-center space-y-6">
          <ReelText size="3xl" weight="bold" color="#ffffff">
            Botões em Grid
          </ReelText>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <ReelButton variant="glass" size="lg" onClick={() => triggerSuccess()}>
              Opção 1
            </ReelButton>
            <ReelButton variant="glass" size="lg" onClick={() => triggerSuccess()}>
              Opção 2
            </ReelButton>
            <ReelButton variant="glass" size="lg" onClick={() => triggerSuccess()}>
              Opção 3
            </ReelButton>
            <ReelButton variant="glass" size="lg" onClick={() => triggerSuccess()}>
              Opção 4
            </ReelButton>
          </div>
        </div>
      ),
      question: {
        question: 'Escolha uma opção',
        options: [
          { id: 'a', text: 'Opção A', emoji: 'A' },
          { id: 'b', text: 'Opção B', emoji: 'B' },
        ],
      },
    },
    // Card 6: Accordion
    {
      id: 6,
      type: 'accordion',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#fad961', '#f76b1c'],
        },
      },
      content: (
        <div className="w-full max-w-lg mx-auto space-y-6">
          <ReelText size="3xl" weight="bold" color="#ffffff" className="text-center">
            Accordion Interativo
          </ReelText>
          <ReelAccordion
            items={[
              {
                title: 'Informação 1',
                content: <p className="text-white/90">Conteúdo detalhado da primeira informação.</p>,
              },
              {
                title: 'Informação 2',
                content: <p className="text-white/90">Conteúdo detalhado da segunda informação.</p>,
              },
              {
                title: 'Informação 3',
                content: <p className="text-white/90">Conteúdo detalhado da terceira informação.</p>,
              },
            ]}
          />
        </div>
      ),
      question: {
        question: 'Qual informação foi mais útil?',
        options: [
          { id: 'a', text: 'Primeira', emoji: '1️⃣' },
          { id: 'b', text: 'Segunda', emoji: '2️⃣' },
          { id: 'c', text: 'Terceira', emoji: '3️⃣' },
        ],
      },
    },
    // Card 7: Benefícios
    {
      id: 7,
      type: 'benefits',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#30cfd0', '#330867'],
        },
      },
      content: (
        <div className="w-full max-w-lg mx-auto space-y-6">
          <ReelText size="3xl" weight="bold" color="#ffffff" className="text-center">
            Lista de Benefícios
          </ReelText>
          <ReelBenefits
            benefits={[
              { text: 'Benefício exclusivo número 1' },
              { text: 'Benefício exclusivo número 2' },
              { text: 'Benefício exclusivo número 3' },
              { text: 'Benefício exclusivo número 4' },
            ]}
          />
        </div>
      ),
      question: {
        question: 'Qual benefício te interessa mais?',
        options: [
          { id: 'a', text: 'Primeiro', emoji: '1️⃣' },
          { id: 'b', text: 'Segundo', emoji: '2️⃣' },
        ],
      },
    },
    // Card 8: Preço
    {
      id: 8,
      type: 'price',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#fa709a', '#fee140'],
        },
      },
      content: (
        <div className="text-center space-y-6">
          <ReelText size="3xl" weight="bold" color="#ffffff">
            Oferta Especial
          </ReelText>
          <ReelPrice
            amount={97}
            currency="R$"
            period="mês"
            originalAmount={197}
            discount={50}
          />
          <ReelText size="lg" weight="normal" color="#ffffff">
            Aproveite esta oferta limitada!
          </ReelText>
        </div>
      ),
      question: {
        question: 'Interessado na oferta?',
        options: [
          { id: 'a', text: 'Sim, quero aproveitar!', emoji: '💰' },
          { id: 'b', text: 'Não, obrigado', emoji: '❌' },
        ],
      },
    },
    // Card 9: Progresso
    {
      id: 9,
      type: 'progress',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#4facfe', '#00f2fe'],
        },
      },
      content: (
        <div className="w-full max-w-md mx-auto space-y-8">
          <ReelText size="3xl" weight="bold" color="#ffffff" className="text-center">
            Barra de Progresso
          </ReelText>
          <div className="space-y-6">
            <ReelProgress value={75} showLabel={true} label="Progresso 1" color="#ffffff" />
            <ReelProgress value={50} showLabel={true} label="Progresso 2" color="#ffffff" />
            <ReelProgress value={90} showLabel={true} label="Progresso 3" color="#ffffff" />
          </div>
        </div>
      ),
      question: {
        question: 'Como está seu progresso?',
        options: [
          { id: 'a', text: 'Ótimo!', emoji: '👍' },
          { id: 'b', text: 'Preciso melhorar', emoji: '📈' },
        ],
      },
    },
    // Card 10: Feedback Visual
    {
      id: 10,
      type: 'feedback',
      config: {
        backgroundGradient: {
          type: 'linear',
          direction: 'to bottom right',
          colors: ['#a8edea', '#fed6e3'],
        },
      },
      content: (
        <div className="text-center space-y-8">
          <div className="animate-bounce-in">
            <div className="w-32 h-32 rounded-full bg-white/30 backdrop-blur-sm mx-auto flex items-center justify-center mb-6">
              <span className="text-7xl">✅</span>
            </div>
            <ReelText size="3xl" weight="bold" color="#333333">
              Feedback Positivo!
            </ReelText>
            <ReelText size="lg" weight="normal" color="#333333" className="mt-4">
              Você está no caminho certo
            </ReelText>
          </div>
        </div>
      ),
      question: {
        question: 'Como você se sente?',
        options: [
          { id: 'a', text: 'Motivado!', emoji: '💪' },
          { id: 'b', text: 'Confuso', emoji: '🤷' },
        ],
      },
    },
    // Card 11: Circular (Progresso Circular)
    {
      id: 11,
      type: 'circular',
      config: {
        backgroundGradient: {
          type: 'conic',
          colors: ['#667eea', '#764ba2', '#f093fb', '#667eea'],
        },
      },
      content: (
        <div className="text-center space-y-6">
          <ReelText size="3xl" weight="bold" color="#ffffff">
            Progresso Circular
          </ReelText>
          <div className="relative w-48 h-48 mx-auto">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="white"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - 0.75)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <ReelText size="4xl" weight="bold" color="#ffffff">
                75%
              </ReelText>
            </div>
          </div>
        </div>
      ),
      question: {
        question: 'Satisfeito com o progresso?',
        options: [
          { id: 'a', text: 'Sim!', emoji: '🎯' },
          { id: 'b', text: 'Quero mais', emoji: '🚀' },
        ],
      },
    },
  ];

  // Swipe gestures
  const swipeState = useSwipe(containerRef, {
    onSwipeUp: () => {
      if (currentSlide < reelCards.length - 1) {
        scrollToSlide(currentSlide + 1);
      }
    },
    onSwipeDown: () => {
      if (currentSlide > 0) {
        scrollToSlide(currentSlide - 1);
      }
    },
    onSwipeRight: () => {
      // Like action - can be implemented
    },
    onSwipeLeft: () => {
      // Pass action - can be implemented
    },
  });

  const scrollToSlide = (slideIndex: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: slideIndex * container.clientHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const slideHeight = container.clientHeight;
      const newSlide = Math.round(scrollTop / slideHeight);

      if (newSlide !== currentSlide && newSlide < reelCards.length) {
        setCurrentSlide(newSlide);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentSlide, reelCards.length]);

  const handleOptionSelect = (cardId: number, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [cardId]: optionId }));
    triggerSuccess();

    // Auto-scroll to next slide after selection
    setTimeout(() => {
      if (currentSlide < reelCards.length - 1) {
        scrollToSlide(currentSlide + 1);
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
        <Link to="/dashboard" className="pointer-events-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMuted(!muted)}
            className="text-white hover:bg-white/20"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white hover:bg-white/20"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <ReelProgressBar currentSlide={currentSlide} totalSlides={reelCards.length} />

      {/* Swipe Hint - Only on first slide */}
      {showSwipeHint && currentSlide === 0 && (
        <SwipeHint onDismiss={() => setShowSwipeHint(false)} />
      )}

      {/* Main Scrollable Container */}
      <div ref={containerRef} className="reels-container hide-scrollbar">
        {reelCards.map((card, index) => (
          <ReelSlide key={card.id} config={card.config}>
            {/* Social Actions */}
            <ReelSocialActions
              initialLikes={Math.floor(Math.random() * 5000) + 1000}
              initialViews={Math.floor(Math.random() * 10000) + 5000}
            />

            {/* Content Area */}
            <ReelContent>{card.content}</ReelContent>

            {/* Question Overlay */}
            {card.question && (
              <ReelQuestion
                question={card.question.question}
                options={card.question.options.map((opt) => ({
                  id: opt.id,
                  text: opt.text,
                  emoji: opt.emoji,
                }))}
                selectedOptionId={selectedAnswers[card.id]}
                onOptionSelect={(optionId) => handleOptionSelect(card.id, optionId)}
              />
            )}
          </ReelSlide>
        ))}

        {/* Result Slide */}
        <ReelSlide
          config={{
            backgroundGradient: {
              type: 'linear',
              direction: 'to bottom right',
              colors: ['#ec4899', '#a855f7', '#6366f1'],
            },
          }}
        >
          <ReelContent>
            <div className="text-center px-6 max-w-lg mx-auto">
              <div className="mb-8 animate-scale-in">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mx-auto flex items-center justify-center mb-6">
                  <span className="text-5xl">🎉</span>
                </div>
                <h2 className="text-4xl font-display font-bold text-white mb-4">
                  Parabéns!
                </h2>
                <p className="text-xl text-white/90">
                  Você completou todos os cards
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8 animate-slide-up">
                <p className="text-white/80 mb-2">Você interagiu com</p>
                <p className="text-5xl font-bold text-white mb-2">
                  {Object.keys(selectedAnswers).length}/{reelCards.length}
                </p>
                <p className="text-white/80">cards</p>
              </div>

              <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Button
                  className="w-full h-14 bg-white text-gray-900 hover:bg-white/90 font-semibold text-lg rounded-xl"
                  onClick={() => navigate('/dashboard')}
                >
                  Ver meu resultado
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14 border-white/30 text-white hover:bg-white/10 font-medium text-lg rounded-xl"
                  onClick={() => navigate('/dashboard')}
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </div>
          </ReelContent>
        </ReelSlide>
      </div>
    </div>
  );
}
