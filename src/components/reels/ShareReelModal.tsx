import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Share2, Mail, Link2, Copy, X, Trash2, Loader2 } from 'lucide-react';

interface ShareReelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reelId: string;
  reelTitle: string;
}

export function ShareReelModal({ open, onOpenChange, reelId, reelTitle }: ShareReelModalProps) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [templateLink, setTemplateLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const queryClient = useQueryClient();

  // Buscar compartilhamentos existentes
  const { data: shares, refetch: refetchShares } = useQuery({
    queryKey: ['reel-shares', reelId],
    queryFn: async () => {
      const response = await api.get(`/reels/${reelId}/shares`);
      return (response as any).data || response;
    },
    enabled: open && reelId !== '',
  });

  // Buscar template share existente
  const { data: existingTemplateShare, refetch: refetchTemplateShare } = useQuery({
    queryKey: ['reel-template-share', reelId],
    queryFn: async () => {
      try {
        const response = await api.get(`/reels/${reelId}/template-share`);
        const data = (response as any).data || response;
        return data;
      } catch {
        return null;
      }
    },
    enabled: open && reelId !== '',
  });

  const handleShareAccess = async () => {
    if (!email.trim()) {
      toast.error('Por favor, informe um email');
      return;
    }

    setIsSharing(true);
    try {
      await api.post(`/reels/${reelId}/share-access`, { email: email.trim() });
      toast.success('Acesso compartilhado com sucesso!');
      setEmail('');
      refetchShares();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Erro ao compartilhar acesso';
      toast.error(message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await api.delete(`/reels/${reelId}/shares/${shareId}`);
      toast.success('Compartilhamento removido com sucesso!');
      refetchShares();
      queryClient.invalidateQueries({ queryKey: ['user-reels'] });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Erro ao remover compartilhamento';
      toast.error(message);
    }
  };

  const handleGenerateTemplateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const response = await api.post(`/reels/${reelId}/share-template`);
      const data = (response as any).data || response;
      setTemplateLink(data.publicUrl);
      toast.success('Link de template gerado com sucesso!');
      refetchTemplateShare();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Erro ao gerar link de template';
      toast.error(message);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Atualizar templateLink quando existingTemplateShare mudar
  useEffect(() => {
    if (existingTemplateShare?.publicUrl) {
      setTemplateLink(existingTemplateShare.publicUrl);
    } else if (existingTemplateShare === null && !isGeneratingLink) {
      // Se não há template share e não está gerando, limpar link
      setTemplateLink(null);
    }
  }, [existingTemplateShare, isGeneratingLink]);

  const handleCopyLink = () => {
    if (templateLink) {
      navigator.clipboard.writeText(templateLink);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleClose = () => {
    setEmail('');
    setTemplateLink(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartilhar Swipper
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{reelTitle}" com outros usuários ou crie um link público de template.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="access" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="access">Compartilhar Acesso</TabsTrigger>
            <TabsTrigger value="template">Compartilhar Template</TabsTrigger>
          </TabsList>

          {/* Aba: Compartilhar Acesso */}
          <TabsContent value="access" className="space-y-4 mt-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">Como funciona?</h4>
              <p className="text-sm text-muted-foreground">
                Ao compartilhar acesso, o usuário selecionado poderá editar este swipper junto com você.
                Todas as mudanças são sincronizadas em tempo real para ambos os usuários. O usuário receberá
                um email automático com as instruções.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-email">Email do usuário</Label>
              <div className="flex gap-2">
                <Input
                  id="share-email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSharing && email.trim()) {
                      handleShareAccess();
                    }
                  }}
                />
                <Button
                  onClick={handleShareAccess}
                  disabled={isSharing || !email.trim()}
                  className="gradient-primary text-primary-foreground"
                >
                  {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Lista de usuários com acesso */}
            {shares && shares.length > 0 && (
              <div className="space-y-2">
                <Label>Usuários com acesso compartilhado</Label>
                <div className="space-y-2">
                  {shares.map((share: any) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{share.sharedWith.name || share.sharedWith.email}</p>
                          <p className="text-xs text-muted-foreground">{share.sharedWith.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba: Compartilhar Template */}
          <TabsContent value="template" className="space-y-4 mt-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">Como funciona?</h4>
              <p className="text-sm text-muted-foreground">
                Ao compartilhar como template, outras pessoas poderão importar uma cópia independente deste swipper.
                As mudanças não refletem entre as cópias - cada importação cria um novo swipper completamente separado.
              </p>
            </div>

            {templateLink ? (
              <div className="space-y-2">
                <Label>Link público do template</Label>
                <div className="flex gap-2">
                  <Input
                    value={templateLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleCopyLink} variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <Button
                  onClick={handleGenerateTemplateLink}
                  variant="outline"
                  className="w-full"
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando novo link...
                    </>
                  ) : (
                    'Gerar novo link (revoga anterior)'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleGenerateTemplateLink}
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando link...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Gerar link público
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

