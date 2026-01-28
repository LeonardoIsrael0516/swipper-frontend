import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, X, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Plan } from '@/types/plan';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTracking } from '@/contexts/TrackingContext';
import { useQuery } from '@tanstack/react-query';

// Helper para obter componente de ícone Lucide (mesma lógica do IconEmojiSelector)
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || null;
};

// Helper para renderizar ícone de feature
const renderFeatureIcon = (icon?: string, iconColor?: string) => {
  if (!icon) return <Check className="w-5 h-5 text-primary" />;
  
  const trimmedIcon = String(icon).trim();
  
  // Se começar com http:// ou https:// ou /, é URL
  if (trimmedIcon.startsWith('http://') || trimmedIcon.startsWith('https://') || trimmedIcon.startsWith('/')) {
    return <img src={trimmedIcon} alt="" className="w-5 h-5 object-cover rounded" />;
  }
  
  // Se começar com "icon:", remover o prefixo
  let iconName = trimmedIcon;
  if (trimmedIcon.startsWith('icon:')) {
    iconName = trimmedIcon.substring(5).trim();
  }
  
  // Se for emoji (regex simples)
  const emojiRegex = /^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(iconName)) {
    return <span className="text-xl">{iconName}</span>;
  }
  
  // Caso contrário, tratar como nome de ícone Lucide
  const IconComponent = getIconComponent(iconName);
  if (IconComponent) {
    const Icon = IconComponent;
    // Usar a cor personalizada se fornecida, caso contrário usar a cor padrão (text-primary)
    const iconStyle = iconColor ? { color: iconColor } : undefined;
    return <Icon className="w-5 h-5" style={iconStyle} />;
  }
  
  // Fallback - retornar checkmark
  return <Check className="w-5 h-5 text-primary" />;
};

// Helper para renderizar ícone de limite
const renderLimitIcon = (icon?: string) => {
  if (!icon) return null;
  
  const trimmedIcon = icon.trim();
  
  // Se começar com http:// ou https:// ou /, é URL
  if (trimmedIcon.startsWith('http://') || trimmedIcon.startsWith('https://') || trimmedIcon.startsWith('/')) {
    return <img src={trimmedIcon} alt="" className="w-4 h-4 object-cover rounded" />;
  }
  
  // Se começar com "icon:", remover o prefixo
  let iconName = trimmedIcon;
  if (trimmedIcon.startsWith('icon:')) {
    iconName = trimmedIcon.substring(5).trim();
  }
  
  // Se for emoji (regex simples), renderizar como texto
  const emojiRegex = /^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(iconName)) {
    return <span className="text-base">{iconName}</span>;
  }
  
  // Caso contrário, tratar como nome de ícone Lucide
  const IconComponent = getIconComponent(iconName);
  if (IconComponent) {
    const Icon = IconComponent;
    return <Icon className="w-4 h-4 text-primary" />;
  }
  
  // Se não encontrou o ícone Lucide, verificar se é um símbolo de texto simples (como "→", "✓", "✗")
  // Se for um único caractere, renderizar como texto
  if (iconName.length === 1 || iconName === '→' || iconName === '✓' || iconName === '✗' || iconName === '✔') {
    return <span className="text-base">{iconName}</span>;
  }
  
  // Se não encontrou, retornar null para não mostrar nada (ou um ícone padrão)
  // Para debug, vamos mostrar o nome no console mas não renderizar
  if (import.meta.env.DEV) {
    console.warn(`Ícone de limite não renderizado: "${iconName}"`);
  }
  
  return null;
};

function formatPrice(price: number): string {
  if (isNaN(price) || price === null || price === undefined) {
    return 'R$ 0';
  }
  
  // Se for um número inteiro, formatar sem centavos
  if (Number.isInteger(price)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  // Se tiver decimais, formatar normalmente
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

function normalizePrice(price: any): number {
  if (price === null || price === undefined) {
    return 0;
  }
  
  if (typeof price === 'number') {
    return isNaN(price) ? 0 : price;
  }
  
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  if (price && typeof price === 'object') {
    // Tentar converter objeto Decimal
    if (typeof price.toNumber === 'function') {
      return price.toNumber();
    }
    const parsed = parseFloat(String(price));
    return isNaN(parsed) ? 0 : parsed;
  }
  
  const num = Number(price);
  return isNaN(num) ? 0 : num;
}

export default function Plans() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { trackEvent, isInitialized } = useTracking();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar perfil do usuário para obter planId
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<{ planId?: string | null; id: string; email: string; name?: string | null; role: string; avatar?: string | null; emailVerified: boolean; createdAt: string; updatedAt: string } | null>({
    queryKey: ['user-profile-plans'],
    queryFn: async () => {
      try {
        const response = await api.getMyProfile<any>();
        const profileData = (response as any).data || response;
        console.log('Profile data received (full):', JSON.stringify(profileData, null, 2));
        console.log('PlanId from profile:', profileData?.planId);
        console.log('All keys in profile:', profileData ? Object.keys(profileData) : 'null');
        // Verificar se planId existe no objeto
        if (!profileData?.planId && profileData) {
          console.warn('⚠️ planId não encontrado no profile! Campos disponíveis:', Object.keys(profileData));
        }
        return profileData;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 0, // Sempre buscar dados frescos
  });

  const currentPlanId = userProfile?.planId || null;
  
  console.log('Current Plan ID for badge:', currentPlanId);

  // Debug: log para verificar valores
  useEffect(() => {
    console.log('=== Plans Page Debug ===');
    console.log('User:', user);
    console.log('User Profile:', userProfile);
    console.log('Current Plan ID:', currentPlanId);
    console.log('Plans:', plans.map(p => ({ id: p.id, title: p.title })));
    console.log('Is Loading Profile:', isLoadingProfile);
  }, [userProfile, plans, currentPlanId, user, isLoadingProfile]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await api.getPlans<Plan[]>();
        
        // Garantir que seja array
        const plansArray = Array.isArray(response) ? response : [];
        
        // Converter price de Decimal para number se necessário
        const normalizedPlans = plansArray.map(plan => ({
          ...plan,
          price: normalizePrice(plan.price),
        }));
        
        setPlans(normalizedPlans);
      } catch (error: any) {
        console.error('Erro ao carregar planos:', error);
        toast.error('Erro ao carregar planos: ' + (error.message || 'Erro desconhecido'));
        setPlans([]); // Garantir que seja array mesmo em caso de erro
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  // Tracking: ViewContent quando planos carregarem
  useEffect(() => {
    if (isInitialized && plans.length > 0) {
      plans.forEach((plan) => {
        trackEvent('ViewContent', {
          content_ids: [plan.id],
          content_type: 'product',
          value: typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price)),
          currency: 'BRL',
        });
      });
    }
  }, [isInitialized, plans, trackEvent]);

  const handleSubscribeClick = (plan: Plan) => {
    const planPrice = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));
    
    // Tracking: AddToCart
    trackEvent('AddToCart', {
      content_ids: [plan.id],
      content_type: 'subscription',
      value: planPrice,
      currency: 'BRL',
    });

    // Tracking: InitiateCheckout
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
      
      <section className="relative py-24 overflow-hidden pt-32">
        {/* Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-start/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-mid/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Escolha seu <span className="gradient-text">Plano</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground">
            Escolha o plano ideal para você.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
            </div>
          ) : (
            <>
              {/* Separar plano free dos planos pagos */}
              {(() => {
                const freePlan = plans.find(plan => normalizePrice(plan.price) === 0);
                const paidPlans = plans.filter(plan => normalizePrice(plan.price) > 0);
                const planIdFromProfile = userProfile?.planId;
                const isFreePlanCurrent = freePlan && planIdFromProfile && String(planIdFromProfile) === String(freePlan.id);
                
                // Debug: verificar features do plano free
                if (freePlan && import.meta.env.DEV) {
                  console.log('Free Plan:', freePlan);
                  console.log('Free Plan Features:', freePlan.features);
                  console.log('Free Plan Features Type:', typeof freePlan.features);
                  console.log('Free Plan Features Is Array:', Array.isArray(freePlan.features));
                  if (freePlan.features) {
                    console.log('Free Plan Features Length:', freePlan.features.length);
                  }
                }

                return (
                  <>
                    {/* Grid de planos pagos */}
                    {paidPlans.length > 0 && (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {paidPlans.map((plan) => {
                          // Comparar planId do usuário com o ID do plano
                          const planIdFromProfile = userProfile?.planId;
                          const isCurrentPlan = planIdFromProfile && plan.id && String(planIdFromProfile) === String(plan.id);
                
                return (
                <div
                  key={plan.id}
                  className={`relative p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    plan.isPopular
                      ? `shadow-xl shadow-primary/20 scale-105 ${theme === 'light' ? 'bg-black text-white' : 'glass-card'}`
                      : 'glass-card hover:border-gray-300'
                  }`}
                >
                  {/* Badge "Plano Atual" */}
                  {isCurrentPlan && (
                    <Badge className={`absolute top-4 right-4 z-20 shadow-lg ${
                      theme === 'light'
                        ? plan.isPopular 
                          ? 'bg-white text-black' 
                          : 'bg-black text-white'
                        : 'bg-white text-black'
                    }`}>
                      Plano Atual
                    </Badge>
                  )}

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
                        {(() => {
                          const priceValue = normalizePrice(plan.price);
                          return priceValue === 0 ? 'Free' : formatPrice(priceValue);
                        })()}
                      </span>
                      {(() => {
                        const priceValue = normalizePrice(plan.price);
                        return priceValue > 0 && (
                          <span className={plan.isPopular && theme === 'light' ? 'text-white/70' : 'text-muted-foreground'}>/mês</span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {feature.icon ? (
                          <div className="flex-shrink-0">
                            {renderFeatureIcon(feature.icon, feature.iconColor)}
                          </div>
                        ) : (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <p className={`text-sm ${plan.isPopular && theme === 'light' ? 'text-white/90' : 'text-muted-foreground'}`}>
                          {feature.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const priceValue = normalizePrice(plan.price);
                    const isFree = priceValue === 0;

                    // Se for o plano atual, não mostrar botão de assinar
                    if (isCurrentPlan) {
                      return (
                        <div className={`w-full h-12 flex items-center justify-center rounded-lg ${
                          plan.isPopular && theme === 'light'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <span className="text-sm font-medium">Plano Atual</span>
                        </div>
                      );
                    }

                    const buttonClassName = `w-full h-12 ${
                      plan.isPopular
                        ? 'gradient-primary text-primary-foreground glow-primary'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`;

                    if (isFree) {
                      return (
                        <Link to="/signup">
                          <Button className={buttonClassName}>
                            Começar Grátis
                            {plan.isPopular && <ArrowRight className="w-4 h-4 ml-2" />}
                          </Button>
                        </Link>
                      );
                    }

                    return (
                      <Button
                        className={buttonClassName}
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
                    );
                  })()}
                </div>
              );
              })}
                      </div>
                    )}

                    {/* Card horizontal para plano free - abaixo dos planos pagos */}
                    {freePlan && (
                      <div className="w-full mt-12 max-w-7xl mx-auto">
                        <div className={`relative p-6 md:p-8 rounded-2xl transition-all duration-300 hover:scale-[1.01] group ${
                          theme === 'light'
                            ? 'bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-gray-300 shadow-sm'
                            : 'bg-gradient-to-r from-white/5 to-white/3 backdrop-blur-md border border-white/10 hover:border-white/20'
                        }`}>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                            {/* Conteúdo central */}
                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className={`font-display text-2xl md:text-3xl font-bold mb-2 ${
                                  theme === 'light' ? 'text-gray-900' : 'text-foreground'
                                }`}>
                                  {freePlan.title}
                                </h3>
                                {freePlan.description && (
                                  <p className={`text-sm md:text-base ${
                                    theme === 'light' ? 'text-gray-600' : 'text-muted-foreground'
                                  }`}>
                                    {freePlan.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Features completas - lado a lado */}
                              {(() => {
                                // Garantir que features seja um array válido
                                const features = freePlan.features && Array.isArray(freePlan.features) 
                                  ? freePlan.features 
                                  : [];
                                
                                if (features.length > 0) {
                                  return (
                                    <div className="flex flex-wrap gap-2 md:gap-3 pt-2">
                                      {features.map((feature, index) => (
                                        <div 
                                          key={index} 
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                                            theme === 'light' 
                                              ? 'bg-gray-100 border border-gray-200' 
                                              : 'bg-white/5 border border-white/10'
                                          }`}
                                        >
                                          {feature.icon ? (
                                            <div className="flex-shrink-0">
                                              {renderFeatureIcon(feature.icon, feature.iconColor)}
                                            </div>
                                          ) : (
                                            <Check className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ${
                                              theme === 'light' ? 'text-primary' : 'text-primary'
                                            }`} />
                                          )}
                                          <span className={`text-xs md:text-sm font-medium ${
                                            theme === 'light' ? 'text-gray-700' : 'text-foreground'
                                          }`}>
                                            {feature.text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* Botão à direita */}
                            <div className="flex-shrink-0 w-full md:w-auto">
                              {isFreePlanCurrent ? (
                                <div className={`w-full md:w-auto px-6 py-3 rounded-lg text-center ${
                                  theme === 'light'
                                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <span className="text-sm font-medium">Plano Atual</span>
                                </div>
                              ) : (
                                <Link to="/signup" className="block">
                                  <Button className={`w-full md:w-auto h-auto py-3 px-6 ${
                                    theme === 'light'
                                      ? 'gradient-primary text-primary-foreground glow-primary'
                                      : 'bg-black text-white hover:bg-gray-800'
                                  }`}>
                                    Começar Grátis
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

