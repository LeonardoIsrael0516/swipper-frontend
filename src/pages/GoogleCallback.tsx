import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const userParam = searchParams.get('user');

      // Verificar se há erro
      if (error) {
        setStatus('error');
        setErrorMessage(error === 'authentication_failed' 
          ? 'Falha na autenticação com Google. Tente novamente.' 
          : decodeURIComponent(error));
        toast.error('Erro ao autenticar com Google');
        return;
      }

      // Verificar se temos os tokens
      if (!accessToken || !refreshToken) {
        setStatus('error');
        setErrorMessage('Tokens de autenticação não recebidos');
        toast.error('Erro ao autenticar com Google');
        return;
      }

      try {
        // Salvar tokens no localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Salvar usuário se fornecido
        if (userParam) {
          try {
            const user = JSON.parse(userParam);
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            // Se não conseguir parsear, não é crítico - refreshUser vai buscar
          }
        }

        // Atualizar contexto de autenticação
        await refreshUser();

        setStatus('success');
        toast.success('Login realizado com sucesso!');

        // Redirecionar para dashboard após um breve delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error?.message || 'Erro ao processar autenticação');
        toast.error('Erro ao processar autenticação');
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Autenticando com Google...</h2>
            <p className="text-muted-foreground">Aguarde enquanto processamos sua autenticação.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Autenticação bem-sucedida!</h2>
            <p className="text-muted-foreground">Redirecionando para o dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Erro na autenticação</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="pt-4">
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:text-primary/80 underline"
              >
                Voltar para o login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

