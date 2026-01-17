import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { extractYouTubeId, isValidYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/youtube';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Video, Youtube, Loader2, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Função helper para normalizar uiConfig
const normalizeUiConfig = (uiConfig: any): any => {
  if (!uiConfig) return {};
  if (typeof uiConfig === 'string') {
    try {
      return JSON.parse(uiConfig);
    } catch {
      return {};
    }
  }
  if (typeof uiConfig === 'object' && uiConfig !== null) {
    return uiConfig;
  }
  return {};
};

interface VideoElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function VideoElementEditor({ element, tab }: VideoElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoSource, setVideoSource] = useState<'upload' | 'youtube'>(config.videoUrl ? 'upload' : config.youtubeUrl ? 'youtube' : 'upload');
  const [youtubeUrl, setYoutubeUrl] = useState(config.youtubeUrl || '');
  const [videoUrl, setVideoUrl] = useState(config.videoUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(config.thumbnailUrl || '');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>(config.orientation || 'vertical');
  
  // Design options
  // Se autoplay=true, automaticamente muted=true (política do navegador/YouTube)
  const [autoplay, setAutoplay] = useState(config.autoplay !== undefined ? config.autoplay : true);
  const [loop, setLoop] = useState(config.loop !== undefined ? config.loop : true);
  const [controls, setControls] = useState(config.controls !== undefined ? config.controls : false);
  const [borderRadius, setBorderRadius] = useState(config.borderRadius || 0);
  
  // Muted é automático: se autoplay=true, então muted=true
  // Mantemos o valor salvo para compatibilidade, mas não mostramos a opção
  const effectiveMuted = autoplay ? true : (config.muted !== undefined ? config.muted : false);

  const { uploadVideo, status, progress, isUploading, isTranscoding } = useVideoUpload({
    onComplete: (result) => {
      if (result.playbackUrl) {
        setVideoUrl(result.playbackUrl);
        if (result.thumbnailUrl) {
          setThumbnailUrl(result.thumbnailUrl);
        }
      }
    },
    onError: (error) => {
      toast.error(`Erro ao processar vídeo: ${error}`);
    },
  });

  // Sincronizar quando element mudar externamente
  // IMPORTANTE: Quando o elemento muda (novo ID), resetar TODOS os campos para evitar herança
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    // Resetar todos os campos baseado no novo elemento
    // Isso previne que dados do elemento anterior sejam mantidos
    if (normalizedConfig.youtubeUrl) {
      setVideoSource('youtube');
      setYoutubeUrl(normalizedConfig.youtubeUrl);
      setVideoUrl(''); // Limpar videoUrl quando usando YouTube
    } else if (normalizedConfig.videoUrl) {
      setVideoSource('upload');
      setVideoUrl(normalizedConfig.videoUrl);
      setYoutubeUrl(''); // Limpar youtubeUrl quando usando upload
    } else {
      // Se não tem nenhum vídeo configurado, resetar para defaults
      setVideoSource('upload');
      setYoutubeUrl('');
      setVideoUrl('');
    }
    
    setThumbnailUrl(normalizedConfig.thumbnailUrl || '');
    setOrientation(normalizedConfig.orientation || 'vertical');
    setAutoplay(normalizedConfig.autoplay !== undefined ? normalizedConfig.autoplay : true);
    setLoop(normalizedConfig.loop !== undefined ? normalizedConfig.loop : true);
    setControls(normalizedConfig.controls !== undefined ? normalizedConfig.controls : false);
    setBorderRadius(normalizedConfig.borderRadius || 0);
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const configToSave: any = {
        videoSource,
        orientation,
        autoplay,
        loop,
        controls,
        muted: effectiveMuted, // Sempre salvar o valor efetivo (true se autoplay, senão false)
        borderRadius,
      };

      if (videoSource === 'youtube' && youtubeUrl) {
        configToSave.youtubeUrl = youtubeUrl;
        configToSave.videoUrl = null;
      } else if (videoSource === 'upload' && videoUrl) {
        configToSave.videoUrl = videoUrl;
        configToSave.youtubeUrl = null;
      }

      if (thumbnailUrl) {
        configToSave.thumbnailUrl = thumbnailUrl;
      }

      updateElement(element.id, configToSave);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    videoSource,
    youtubeUrl,
    videoUrl,
    thumbnailUrl,
    orientation,
    autoplay,
    loop,
    controls,
    effectiveMuted, // Usar effectiveMuted ao invés de muted
    borderRadius,
    element.id,
  ]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validVideoTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use MP4, WebM ou MOV');
      return;
    }

    // Validar tamanho (200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 200MB');
      return;
    }

    try {
      await uploadVideo(file, orientation);
    } catch (error: any) {
      // Erro já foi tratado no hook
    } finally {
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleYouTubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    
    if (url && isValidYouTubeUrl(url)) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        // Gerar thumbnail do YouTube
        const thumbUrl = getYouTubeThumbnailUrl(videoId, 'high');
        setThumbnailUrl(thumbUrl);
        toast.success('URL do YouTube válida!');
      }
    }
  };

  const handleValidateYouTube = async () => {
    if (!youtubeUrl) {
      toast.error('Digite uma URL do YouTube');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      toast.error('URL do YouTube inválida');
      return;
    }

    try {
      const response = await api.post('/media/videos/youtube', { url: youtubeUrl });
      const data = (response as any).data || response;

      if (data.valid) {
        toast.success('URL do YouTube validada com sucesso!');
        if (data.embedUrl) {
          const videoId = extractYouTubeId(youtubeUrl);
          if (videoId) {
            const thumbUrl = getYouTubeThumbnailUrl(videoId, 'high');
            setThumbnailUrl(thumbUrl);
          }
        }
      } else {
        toast.error('URL do YouTube inválida');
      }
    } catch (error: any) {
      toast.error('Erro ao validar URL do YouTube: ' + (error.message || 'Erro desconhecido'));
    }
  };

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Origem do Vídeo</Label>
          <Select value={videoSource} onValueChange={(value: 'upload' | 'youtube') => setVideoSource(value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upload">Upload</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {videoSource === 'youtube' ? (
          <div className="space-y-2">
            <Label>URL do YouTube</Label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleValidateYouTube}
                disabled={!youtubeUrl}
              >
                <Youtube className="w-4 h-4" />
              </Button>
            </div>
            {youtubeUrl && isValidYouTubeUrl(youtubeUrl) && (
              <p className="text-xs text-muted-foreground">✓ URL válida</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Vídeo</Label>
            <input
              ref={fileInputRef}
              id="videoUpload"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              disabled={isUploading || isTranscoding}
              style={{ display: 'none' }}
            />
            {(isUploading || isTranscoding) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {isUploading ? 'Enviando...' : 'Otimizando...'}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            {videoUrl ? (
              <div className="relative">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-auto rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-lg border border-border flex items-center justify-center">
                    <Video className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isTranscoding}
                  >
                    {isUploading || isTranscoding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Trocar Vídeo
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setVideoUrl('');
                      setThumbnailUrl('');
                      updateElement(element.id, { videoUrl: '', thumbnailUrl: '' });
                    }}
                    disabled={isUploading || isTranscoding}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-border transition-colors"
                  onClick={() => !isUploading && !isTranscoding && fileInputRef.current?.click()}
                >
                  <Video className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum vídeo selecionado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clique aqui ou no botão abaixo para selecionar
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isTranscoding}
                >
                  {isUploading || isTranscoding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Vídeo
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <div>
          <Label>Orientação</Label>
          <Select value={orientation} onValueChange={(value: 'horizontal' | 'vertical') => setOrientation(value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">Vertical (9:16)</SelectItem>
              <SelectItem value="horizontal">Horizontal (16:9)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Design tab
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="autoplay">Reprodução Automática</Label>
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={setAutoplay}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {autoplay 
            ? 'O vídeo iniciará automaticamente sem som (por políticas do navegador). O usuário pode clicar para ativar o som.'
            : 'O vídeo será reproduzido apenas quando o usuário clicar no botão de play.'}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="loop">Loop</Label>
          <Switch
            id="loop"
            checked={loop}
            onCheckedChange={setLoop}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          O vídeo reiniciará automaticamente ao terminar
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="controls">Controles</Label>
          <Switch
            id="controls"
            checked={controls}
            onCheckedChange={setControls}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Mostrar controles de reprodução (play, pause, volume, etc.)
        </p>
      </div>

      <div>
        <Label htmlFor="borderRadius">Borda Arredondada: {borderRadius}px</Label>
        <Slider
          id="borderRadius"
          min={0}
          max={100}
          step={1}
          value={[borderRadius]}
          onValueChange={([value]) => setBorderRadius(value)}
          className="mt-2"
        />
      </div>
    </div>
  );
}

