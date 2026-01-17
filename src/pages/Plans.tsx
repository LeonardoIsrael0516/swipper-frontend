import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, X, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Plan } from '@/types/plan';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                    plan.isPopular
                      ? `shadow-xl shadow-primary/20 scale-105 ${theme === 'light' ? 'bg-black text-white' : 'glass-card'}`
                      : 'glass-card hover:border-primary/30'
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
                        {(() => {
                          const priceValue = normalizePrice(plan.price);
                          return priceValue === 0 ? 'Grátis' : formatPrice(priceValue);
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

                  <Link to="/signup">
                    <Button
                      className={`w-full h-12 ${
                        plan.isPopular
                          ? 'gradient-primary text-primary-foreground glow-primary'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {(() => {
                        const priceValue = normalizePrice(plan.price);
                        return priceValue === 0 ? 'Começar Grátis' : 'Assinar Agora';
                      })()}
                      {plan.isPopular && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

