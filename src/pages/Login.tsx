import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      
      // Wait a tick to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Redirect to intended page or dashboard
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle redirect if already authenticated (e.g., user navigated to login page while logged in)
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, searchParams]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
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
              alt="ReelQuiz"
              className="h-10 transition-all duration-300 group-hover:opacity-80"
            />
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">
              Bem-vindo de volta
            </h1>
            <p className="text-muted-foreground text-lg">
              Entre na sua conta para continuar criando swippers incríveis
            </p>
          </div>

          {/* Login Form */}
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="pl-11 pr-11 h-12 bg-surface border-border focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-gray-600 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base glow-primary hover:opacity-90 transition-opacity group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>Carregando...</>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          {/* Social Login */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-12 border-border hover:bg-surface-hover transition-colors"
            onClick={() => api.initiateGoogleAuth()}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </Button>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-muted-foreground">
            Não tem uma conta?{' '}
            <Link 
              to={searchParams.get('redirect') ? `/signup?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : '/signup'} 
              className="text-primary font-medium hover:text-gray-600 transition-colors"
            >
              Criar conta
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
            {/* Floating Phone Mockup */}
            <div className="mb-12 animate-float">
              <div className="w-64 h-[500px] bg-black/20 backdrop-blur-lg rounded-[3rem] border border-white/20 mx-auto p-3 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 rounded-full bg-white/20 mb-4" />
                  <div className="w-3/4 h-3 bg-white/20 rounded-full mb-2" />
                  <div className="w-1/2 h-3 bg-white/20 rounded-full mb-8" />
                  
                  {/* Quiz Options */}
                  <div className="w-full space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className="w-full h-14 bg-white/10 backdrop-blur rounded-xl border border-white/20 flex items-center px-4"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/20 mr-3" />
                        <div className="w-2/3 h-2 bg-white/30 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <h2 className="font-display text-3xl font-bold mb-4">
              Quizzes que viciam
            </h2>
            <p className="text-white/80 text-lg">
              Crie experiências de quiz interativas com rolagem estilo Reels. 
              Engaje seu público como nunca antes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
