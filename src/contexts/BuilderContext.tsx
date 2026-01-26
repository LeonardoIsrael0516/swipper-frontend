import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
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

export interface SlideElement {
  id: string;
  elementType: string;
  order: number;
  uiConfig?: any;
  // Configuração de gamificação por elemento
  gamificationConfig?: GamificationElementConfig;
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'video';
  // Para color
  color?: string;
  
  // Para gradient
  gradient?: {
    direction: 'linear' | 'radial' | 'conic';
    angle?: number; // 0-360 para linear
    stops: Array<{ color: string; position: number }>; // 0-100
  };
  
  // Para image
  image?: {
    url: string;
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'cover';
    repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    size?: 'cover' | 'contain' | 'auto' | string;
    opacity?: number; // 0-1
  };
  
  // Para video
  video?: {
    url: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    opacity?: number; // 0-1
    showProgressBar?: boolean; // Habilitar/desabilitar barrinha
    fakeProgress?: boolean; // Habilitar fake progress
    fakeProgressSpeed?: number; // Velocidade do fake progress (ex: 1.5 = 50% mais rápido, 2.0 = 2x mais rápido)
    fakeProgressSlowdownStart?: number; // Porcentagem do vídeo onde começa a desacelerar (ex: 0.9 = últimos 10%)
  };
}

export interface GamificationElementConfig {
  // Configuração por elemento (botão, questionário, etc.)
  enablePointsBadge?: boolean;
  enableSuccessSound?: boolean;
  enableConfetti?: boolean;
  enableParticles?: boolean;
  enablePointsProgress?: boolean;
  enableAchievement?: boolean;
  
  // Triggers específicos
  triggers?: {
    onButtonClick?: boolean;
    onQuestionAnswer?: boolean;
    onSlideChange?: boolean;
    onFormComplete?: boolean;
    onPointsGained?: boolean;
  };
}

export interface Slide {
  id: string;
  order: number;
  question: string;
  type?: string;
  backgroundColor?: string; // Mantido para compatibilidade
  accentColor?: string;
  backgroundConfig?: BackgroundConfig; // Novo campo (também pode estar em uiConfig.backgroundConfig)
  uiConfig?: any;
  logicNext?: Record<string, any>;
  caption?: string;
  audioTag?: string;
  hideSocialElements?: boolean;
  hideGamificationProgress?: boolean;
  elements: SlideElement[];
  options?: Array<{
    id: string;
    text: string;
    emoji?: string;
    order?: number;
  }>;
  // Configuração de gamificação por slide
  gamificationConfig?: GamificationElementConfig;
}

export interface PixelsConfig {
  metaPixel?: {
    pixelId: string;
    enabled: boolean;
  };
  googleAds?: {
    conversionId?: string;
    conversionLabel?: string;
    analyticsId?: string;
    tagManagerId?: string;
    siteVerification?: string;
    enabled: boolean;
  };
  customScripts?: {
    head?: string;
    body?: string;
    footer?: string;
  };
}

export interface SocialConfig {
  enabled?: boolean;
  showAvatar?: boolean;
  showLike?: boolean;
  showComment?: boolean;
  showShare?: boolean;
  showUsername?: boolean;
  showCaptions?: boolean;
  username?: string;
  avatarUrl?: string;
  initialLikes?: number;
  initialComments?: number;
  incrementInterval?: number; // em segundos
}

export interface GamificationConfig {
  enabled: boolean;
  pointsConfig: {
    pointsPerAnswer: number;
    pointsPerCorrectAnswer: number;
    pointsPerWrongAnswer: number;
    pointsPerFormComplete: number;
    pointsPerSlideVisit: number;
  };
  elements: {
    pointsBadge: {
      enabled: boolean;
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
      duration: number;
      textFormat: string;
      backgroundColor: string;
      textColor: string;
    };
    successSound: {
      enabled: boolean;
      soundType: 'success' | 'coin' | 'ding' | 'achievement';
      volume: number;
    };
    confetti: {
      enabled: boolean;
      colors: string[];
      particleCount: number;
      duration: number;
      direction: 'top' | 'bottom' | 'center';
    };
    particles: {
      enabled: boolean;
      particleType: 'star' | 'heart' | 'sparkle';
      colors: string[];
      particleCount: number;
    };
    pointsProgress: {
      enabled: boolean;
      position: 'top' | 'bottom' | 'top-left' | 'top-right';
      style: 'bar' | 'circular';
      milestone: number;
      progressColor?: string;
      backgroundColor?: string;
      textColor?: string;
      cardBackgroundColor?: string;
      circularProgressColor?: string;
      circularBackgroundColor?: string;
    };
    achievement: {
      enabled: boolean;
      title: string;
      description: string;
      icon: string;
      condition: {
        type: 'points';
        value: number;
      };
    };
  };
}

export interface Reel {
  id: string;
  title: string;
  description?: string;
  status: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  faviconUrl?: string;
  showProgressBar?: boolean;
  pixelsConfig?: PixelsConfig;
  socialConfig?: SocialConfig;
  gamificationConfig?: GamificationConfig;
  uiConfig?: any; // Para armazenar pastas e outras configurações de UI
  slides: Slide[];
}

interface BuilderContextType {
  reel: Reel | null;
  selectedSlide: Slide | null;
  selectedElement: SlideElement | null;
  isEditingBackground: boolean;
  selectedTab: 'edit' | 'theme' | 'gamification' | 'flow' | 'settings';
  setReel: (reel: Reel | null) => void;
  setSelectedSlide: (slide: Slide | null) => void;
  setSelectedElement: (element: SlideElement | null) => void;
  setIsEditingBackground: (value: boolean) => void;
  setSelectedTab: (tab: 'edit' | 'theme' | 'flow' | 'settings') => void;
  addElement: (elementType: string, config?: any) => Promise<void>;
  updateElement: (elementId: string, config: any) => Promise<void>;
  removeElement: (elementId: string) => Promise<void>;
  duplicateElement: (elementId: string) => Promise<void>;
  updateSlide: (slideId: string, data: Partial<Slide>) => Promise<void>;
  updateSlideLogicNext: (slideId: string, logicNext: Record<string, any>) => Promise<void>;
  saveFlowConnections: (connections: Record<string, Record<string, any>>) => Promise<void>;
  addSlide: () => Promise<void>;
  duplicateSlide: (slideId: string) => Promise<void>;
  removeSlide: (slideId: string) => Promise<void>;
  reorderSlides: (activeId: string, overId: string) => Promise<void>;
  saveReel: () => Promise<void>;
  publishReel: () => Promise<void>;
  saveDraft: () => Promise<void>;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  isLoading: boolean;
  hasAvailableSpace: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  setLastSavedAt: (value: Date | null) => void;
  setHasAvailableSpace: (value: boolean) => void;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reel, setReel] = useState<Reel | null>(null);
  const [selectedSlideInternal, setSelectedSlideInternal] = useState<Slide | null>(null);
  const [selectedElementInternal, setSelectedElementInternal] = useState<SlideElement | null>(null);
  const [isEditingBackgroundInternal, setIsEditingBackgroundInternal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'edit' | 'theme' | 'gamification' | 'flow' | 'settings'>('edit');

  // Wrappers que também mudam a tab para 'edit' quando um elemento/slide/background é selecionado
  const setSelectedSlide = useCallback((slide: Slide | null) => {
    setSelectedSlideInternal(slide);
    setSelectedTab('edit');
  }, []);

  const setSelectedElement = useCallback((element: SlideElement | null) => {
    setSelectedElementInternal(element);
    setSelectedTab('edit');
  }, []);

  const setIsEditingBackground = useCallback((value: boolean) => {
    setIsEditingBackgroundInternal(value);
    setSelectedTab('edit');
  }, []);

  // Aliases para usar nos callbacks
  const selectedSlide = selectedSlideInternal;
  const selectedElement = selectedElementInternal;
  const isEditingBackground = isEditingBackgroundInternal;

  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasAvailableSpace, setHasAvailableSpace] = useState(true);

  const addElement = useCallback(async (elementType: string, config?: any) => {
    if (!reel || !selectedSlideInternal) return;

    // Verificar se há espaço disponível antes de adicionar
    if (!hasAvailableSpace) {
      toast.error('Não é possível adicionar mais elementos. O limite de altura foi atingido. Remova elementos existentes para continuar.');
      return;
    }

    setIsLoading(true);
    try {
      // IMPORTANTE: Sempre deselecionar elemento anterior antes de criar novo
      // Isso garante que editores não usem estado residual
      setSelectedElement(null);
      setIsEditingBackground(false);

      // SEMPRE usar defaults limpos baseados no tipo de elemento
      // Nunca herdar configuração de elementos anteriores
      // Não usar config passado por parâmetro para evitar herança
      let uiConfig: any = {};
      
      // Definir defaults limpos para cada tipo de elemento
      if (elementType === 'TEXT') {
        const defaultContent = '<div style="text-align: center;"><h2 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0; color: #000000;">Headline</h2><p style="font-size: 14px; margin: 0; color: #000000;">Descrição</p></div>';
        uiConfig = {
          content: defaultContent,
          alignment: 'center',
          textColor: '#000000',
          backgroundColor: 'transparent',
          fontWeight: 'normal',
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          borderRadius: 0,
        };
      } else if (elementType === 'IMAGE') {
        uiConfig = {
          objectFit: 'contain',
          size: 'full',
          borderRadius: 0,
        };
      } else if (elementType === 'VIDEO') {
        uiConfig = {
          videoSource: 'upload',
          orientation: 'vertical',
          autoplay: true,
          loop: true,
          muted: true,
          controls: false,
          objectFit: 'cover',
          borderRadius: 0,
          // Garantir que videoUrl e youtubeUrl não venham de elementos anteriores
          videoUrl: undefined,
          youtubeUrl: undefined,
          thumbnailUrl: undefined,
        };
      } else if (elementType === 'AUDIO') {
        uiConfig = {
          audioUrl: undefined,
          avatar: undefined,
          backgroundColor: '#ffffff',
          buttonColor: '#25D366',
          textColor: '#000000',
          cardSize: 'full',
          borderRadius: 12,
          showTimestamp: true,
        };
      } else if (elementType === 'TIMER') {
        uiConfig = {
          title: 'Oferta especial',
          duration: 300,
          remainingText: 'restantes',
          finalMessage: 'Última chance de aproveitar esta oferta!',
          backgroundColor: '#ffe5e5',
          textColor: '#ff0026',
          borderRadius: 12,
          padding: { top: 16, right: 16, bottom: 16, left: 16 },
        };
      } else if (elementType === 'CAROUSEL') {
        const generateId = () => `carousel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          items: [{
            id: generateId(),
            title: 'Primeiro Item',
            description: 'Descrição do primeiro item',
            icon: 'icon:Star',
            backgroundImage: '',
            overlay: {
              enabled: false,
              color: '#000000',
              opacity: 0.5,
            },
          }],
          baseWidth: 300,
          autoplay: false,
          autoplayDelay: 3000,
          pauseOnHover: false,
          loop: false,
          round: false,
          gap: 16,
          borderRadius: 24,
          backgroundColor: '#0d0716',
          borderColor: '#555',
          textColor: '#fff',
        };
      } else if (elementType === 'BUTTON') {
        uiConfig = {
          title: 'Clique aqui',
          destination: 'next-slide',
          url: '',
          openInNewTab: true,
          delayEnabled: false,
          delaySeconds: 0,
          lockSlide: false,
          columnMode: false,
          pulseAnimation: false,
          colorType: 'solid',
          backgroundColor: '#007bff',
          gradient: {
            direction: 'to right',
            color1: '#007bff',
            color2: '#0056b3',
          },
          textColor: '#ffffff',
          strokeEnabled: false,
          strokeColor: '#000000',
          strokeWidth: 0,
          borderRadius: 8,
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
        };
      } else if (elementType === 'ACCORDION') {
        const generateId = () => `accordion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          items: [{
            id: generateId(),
            title: 'Título do Accordion',
            description: 'Descrição do accordion',
          }],
          borderRadius: 8,
          dividerColor: '#e5e7eb',
          textColor: '#000000',
          backgroundColor: '#ffffff',
          descriptionColor: '#666666',
        };
      } else if (elementType === 'BENEFITS' || elementType === 'COMPARATIVO') {
        const generateId = () => `comparativo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          firstColumnTitle: 'Título',
          columnATitle: 'A',
          columnBTitle: 'B',
          items: [{
            id: generateId(),
            title: 'Item',
            valueA: '',
            valueB: '',
          }],
          borderRadius: 8,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          columnABackgroundColor: '#c15772',
          columnATextColor: '#ffffff',
          columnBBackgroundColor: '#ffffff',
          columnBTextColor: '#000000',
          headerTextColor: '#000000',
          headerBackgroundColor: '#f3f4f6',
        };
      } else if (elementType === 'PRICE') {
        const generateId = () => `benefit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          price: 99,
          currency: 'R$',
          period: '/mês',
          originalPrice: 197,
          discount: undefined,
          title: 'Oferta Especial',
          subtitle: 'Não perca esta oportunidade única',
          description: 'Aproveite esta oferta por tempo limitado e garanta todos os benefícios inclusos.',
          benefits: [
            {
              id: generateId(),
              text: 'Benefício 1',
              icon: '',
            },
            {
              id: generateId(),
              text: 'Benefício 2',
              icon: '',
            },
            {
              id: generateId(),
              text: 'Benefício 3',
              icon: '',
            },
          ],
          showBenefits: true,
          buttonTitle: 'Comprar Agora',
          buttonUrl: '',
          buttonOpenInNewTab: true,
          buttonIcon: '',
          backgroundType: 'solid',
          backgroundColor: '#1a1a1a',
          backgroundGradient: {
            direction: 'to right',
            color1: '#1a1a1a',
            color2: '#2a2a2a',
          },
          backgroundImage: undefined,
          titleColor: '#ffffff',
          subtitleColor: '#cccccc',
          priceColor: '#ffffff',
          originalPriceColor: '#999999',
          currencyColor: undefined,
          periodColor: '#cccccc',
          descriptionColor: '#cccccc',
          benefitsTextColor: '#ffffff',
          buttonColorType: 'solid',
          buttonBackgroundColor: '#25D366',
          buttonGradient: {
            direction: 'to right',
            color1: '#25D366',
            color2: '#20B858',
          },
          buttonTextColor: '#ffffff',
          buttonStrokeEnabled: false,
          buttonStrokeColor: '#000000',
          buttonStrokeWidth: 0,
          buttonBorderRadius: 12,
          buttonPadding: { top: 14, right: 28, bottom: 14, left: 28 },
          cardStrokeEnabled: false,
          cardStrokeColor: '#333333',
          cardStrokeWidth: 1,
          cardBorderRadius: 16,
          cardPadding: { top: 24, right: 24, bottom: 24, left: 24 },
          cardShadow: true,
          cardShadowColor: 'rgba(0, 0, 0, 0.3)',
        };
      } else if (elementType === 'PLANS') {
        const generateId = () => `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          plans: [
            {
              id: generateId(),
              name: 'Plano Premium',
              price: 29.90,
              originalPrice: 159.90,
              currency: 'R$',
              period: '',
              description: '',
              alternativePayment: 'ou R$ 159 avista',
              isPopular: true,
              buttonTitle: 'COMPRAR',
              buttonUrl: '',
              buttonOpenInNewTab: true,
              buttonIcon: '',
            },
            {
              id: generateId(),
              name: 'Plano Premium',
              price: 29.90,
              originalPrice: 159.90,
              currency: 'R$',
              period: '',
              description: '',
              alternativePayment: 'ou R$ 159 avista',
              isPopular: false,
              buttonTitle: 'COMPRAR',
              buttonUrl: '',
              buttonOpenInNewTab: true,
              buttonIcon: '',
            },
            {
              id: generateId(),
              name: 'Plano Premium',
              price: 29.90,
              originalPrice: 159.90,
              currency: 'R$',
              period: '',
              description: '',
              alternativePayment: 'ou R$ 159 avista',
              isPopular: false,
              buttonTitle: 'COMPRAR',
              buttonUrl: '',
              buttonOpenInNewTab: true,
              buttonIcon: '',
            },
          ],
          currency: 'R$',
          planNameColor: '#000000',
          priceColor: '#000000',
          originalPriceColor: '#999999',
          currencyColor: undefined,
          periodColor: '#666666',
          descriptionColor: '#666666',
          alternativePaymentColor: '#666666',
          buttonColorType: 'solid',
          buttonBackgroundColor: '#000000',
          buttonGradient: {
            direction: 'to right',
            color1: '#000000',
            color2: '#1a1a1a',
          },
          buttonTextColor: '#ffffff',
          buttonStrokeEnabled: false,
          buttonStrokeColor: '#000000',
          buttonStrokeWidth: 0,
          buttonBorderRadius: 12,
          buttonPadding: { top: 14, right: 28, bottom: 14, left: 28 },
          cardBackgroundType: 'solid',
          cardBackgroundColor: '#ffffff',
          cardBackgroundGradient: {
            direction: 'to right',
            color1: '#ffffff',
            color2: '#f5f5f5',
          },
          cardBackgroundImage: undefined,
          cardBackgroundOverlay: {
            enabled: false,
            color: '#000000',
            opacity: 0.5,
          },
          cardStrokeEnabled: false,
          cardStrokeColor: '#b3b3b3',
          cardStrokeWidth: 1,
          cardBorderRadius: 12,
          cardPadding: { top: 24, right: 20, bottom: 24, left: 20 },
          cardShadow: false,
          cardShadowColor: 'rgba(0, 0, 0, 0.1)',
          badgeBackgroundColor: '#000000',
          badgeTextColor: '#ffffff',
          badgePosition: 'top',
          gap: 12,
        };
      } else if (elementType === 'QUESTIONNAIRE') {
        const generateId = () => `questionnaire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          items: [{
            id: generateId(),
            iconType: 'emoji',
            emoji: '👍',
            icon: '',
            imageUrl: '',
            title: 'Opção 1',
            description: '',
          }],
          layout: 'list',
          multipleSelection: false,
          lockSlide: false,
          endIcon: 'none',
          endIconCustom: '',
          itemHeight: 80,
          gap: 12,
          borderRadius: 12,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          selectedBackgroundColor: '#007bff',
          selectedTextColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
        };
      } else if (elementType === 'QUESTION_GRID') {
        const generateId = () => `question-grid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          items: [
            {
              id: generateId(),
              imageUrl: undefined,
              title: 'Opção 1',
              description: 'Descrição da opção 1',
            },
            {
              id: generateId(),
              imageUrl: undefined,
              title: 'Opção 2',
              description: 'Descrição da opção 2',
            },
          ],
          layout: 'grid',
          multipleSelection: false,
          lockSlide: false,
          delayEnabled: false,
          delaySeconds: 0,
          gap: 12,
          borderRadius: 12,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          selectedBackgroundColor: '#007bff',
          selectedTextColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
        };
      } else if (elementType === 'PROGRESS') {
        uiConfig = {
          title: 'Estamos criando o seu plano personalizado',
          progress: 100,
          duration: 5,
          destination: 'next-slide',
          url: '',
          openInNewTab: true,
          layout: 'linear', // 'linear' | 'circular' | 'pulse'
          backgroundColor: '#ffffff',
          progressColor: '#007bff',
          textColor: '#000000',
          borderRadius: 12,
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
        };
      } else if (elementType === 'FORM') {
        const generateId = () => `form-field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          fields: [
            {
              id: generateId(),
              title: 'Nome',
              type: 'text',
              required: true,
              placeholder: 'Digite seu nome',
            },
            {
              id: generateId(),
              title: 'Telefone',
              type: 'tel',
              required: true,
              placeholder: '(00) 00000-0000',
            },
            {
              id: generateId(),
              title: 'Email',
              type: 'email',
              required: true,
              placeholder: 'seu@email.com',
            },
          ],
          buttonEnabled: true,
          buttonTitle: 'Enviar',
          buttonDestination: 'next-slide',
          buttonUrl: '',
          buttonOpenInNewTab: false,
          lockSlide: false,
          gap: 16,
          borderRadius: 8,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          borderColor: '#e5e7eb',
          placeholderColor: '#999999',
          focusColor: '#007bff',
          buttonBackgroundColor: '#007bff',
          buttonTextColor: '#ffffff',
          inputHeight: 48,
          inputPadding: { top: 12, right: 16, bottom: 12, left: 16 },
        };
      } else if (elementType === 'FEEDBACK') {
        const generateId = () => `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          layout: 'list',
          reviews: [
            {
              id: generateId(),
              name: 'Cliente Satisfeito',
              stars: 5,
              description: 'Excelente produto! Recomendo.',
              avatar: undefined,
            },
            {
              id: generateId(),
              name: 'Outro Cliente',
              stars: 4,
              description: 'Muito bom, atendeu minhas expectativas.',
              avatar: undefined,
            },
          ],
          gap: 16,
          borderRadius: 12,
          backgroundColor: 'transparent',
          textColor: '#000000',
          starColor: '#FFD700',
          cardBackgroundColor: '#ffffff',
          cardBorderColor: '#e5e7eb',
          showProgress: true,
          showArrows: true,
          controlsColor: '#000000',
          autoPlay: false,
          autoPlayInterval: 5,
        };
      } else if (elementType === 'CIRCULAR') {
        const generateId = () => `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          columns: 2,
          defaultType: 'circular',
          items: [
            {
              id: generateId(),
              type: 'circular',
              percentage: 60,
              time: 5,
              description: 'Voce',
              backgroundColor: '#e5e7eb',
              transitionColor: '',
              color: '#007bff',
            },
          ],
        };
      } else if (elementType === 'CHART') {
        const generateId = () => `chart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          chartType: 'bar',
          items: [
            {
              id: generateId(),
              label: 'Baixo',
              value: 0.5,
              color: '#3b82f6',
            },
            {
              id: generateId(),
              label: 'Aceitável',
              value: 1.0,
              color: '#ef4444',
            },
            {
              id: generateId(),
              label: 'Normal',
              value: 2.0,
              color: '#10b981',
            },
            {
              id: generateId(),
              label: 'Médio',
              value: 3.5,
              color: '#f59e0b',
            },
            {
              id: generateId(),
              label: 'Alto',
              value: 4.0,
              color: '#8b5cf6',
            },
          ],
          height: 300,
          showLegend: true,
          showGrid: true,
          backgroundColor: 'transparent',
          textColor: '#000000',
        };
      } else if (elementType === 'SCORE') {
        const generateId = () => `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        uiConfig = {
          title: 'HOJE',
          showImage: true,
          imageUrl: null,
          titleColor: '#22c55e', // verde
          items: [
            {
              id: generateId(),
              title: 'Nível de Potência Vocal',
              value: 'Fraco',
              percentage: 20,
              progressColor: '#ef4444', // vermelho
              backgroundColor: '#e5e7eb',
              textColor: '#ffffff',
            }
          ],
        };
      } else if (elementType === 'SPACING') {
        uiConfig = {
          height: 20,
        };
      }

      // NÃO fazer merge com config passado - sempre usar apenas defaults limpos
      // Isso previne que configurações de elementos anteriores sejam herdadas

      const response = await api.post(
        `/reels/${reel.id}/slides/${selectedSlide.id}/elements`,
        {
          elementType,
          uiConfig,
        }
      );

      const data = (response as any).data || response;
      const newElement: SlideElement = {
        id: data.id,
        elementType: data.elementType,
        order: data.order,
        uiConfig: normalizeUiConfig(data.uiConfig),
      };

      const updatedSlide = {
        ...selectedSlide,
        elements: [...selectedSlide.elements, newElement],
      };

      const updatedReel = {
        ...reel,
        slides: reel.slides.map((s) => (s.id === selectedSlide.id ? updatedSlide : s)),
      };

      setReel(updatedReel);
      setSelectedSlide(updatedSlide);
      setSelectedElement(newElement);
      setIsEditingBackground(false);
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
    } catch (error: any) {
      toast.error('Erro ao adicionar elemento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel, selectedSlide, hasAvailableSpace]);

  const updateElement = useCallback(async (elementId: string, config: any) => {
    if (!reel || !selectedSlide) return;

    // Debug em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('updateElement called:', { elementId, config });
    }

    // Atualizar estado local imediatamente (otimista)
    // Separar gamificationConfig de config (similar ao backgroundConfig no updateSlide)
    const { gamificationConfig, ...restConfig } = config;
    
    const updatedSlide = {
      ...selectedSlide,
      elements: selectedSlide.elements.map((el) => {
        if (el.id === elementId) {
          // Normalizar uiConfig antes de fazer merge
          const currentUiConfig = normalizeUiConfig(el.uiConfig);
          let mergedConfig = { ...currentUiConfig, ...restConfig };
          
          // Se gamificationConfig estiver presente, salvar no uiConfig
          if (gamificationConfig) {
            mergedConfig = {
              ...mergedConfig,
              gamificationConfig: gamificationConfig,
            };
          }
          
          // Debug em desenvolvimento
          if (import.meta.env.DEV) {
            console.log('Updating element:', {
              elementId: el.id,
              currentUiConfig,
              newConfig: config,
              mergedConfig,
            });
          }
          
          return { 
            ...el, 
            uiConfig: mergedConfig,
            gamificationConfig: gamificationConfig || el.gamificationConfig || currentUiConfig.gamificationConfig,
          };
        }
        return el;
      }),
    };

    const updatedReel = {
      ...reel,
      slides: reel.slides.map((s) => (s.id === selectedSlide.id ? updatedSlide : s)),
    };

    // Debug em desenvolvimento
    if (import.meta.env.DEV) {
      const updatedElement = updatedSlide.elements.find((el) => el.id === elementId);
      console.log('State updated:', {
        elementId,
        updatedElement,
        uiConfig: updatedElement?.uiConfig,
        imageUrl: updatedElement?.uiConfig?.imageUrl,
      });
    }

    setReel(updatedReel);
    setSelectedSlide(updatedSlide);
    setSelectedElement(updatedSlide.elements.find((el) => el.id === elementId) || null);
    setIsEditingBackground(false);

    // Salvar no backend de forma assíncrona (sem bloquear UI)
    // Preparar uiConfig para o backend - incluir gamificationConfig se presente
    const element = selectedSlide.elements.find((el) => el.id === elementId);
    const currentUiConfig = element ? normalizeUiConfig(element.uiConfig) : {};
    const backendUiConfig: any = {
      ...currentUiConfig,
      ...restConfig,
    };
    
    // Se gamificationConfig estiver presente, salvar no uiConfig
    if (gamificationConfig) {
      backendUiConfig.gamificationConfig = gamificationConfig;
    }
    
    try {
      await api.patch(
        `/reels/${reel.id}/slides/${selectedSlide.id}/elements/${elementId}`,
        {
          uiConfig: backendUiConfig,
        }
      );
      
      // Manter status ACTIVE - não mudar para DRAFT para que continue visível publicamente
      setReel(updatedReel);
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
    } catch (error: any) {
      // Se for erro de autenticação, o api.ts já redireciona para login
      if (error.message === 'Unauthorized' || error.statusCode === 401) {
        // Não mostrar toast adicional, o redirecionamento já aconteceu
        return;
      }
      toast.error('Erro ao salvar elemento: ' + (error.message || 'Erro desconhecido'));
      // Reverter em caso de erro (opcional)
    }
  }, [reel, selectedSlide]);

  const removeElement = useCallback(async (elementId: string) => {
    if (!reel || !selectedSlide) return;

    setIsLoading(true);
    try {
      await api.delete(
        `/reels/${reel.id}/slides/${selectedSlide.id}/elements/${elementId}`
      );

      const updatedSlide = {
        ...selectedSlide,
        elements: selectedSlide.elements.filter((el) => el.id !== elementId),
      };

      const updatedReel = {
        ...reel,
        slides: reel.slides.map((s) => (s.id === selectedSlide.id ? updatedSlide : s)),
      };

      // Se o reel estava publicado, mudar para DRAFT após alteração
      const finalReel = updatedReel.status === 'ACTIVE' 
        ? { ...updatedReel, status: 'DRAFT' }
        : updatedReel;
      
      setReel(finalReel);
      setSelectedSlide(updatedSlide);
      if (selectedElement?.id === elementId) {
        setSelectedElement(null);
      }
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
    } catch (error: any) {
      toast.error('Erro ao remover elemento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel, selectedSlide, selectedElement]);

  const addSlide = useCallback(async () => {
    if (!reel) return;

    setIsLoading(true);
    try {
      // Get background config from first slide
      const firstSlide = reel.slides && reel.slides.length > 0 ? reel.slides[0] : null;
      const backgroundConfig = firstSlide?.backgroundConfig || firstSlide?.uiConfig?.backgroundConfig;

      // Se for vídeo, usar fundo branco padrão
      let uiConfig;
      if (backgroundConfig?.type === 'video') {
        uiConfig = {
          backgroundConfig: {
            type: 'color',
            color: '#ffffff',
          },
        };
      } else if (backgroundConfig) {
        // Herdar fundo se não for vídeo
        uiConfig = { backgroundConfig };
      } else {
        // Sem fundo configurado, usar branco padrão
        uiConfig = {
          backgroundConfig: {
            type: 'color',
            color: '#ffffff',
          },
        };
      }

      // Create slide in backend
      const response = await api.post(`/reels/${reel.id}/slides`, {
        question: '',
        options: [],
        uiConfig,
      });

      const data = (response as any).data || response;
      
      // Extract backgroundConfig and gamificationConfig from uiConfig if present
      const normalizedUiConfig = normalizeUiConfig(data.uiConfig);
      const newSlide: Slide = {
        id: data.id,
        order: data.order,
        question: data.question || '',
        type: data.type,
        backgroundColor: data.backgroundColor,
        accentColor: data.accentColor,
        backgroundConfig: data.backgroundConfig || normalizedUiConfig.backgroundConfig,
        gamificationConfig: data.gamificationConfig || normalizedUiConfig.gamificationConfig,
        uiConfig: normalizedUiConfig,
        elements: (data.elements || []).map((el: any) => {
          const normalizedElementUiConfig = normalizeUiConfig(el.uiConfig);
          return {
            id: el.id,
            elementType: el.elementType,
            order: el.order,
            uiConfig: normalizedElementUiConfig,
            gamificationConfig: el.gamificationConfig || normalizedElementUiConfig.gamificationConfig,
          };
        }),
        options: (data.options || []).map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          emoji: opt.emoji,
          order: opt.order,
        })),
      };

      const updatedReel = {
        ...reel,
        slides: [...reel.slides, newSlide].sort((a, b) => a.order - b.order),
      };

      // Manter status ACTIVE - não mudar para DRAFT para que continue visível publicamente
      setReel(updatedReel);
      setSelectedSlide(newSlide);
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
      
      toast.success('Card adicionado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao adicionar slide: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel]);

  const duplicateElement = useCallback(async (elementId: string) => {
    if (!reel || !selectedSlide) return;

    const elementToDuplicate = selectedSlide.elements.find((el) => el.id === elementId);
    if (!elementToDuplicate) return;

    setIsLoading(true);
    try {
      // Encontrar a ordem máxima
      const maxOrder = Math.max(...selectedSlide.elements.map((el) => el.order), 0);

      const response = await api.post(
        `/reels/${reel.id}/slides/${selectedSlide.id}/elements`,
        {
          elementType: elementToDuplicate.elementType,
          uiConfig: elementToDuplicate.uiConfig || {},
          order: maxOrder + 1,
        }
      );

      const data = (response as any).data || response;
      const newElement: SlideElement = {
        id: data.id,
        elementType: data.elementType,
        order: data.order,
        uiConfig: normalizeUiConfig(data.uiConfig),
      };

      const updatedSlide = {
        ...selectedSlide,
        elements: [...selectedSlide.elements, newElement].sort((a, b) => a.order - b.order),
      };

      const updatedReel = {
        ...reel,
        slides: reel.slides.map((s) => (s.id === selectedSlide.id ? updatedSlide : s)),
      };

      // Manter status ACTIVE - não mudar para DRAFT para que continue visível publicamente
      setReel(updatedReel);
      setSelectedSlide(updatedSlide);
      setSelectedElement(newElement);
      setIsEditingBackground(false);
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
      
      toast.success('Elemento duplicado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao duplicar elemento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel, selectedSlide]);

  const updateSlide = useCallback(async (slideId: string, data: Partial<Slide>) => {
    if (!reel) return;

    // Buscar o slide do reel (pode não estar selecionado, especialmente na aba Flow)
    const slide = reel.slides.find((s) => s.id === slideId);
    if (!slide) return;

    // Preparar dados para o backend - remover backgroundConfig e gamificationConfig e salvar apenas no uiConfig
    const { backgroundConfig, gamificationConfig, ...restData } = data;
    
    const backendData: any = {
      ...restData,
    };

    // Mesclar uiConfig corretamente
    const currentUiConfig = slide.uiConfig || {};
    if (data.uiConfig) {
      backendData.uiConfig = {
        ...currentUiConfig,
        ...data.uiConfig,
      };
    }

    // Se backgroundConfig estiver presente, salvar no uiConfig
    if (backgroundConfig) {
      backendData.uiConfig = {
        ...(backendData.uiConfig || currentUiConfig),
        backgroundConfig: backgroundConfig,
      };
    }

    // Se gamificationConfig estiver presente, salvar no uiConfig
    if (gamificationConfig) {
      backendData.uiConfig = {
        ...(backendData.uiConfig || currentUiConfig),
        gamificationConfig: gamificationConfig,
      };
    }

    // Atualizar estado local imediatamente usando função funcional para evitar condições de corrida
    // Isso garante que sempre pegamos o estado mais recente do reel
    let updatedSlideForSelection: Slide | null = null;
    
    setReel((prevReel) => {
      if (!prevReel || prevReel.id !== reel.id) return prevReel;
      
      const prevSlide = prevReel.slides.find((s) => s.id === slideId);
      if (!prevSlide) return prevReel;
      
      // Mesclar uiConfig com o estado mais recente
      const prevUiConfig = prevSlide.uiConfig || {};
      const mergedUiConfig = backendData.uiConfig || prevUiConfig;
      
      // Extrair gamificationConfig do uiConfig se presente
      const extractedGamificationConfig = data.gamificationConfig || mergedUiConfig.gamificationConfig || prevSlide.gamificationConfig;
      
      const updatedSlide = {
        ...prevSlide,
        ...data,
        uiConfig: mergedUiConfig,
        gamificationConfig: extractedGamificationConfig,
      };
      
      // Armazenar para uso após setReel
      updatedSlideForSelection = updatedSlide;
      
      return {
        ...prevReel,
        slides: prevReel.slides.map((s) => (s.id === slideId ? updatedSlide : s)),
      };
    });
    
    // Atualizar selectedSlide apenas se for o slide selecionado E não estivermos na aba Flow
    // Na aba Flow, não queremos mudar a aba para 'edit' ao atualizar posições
    if (updatedSlideForSelection && selectedSlide && selectedSlide.id === slideId && selectedTab !== 'flow') {
      setSelectedSlide(updatedSlideForSelection);
    } else if (updatedSlideForSelection && selectedSlide && selectedSlide.id === slideId && selectedTab === 'flow') {
      // Na aba Flow, atualizar apenas o estado interno do slide sem mudar a aba
      setSelectedSlideInternal(updatedSlideForSelection);
    }

    // Salvar no backend de forma assíncrona
    try {
      await api.patch(`/reels/${reel.id}/slides/${slideId}`, backendData);
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
    } catch (error: any) {
      toast.error('Erro ao salvar slide: ' + (error.message || 'Erro desconhecido'));
    }
  }, [reel, selectedSlide, selectedTab]);

  const updateSlideLogicNext = useCallback(async (slideId: string, logicNext: Record<string, any>) => {
    if (!reel) return;

    const slide = reel.slides.find((s) => s.id === slideId);
    if (!slide) return;

    setIsLoading(true);
    try {
      // Atualizar apenas logicNext no backend
      await api.patch(`/reels/${reel.id}/slides/${slideId}`, { logicNext });

      // Atualizar estado local
      const updatedSlide = {
        ...slide,
        logicNext,
      };

      const updatedReel = {
        ...reel,
        slides: reel.slides.map((s) => (s.id === slideId ? updatedSlide : s)),
      };

      setReel(updatedReel);
      if (selectedSlideInternal?.id === slideId) {
        setSelectedSlideInternal(updatedSlide);
      }

      setHasUnsavedChanges(true);
    } catch (error: any) {
      toast.error('Erro ao salvar conexões: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [reel, selectedSlideInternal]);

  const saveFlowConnections = useCallback(async (connections: Record<string, Record<string, any>>) => {
    if (!reel) return;

    setIsLoading(true);
    try {
      // Atualizar logicNext de múltiplos slides
      const promises = Object.entries(connections).map(([slideId, logicNext]) =>
        api.patch(`/reels/${reel.id}/slides/${slideId}`, { logicNext })
      );

      await Promise.all(promises);

      // Atualizar estado local
      const updatedReel = {
        ...reel,
        slides: reel.slides.map((slide) => {
          if (connections[slide.id]) {
            return {
              ...slide,
              logicNext: connections[slide.id],
            };
          }
          return slide;
        }),
      };

      setReel(updatedReel);
      setHasUnsavedChanges(true);
      toast.success('Conexões salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar conexões: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [reel]);

  const duplicateSlide = useCallback(async (slideId: string) => {
    if (!reel) return;

    const slideToDuplicate = reel.slides.find((s) => s.id === slideId);
    if (!slideToDuplicate) return;

    setIsLoading(true);
    try {
      // Prepare data for duplication
      const backgroundConfig = slideToDuplicate.backgroundConfig || slideToDuplicate.uiConfig?.backgroundConfig;
      const uiConfig = slideToDuplicate.uiConfig || {};
      if (backgroundConfig) {
        uiConfig.backgroundConfig = backgroundConfig;
      }

      // Create new slide with all data from original
      const response = await api.post(`/reels/${reel.id}/slides`, {
        question: slideToDuplicate.question || '',
        backgroundColor: slideToDuplicate.backgroundColor,
        accentColor: slideToDuplicate.accentColor,
        type: slideToDuplicate.type,
        uiConfig,
        logicNext: slideToDuplicate.uiConfig?.logicNext,
        options: (slideToDuplicate.options || []).map((opt) => ({
          text: opt.text,
          emoji: opt.emoji,
        })),
        elements: (slideToDuplicate.elements || []).map((el) => ({
          elementType: el.elementType,
          order: el.order,
          uiConfig: el.uiConfig || {},
        })),
      });

      const data = (response as any).data || response;

      // Extract backgroundConfig and gamificationConfig from uiConfig if present
      const normalizedUiConfig = normalizeUiConfig(data.uiConfig);
      const newSlide: Slide = {
        id: data.id,
        order: data.order,
        question: data.question || '',
        type: data.type,
        backgroundColor: data.backgroundColor,
        accentColor: data.accentColor,
        backgroundConfig: data.backgroundConfig || normalizedUiConfig.backgroundConfig,
        gamificationConfig: data.gamificationConfig || normalizedUiConfig.gamificationConfig,
        uiConfig: normalizedUiConfig,
        elements: (data.elements || []).map((el: any) => {
          const normalizedElementUiConfig = normalizeUiConfig(el.uiConfig);
          return {
            id: el.id,
            elementType: el.elementType,
            order: el.order,
            uiConfig: normalizedElementUiConfig,
            gamificationConfig: el.gamificationConfig || normalizedElementUiConfig.gamificationConfig,
          };
        }),
        options: (data.options || []).map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          emoji: opt.emoji,
          order: opt.order,
        })),
      };

      const updatedReel = {
        ...reel,
        slides: [...reel.slides, newSlide].sort((a, b) => a.order - b.order),
      };

      // Manter status ACTIVE - não mudar para DRAFT para que continue visível publicamente
      setReel(updatedReel);
      setSelectedSlide(newSlide);
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
      
      toast.success('Card duplicado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao duplicar slide: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel]);

  const removeSlide = useCallback(async (slideId: string) => {
    if (!reel) return;

    setIsLoading(true);
    try {
      // Delete slide from backend
      await api.delete(`/reels/${reel.id}/slides/${slideId}`);

      // Remove slide from local state
      const updatedSlides = reel.slides.filter((s) => s.id !== slideId);
      const updatedReel = {
        ...reel,
        slides: updatedSlides,
      };

      // Manter status ACTIVE - não mudar para DRAFT para que continue visível publicamente
      setReel(updatedReel);

      // If deleted slide was selected, select another slide
      if (selectedSlide?.id === slideId) {
        if (updatedSlides.length > 0) {
          setSelectedSlide(updatedSlides[0]);
        } else {
          setSelectedSlide(null);
        }
      }

      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
      
      toast.success('Card excluído com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao excluir slide: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel, selectedSlide]);

  // Função auxiliar para calcular ordem hierárquica baseada na estrutura visual atual
  // Esta função recalcula a ordem baseada na posição visual na sidebar (pastas + ordem dentro das pastas)
  const calculateHierarchicalOrder = useCallback((slides: Slide[]): Slide[] => {
    if (!reel) return slides;
    
    const folders = (reel.uiConfig?.folders || []).sort((a: any, b: any) => a.order - b.order);
    const folderMap = new Map<string, Slide[]>();
    const unassigned: Slide[] = [];
    
    // Criar um mapa de posição no array original para manter a ordem relativa após o movimento
    const positionMap = new Map<string, number>();
    slides.forEach((slide, index) => {
      positionMap.set(slide.id, index);
    });

    // Organizar slides por pasta baseado na estrutura atual
    slides.forEach((slide) => {
      const folderId = slide.uiConfig?.folderId;
      if (folderId) {
        if (!folderMap.has(folderId)) {
          folderMap.set(folderId, []);
        }
        folderMap.get(folderId)!.push(slide);
      } else {
        unassigned.push(slide);
      }
    });

    // Ordenar slides dentro de cada pasta pela posição no array (não pela ordem antiga!)
    folderMap.forEach((folderSlides) => {
      folderSlides.sort((a, b) => {
        const posA = positionMap.get(a.id) ?? 0;
        const posB = positionMap.get(b.id) ?? 0;
        return posA - posB;
      });
    });
    unassigned.sort((a, b) => {
      const posA = positionMap.get(a.id) ?? 0;
      const posB = positionMap.get(b.id) ?? 0;
      return posA - posB;
    });

    // Criar ordem hierárquica: pastas em ordem, depois slides sem pasta
    // O primeiro slide da primeira pasta terá order = 1
    const hierarchicalOrder: Slide[] = [];
    folders.forEach((folder: any) => {
      const folderSlides = folderMap.get(folder.id) || [];
      hierarchicalOrder.push(...folderSlides);
    });
    hierarchicalOrder.push(...unassigned);

    // Atualizar ordem de cada slide baseado na ordem hierárquica
    return hierarchicalOrder.map((slide, index) => ({
      ...slide,
      order: index + 1,
    }));
  }, [reel]);

  const reorderSlides = useCallback(async (activeId: string, overId: string) => {
    if (!reel) return;
    if (activeId === overId) return;

    const activeIndex = reel.slides.findIndex((s) => s.id === activeId);
    const overIndex = reel.slides.findIndex((s) => s.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    // Criar nova ordem dos slides (movimento linear primeiro)
    const newSlides = [...reel.slides];
    const [movedSlide] = newSlides.splice(activeIndex, 1);
    newSlides.splice(overIndex, 0, movedSlide);

    // Recalcular ordem hierárquica baseada na estrutura visual
    const updatedSlides = calculateHierarchicalOrder(newSlides);

    // Atualizar estado local imediatamente
    const updatedReel = {
      ...reel,
      slides: updatedSlides,
    };
    setReel(updatedReel);

    // Atualizar selectedSlide se necessário
    if (selectedSlide?.id === activeId) {
      const updatedSelectedSlide = updatedSlides.find((s) => s.id === activeId);
      if (updatedSelectedSlide) {
        setSelectedSlide(updatedSelectedSlide);
      }
    }

    // Salvar no backend usando endpoint de reordenar
    setIsLoading(true);
    try {
      // Enviar todos os slides com suas novas ordens em uma única requisição
      await api.patch(`/reels/${reel.id}/slides/reorder`, {
        slides: updatedSlides.map((slide) => ({
          id: slide.id,
          order: slide.order,
        })),
      });

      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (reel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
      
      toast.success('Slides reordenados com sucesso!');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      toast.error('Erro ao reordenar slides: ' + errorMessage);
      // Reverter mudanças em caso de erro
      setReel(reel);
      if (selectedSlide?.id === activeId) {
        const originalSelectedSlide = reel.slides.find((s) => s.id === activeId);
        if (originalSelectedSlide) {
          setSelectedSlide(originalSelectedSlide);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [reel, selectedSlide, calculateHierarchicalOrder]);

  const saveReel = useCallback(async () => {
    if (!reel || isLoading) return;

    setIsLoading(true);
    try {
      // Salvar informações básicas do reel sempre como DRAFT
      const response = await api.patch(`/reels/${reel.id}`, {
        title: reel.title,
        description: reel.description,
        slug: reel.slug,
        pixelsConfig: reel.pixelsConfig,
        socialConfig: reel.socialConfig,
        gamificationConfig: reel.gamificationConfig,
        seoTitle: reel.seoTitle,
        seoDescription: reel.seoDescription,
        faviconUrl: reel.faviconUrl,
        showProgressBar: reel.showProgressBar,
        uiConfig: reel.uiConfig, // Salvar configurações de UI (pastas, etc)
        status: 'DRAFT', // Sempre salvar como rascunho
      });

      const reelData = (response as any).data || response;
      
      // Atualizar o reel com os dados retornados (incluindo slug se houver)
      setReel((prevReel) => {
        if (!prevReel) return prevReel;
        return { ...prevReel, ...reelData, status: 'DRAFT' };
      });
      
      // Atualizar estados de rascunho
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      
      toast.success('Quiz salvo com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar quiz: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel, isLoading]);

  const saveDraft = useCallback(async () => {
    if (!reel || isLoading) return;

    setIsLoading(true);
    try {
      // Salvar tudo como rascunho (status DRAFT)
      const response = await api.patch(`/reels/${reel.id}`, {
        title: reel.title,
        description: reel.description,
        slug: reel.slug,
        pixelsConfig: reel.pixelsConfig,
        socialConfig: reel.socialConfig,
        gamificationConfig: reel.gamificationConfig,
        seoTitle: reel.seoTitle,
        seoDescription: reel.seoDescription,
        faviconUrl: reel.faviconUrl,
        showProgressBar: reel.showProgressBar,
        uiConfig: reel.uiConfig, // Salvar configurações de UI (pastas, etc)
        status: 'DRAFT',
      });

      const reelData = (response as any).data || response;
      
      // Atualizar o reel com os dados retornados
      setReel((prevReel) => {
        if (!prevReel) return prevReel;
        return { ...prevReel, ...reelData, status: 'DRAFT' };
      });
      
      // Atualizar estados de rascunho
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      
      toast.success('Rascunho salvo!');
    } catch (error: any) {
      toast.error('Erro ao salvar rascunho: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [reel, isLoading]);

  const publishReel = useCallback(async () => {
    if (!reel || isLoading) return;

    // Verificar se o usuário tem plano free e bloquear publicação
    if (user?.planId) {
      try {
        // Buscar informações do plano do usuário
        const plans = await api.getPlans<any[]>();
        const plansArray = Array.isArray(plans) ? plans : [];
        const userPlan = plansArray.find((plan: any) => plan.id === user.planId);
        
        // Verificar se é plano free (título "free" ou preço 0)
        if (userPlan) {
          const planTitle = (userPlan.title || '').toLowerCase().trim();
          const planPrice = typeof userPlan.price === 'number' 
            ? userPlan.price 
            : parseFloat(String(userPlan.price || 0));
          
          if (planTitle === 'free' || planPrice === 0) {
            toast.error('O plano gratuito não permite publicar swippers. Faça upgrade para publicar!', {
              duration: 5000,
            });
            window.location.href = '/plans';
            return;
          }
        }
      } catch (error) {
        // Se não conseguir buscar planos, verificar se planId é null (usuário sem plano = free)
        // Se planId existe mas não conseguimos buscar, continuar (não bloquear)
      }
    } else {
      // Se não tem planId, assumir que é plano free
      toast.error('O plano gratuito não permite publicar swippers. Faça upgrade para publicar!', {
        duration: 5000,
      });
      window.location.href = '/plans';
      return;
    }

    // Verificar se email está verificado antes de publicar
    try {
      const settings = await api.getSettings();
      const settingsData = (settings as any).data || settings;
      
      if (settingsData?.requireEmailVerification && user && !user.emailVerified) {
        toast.error('Você precisa verificar seu email antes de publicar um swipper. Verifique sua caixa de entrada e clique no link de verificação.', {
          duration: 5000,
          action: {
            label: 'Reenviar email',
            onClick: async () => {
              try {
                await api.resendVerificationEmail();
                toast.success('Email de verificação reenviado!');
              } catch (err: any) {
                toast.error('Erro ao reenviar email');
              }
            },
          },
        });
        return;
      }
    } catch (error) {
      // Se não conseguir buscar settings, continuar (não bloquear publicação)
    }

    setIsLoading(true);
    try {
      // Publicar reel mudando status para ACTIVE
      const response = await api.patch(`/reels/${reel.id}`, {
        title: reel.title,
        description: reel.description,
        slug: reel.slug,
        pixelsConfig: reel.pixelsConfig,
        socialConfig: reel.socialConfig,
        gamificationConfig: reel.gamificationConfig,
        seoTitle: reel.seoTitle,
        seoDescription: reel.seoDescription,
        faviconUrl: reel.faviconUrl,
        showProgressBar: reel.showProgressBar,
        uiConfig: reel.uiConfig, // Salvar configurações de UI (pastas, etc)
        status: 'ACTIVE',
      });

      const reelData = (response as any).data || response;
      
      // Atualizar o reel com os dados retornados
      setReel((prevReel) => {
        if (!prevReel) return prevReel;
        return { ...prevReel, ...reelData, status: 'ACTIVE' };
      });
      
      // Atualizar estados de rascunho
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      
      toast.success('Quiz publicado com sucesso!');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      
      // Verificar se o erro é relacionado a email não verificado
      if (errorMessage.includes('verificar seu email') || errorMessage.includes('email não verificado')) {
        toast.error(errorMessage, {
          duration: 5000,
          action: {
            label: 'Reenviar email',
            onClick: async () => {
              try {
                await api.resendVerificationEmail();
                toast.success('Email de verificação reenviado!');
              } catch (err: any) {
                toast.error('Erro ao reenviar email');
              }
            },
          },
        });
      } else {
        toast.error('Erro ao publicar quiz: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [reel, isLoading, user]);

  return (
    <BuilderContext.Provider
      value={{
        reel,
        selectedSlide,
        selectedElement,
        isEditingBackground,
        selectedTab,
        setReel,
        setSelectedSlide,
        setSelectedElement,
        setIsEditingBackground,
        setSelectedTab,
        addElement,
        updateElement,
        removeElement,
        duplicateElement,
        updateSlide,
      updateSlideLogicNext,
      saveFlowConnections,
      addSlide,
      duplicateSlide,
      removeSlide,
      reorderSlides,
      saveReel,
      publishReel,
      saveDraft,
      hasUnsavedChanges,
      lastSavedAt,
      isLoading,
      hasAvailableSpace,
      setHasUnsavedChanges,
      setLastSavedAt,
      setHasAvailableSpace,
    }}
  >
    {children}
  </BuilderContext.Provider>
);
}

// Hook customizado - deve ser exportado como função nomeada para Fast Refresh
export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
};

