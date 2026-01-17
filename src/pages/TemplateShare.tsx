import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';
import { Loader2, Download, LogIn, FileText, Image as ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function TemplateShare() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  // Buscar template compartilhado (público)
  const { data: template, isLoading, error } = useQuery({
    queryKey: ['shared-template', token],
    queryFn: async () => {
      const response = await api.get(`/reels/templates/${token}`);
      return (response as any).data || response;
    },
    enabled: !!token,
  });

  useEffect(() => {
    // Se o token estava no localStorage e o usuário acabou de fazer login
    const savedToken = sessionStorage.getItem('pendingTemplateImport');
    if (savedToken === token && isAuthenticated && !isAuthLoading) {
      handleImportTemplate();
      sessionStorage.removeItem('pendingTemplateImport');
    }
  }, [isAuthenticated, isAuthLoading, token]);

  const handleImportTemplate = async () => {
    if (!token) return;

    // Se não estiver autenticado, salvar token e redirecionar para login
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingTemplateImport', token);
      navigate(`/login?redirect=/template/${token}`);
      return;
    }

    setIsImporting(true);
    try {
      const response = await api.post(`/reels/import-template/${token}`);
      const newReel = (response as any).data || response;
      
      // Invalidar queries para atualizar dashboard
      queryClient.invalidateQueries({ queryKey: ['user-reels'] });
      
      toast.success('Template importado com sucesso!');
      navigate(`/builder/${newReel.id}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Erro ao importar template';
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Template não encontrado</CardTitle>
              <CardDescription>
                O link de template compartilhado pode estar inválido ou expirado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Voltar para início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 pt-20 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">{template.title}</h1>
            {template.description && (
              <p className="text-muted-foreground text-lg">{template.description}</p>
            )}
            {template.owner?.name && (
              <p className="text-sm text-muted-foreground">
                Criado por <span className="font-medium">{template.owner.name}</span>
              </p>
            )}
          </div>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Preview do Template
              </CardTitle>
              <CardDescription>
                Este template contém {template.slides?.length || 0} slide(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {template.slides && template.slides.length > 0 ? (
                <div className="space-y-4">
                  {template.slides.map((slide: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border bg-surface/50"
                      style={{
                        backgroundColor: slide.backgroundColor || undefined,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium">{slide.question || 'Slide sem título'}</h4>
                          {slide.options && slide.options.length > 0 && (
                            <div className="space-y-1 mt-2">
                              {slide.options.map((option: any, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className="text-sm text-muted-foreground flex items-center gap-2"
                                >
                                  <span>{option.emoji}</span>
                                  <span>{option.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {slide.elements && slide.elements.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <ImageIcon className="w-3 h-3" />
                              <span>{slide.elements.length} elemento(s)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum slide encontrado neste template
                </p>
              )}
            </CardContent>
          </Card>

          {/* Import Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button
                onClick={handleImportTemplate}
                disabled={isImporting}
                size="lg"
                className="gradient-primary text-primary-foreground h-14 px-8"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Importar Template
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleImportTemplate}
                size="lg"
                className="gradient-primary text-primary-foreground h-14 px-8"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Fazer Login para Importar
              </Button>
            )}
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
              className="h-14 px-8"
            >
              Voltar para início
            </Button>
          </div>

          {/* Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Ao importar este template, você criará uma cópia independente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

