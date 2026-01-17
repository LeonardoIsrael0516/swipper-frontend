import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { uploadFile } from '@/lib/media';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { toast } from 'sonner';
import { Mic, Upload, Loader2, Play, Pause, Square, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface AudioElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function AudioElementEditor({ element, tab }: AudioElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [audioUrl, setAudioUrl] = useState(config.audioUrl || '');
  const [avatar, setAvatar] = useState(config.avatar || '');
  const [backgroundColor, setBackgroundColor] = useState(config.backgroundColor || '#ffffff');
  const [buttonColor, setButtonColor] = useState(config.buttonColor || '#25D366');
  const [textColor, setTextColor] = useState(config.textColor || '#000000');
  const [cardSize, setCardSize] = useState(config.cardSize || 'full');
  const [borderRadius, setBorderRadius] = useState(config.borderRadius ?? 12);
  const [showTimestamp, setShowTimestamp] = useState(config.showTimestamp !== false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    isRecording,
    isPaused,
    duration: recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error: recordingError,
  } = useAudioRecorder();

  // Sincronizar quando element mudar externamente
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    setAudioUrl(normalizedConfig.audioUrl || '');
    setAvatar(normalizedConfig.avatar || '');
    setBackgroundColor(normalizedConfig.backgroundColor || '#ffffff');
    setButtonColor(normalizedConfig.buttonColor || '#25D366');
    setTextColor(normalizedConfig.textColor || '#000000');
    setCardSize(normalizedConfig.cardSize || 'full');
    setBorderRadius(normalizedConfig.borderRadius ?? 12);
    setShowTimestamp(normalizedConfig.showTimestamp !== false);
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        audioUrl,
        avatar,
        backgroundColor,
        buttonColor,
        textColor,
        cardSize,
        borderRadius,
        showTimestamp,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    audioUrl,
    avatar,
    backgroundColor,
    buttonColor,
    textColor,
    cardSize,
    borderRadius,
    showTimestamp,
    element.id,
  ]);

  // Tratar erros de gravação
  useEffect(() => {
    if (recordingError) {
      toast.error(recordingError);
    }
  }, [recordingError]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validAudioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/vorbis',
      'audio/mp4',
      'audio/m4a',
      'audio/x-m4a',
      'audio/aac',
    ];
    if (!validAudioTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use áudio (MP3, WAV, OGG, M4A, AAC)');
      return;
    }

    // Validar tamanho (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('URL inválida retornada do servidor. Verifique a configuração do R2.');
      }
      
      setAudioUrl(url);
      await updateElement(element.id, { audioUrl: url });
      
      toast.success('Áudio enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer upload: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRecordAudio = async () => {
    if (isRecording) {
      // Parar gravação
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        // Converter Blob para File
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
          type: 'audio/webm',
        });

        setIsUploading(true);
        try {
          const url = await uploadFile(audioFile);
          
          if (!url || typeof url !== 'string' || !url.startsWith('http')) {
            throw new Error('URL inválida retornada do servidor.');
          }
          
          setAudioUrl(url);
          await updateElement(element.id, { audioUrl: url });
          
          toast.success('Áudio gravado e enviado com sucesso!');
        } catch (error: any) {
          toast.error('Erro ao fazer upload do áudio gravado: ' + (error.message || 'Erro desconhecido'));
        } finally {
          setIsUploading(false);
        }
      }
    } else {
      // Iniciar gravação
      await startRecording();
    }
  };

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas imagens)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamanho (5MB para avatar)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('URL inválida retornada do servidor.');
      }
      
      setAvatar(url);
      await updateElement(element.id, { avatar: url });
      
      toast.success('Avatar enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer upload: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Áudio</Label>
          <div className="mt-2 space-y-2">
            <input
              ref={fileInputRef}
              id="audioUpload"
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/ogg,audio/vorbis,audio/mp4,audio/m4a,audio/x-m4a,audio/aac"
              onChange={handleFileSelect}
              disabled={isUploading || isRecording}
              style={{ display: 'none' }}
            />
            
            {/* Opções de upload/gravação */}
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="record">Gravar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-2 mt-2">
                {audioUrl ? (
                  <div className="space-y-2">
                    <div className="border border-border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Áudio carregado</span>
                      </div>
                      <audio
                        src={audioUrl}
                        controls
                        className="w-full"
                        onError={() => {
                          toast.error('Erro ao carregar áudio. Verifique se a URL está correta.');
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isRecording}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Trocar Áudio
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setAudioUrl('');
                          updateElement(element.id, { audioUrl: '' });
                        }}
                        disabled={isUploading || isRecording}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-border transition-colors"
                      onClick={() => !isUploading && !isRecording && fileInputRef.current?.click()}
                    >
                      <Mic className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Nenhum áudio selecionado
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
                      disabled={isUploading || isRecording}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Selecionar Áudio
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="record" className="space-y-2 mt-2">
                <div className="border border-border rounded-lg p-4 space-y-4">
                  {isRecording ? (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">Gravando...</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {formatTime(recordingDuration)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={isPaused ? resumeRecording : pauseRecording}
                          disabled={isUploading}
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Continuar
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pausar
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={handleRecordAudio}
                          disabled={isUploading}
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Parar e Salvar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <Mic className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Grave um áudio diretamente
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        className="w-full"
                        onClick={handleRecordAudio}
                        disabled={isUploading}
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Iniciar Gravação
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Design tab
  const getSizeLabel = (sizeValue: string) => {
    switch (sizeValue) {
      case 'small':
        return 'Pequeno (25%)';
      case 'medium':
        return 'Médio (50%)';
      case 'large':
        return 'Grande (75%)';
      case 'full':
        return 'Completo (100%)';
      default:
        return 'Completo (100%)';
    }
  };

  const getSizeValue = (sizeValue: string) => {
    switch (sizeValue) {
      case 'small':
        return 0;
      case 'medium':
        return 1;
      case 'large':
        return 2;
      case 'full':
        return 3;
      default:
        return 3;
    }
  };

  const handleSizeChange = (value: number[]) => {
    const sizeMap = ['small', 'medium', 'large', 'full'];
    setCardSize(sizeMap[value[0]] as any);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Avatar</Label>
        <div className="mt-2 space-y-2">
          <input
            ref={avatarInputRef}
            id="avatarUpload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleAvatarSelect}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          {avatar ? (
            <div className="space-y-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-border">
                {avatar.startsWith('http') || avatar.startsWith('data:') ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-muted">
                    {avatar}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Trocar
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setAvatar('');
                    updateElement(element.id, { avatar: '' });
                  }}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar Avatar
                  </>
                )}
              </Button>
              <div className="text-xs text-muted-foreground">
                Ou use um emoji: <Input
                  type="text"
                  placeholder="🎤"
                  value={avatar}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAvatar(value);
                    updateElement(element.id, { avatar: value });
                  }}
                  className="mt-1"
                  maxLength={2}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="cardSize">Tamanho do Card: {getSizeLabel(cardSize)}</Label>
        <Slider
          id="cardSize"
          min={0}
          max={3}
          step={1}
          value={[getSizeValue(cardSize)]}
          onValueChange={handleSizeChange}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      <div>
        <Label htmlFor="borderRadius">Borda Arredondada: {borderRadius}px</Label>
        <Slider
          id="borderRadius"
          min={0}
          max={50}
          step={1}
          value={[borderRadius]}
          onValueChange={([value]) => setBorderRadius(value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="backgroundColor">Cor de Fundo do Card</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="backgroundColor"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="buttonColor">Cor dos Botões</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="buttonColor"
            type="color"
            value={buttonColor}
            onChange={(e) => setButtonColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={buttonColor}
            onChange={(e) => setButtonColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="textColor">Cor do Texto</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="textColor"
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="showTimestamp">Mostrar Timestamp</Label>
        <Switch
          id="showTimestamp"
          checked={showTimestamp}
          onCheckedChange={setShowTimestamp}
        />
      </div>
    </div>
  );
}

