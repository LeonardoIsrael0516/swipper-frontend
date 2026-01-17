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

export function ThemeEditor() {
  const { reel, setReel, hasUnsavedChanges, setHasUnsavedChanges } = useBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [seoTitle, setSeoTitle] = useState(reel?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(reel?.seoDescription || '');
  const [faviconUrl, setFaviconUrl] = useState(reel?.faviconUrl || '');
  const [showProgressBar, setShowProgressBar] = useState(reel?.showProgressBar || false);
  const [isUploading, setIsUploading] = useState(false);

  // Sincronizar estado quando reel mudar
  useEffect(() => {
    setSeoTitle(reel?.seoTitle || '');
    setSeoDescription(reel?.seoDescription || '');
    setFaviconUrl(reel?.faviconUrl || '');
    setShowProgressBar(reel?.showProgressBar || false);
  }, [reel?.seoTitle, reel?.seoDescription, reel?.faviconUrl, reel?.showProgressBar]);

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

  const updateReelData = useCallback(
    async (data: { seoTitle?: string; seoDescription?: string; faviconUrl?: string; showProgressBar?: boolean }) => {
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
          onChange={(e) => setSeoTitle(e.target.value)}
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
          onChange={(e) => setSeoDescription(e.target.value)}
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
    </div>
  );
}

