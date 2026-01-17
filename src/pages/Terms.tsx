import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export default function Terms() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'}
              alt="ReelQuiz"
              className="h-8"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar a plataforma ReelQuiz, você concorda em cumprir e estar vinculado a estes Termos de Uso.
              Se você não concorda com qualquer parte destes termos, não deve usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Uso da Plataforma</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos de Uso.
              Você não deve:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Usar a plataforma para qualquer propósito ilegal ou não autorizado</li>
              <li>Violar qualquer lei local, estadual, nacional ou internacional</li>
              <li>Transmitir qualquer conteúdo que seja ofensivo, difamatório ou prejudicial</li>
              <li>Interferir ou interromper o funcionamento da plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Conta de Usuário</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em aceitar
              responsabilidade por todas as atividades que ocorram sob sua conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo da plataforma, incluindo textos, gráficos, logos e software, é propriedade da ReelQuiz
              ou de seus fornecedores de conteúdo e está protegido por leis de direitos autorais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A ReelQuiz não será responsável por quaisquer danos diretos, indiretos, incidentais ou consequenciais
              resultantes do uso ou incapacidade de usar a plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Modificações dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações entrarão
              em vigor imediatamente após a publicação. É sua responsabilidade revisar periodicamente estes termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através dos canais
              disponíveis na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

