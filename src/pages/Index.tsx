import { Link, useSearchParams } from 'react-router-dom';
import {
  Play,
  ArrowRight,
  Zap,
  BarChart3,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  Layers,
  Code,
  Webhook,
  Facebook,
  Chrome,
  Timer,
  Gauge,
  LayoutGrid,
  ChartBar,
  FileText,
  DollarSign,
  CheckCircle2,
  X,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useTracking } from '@/contexts/TrackingContext';
import { SwipperPreview } from '@/components/landing/SwipperPreview';
import { SwipeHint } from '@/components/reels/SwipeHint';
import { SlideIndicators } from '@/components/landing/SlideIndicators';
import { OrbitingCircles } from '@/components/ui/orbiting-circles';
import { useSwipe } from '@/components/reels/hooks/useSwipe';
import { api } from '@/lib/api';
import { Plan } from '@/types/plan';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useEffect, useState } from 'react';

// Helper para formatar preço
function formatPrice(price: number): string {
  if (isNaN(price) || price === null || price === undefined) {
    return 'R$ 0';
  }
  if (Number.isInteger(price)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

function normalizePrice(price: any): number {
  if (price === null || price === undefined) return 0;
  if (typeof price === 'number') return isNaN(price) ? 0 : price;
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (price && typeof price === 'object') {
    if (typeof price.toNumber === 'function') {
      return price.toNumber();
    }
    const parsed = parseFloat(String(price));
    return isNaN(parsed) ? 0 : parsed;
  }
  return Number(price) || 0;
}

export default function Index() {
  const { trackEvent, isInitialized } = useTracking();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(1247);
  const [comments, setComments] = useState(89);

  // Rastrear afiliado via query param ou cookie
  useEffect(() => {
    // Verificar query param
    const refParam = searchParams.get('ref');
    if (refParam) {
      // Salvar no cookie (30 dias)
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `affiliateToken=${refParam}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } else {
      // Verificar cookie existente (manter se já existe)
      const cookies = document.cookie.split(';');
      const affiliateCookie = cookies.find((c) => c.trim().startsWith('affiliateToken='));
      if (affiliateCookie) {
        // Cookie já existe, não precisa fazer nada
        // O cookie será usado quando o usuário se cadastrar
      }
    }
  }, [searchParams]);

  // Buscar planos
  const { data: plansData } = useQuery<Plan[]>({
    queryKey: ['plans-landing'],
    queryFn: async () => {
      const response = await api.getPlans<Plan[]>();
      const plansArray = Array.isArray(response) ? response : [];
      return plansArray.map((plan) => ({
        ...plan,
        price: normalizePrice(plan.price),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (plansData) {
      setPlans(plansData);
    }
  }, [plansData]);

  // Calcular total de slides dinamicamente (Slide de planos só aparece se houver planos)
  const TOTAL_SLIDES = plans.length > 0 ? 7 : 6;

  useEffect(() => {
    if (isInitialized) {
      trackEvent('ViewContent', {
        content_type: 'landing_page',
      });
    }
  }, [isInitialized, trackEvent]);

  // Scroll handler para detectar slide atual
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollHandlerRef: number | null = null;
    const lastScrollTopRef = { current: 0 };

    const handleScroll = () => {
      if (scrollHandlerRef !== null) {
        cancelAnimationFrame(scrollHandlerRef);
      }

      scrollHandlerRef = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const slideHeight = container.clientHeight;
        
        if (Math.abs(scrollTop - lastScrollTopRef.current) < slideHeight * 0.1) {
          return;
        }
        
        lastScrollTopRef.current = scrollTop;
        const newSlide = Math.round(scrollTop / slideHeight);
        
        if (newSlide !== currentSlide && newSlide >= 0 && newSlide < TOTAL_SLIDES) {
          setCurrentSlide(newSlide);
          if (newSlide > 0) {
            setShowSwipeHint(false);
          }
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollHandlerRef !== null) {
        cancelAnimationFrame(scrollHandlerRef);
      }
    };
  }, [currentSlide]);

  // Função para navegar para um slide específico
  const scrollToSlide = (slideIndex: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: slideIndex * container.clientHeight,
        behavior: 'smooth',
      });
    }
  };

  // Swipe gestures
  useSwipe(containerRef, {
    onSwipeUp: () => {
      if (currentSlide < TOTAL_SLIDES - 1) {
        scrollToSlide(currentSlide + 1);
      }
    },
    onSwipeDown: () => {
      if (currentSlide > 0) {
        scrollToSlide(currentSlide - 1);
      }
    },
  });

  const handleLeadClick = () => {
    trackEvent('Lead');
  };

  const handleSubscribeClick = (plan: Plan) => {
    const planPrice = normalizePrice(plan.price);
    trackEvent('AddToCart', {
      content_ids: [plan.id],
      content_type: 'subscription',
      value: planPrice,
      currency: 'BRL',
    });
    trackEvent('InitiateCheckout', {
      content_ids: [plan.id],
      content_type: 'subscription',
      value: planPrice,
      currency: 'BRL',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Container - Reels Style Scroll */}
      <div 
        ref={containerRef}
        className="fixed inset-0 top-16 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ 
          scrollSnapType: 'y mandatory',
          height: 'calc(100vh - 4rem)',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Slide 1: Hero Section */}
        <div className="snap-start snap-always flex items-center justify-center relative z-10" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Background Pattern - Dots Style */}
          <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none">
            <div 
              className="absolute inset-0 opacity-30 dark:opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0',
              }}
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Headline & CTA */}
              <div className="space-y-8 -mt-56 md:mt-0">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-slate-100 dark:bg-slate-800 animate-fade-in">
                  <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
                    #Dopaminergico
                  </span>
                </div>

                {/* Headline */}
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-slide-up">
                  <span className="gradient-text">Reels Sales</span>
                  <br />
                  que viciam e{' '}
                  <span className="relative inline-block px-2 py-0.5">
                    <span className="relative z-10">vendem</span>
                    {/* Background highlight box */}
                    <span className="absolute inset-0 bg-primary/20 dark:bg-primary/25 rounded border border-primary/40 dark:border-primary/50"></span>
                    {/* Top-left circle */}
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary/60 dark:bg-primary/70 rounded-full border border-primary/80 dark:border-primary/90"></span>
                    {/* Bottom-right circle */}
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary/60 dark:bg-primary/70 rounded-full border border-primary/80 dark:border-primary/90"></span>
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-muted-foreground max-w-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
                  Construa funis em formato de reels com scroll vertical que aumentam engajamento, retenção e conversão.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-start gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <Link to={user ? '/dashboard' : '/signup'} onClick={handleLeadClick}>
                    <Button size="lg" className="h-14 px-8 gradient-primary text-primary-foreground font-semibold text-lg glow-primary hover:opacity-90 transition-opacity group">
                      Criar conta grátis
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: Swipper Preview */}
              <div className="relative animate-slide-up hidden lg:block" style={{ animationDelay: '300ms' }}>
                <SwipperPreview />
              </div>
            </div>
          </div>

          {/* Username - Mobile only, Bottom Left */}
          <div className="lg:hidden absolute left-4 bottom-8 z-40">
            <span className="text-[10px] font-medium text-gray-900 dark:text-white">
              @swipper.me
            </span>
          </div>

          {/* Social Actions - Right Side */}
          <div className="absolute right-4 lg:right-8 bottom-[15%] lg:bottom-1/4 flex flex-col gap-2.5 lg:gap-3 z-40">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-[36px] h-[36px] lg:w-[40px] lg:h-[40px] rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                  <img 
                    src="/favicon.png" 
                    alt="Swipper" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-0.5 lg:-bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 lg:w-4.5 lg:h-4.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm">
                  <UserPlus className="w-2 h-2 lg:w-2.5 lg:h-2.5 text-white" />
                </button>
              </div>
            </div>

            {/* Like Button */}
            <button
              onClick={() => {
                setIsLiked(!isLiked);
                setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
              }}
              className="flex flex-col items-center text-gray-900 dark:text-white group transition-all duration-200"
            >
              <div
                className={`w-[36px] h-[36px] lg:w-[40px] lg:h-[40px] rounded-full bg-black/15 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/20 dark:hover:bg-black/30 shadow-sm transition-all duration-200 ${
                  isLiked ? 'scale-110' : ''
                }`}
              >
                <Heart
                  className={`w-[18px] h-[18px] lg:w-[20px] lg:h-[20px] transition-colors ${
                    isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900 dark:text-white'
                  }`}
                  fill={isLiked ? 'currentColor' : 'none'}
                />
              </div>
              <span className="text-[9px] lg:text-[10px] mt-0.5 font-medium text-gray-900 dark:text-white drop-shadow-md">
                {likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes}
              </span>
            </button>

            {/* Comment Button */}
            <button
              className="flex flex-col items-center text-gray-900 dark:text-white group transition-all duration-200"
            >
              <div className="w-[36px] h-[36px] lg:w-[40px] lg:h-[40px] rounded-full bg-black/15 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/20 dark:hover:bg-black/30 shadow-sm transition-all duration-200 group-hover:scale-105">
                <MessageCircle className="w-[18px] h-[18px] lg:w-[20px] lg:h-[20px] text-gray-900 dark:text-white drop-shadow-md" />
              </div>
              <span className="text-[9px] lg:text-[10px] mt-0.5 font-medium text-gray-900 dark:text-white drop-shadow-md">
                {comments >= 1000 ? `${(comments / 1000).toFixed(1)}K` : comments}
              </span>
            </button>

            {/* Share Button */}
            <button className="flex flex-col items-center text-gray-900 dark:text-white group transition-all duration-200">
              <div className="w-[36px] h-[36px] lg:w-[40px] lg:h-[40px] rounded-full bg-black/15 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/20 dark:hover:bg-black/30 shadow-sm transition-all duration-200 group-hover:scale-105">
                <Share2 className="w-[18px] h-[18px] lg:w-[20px] lg:h-[20px] text-gray-900 dark:text-white drop-shadow-md" />
              </div>
            </button>
          </div>

          {/* Swipe Hint - Only on first slide */}
          {showSwipeHint && currentSlide === 0 && (
            <SwipeHint 
              onDismiss={() => setShowSwipeHint(false)}
              autoHideAfter={4000}
            />
          )}
        </div>

        {/* Slide 2: "O funil que parece rede social" */}
        <div className="snap-start snap-always flex items-center justify-center relative z-10" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Background Image - Mobile */}
          <div 
            className="absolute inset-0 lg:hidden pointer-events-none"
            style={{
              backgroundImage: 'url(https://img.swipper.me/landing/sm2.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          
          {/* Background Image - Desktop */}
          <div 
            className="hidden lg:block absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'url(https://img.swipper.me/landing/sd.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10 pt-80 md:pt-56 lg:pt-96">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="font-display text-lg md:text-xl font-bold text-white drop-shadow-lg">
                O funil que parece{' '}
                <span className="relative inline-block px-2 py-0.5">
                  <span className="relative z-10 text-white drop-shadow-lg">rede social</span>
                  {/* Background highlight box */}
                  <span className="absolute inset-0 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded border border-white/30 dark:border-white/20"></span>
                  {/* Top-left circle */}
                  <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white/60 dark:bg-white/50 rounded-full border border-white/80 dark:border-white/70"></span>
                  {/* Bottom-right circle */}
                  <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white/60 dark:bg-white/50 rounded-full border border-white/80 dark:border-white/70"></span>
                </span>
                .
              </h2>
              
              {/* Botão Conhecer */}
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="h-12 px-12 bg-black/40 dark:bg-black/60 backdrop-blur-md text-white font-semibold hover:bg-black/60 dark:hover:bg-black/80 transition-all group border border-white/10"
                  onClick={() => scrollToSlide(2)}
                >
                  Conhecer
                  <Play className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Infinite Carousel de Marcas - Parte Inferior */}
          <div className="absolute bottom-8 md:bottom-12 lg:bottom-16 left-0 right-0 z-20 overflow-hidden py-4 md:py-6">
            <div className="relative w-full">
              {/* Gradient overlays para efeito fade nas bordas */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/40 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/40 to-transparent z-10 pointer-events-none" />
              
              {/* Desktop: Uma linha única - COMPLETAMENTE OCULTO NO MOBILE */}
              <div className="hidden md:flex animate-scroll-infinite !hidden md:!flex">
                {/* Lista completa de marcas */}
                {[
                  { logo: '/marcas-landing/braip.png', title: 'Braip' },
                  { logo: '/marcas-landing/cakto.png', title: 'Cakto' },
                  { logo: '/marcas-landing/eduzz.png', title: 'Eduzz' },
                  { logo: '/marcas-landing/hotmart.png', title: 'Hotmart' },
                  { logo: '/marcas-landing/kirvano.png', title: 'Kirvano' },
                  { logo: '/marcas-landing/kiwify.png', title: 'Kiwify' },
                  { logo: '/marcas-landing/lastlink.png', title: 'LastLink' },
                  { logo: '/marcas-landing/perfectpay.png', title: 'Perfect Pay' },
                  { logo: '/marcas-landing/ticto.png', title: 'Ticto' },
                ].map((brand, index) => (
                  <div
                    key={`desktop-brand-1-${index}`}
                    className="flex-shrink-0 px-6 md:px-8 lg:px-12 flex items-center justify-center"
                  >
                    <img
                      src={brand.logo}
                      alt={brand.title}
                      className="h-8 md:h-12 lg:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg filter brightness-0 invert"
                    />
                  </div>
                ))}
                
                {/* Segunda duplicação para loop infinito */}
                {[
                  { logo: '/marcas-landing/braip.png', title: 'Braip' },
                  { logo: '/marcas-landing/cakto.png', title: 'Cakto' },
                  { logo: '/marcas-landing/eduzz.png', title: 'Eduzz' },
                  { logo: '/marcas-landing/hotmart.png', title: 'Hotmart' },
                  { logo: '/marcas-landing/kirvano.png', title: 'Kirvano' },
                  { logo: '/marcas-landing/kiwify.png', title: 'Kiwify' },
                  { logo: '/marcas-landing/lastlink.png', title: 'LastLink' },
                  { logo: '/marcas-landing/perfectpay.png', title: 'Perfect Pay' },
                  { logo: '/marcas-landing/ticto.png', title: 'Ticto' },
                ].map((brand, index) => (
                  <div
                    key={`desktop-brand-2-${index}`}
                    className="flex-shrink-0 px-6 md:px-8 lg:px-12 flex items-center justify-center"
                  >
                    <img
                      src={brand.logo}
                      alt={brand.title}
                      className="h-8 md:h-12 lg:h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg filter brightness-0 invert"
                    />
                  </div>
                ))}
              </div>

              {/* Mobile: Duas linhas - uma para direita, outra para esquerda */}
              <div className="md:hidden flex flex-col gap-3">
                {/* Linha 1: Movendo para direita - Logos únicas (5 logos) */}
                <div className="flex animate-scroll-infinite-reverse">
                  {/* Primeira passagem - logos únicas */}
                  {[
                    { logo: '/marcas-landing/braip.png', title: 'Braip' },
                    { logo: '/marcas-landing/cakto.png', title: 'Cakto' },
                    { logo: '/marcas-landing/eduzz.png', title: 'Eduzz' },
                    { logo: '/marcas-landing/hotmart.png', title: 'Hotmart' },
                    { logo: '/marcas-landing/kirvano.png', title: 'Kirvano' },
                  ].map((brand, index) => (
                    <div
                      key={`mobile-line1-${index}`}
                      className="flex-shrink-0 px-4 flex items-center justify-center"
                    >
                      <img
                        src={brand.logo}
                        alt={brand.title}
                        className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg filter brightness-0 invert"
                      />
                    </div>
                  ))}
                  {/* Segunda passagem - duplicação apenas para loop infinito */}
                  {[
                    { logo: '/marcas-landing/braip.png', title: 'Braip' },
                    { logo: '/marcas-landing/cakto.png', title: 'Cakto' },
                    { logo: '/marcas-landing/eduzz.png', title: 'Eduzz' },
                    { logo: '/marcas-landing/hotmart.png', title: 'Hotmart' },
                    { logo: '/marcas-landing/kirvano.png', title: 'Kirvano' },
                  ].map((brand, index) => (
                    <div
                      key={`mobile-line1-duplicate-${index}`}
                      className="flex-shrink-0 px-4 flex items-center justify-center"
                    >
                      <img
                        src={brand.logo}
                        alt={brand.title}
                        className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg filter brightness-0 invert"
                      />
                    </div>
                  ))}
                </div>

                {/* Linha 2: Movendo para esquerda - Logos únicas diferentes (4 logos) */}
                <div className="flex animate-scroll-infinite">
                  {/* Primeira passagem - logos únicas */}
                  {[
                    { logo: '/marcas-landing/kiwify.png', title: 'Kiwify' },
                    { logo: '/marcas-landing/lastlink.png', title: 'LastLink' },
                    { logo: '/marcas-landing/perfectpay.png', title: 'Perfect Pay' },
                    { logo: '/marcas-landing/ticto.png', title: 'Ticto' },
                  ].map((brand, index) => (
                    <div
                      key={`mobile-line2-${index}`}
                      className="flex-shrink-0 px-4 flex items-center justify-center"
                    >
                      <img
                        src={brand.logo}
                        alt={brand.title}
                        className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg filter brightness-0 invert"
                      />
                    </div>
                  ))}
                  {/* Segunda passagem - duplicação apenas para loop infinito */}
                  {[
                    { logo: '/marcas-landing/kiwify.png', title: 'Kiwify' },
                    { logo: '/marcas-landing/lastlink.png', title: 'LastLink' },
                    { logo: '/marcas-landing/perfectpay.png', title: 'Perfect Pay' },
                    { logo: '/marcas-landing/ticto.png', title: 'Ticto' },
                  ].map((brand, index) => (
                    <div
                      key={`mobile-line2-duplicate-${index}`}
                      className="flex-shrink-0 px-4 flex items-center justify-center"
                    >
                      <img
                        src={brand.logo}
                        alt={brand.title}
                        className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-lg filter brightness-0 invert"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 3: Builder Section - Flow/Storyboard */}
        <div className="snap-start snap-always flex items-center justify-center relative z-10" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none">
            <div 
              className="absolute inset-0 opacity-30 dark:opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0',
              }}
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-6 md:mb-8">
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                Construtor Visual{' '}
                <span className="gradient-text">Intuitivo</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Crie funis de vendas interativos sem código. Interface drag & drop 
                poderosa que transforma suas ideias em realidade em minutos.
              </p>
            </div>

            {/* Flow/Storyboard Cards */}
            <div className="relative max-w-6xl mx-auto">
              {/* Connection Lines - Desktop only */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 pointer-events-none z-0" style={{ marginTop: '-2.5rem', height: '1px' }}>
                {/* Line 1 to 2 */}
                <div className="absolute left-[12.5%] top-0 w-[25%] h-full flex items-center">
                  <div className="flex-1 h-0.5 border-t-2 border-dashed border-primary/40"></div>
                  <ArrowRight className="w-3 h-3 text-primary/50 mx-1" />
                </div>
                
                {/* Line 2 to 3 */}
                <div className="absolute left-[37.5%] top-0 w-[25%] h-full flex items-center">
                  <div className="flex-1 h-0.5 border-t-2 border-dashed border-primary/40"></div>
                  <ArrowRight className="w-3 h-3 text-primary/50 mx-1" />
                </div>
                
                {/* Line 3 to 4 */}
                <div className="absolute left-[62.5%] top-0 w-[25%] h-full flex items-center">
                  <div className="flex-1 h-0.5 border-t-2 border-dashed border-primary/40"></div>
                  <ArrowRight className="w-3 h-3 text-primary/50 mx-1" />
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 relative z-10">
                {[
                  {
                    icon: Layers,
                    title: 'Drag & Drop',
                    description: 'Arraste elementos e monte seu funil visualmente',
                  },
                  {
                    icon: Zap,
                    title: 'Elementos Visuais',
                    description: 'Mais de 20 elementos prontos para usar',
                  },
                  {
                    icon: Target,
                    title: 'Personalização Total',
                    description: 'Cores, fontes, animações - tudo personalizável',
                  },
                  {
                    icon: Play,
                    title: 'Preview em Tempo Real',
                    description: 'Veja suas mudanças instantaneamente',
                  },
                ].map((feature, index) => (
                  <div
                    key={feature.title}
                    className="relative p-4 md:p-5 rounded-xl glass-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-sm md:text-base font-bold mb-1.5">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Slide 5: Comparison Section */}
        <div className="snap-start snap-always flex items-center justify-center relative z-10" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none">
            <div 
              className="absolute inset-0 opacity-30 dark:opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0',
              }}
            />
          </div>
          <div className="container mx-auto px-4 relative z-10 py-8 md:py-12">
            <div className="max-w-4xl mx-auto text-center mb-6 md:mb-8">
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Por que Swipper converte{' '}
                <span className="gradient-text">2x mais</span> que Quiz tradicional?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                A diferença está na experiência e no engajamento
              </p>
            </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
            {/* Swipper */}
            <div className="p-4 md:p-6 rounded-2xl glass-card border-2 border-primary/30 relative overflow-hidden">
              <div className="absolute top-2 right-2 md:top-4 md:right-4 px-2 py-1 md:px-3 md:py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                Swipper
              </div>
              <div className="space-y-2 md:space-y-3 mt-3 md:mt-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs md:text-sm">Scroll vertical viciante (estilo Reels)</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs md:text-sm">Experiência imersiva e envolvente</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs md:text-sm">Elementos visuais ricos e interativos</span>
                  </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs md:text-sm">Dopamina constante a cada slide</span>
                  </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs md:text-sm">3x mais tempo na página</span>
                </div>
              </div>
              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-primary/10">
                <div className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-1">2x mais conversão</div>
                <div className="text-xs md:text-sm text-muted-foreground">vs Quiz tradicional</div>
              </div>
              </div>

            {/* Quiz Tradicional */}
            <div className="p-4 md:p-6 rounded-2xl glass-card border border-border/50 relative overflow-hidden">
              <div className="absolute top-2 right-2 md:top-4 md:right-4 px-2 py-1 md:px-3 md:py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                Quiz Tradicional
              </div>
              <div className="space-y-2 md:space-y-3 mt-3 md:mt-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground">Scroll tradicional e linear</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground">Menos engajamento visual</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground">Visual básico e estático</span>
                  </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground">Baixa retenção de atenção</span>
                  </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs md:text-sm text-muted-foreground">Taxa de abandono alta</span>
                </div>
              </div>
              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-muted/50">
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-muted-foreground mb-1">Conversão padrão</div>
                <div className="text-xs md:text-sm text-muted-foreground">Taxa de mercado</div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Slide 6: Analytics Section */}
        <div className="snap-start snap-always flex items-center justify-center relative" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Background simples */}
          <div className="absolute inset-0 bg-slate-50 dark:bg-background/80 pointer-events-none" style={{ zIndex: 0 }} />

          {/* Orbiting Circles Background - Entre background e conteúdo */}
          <div className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 1 }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: '700px', height: '700px', position: 'relative' }}>
              {/* Órbita Externa - Sentido Normal */}
              <OrbitingCircles
                radius={280}
                duration={30}
                iconSize={60}
                path={true}
                className="opacity-90 dark:opacity-80"
              >
                <img src="/meta.png" alt="Meta" className="w-full h-full object-contain opacity-100" />
                <img src="/n8n.png" alt="n8n" className="w-full h-full object-contain opacity-100" />
                <img src="/adwords.png" alt="Google Ads" className="w-full h-full object-contain opacity-100" />
                <img src="/evoapi.png" alt="Evolution API" className="w-full h-full object-contain opacity-100" />
              </OrbitingCircles>

              {/* Órbita Média - Sentido Reverso */}
              <OrbitingCircles
                radius={170}
                duration={25}
                iconSize={50}
                reverse
                path={true}
                className="opacity-90 dark:opacity-80"
              >
                <img src="/webhook.png" alt="Webhook" className="w-full h-full object-contain opacity-100" />
                <img src="/utmify.webp" alt="Utmify" className="w-full h-full object-contain opacity-100" />
                <img src="/zapier.svg" alt="Zapier" className="w-full h-full object-contain opacity-100" />
                <img src="/z_api_logo.png" alt="Z-API" className="w-full h-full object-contain opacity-100" />
              </OrbitingCircles>

            </div>
          </div>
          <div className="container mx-auto px-4 relative z-20 py-8 md:py-12">
            <div className="max-w-4xl mx-auto text-center mb-4 md:mb-6">
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Analytics que{' '}
                <span className="gradient-text">Impulsionam Resultados</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Painel completo de métricas para otimizar cada detalhe do seu funil
              </p>
            </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
            {[
              { label: 'Taxa de Conclusão', value: '78%', icon: Target },
              { label: 'Tempo Médio', value: '4.2min', icon: Timer },
              { label: 'Taxa de Conversão', value: '12.5%', icon: TrendingUp },
              { label: 'Engajamento', value: '3.2x', icon: BarChart3 },
            ].map((metric) => (
              <div key={metric.label} className="p-4 md:p-5 rounded-2xl glass-card border border-border/50 text-center">
                <metric.icon className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2 md:mb-4" />
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-1 md:mb-2">{metric.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Slide 7: Plans Section */}
        {plans.length > 0 && (
          <div className="snap-start snap-always flex items-center justify-center relative z-10" style={{ height: 'calc(100vh - 4rem)' }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none">
              <div 
                className="absolute inset-0 opacity-30 dark:opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.3) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0',
                }}
              />
            </div>
            <div className="container mx-auto px-4 relative z-10 py-8 md:py-12">
              <div className="max-w-4xl mx-auto text-center mb-6 md:mb-8">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                  Escolha Seu <span className="gradient-text">Plano</span>
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Planos flexíveis para todos os tamanhos de negócio
                </p>
              </div>

            <div className="relative max-w-2xl mx-auto">
              {/* Card do Plano Atual */}
              <div className="relative">
                {plans[currentPlanIndex] && (
                  <div
                    key={plans[currentPlanIndex].id}
                    className={`relative p-4 md:p-6 rounded-2xl transition-all duration-300 ${
                      plans[currentPlanIndex].isPopular
                        ? 'glass-card border-2 border-primary/50 shadow-xl shadow-primary/20'
                        : 'glass-card border border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <div className="mb-3 md:mb-4">
                      <h3 className="font-display text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2">{plans[currentPlanIndex].title}</h3>
                      {plans[currentPlanIndex].description && (
                        <p className="text-xs md:text-sm text-muted-foreground">{plans[currentPlanIndex].description}</p>
                      )}
                    </div>

                    <div className="mb-4 md:mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl md:text-3xl lg:text-4xl font-bold">
                          {plans[currentPlanIndex].price === 0 ? 'Grátis' : formatPrice(plans[currentPlanIndex].price)}
                        </span>
                        {plans[currentPlanIndex].price > 0 && (
                          <span className="text-xs md:text-sm text-muted-foreground">/mês</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 md:mb-6">
                      {plans[currentPlanIndex].features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
                          <p className="text-xs md:text-sm text-muted-foreground">{feature.text}</p>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full h-10 md:h-12 text-sm md:text-base ${
                        plans[currentPlanIndex].isPopular
                          ? 'gradient-primary text-primary-foreground glow-primary'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        handleSubscribeClick(plans[currentPlanIndex]);
                        if (user) {
                          window.location.href = `/checkout/${plans[currentPlanIndex].id}`;
                        } else {
                          window.location.href = `/signup?redirect=/checkout/${plans[currentPlanIndex].id}`;
                        }
                      }}
                    >
                      {plans[currentPlanIndex].price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                      {plans[currentPlanIndex].isPopular && <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Indicadores de Plano com Setas */}
              {plans.length > 1 && (
                <div className="flex items-center justify-center gap-3 md:gap-4 mt-6">
                  {/* Seta Anterior */}
                  <button
                    onClick={() => setCurrentPlanIndex((prev) => (prev === 0 ? plans.length - 1 : prev - 1))}
                    className="w-6 h-6 md:w-7 md:h-7 rounded-full glass-card border border-border/50 hover:border-primary/50 flex items-center justify-center transition-all duration-300 hover:scale-110 flex-shrink-0"
                    aria-label="Plano anterior"
                  >
                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 text-foreground" />
                  </button>

                  {/* Indicadores */}
                  <div className="flex items-center gap-2">
                    {plans.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPlanIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentPlanIndex
                            ? 'bg-primary w-6'
                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                        aria-label={`Ir para plano ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Seta Próxima */}
                  <button
                    onClick={() => setCurrentPlanIndex((prev) => (prev === plans.length - 1 ? 0 : prev + 1))}
                    className="w-6 h-6 md:w-7 md:h-7 rounded-full glass-card border border-border/50 hover:border-primary/50 flex items-center justify-center transition-all duration-300 hover:scale-110 flex-shrink-0"
                    aria-label="Próximo plano"
                  >
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-foreground" />
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Slide 8: CTA Section */}
        <div className="snap-start snap-always flex items-center justify-center relative z-10" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none">
            <div 
              className="absolute inset-0 opacity-30 dark:opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0',
              }}
            />
          </div>
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
              Pronto para criar swippers{' '}
              <span className="gradient-text">irresistíveis</span>?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
              Comece gratuitamente e veja seus resultados decolarem.
            </p>
            <div className="flex items-center justify-center">
                <Link to={user ? '/dashboard' : '/signup'} onClick={handleLeadClick}>
                <Button size="lg" className="h-12 md:h-14 px-8 md:px-10 gradient-primary text-primary-foreground font-semibold text-base md:text-lg glow-primary hover:opacity-90 transition-opacity">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
        </div>

        {/* Slide Indicators */}
        <SlideIndicators 
          totalSlides={TOTAL_SLIDES} 
          currentSlide={currentSlide}
          onSlideClick={scrollToSlide}
        />
      </div>
    </div>
  );
}
