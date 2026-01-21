import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Token inválido. Por favor, solicite um novo link de redefinição de senha.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!token) {
      setError('Token inválido. Por favor, solicite um novo link de redefinição de senha.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      await api.publicPost('/auth/reset-password', {
        token,
        newPassword: password,
      });
      
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao redefinir senha. O token pode estar expirado ou inválido.';
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

          {/* Title */}
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">
              Redefinir senha
            </h1>
            <p className="text-muted-foreground text-lg">
              Digite sua nova senha abaixo
            </p>
          </div>

          {/* Form */}
          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                    Senha redefinida com sucesso!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Você será redirecionado para a página de login em instantes.
                  </p>
                </div>
              </div>
              <Link to="/login">
                <Button className="w-full h-12">
                  Ir para login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-destructive mb-1">{error}</p>
                    {error.includes('expirado') || error.includes('inválido') ? (
                      <Link
                        to="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Solicitar novo link de redefinição
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Nova senha
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
                    minLength={8}
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
                <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="pl-11 pr-11 h-12 bg-surface border-border focus:border-primary transition-colors"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !token}
                className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base glow-primary hover:opacity-90 transition-opacity group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>Redefinindo...</>
                ) : (
                  <>
                    Redefinir senha
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Links */}
          <div className="text-center mt-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Lembrou sua senha?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-gray-600 transition-colors">
                Fazer login
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Precisa de um novo link?{' '}
              <Link to="/forgot-password" className="text-primary font-medium hover:text-gray-600 transition-colors">
                Solicitar novamente
              </Link>
            </p>
          </div>
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
              Crie uma nova senha
            </h2>
            <p className="text-white/80 text-lg">
              Escolha uma senha forte para proteger sua conta e continuar criando swippers incríveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

