import { Link } from 'react-router-dom';
import { Sparkles, Play, ArrowRight, Zap, BarChart3, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';

const features = [
  {
    icon: Zap,
    title: 'Scroll Viciante',
    description: 'Experiência estilo Reels que prende a atenção do usuário do início ao fim.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Acompanhe cada interação e otimize suas conversões em tempo real.',
  },
  {
    icon: Users,
    title: 'Alta Conversão',
    description: 'Aumente seu engajamento em até 300% com quizzes interativos.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-start/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-mid/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-end/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Nova forma de criar swippers</span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Quizzes que{' '}
              <span className="gradient-text">viciam</span>
              <br />
              como Reels
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Crie experiências de quiz interativas com rolagem vertical. 
              Engaje seu público como nunca antes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link to="/reels">
                <Button size="lg" className="h-14 px-8 gradient-primary text-primary-foreground font-semibold text-lg glow-primary hover:opacity-90 transition-opacity group">
                  <Play className="w-5 h-5 mr-2" />
                  Testar Agora
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="h-14 px-8 border-border hover:bg-surface-hover font-semibold text-lg gradient-border">
                  Ver Dashboard
                </Button>
              </Link>
            </div>

            {/* Phone Mockup */}
            <div className="mt-20 relative animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="relative mx-auto w-72 h-[580px] rounded-[3rem] bg-gradient-to-br from-gray-900 to-gray-800 p-3 shadow-2xl">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500">
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs mb-6">Pergunta 1 de 5</span>
                    <h3 className="text-xl font-bold text-center mb-8">Qual é o seu estilo de vida ideal?</h3>
                    <div className="w-full space-y-3">
                      {['🌍 Aventura e viagens', '🏠 Tranquilidade em casa', '🎉 Vida social ativa'].map((opt, i) => (
                        <div 
                          key={i} 
                          className={`w-full p-4 rounded-xl ${i === 0 ? 'bg-white text-gray-900' : 'bg-white/20'} text-sm font-medium`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -left-16 top-1/4 w-48 h-32 glass-card rounded-2xl p-4 animate-float hidden lg:block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Taxa de Conclusão</p>
                    <p className="text-xs text-muted-foreground">+15% este mês</p>
                  </div>
                </div>
                <p className="text-3xl font-bold gradient-text">78%</p>
              </div>

              <div className="absolute -right-16 top-1/3 w-48 h-32 glass-card rounded-2xl p-4 animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Respostas</p>
                    <p className="text-xs text-muted-foreground">Últimas 24h</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-accent">2.4k</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-muted-foreground animate-bounce">
          <span className="text-sm mb-2">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Por que <span className="gradient-text">ReelQuiz</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              A nova geração de quizzes interativos que convertem mais.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl glass-card border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow-primary">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Pronto para criar swippers{' '}
              <span className="gradient-text">irresistíveis</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Comece gratuitamente e veja seus resultados decolarem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="h-14 px-10 gradient-primary text-primary-foreground font-semibold text-lg glow-primary hover:opacity-90 transition-opacity">
                  Começar Grátis
                </Button>
              </Link>
              <Link to="/reels">
                <Button variant="ghost" size="lg" className="h-14 px-8 font-semibold text-lg">
                  Ver Demo
                  <Play className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold gradient-text">ReelQuiz</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ReelQuiz. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
