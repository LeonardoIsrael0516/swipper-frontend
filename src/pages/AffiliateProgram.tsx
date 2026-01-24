import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Gift,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';

// Formatar valor monetário
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function AffiliateProgram() {
  // Buscar informações do programa
  const { data: programInfo, isLoading } = useQuery({
    queryKey: ['affiliate-program-info-public'],
    queryFn: async () => {
      try {
        const response = await api.get('/affiliates/program-info');
        return (response as any).data || response;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const commissionPercentage = programInfo?.commissionPercentage || 10;
  const commissionMonths = programInfo?.commissionMonths || 6;
  const releasePeriod = programInfo?.releasePeriod || 33;
  const minWithdrawal = programInfo?.minWithdrawal ? Number(programInfo.minWithdrawal) : 50;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-background/80 pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-semibold">Programa de Afiliados</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Indique o Swipper e{' '}
                <span className="gradient-text">Ganhe Comissões</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Compartilhe o Swipper com sua audiência e ganhe comissões recorrentes sobre cada assinatura que você gerar.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="h-12 px-8 gradient-primary text-primary-foreground font-semibold text-base glow-primary">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-12 px-8">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="py-20 md:py-32 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Como Funciona
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Um processo simples em 3 passos para começar a ganhar
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>1. Cadastre-se</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Crie sua conta gratuita no Swipper e acesse a área de afiliados no dashboard.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>2. Gere seu Link</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Gere seu link único de afiliado e compartilhe com sua audiência através de qualquer canal.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>3. Ganhe Comissões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Receba comissões recorrentes toda vez que alguém se cadastrar pelo seu link e assinar um plano.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Detalhes do Programa */}
        {!isLoading && programInfo && (
          <section className="py-20 md:py-32 border-t border-border/50 bg-slate-50 dark:bg-background/80">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                      <Gift className="w-6 h-6 text-primary" />
                      Detalhes do Programa
                    </CardTitle>
                    <CardDescription>
                      Tudo que você precisa saber sobre comissões e pagamentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Comissão</h3>
                          <p className="text-sm text-muted-foreground">
                            Você recebe <span className="font-bold text-primary text-base">{commissionPercentage}%</span> de comissão sobre cada assinatura ativa
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Duração</h3>
                          <p className="text-sm text-muted-foreground">
                            Receba comissões por <span className="font-bold text-primary text-base">{commissionMonths} meses</span> sobre cada assinatura ativa
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Liberação</h3>
                          <p className="text-sm text-muted-foreground">
                            Comissões são liberadas após <span className="font-bold text-primary text-base">{releasePeriod} dias</span> do pagamento
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Saque Mínimo</h3>
                          <p className="text-sm text-muted-foreground">
                            Valor mínimo para solicitar saque: <span className="font-bold text-primary text-base">{formatCurrency(minWithdrawal)}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Como funciona:</strong> Compartilhe seu link único de afiliado. Quando alguém se cadastrar através do seu link e assinar um plano, você receberá {commissionPercentage}% de comissão sobre o valor da assinatura mensal por {commissionMonths} meses. As comissões ficam pendentes por {releasePeriod} dias e depois ficam disponíveis para saque via PIX.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Benefícios */}
        <section className="py-20 md:py-32 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Por que ser Afiliado?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Vantagens exclusivas do programa
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Gratuito para Participar</h3>
                    <p className="text-sm text-muted-foreground">
                      Não há custos para se tornar um afiliado. Cadastre-se e comece a ganhar imediatamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Comissões Recorrentes</h3>
                    <p className="text-sm text-muted-foreground">
                      Ganhe comissões mensais enquanto seus indicados mantiverem a assinatura ativa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Dashboard Completo</h3>
                    <p className="text-sm text-muted-foreground">
                      Acompanhe todas as suas estatísticas, indicados e comissões em tempo real.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Saques Rápidos</h3>
                    <p className="text-sm text-muted-foreground">
                      Solicite seus saques via PIX e receba em até 48 horas após a aprovação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 md:py-32 border-t border-border/50 bg-slate-50 dark:bg-background/80">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Pronto para começar a ganhar?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Cadastre-se gratuitamente e comece a compartilhar o Swipper hoje mesmo.
              </p>
              <Link to="/signup">
                <Button size="lg" className="h-12 px-8 gradient-primary text-primary-foreground font-semibold text-base glow-primary">
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

