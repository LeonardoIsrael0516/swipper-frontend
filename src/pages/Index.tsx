import { Link, useSearchParams } from 'react-router-dom';
import {
  Play,
  ArrowRight,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Target,
  Layers,
  Timer,
  CheckCircle2,
  Check,
  X,
  ArrowDown,
  Calendar,
  VideoOff,
  Instagram,
  Linkedin,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { useTracking } from '@/contexts/TrackingContext';
import { SwipperPreview } from '@/components/landing/SwipperPreview';
import { OrbitingCircles } from '@/components/ui/orbiting-circles';
import { api } from '@/lib/api';
import { Plan } from '@/types/plan';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

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
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

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
      return plansArray
        .map((plan) => ({
          ...plan,
          price: normalizePrice(plan.price),
        }))
        .filter((plan) => {
          // Ocultar plano gratuito (preço 0)
          return plan.price > 0;
        });
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (plansData) {
      setPlans(plansData);
    }
  }, [plansData]);

  useEffect(() => {
    if (isInitialized) {
      trackEvent('ViewContent', {
        content_type: 'landing_page',
      });
    }
  }, [isInitialized, trackEvent]);

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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center py-20 md:py-32">
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
            <div className="space-y-8">
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
                    Criar conta
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Swipper Preview - Desktop */}
            <div className="relative animate-slide-up hidden lg:block" style={{ animationDelay: '300ms' }}>
              <SwipperPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Swipper Preview - Mobile (abaixo da hero) */}
      <section className="lg:hidden -mt-56 sm:-mt-64 pb-6 overflow-x-hidden relative z-10">
        <div className="w-full max-w-full">
          <div className="flex justify-center items-center w-full overflow-x-hidden px-2">
            <div className="flex justify-center items-center w-full" style={{ maxWidth: '100vw' }}>
              <div className="scale-[0.75] sm:scale-[0.85] md:scale-90 origin-center flex-shrink-0 mx-auto">
                <SwipperPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: "O funil que parece rede social" */}
      <section id="funnel" className="relative pt-8 pb-8 md:pt-12 md:pb-12 overflow-hidden">
        {/* Background Image - Mobile */}
        <div 
          className="absolute inset-0 lg:hidden pointer-events-none"
          style={{
            backgroundImage: 'url(https://img.swipper.me/landing/sm.webp)',
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
        
        <div className="container mx-auto px-4 relative z-10 pt-4 md:pt-8 pb-4 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Título e Descrição */}
            <div className="text-center space-y-6">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                O primeiro funil que parece{' '}
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
              
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md leading-relaxed">
                Swipper transforma seus quizzes em experiências viciantes no formato Reels. Scroll vertical, elementos visuais ricos, animações envolventes e dopamina a cada interação.
              </p>
            </div>

            {/* Grid de 3 Cards com Métricas */}
            <div className="grid grid-cols-2 gap-2 md:gap-8">
              {/* Card 1: Experiência Imersiva - Full width */}
              <div className="col-span-2 relative p-4 md:p-6 rounded-xl md:rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                {/* Layout horizontal */}
                <div className="flex flex-row items-start gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm overflow-hidden">
                    <img src="/landing/asterisk.png" alt="Experiência Imersiva" className="w-full h-full object-contain p-3" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-display text-sm md:text-lg lg:text-xl font-bold text-white leading-tight text-left">
                      Experiência Imersiva
                    </h3>
                    <p className="text-xs md:text-sm text-white/80 leading-relaxed text-left">
                      Scroll vertical viciante que seus leads já conhecem e amam
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Engajamento 8x maior */}
              <div className="col-span-1 relative p-3 md:p-6 rounded-xl md:rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                {/* Layout horizontal */}
                <div className="flex flex-row items-start gap-3">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm overflow-hidden">
                    <img src="/landing/asterisk.png" alt="Engajamento 8x maior" className="w-full h-full object-contain p-3" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-lg md:text-2xl lg:text-3xl font-bold text-white">
                      8x
                    </div>
                    <h3 className="font-display text-xs md:text-sm lg:text-base font-bold text-white leading-tight text-left">
                      Engajamento maior
                    </h3>
                    <p className="hidden md:block text-xs md:text-sm text-white/80 leading-relaxed text-left">
                      Mantenha atenção por 4.2min vs 1.3min de quiz tradicionais
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: 95% taxa de conclusão */}
              <div className="col-span-1 relative p-3 md:p-6 rounded-xl md:rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                {/* Layout horizontal */}
                <div className="flex flex-row items-start gap-3">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm overflow-hidden">
                    <img src="/landing/asterisk.png" alt="95% taxa de conclusão" className="w-full h-full object-contain p-3" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-lg md:text-2xl lg:text-3xl font-bold text-white">
                      95%
                    </div>
                    <h3 className="font-display text-xs md:text-sm lg:text-base font-bold text-white leading-tight text-left">
                      Taxa de conclusão
                    </h3>
                    <p className="hidden md:block text-xs md:text-sm text-white/80 leading-relaxed text-left">
                      Seus leads realmente chegam até o final (e compram)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Infinite Carousel de Marcas */}
        <div className="relative z-20 overflow-hidden py-4 md:py-6 mt-4 md:mt-6">
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
        </section>

        {/* Section 3: Problemas dos Quizzes Tradicionais */}
        <section id="builder" className="relative py-20 md:py-32">
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
            {/* Título e Descrição */}
            <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                Enquanto você usa tecnologia de{' '}
                <span className="relative inline-block px-2 py-0.5">
                  <span className="relative z-10">2019</span>
                  <span className="absolute inset-0 bg-muted/50 dark:bg-muted/30 rounded border border-muted-foreground/20"></span>
                </span>
                , seus clientes estão viciados em experiências de{' '}
                <span className="gradient-text">2026</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                O gap entre o que você oferece e o que seus leads esperam está custando conversões todos os dias.
              </p>
            </div>

            {/* Cards de Problemas */}
            <div className="max-w-6xl mx-auto mb-8 md:mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  {
                    icon: ArrowDown,
                    title: 'Scroll linear e previsível',
                    description: 'Seus usuários sabem exatamente o que vem. Zero surpresa = zero dopamina',
                  },
                  {
                    icon: Calendar,
                    title: 'Design ultrapassado',
                    description: 'Parece formulário do banco. Ninguém quer preencher isso',
                  },
                  {
                    icon: TrendingDown,
                    title: 'Zero retenção',
                    description: '92% abandonam antes do final. Você está perdendo leads qualificados',
                  },
                  {
                    icon: VideoOff,
                    title: 'Experiência chata',
                    description: 'Sem vídeo, sem animação, sem vida. Como espera engajar a geração TikTok?',
                  },
                ].map((problem, index) => (
                  <div
                    key={problem.title}
                    className="relative p-5 md:p-6 rounded-xl glass-card border border-border/50 hover:border-muted-foreground/30 transition-all duration-300 hover:scale-105 group overflow-hidden"
                  >
                    {/* X suave no canto direito */}
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 opacity-20 dark:opacity-30 pointer-events-none">
                      <X className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
                    </div>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                      <problem.icon className="w-6 h-6 md:w-7 md:h-7 text-gray-900 dark:text-gray-100" />
                    </div>
                    <h3 className="font-display text-base md:text-lg font-bold mb-2 text-foreground">
                      {problem.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Final */}
            <div className="text-center">
              <button
                onClick={() => scrollToSection('comparison')}
                className="inline-flex flex-col items-center gap-2 text-lg md:text-xl font-semibold text-foreground hover:text-primary transition-colors group"
              >
                <span>Existe uma solução melhor</span>
                <ChevronDown className="w-5 h-5 md:w-6 md:h-6 animate-bounce group-hover:text-primary" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Comparison Section */}
        <section id="comparison" className="relative py-20 md:py-32 border-t border-b border-border/50">
          {/* Background simples */}
          <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10 py-8 md:py-12">
            <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Por que Swipper converte{' '}
                <span className="gradient-text">8x mais</span> que Quiz tradicional?
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                A diferença está na experiência e no engajamento. Veja os números que comprovam.
              </p>
            </div>

            {/* Grid com VS central */}
            <div className="relative max-w-6xl mx-auto">
              <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center">
                {/* Quiz Tradicional */}
                <div className="w-full p-5 md:p-8 rounded-2xl glass-card border border-border/50 relative overflow-hidden hover:border-border/70 transition-all duration-300 hover:scale-[1.01]">
                  {/* Badge */}
                  <div className="absolute top-3 right-3 md:top-5 md:right-5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50 text-muted-foreground text-xs md:text-sm font-semibold">
                    Quiz Tradicional
                  </div>

                  {/* Métricas no topo */}
                  <div className="mb-4 md:mb-6 pt-8 md:pt-10">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-muted-foreground">45%</span>
                      <span className="text-sm md:text-base text-muted-foreground">conclusão</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                      <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Taxa de mercado</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 md:space-y-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">Scroll tradicional e linear</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">Menos engajamento visual</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">Visual básico e estático</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">Baixa retenção de atenção</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">Taxa de abandono alta</span>
                    </div>
                  </div>

                  {/* Badge de conversão */}
                  <div className="mt-6 md:mt-8 p-4 md:p-5 rounded-xl bg-muted/50 border border-border/50">
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-muted-foreground mb-1">Conversão padrão</div>
                    <div className="text-xs md:text-sm text-muted-foreground font-medium">Taxa de mercado</div>
                  </div>
                </div>

                {/* Elemento VS Central */}
                <div className="flex flex-col items-center justify-center py-4 md:py-8">
                  <div className="relative">
                    {/* Círculo com VS */}
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
                      <span className="text-lg md:text-xl font-bold text-primary">VS</span>
                    </div>
                    {/* Linhas decorativas - Horizontal no desktop, Vertical no mobile */}
                    <div className="hidden md:block absolute top-1/2 left-full w-8 h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                    <div className="hidden md:block absolute top-1/2 right-full w-8 h-0.5 bg-gradient-to-l from-primary/30 to-transparent" />
                    {/* Linhas decorativas - Vertical no mobile */}
                    <div className="md:hidden absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/30 to-transparent" />
                    <div className="md:hidden absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-t from-primary/30 to-transparent" />
                  </div>
                </div>

                {/* Swipper - Card Destacado */}
                <div className="relative w-full p-5 md:p-8 rounded-2xl glass-card border-2 border-primary/40 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
                  {/* Gradiente sutil no fundo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 group-hover:opacity-75 transition-opacity" />
                  
                  {/* Badge melhorado */}
                  <div className="absolute top-3 right-3 md:top-5 md:right-5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-xs md:text-sm font-bold shadow-sm">
                    Swipper
                  </div>

                  {/* Métricas em destaque no topo */}
                  <div className="mb-4 md:mb-6 pt-8 md:pt-10">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text">95%</span>
                      <span className="text-sm md:text-base text-muted-foreground">conclusão</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-primary">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                      <span>8x mais engajamento</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 md:space-y-3 relative z-10">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span className="text-xs md:text-sm font-medium">Scroll vertical viciante (estilo Reels)</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span className="text-xs md:text-sm font-medium">Experiência imersiva e envolvente</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span className="text-xs md:text-sm font-medium">Elementos visuais ricos e interativos</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span className="text-xs md:text-sm font-medium">Dopamina constante a cada slide</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                      </div>
                      <span className="text-xs md:text-sm font-medium">5x mais tempo na página</span>
                    </div>
                  </div>

                  {/* Badge de conversão melhorado */}
                  <div className="mt-6 md:mt-8 p-4 md:p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="relative z-10">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text mb-1">8x mais conversão</div>
                      <div className="text-xs md:text-sm text-muted-foreground font-medium">vs Quiz tradicional</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Analytics Section */}
        <section id="analytics" className="relative py-20 md:py-32 overflow-hidden">
          {/* Background simples */}
          <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none" />

          {/* Orbiting Circles Background - Responsivo e contido */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            {/* Container Mobile - Menor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:hidden" style={{ position: 'relative' }}>
              {/* Órbita Externa - Sentido Normal - Mobile */}
              <OrbitingCircles
                radius={120}
                duration={30}
                iconSize={30}
                path={true}
                className="opacity-90 dark:opacity-80"
              >
                <img src="/meta.png" alt="Meta" className="w-full h-full object-contain opacity-100" />
                <img src="/n8n.png" alt="n8n" className="w-full h-full object-contain opacity-100" />
                <img src="/adwords.png" alt="Google Ads" className="w-full h-full object-contain opacity-100" />
                <img src="/evoapi.png" alt="Evolution API" className="w-full h-full object-contain opacity-100" />
              </OrbitingCircles>

              {/* Órbita Média - Sentido Reverso - Mobile */}
              <OrbitingCircles
                radius={70}
                duration={25}
                iconSize={25}
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

            {/* Container Desktop - Maior */}
            <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[700px] h-full max-h-[700px] aspect-square" style={{ position: 'relative' }}>
              {/* Órbita Externa - Sentido Normal - Desktop */}
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

              {/* Órbita Média - Sentido Reverso - Desktop */}
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

          <div className="container mx-auto px-4 sm:px-6 relative z-20 py-8 md:py-12">
            <div className="max-w-4xl mx-auto text-center mb-6 md:mb-8">
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Analytics que{' '}
                <span className="gradient-text">Impulsionam Resultados</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Painel completo de métricas para otimizar cada detalhe do seu funil
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto">
              {[
                { label: 'Taxa de Conclusão', value: '95%', icon: Target },
                { label: 'Tempo Médio', value: '4.2min', icon: Timer },
                { label: 'Taxa de Conversão', value: '+62%', icon: TrendingUp },
                { label: 'Engajamento', value: '5.2x', icon: BarChart3 },
              ].map((metric, index) => (
                <div 
                  key={metric.label} 
                  className="group relative p-4 md:p-6 rounded-2xl glass-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradiente sutil no hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Conteúdo */}
                  <div className="relative z-10">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mx-auto mb-3 md:mb-4 transition-colors duration-300">
                      <metric.icon className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text mb-1 md:mb-2 group-hover:scale-105 transition-transform duration-300">
                      {metric.value}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground font-medium leading-tight">
                      {metric.label}
                    </div>
                  </div>

                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Plans Section */}
        {plans.length > 0 && (
          <section id="plans" className="relative py-20 md:py-32">
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

            {/* Mobile: Carrossel */}
            <div className="md:hidden relative max-w-2xl mx-auto">
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

            {/* Desktop: Grid com todos os planos */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.filter((plan) => {
                // Ocultar plano gratuito (preço 0)
                const priceValue = normalizePrice(plan.price);
                return priceValue > 0;
              }).map((plan) => {
                const priceValue = normalizePrice(plan.price);
                return (
                  <div
                    key={plan.id}
                    className={`relative p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                      plan.isPopular
                        ? `shadow-xl shadow-primary/20 scale-105 ${theme === 'light' ? 'bg-black text-white' : 'glass-card'}`
                        : 'glass-card hover:border-gray-300'
                    }`}
                  >
                    <div className="mb-6">
                      <h3 className={`font-display text-2xl font-bold mb-2 ${plan.isPopular && theme === 'light' ? 'text-white' : ''}`}>
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className={`text-sm ${plan.isPopular && theme === 'light' ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold ${plan.isPopular && theme === 'light' ? 'text-white' : ''}`}>
                          {formatPrice(priceValue)}
                        </span>
                        <span className={plan.isPopular && theme === 'light' ? 'text-white/70' : 'text-muted-foreground'}>/mês</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <p className={`text-sm ${plan.isPopular && theme === 'light' ? 'text-white/90' : 'text-muted-foreground'}`}>
                            {feature.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full h-12 ${
                        plan.isPopular
                          ? 'gradient-primary text-primary-foreground glow-primary'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        handleSubscribeClick(plan);
                        if (user) {
                          window.location.href = `/checkout/${plan.id}`;
                        } else {
                          window.location.href = `/signup?redirect=/checkout/${plan.id}`;
                        }
                      }}
                    >
                      Assinar Agora
                      {plan.isPopular && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                );
              })}
            </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="relative border-t border-border/50 bg-slate-50 dark:bg-background/80">
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 opacity-20 dark:opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / 0.2) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0',
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
              {/* Logo e Descrição */}
              <div className="space-y-4">
                <Link to="/" className="inline-block">
                  <img
                    src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'}
                    alt="Swipper"
                    className="h-8 md:h-10 transition-all duration-300 hover:opacity-80"
                  />
                </Link>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Crie funis de vendas interativos que convertem como nunca antes. 
                  A experiência que seus leads esperam.
                </p>
              </div>

              {/* Links Rápidos */}
              <div>
                <h3 className="font-display text-lg font-bold mb-4">Links Rápidos</h3>
                <ul className="space-y-3">
                  <li>
                    <Link 
                      to="/dashboard" 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/plans" 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      Planos
                    </Link>
                  </li>
                  <li>
                    {user ? (
                      <Link 
                        to="/affiliates" 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                      >
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        Afiliados
                      </Link>
                    ) : (
                      <a 
                        href="/affiliate-program" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                      >
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        Afiliados
                      </a>
                    )}
                  </li>
                  <li>
                    <Link 
                      to="/partner-program" 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      Programa de Parceiros
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Redes Sociais */}
              <div>
                <h3 className="font-display text-lg font-bold mb-4">Redes Sociais</h3>
                <div className="flex items-center gap-4">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all duration-300 hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all duration-300 hover:scale-110"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="mailto:contato@swipper.com"
                    className="w-10 h-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all duration-300 hover:scale-110"
                    aria-label="Email"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-border/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                  © {new Date().getFullYear()} Swipper. Todos os direitos reservados.
                </p>
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Termos de Uso
                  </Link>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Privacidade
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}

