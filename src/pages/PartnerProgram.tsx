import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  Gift,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';

export default function PartnerProgram() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: '',
    hasDigitalRevenue: '',
    revenue: '',
    description: '',
  });

  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    if (!formData.name.trim() || !formData.email.trim() || !formData.whatsapp.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor, insira um e-mail válido');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.publicPost<{ message: string }>('/partner/submit', formData);
      toast.success(response?.message || 'Formulário enviado com sucesso! Entraremos em contato em breve.');
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        whatsapp: '',
        role: '',
        hasDigitalRevenue: '',
        revenue: '',
        description: '',
      });
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      const errorMessage = error?.message || error?.error || 'Erro ao enviar formulário. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Users className="w-4 h-4" />
                <span className="text-sm font-semibold">Programa de Parceiros</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Seja Parceiro do{' '}
                <span className="gradient-text">Swipper</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Estabeleça parcerias estratégicas, ganhe benefícios exclusivos e até mesmo uma conta gratuita. 
                Vamos crescer juntos!
              </p>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="py-20 md:py-32 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Benefícios de ser Parceiro
                </h2>
                <p className="text-lg text-muted-foreground">
                  O que você ganha ao se tornar parceiro do Swipper
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Parcerias Estratégicas</h3>
                    <p className="text-sm text-muted-foreground">
                      Estabeleça parcerias que geram valor para ambas as partes e abrem novas oportunidades de negócio.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Conta Gratuita</h3>
                    <p className="text-sm text-muted-foreground">
                      Parceiros qualificados podem receber acesso gratuito à plataforma Swipper.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Suporte Prioritário</h3>
                    <p className="text-sm text-muted-foreground">
                      Receba suporte dedicado e prioridade no atendimento para suas necessidades.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Oportunidades Exclusivas</h3>
                    <p className="text-sm text-muted-foreground">
                      Acesso antecipado a novos recursos, eventos exclusivos e oportunidades de colaboração.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section className="py-20 md:py-32 border-t border-border/50 bg-slate-50 dark:bg-background/80">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                    <Gift className="w-6 h-6 text-primary" />
                    Cadastre-se como Parceiro
                  </CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e nossa equipe entrará em contato em breve
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nome <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        E-mail <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">
                        WhatsApp <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        type="tel"
                        required
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    {/* O que você é */}
                    <div className="space-y-2">
                      <Label htmlFor="role">
                        O que você é?
                      </Label>
                      <Input
                        id="role"
                        name="role"
                        type="text"
                        value={formData.role}
                        onChange={handleChange}
                        placeholder="Ex: Influencer, Agência, Criador de Conteúdo, etc."
                      />
                    </div>

                    {/* Já fatura no digital */}
                    <div className="space-y-2">
                      <Label htmlFor="hasDigitalRevenue">
                        Já fatura no digital?
                      </Label>
                      <select
                        id="hasDigitalRevenue"
                        name="hasDigitalRevenue"
                        value={formData.hasDigitalRevenue}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecione uma opção</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>

                    {/* Faturamento */}
                    {formData.hasDigitalRevenue === 'sim' && (
                      <div className="space-y-2">
                        <Label htmlFor="revenue">
                          Qual seu faturamento?
                        </Label>
                        <Input
                          id="revenue"
                          name="revenue"
                          type="text"
                          value={formData.revenue}
                          onChange={handleChange}
                          placeholder="Ex: R$ 10.000/mês"
                        />
                      </div>
                    )}

                    {/* Descrição */}
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Descrição
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={5}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Conte-nos mais sobre você, sua proposta de parceria ou qualquer informação adicional que considere relevante..."
                        className="resize-none"
                      />
                    </div>

                    {/* Botão Submit */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 gradient-primary text-primary-foreground font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar Formulário
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

