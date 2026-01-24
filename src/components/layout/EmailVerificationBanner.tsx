import { useState, useEffect } from 'react';
import { Mail, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function EmailVerificationBanner() {
  const { user, refreshUser } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Fetch app settings to check if email verification is required
  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      try {
        const response = await api.getSettings();
        return (response as any).data || response;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Check if should show banner
  const shouldShow = 
    !isDismissed &&
    user &&
    settings &&
    settings.requireEmailVerification &&
    !user.emailVerified;

  // Reset dismissed state when user changes or email is verified
  useEffect(() => {
    setIsDismissed(false);
    // Se o email foi verificado, garantir que o banner não apareça
    if (user?.emailVerified) {
      setIsDismissed(true);
    }
  }, [user?.id, user?.emailVerified]);

  // Force refresh user data when banner mounts to ensure we have latest data
  useEffect(() => {
    if (user && !user.emailVerified) {
      // Se usuário existe mas emailVerified não está definido ou é false, tentar refresh
      refreshUser().catch(() => {
        // Silently fail
      });
    }
  }, [user?.id, user?.emailVerified, refreshUser]); // Adicionar refreshUser às dependências

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await api.resendVerificationEmail();
      toast.success('Email de verificação reenviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erro ao reenviar email de verificação.';
      // Melhorar mensagem de erro para ser mais clara
      let errorMessage = message;
      if (message.includes('No active email provider') || message.includes('Nenhum provedor')) {
        errorMessage = 'Serviço de email não configurado. Entre em contato com o suporte.';
      } else if (message.includes('Email já foi verificado')) {
        errorMessage = 'Seu email já foi verificado.';
        // Atualizar usuário para refletir a verificação
        refreshUser().catch(() => {});
      } else if (err?.response?.status === 401) {
        errorMessage = 'Você precisa estar logado para reenviar o email.';
      } else if (err?.response?.status === 429) {
        errorMessage = 'Você já solicitou o reenvio recentemente. Tente novamente em 10 minutos.';
      }
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2 gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-600">
              Verifique seu email para ter acesso completo a todas as funcionalidades
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              disabled={isResending}
              className="border-red-600/30 text-red-600 hover:bg-red-500/20 hover:border-red-600/50 h-7 text-xs"
            >
              <Mail className="w-3 h-3 mr-1.5" />
              {isResending ? 'Enviando...' : 'Reenviar Email'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDismissed(true)}
              className="text-red-600 hover:bg-red-500/20 h-7 w-7"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

