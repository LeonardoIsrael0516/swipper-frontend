import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { validateEmail } from '@/lib/email-validator';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validar email antes de enviar
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Email inválido');
      return;
    }

    setIsLoading(true);

    try {
      await api.publicPost('/auth/forgot-password', { email });
      setSuccess(true);
      toast.success('Se o email existir, você receberá instruções para redefinir sua senha.');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao solicitar redefinição de senha. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12 group">
            <img
              src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'}
              alt="Swipper"
              className="h-10 transition-all duration-300 group-hover:opacity-80"
            />
          </Link>

          {/* Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
          </Link>

          {/* Title */}
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">
              Esqueceu sua senha?
            </h1>
            <p className="text-muted-foreground text-lg">
              Não se preocupe! Digite seu email e enviaremos instruções para redefinir sua senha.
            </p>
          </div>

          {/* Form */}
          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                    Email enviado com sucesso!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Se o email existir em nossa base, você receberá instruções para redefinir sua senha. Verifique sua caixa de entrada e spam.
                  </p>
                </div>
              </div>
              <Link to="/login">
                <Button className="w-full h-12">
                  Voltar para login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="pl-11 h-12 bg-surface border-border focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base glow-primary hover:opacity-90 transition-opacity group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>Enviando...</>
                ) : (
                  <>
                    Enviar instruções
                    <ArrowLeft className="w-5 h-5 ml-2 group-hover:-translate-x-1 transition-transform rotate-180" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Login Link */}
          <p className="text-center mt-8 text-muted-foreground">
            Lembrou sua senha?{' '}
            <Link to="/login" className="text-primary font-medium hover:text-gray-600 transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="text-center max-w-lg">
            <h2 className="font-display text-3xl font-bold mb-4">
              Recupere sua conta
            </h2>
            <p className="text-white/80 text-lg">
              Siga as instruções que enviaremos por email para redefinir sua senha e voltar a criar swippers incríveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

