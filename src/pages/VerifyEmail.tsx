import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Token de verificação não fornecido');
        return;
      }

      try {
        await api.publicGet(`/auth/verify-email/${token}`);
        setStatus('success');
        toast.success('Email verificado com sucesso!');
        
        // Forçar atualização do usuário - aguardar e verificar
        let retries = 3;
        while (retries > 0) {
          try {
            await refreshUser();
            // Pequeno delay para garantir que o estado foi atualizado
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Verificar se o usuário foi atualizado (opcional - pode remover se não necessário)
            break;
          } catch (error) {
            retries--;
            if (retries === 0) {
              console.error('Failed to refresh user after email verification');
            } else {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
        
        // Redirecionar para dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        const message = err?.response?.data?.message || err?.message || 'Erro ao verificar email';
        setErrorMessage(message);
        toast.error(message);
      }
    };

    verifyEmail();
  }, [token, navigate, refreshUser]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('Email de verificação reenviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erro ao reenviar email';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo-dark.png"
            alt="ReelQuiz"
            className="h-10"
          />
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verificando email...
              </h1>
              <p className="text-gray-600">
                Aguarde enquanto verificamos seu email
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email verificado!
              </h1>
              <p className="text-gray-600 mb-6">
                Seu email foi verificado com sucesso. Você será redirecionado para o dashboard em instantes.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              >
                Ir para Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Erro na verificação
              </h1>
              <p className="text-gray-600 mb-6">
                {errorMessage || 'O token de verificação é inválido ou expirou.'}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Reenviar email de verificação
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Ir para Dashboard
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Precisa de ajuda?{' '}
          <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
            Entre em contato
          </Link>
        </p>
      </div>
    </div>
  );
}

