import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, Loader2, X } from 'lucide-react';
import { useBuilder } from '@/contexts/BuilderContext';
import { uploadFile } from '@/lib/media';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { SocialConfig } from '@/contexts/BuilderContext';

export function ThemeEditor() {
  const { reel, setReel, hasUnsavedChanges, setHasUnsavedChanges } = useBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [seoTitle, setSeoTitle] = useState(reel?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(reel?.seoDescription || '');
  const [faviconUrl, setFaviconUrl] = useState(reel?.faviconUrl || '');
  const [showProgressBar, setShowProgressBar] = useState(reel?.showProgressBar || false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Refs para rastrear quando estamos editando
  const isEditingSeoTitleRef = useRef(false);
  const isEditingSeoDescriptionRef = useRef(false);
  
  // Estados para configurações sociais
  const [socialConfig, setSocialConfig] = useState<SocialConfig>({
    enabled: reel?.socialConfig?.enabled || false,
    showAvatar: reel?.socialConfig?.showAvatar ?? true,
    showLike: reel?.socialConfig?.showLike ?? true,
    showComment: reel?.socialConfig?.showComment ?? true,
    showShare: reel?.socialConfig?.showShare ?? true,
    showUsername: reel?.socialConfig?.showUsername ?? true,
    showCaptions: reel?.socialConfig?.showCaptions || false,
    username: reel?.socialConfig?.username || '',
    avatarUrl: reel?.socialConfig?.avatarUrl || '',
    initialLikes: reel?.socialConfig?.initialLikes || 0,
    initialComments: reel?.socialConfig?.initialComments || 0,
    incrementInterval: reel?.socialConfig?.incrementInterval || 3,
  });

  // Sincronizar estado quando reel mudar
  // Mas apenas se não estivermos editando ativamente
  useEffect(() => {
    if (!isEditingSeoTitleRef.current) {
      setSeoTitle(reel?.seoTitle || '');
    }
    if (!isEditingSeoDescriptionRef.current) {
      setSeoDescription(reel?.seoDescription || '');
    }
    setFaviconUrl(reel?.faviconUrl || '');
    setShowProgressBar(reel?.showProgressBar || false);
    if (reel?.socialConfig) {
      setSocialConfig({
        enabled: reel.socialConfig.enabled || false,
        showAvatar: reel.socialConfig.showAvatar ?? true,
        showLike: reel.socialConfig.showLike ?? true,
        showComment: reel.socialConfig.showComment ?? true,
        showShare: reel.socialConfig.showShare ?? true,
        showUsername: reel.socialConfig.showUsername ?? true,
        showCaptions: reel.socialConfig.showCaptions || false,
        username: reel.socialConfig.username || '',
        avatarUrl: reel.socialConfig.avatarUrl || '',
        initialLikes: reel.socialConfig.initialLikes || 0,
        initialComments: reel.socialConfig.initialComments || 0,
        incrementInterval: reel.socialConfig.incrementInterval || 3,
      });
    }
  }, [reel?.seoTitle, reel?.seoDescription, reel?.faviconUrl, reel?.showProgressBar, reel?.socialConfig]);

  // Debounce para seoTitle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reel && seoTitle !== (reel.seoTitle || '')) {
        updateReelData({ seoTitle: seoTitle || undefined });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [seoTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce para seoDescription
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reel && seoDescription !== (reel.seoDescription || '')) {
        updateReelData({ seoDescription: seoDescription || undefined });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [seoDescription]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce para socialConfig
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reel) {
        updateReelData({ socialConfig });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [socialConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateReelData = useCallback(
    async (data: { seoTitle?: string; seoDescription?: string; faviconUrl?: string; showProgressBar?: boolean; socialConfig?: SocialConfig }) => {
      if (!reel) return;

      // Atualizar estado local imediatamente
      const updatedReel = {
        ...reel,
        ...data,
      };
      setReel(updatedReel);

      // Salvar no backend de forma assíncrona
      try {
        await api.patch(`/reels/${reel.id}`, data);
        
        // Marcar como tendo mudanças não salvas se estiver em DRAFT
        // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
        if (reel.status === 'DRAFT') {
          setHasUnsavedChanges(true);
        } else {
          setHasUnsavedChanges(true);
        }
      } catch (error: any) {
        toast.error('Erro ao salvar configurações: ' + (error.message || 'Erro desconhecido'));
      }
    },
    [reel, setReel, setHasUnsavedChanges]
  );


  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo (apenas imagens)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use imagens (JPG, PNG, GIF, WebP, ICO)');
      return;
    }

    // Validar tamanho (1MB para favicon)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 1MB');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadFile(file);
      setFaviconUrl(url);
      await updateReelData({ faviconUrl: url });
      toast.success('Favicon enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar favicon: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFavicon = async () => {
    setFaviconUrl('');
    await updateReelData({ faviconUrl: undefined });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use imagens (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamanho (10MB para avatar)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadFile(file);
      setSocialConfig((prev) => ({ ...prev, avatarUrl: url }));
      toast.success('Avatar enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar avatar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingAvatar(false);
      // Limpar input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setSocialConfig((prev) => ({ ...prev, avatarUrl: undefined }));
  };

  if (!reel) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título SEO */}
      <div className="space-y-2">
        <Label htmlFor="seoTitle">Título SEO</Label>
        <Input
          id="seoTitle"
          type="text"
          value={seoTitle}
          onChange={(e) => {
            isEditingSeoTitleRef.current = true;
            setSeoTitle(e.target.value);
          }}
          onFocus={() => {
            isEditingSeoTitleRef.current = true;
          }}
          onBlur={() => {
            setTimeout(() => {
              isEditingSeoTitleRef.current = false;
            }, 200);
          }}
          placeholder="Título que aparecerá na aba do navegador"
          maxLength={60}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          {seoTitle.length}/60 caracteres. Este título aparecerá na aba do navegador.
        </p>
      </div>

      {/* Descrição SEO */}
      <div className="space-y-2">
        <Label htmlFor="seoDescription">Descrição SEO</Label>
        <Textarea
          id="seoDescription"
          value={seoDescription}
          onChange={(e) => {
            isEditingSeoDescriptionRef.current = true;
            setSeoDescription(e.target.value);
          }}
          onFocus={() => {
            isEditingSeoDescriptionRef.current = true;
          }}
          onBlur={() => {
            setTimeout(() => {
              isEditingSeoDescriptionRef.current = false;
            }, 200);
          }}
          placeholder="Descrição que aparecerá nos resultados de busca"
          maxLength={160}
          rows={4}
          className="w-full resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {seoDescription.length}/160 caracteres. Esta descrição aparecerá nos resultados de busca.
        </p>
      </div>

      {/* Favicon */}
      <div className="space-y-2">
        <Label>Favicon</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/x-icon,image/vnd.microsoft.icon"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        {faviconUrl ? (
          <div className="mt-2 space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-16 h-16 border rounded flex items-center justify-center bg-background">
                <img
                  src={faviconUrl}
                  alt="Favicon"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Favicon carregado</p>
                <p className="text-xs text-muted-foreground truncate">{faviconUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Trocar Favicon'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveFavicon}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isUploading ? "border-primary bg-primary/5 opacity-50 pointer-events-none" : "border-border hover:border-border"
            )}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 mx-auto mb-2 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Enviando favicon...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Arraste uma imagem aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  ou clique para selecionar (ICO, PNG, JPG, GIF, WebP - até 1MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showProgressBar">Barra de Progresso</Label>
            <p className="text-xs text-muted-foreground">
              Exibe uma barra de progresso no topo da página mostrando o progresso através dos slides
            </p>
          </div>
          <Switch
            id="showProgressBar"
            checked={showProgressBar}
            onCheckedChange={(checked) => {
              setShowProgressBar(checked);
              updateReelData({ showProgressBar: checked });
            }}
          />
        </div>
      </div>

      {/* Elementos Sociais */}
      <div className="space-y-6 pt-6 border-t">
        <div>
          <h3 className="text-lg font-semibold mb-2">Elementos Sociais</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure os elementos de interação social estilo TikTok
          </p>
        </div>

        {/* Habilitar Elementos Sociais */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="socialEnabled">Habilitar Elementos Sociais</Label>
              <p className="text-xs text-muted-foreground">
                Ativa os botões de interação social (curtir, comentar, compartilhar)
              </p>
            </div>
            <Switch
              id="socialEnabled"
              checked={socialConfig.enabled || false}
              onCheckedChange={(checked) => {
                setSocialConfig((prev) => ({ ...prev, enabled: checked }));
              }}
            />
          </div>
        </div>

        {socialConfig.enabled && (
          <>
            {/* Nome de Usuário */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showUsername">Mostrar Nome de Usuário</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe o nome de usuário na parte inferior esquerda
                  </p>
                </div>
                <Switch
                  id="showUsername"
                  checked={socialConfig.showUsername ?? true}
                  onCheckedChange={(checked) => {
                    setSocialConfig((prev) => ({ ...prev, showUsername: checked }));
                  }}
                />
              </div>
              {socialConfig.showUsername && (
                <div className="mt-2">
                  <Input
                    placeholder="@seu_usuario"
                    value={socialConfig.username || ''}
                    onChange={(e) => {
                      setSocialConfig((prev) => ({ ...prev, username: e.target.value }));
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showAvatar">Mostrar Avatar</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe avatar com botão de seguir na direita
                  </p>
                </div>
                <Switch
                  id="showAvatar"
                  checked={socialConfig.showAvatar ?? true}
                  onCheckedChange={(checked) => {
                    setSocialConfig((prev) => ({ ...prev, showAvatar: checked }));
                  }}
                />
              </div>
              {socialConfig.showAvatar && (
                <div className="mt-2 space-y-3">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  {socialConfig.avatarUrl ? (
                    <>
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                        <div className="flex-shrink-0 w-16 h-16 border rounded-full overflow-hidden bg-background">
                          <img
                            src={socialConfig.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">Avatar carregado</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploadingAvatar ? 'Enviando...' : 'Trocar Avatar'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                        isUploadingAvatar ? "border-primary bg-primary/5 opacity-50 pointer-events-none" : "border-border hover:border-primary"
                      )}
                      onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Enviando avatar...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-1">
                            Clique para fazer upload do avatar
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, GIF, WebP - até 10MB
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Curtir */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showLike">Mostrar Botão de Curtir</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe botão de curtir (funcionalidade real)
                  </p>
                </div>
                <Switch
                  id="showLike"
                  checked={socialConfig.showLike ?? true}
                  onCheckedChange={(checked) => {
                    setSocialConfig((prev) => ({ ...prev, showLike: checked }));
                  }}
                />
              </div>
              {socialConfig.showLike && (
                <div className="mt-2">
                  <Label htmlFor="initialLikes">Curtidas Iniciais</Label>
                  <Input
                    id="initialLikes"
                    type="number"
                    min="0"
                    value={socialConfig.initialLikes || 0}
                    onChange={(e) => {
                      setSocialConfig((prev) => ({ ...prev, initialLikes: parseInt(e.target.value) || 0 }));
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Comentar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showComment">Mostrar Botão de Comentar</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe botão de comentar (apenas visual)
                  </p>
                </div>
                <Switch
                  id="showComment"
                  checked={socialConfig.showComment ?? true}
                  onCheckedChange={(checked) => {
                    setSocialConfig((prev) => ({ ...prev, showComment: checked }));
                  }}
                />
              </div>
              {socialConfig.showComment && (
                <div className="mt-2">
                  <Label htmlFor="initialComments">Comentários Iniciais</Label>
                  <Input
                    id="initialComments"
                    type="number"
                    min="0"
                    value={socialConfig.initialComments || 0}
                    onChange={(e) => {
                      setSocialConfig((prev) => ({ ...prev, initialComments: parseInt(e.target.value) || 0 }));
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Compartilhar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showShare">Mostrar Botão de Compartilhar</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe botão de compartilhar (apenas visual)
                  </p>
                </div>
                <Switch
                  id="showShare"
                  checked={socialConfig.showShare ?? true}
                  onCheckedChange={(checked) => {
                    setSocialConfig((prev) => ({ ...prev, showShare: checked }));
                  }}
                />
              </div>
            </div>

            {/* Legendas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showCaptions">Habilitar Legendas</Label>
                  <p className="text-xs text-muted-foreground">
                    Permite adicionar legendas em cada slide
                  </p>
                </div>
                <Switch
                  id="showCaptions"
                  checked={socialConfig.showCaptions || false}
                  onCheckedChange={(checked) => {
                    setSocialConfig((prev) => ({ ...prev, showCaptions: checked }));
                  }}
                />
              </div>
            </div>

            {/* Intervalo de Incremento */}
            <div className="space-y-2">
              <Label htmlFor="incrementInterval">Intervalo de Incremento (segundos)</Label>
              <Input
                id="incrementInterval"
                type="number"
                min="1"
                max="60"
                value={socialConfig.incrementInterval || 3}
                onChange={(e) => {
                  setSocialConfig((prev) => ({ ...prev, incrementInterval: parseInt(e.target.value) || 3 }));
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Intervalo em segundos para incremento automático dos números (curtidas e comentários)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

