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
import { toast } from 'sonner';
import { Image as ImageIcon, Sparkles, Loader2, Upload } from 'lucide-react';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
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

interface ImageElementEditorProps {
  element: SlideElement;
  tab: 'content' | 'design';
}

export function ImageElementEditor({ element, tab }: ImageElementEditorProps) {
  const { updateElement } = useBuilder();
  const config = normalizeUiConfig(element.uiConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState(config.imageUrl || '');
  const [size, setSize] = useState(config.size || 'full');
  const [borderRadius, setBorderRadius] = useState(config.borderRadius || 0);
  const [overlayEnabled, setOverlayEnabled] = useState(config.overlay?.enabled || false);
  const [overlayColor, setOverlayColor] = useState(config.overlay?.color || '#000000');
  const [overlayOpacity, setOverlayOpacity] = useState(config.overlay?.opacity !== undefined ? config.overlay.opacity : 0.5);
  const [objectFit, setObjectFit] = useState(config.objectFit || 'contain');
  const [isUploading, setIsUploading] = useState(false);

  // Sincronizar quando element mudar externamente
  // IMPORTANTE: Quando o elemento muda (novo ID), resetar TODOS os campos para evitar herança
  useEffect(() => {
    const normalizedConfig = normalizeUiConfig(element.uiConfig);
    
    // Resetar todos os campos baseado no novo elemento
    // Isso previne que dados do elemento anterior sejam mantidos
    setImageUrl(normalizedConfig.imageUrl || '');
    setSize(normalizedConfig.size || 'full');
    setBorderRadius(normalizedConfig.borderRadius || 0);
    setOverlayEnabled(normalizedConfig.overlay?.enabled || false);
    setOverlayColor(normalizedConfig.overlay?.color || '#000000');
    setOverlayOpacity(normalizedConfig.overlay?.opacity !== undefined ? normalizedConfig.overlay.opacity : 0.5);
    setObjectFit(normalizedConfig.objectFit || 'contain');
  }, [element.id]);

  // Salvar automaticamente com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(element.id, {
        imageUrl,
        size,
        borderRadius,
        overlay: {
          enabled: overlayEnabled,
          color: overlayColor,
          opacity: overlayOpacity,
        },
        objectFit,
      });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    imageUrl,
    size,
    borderRadius,
    overlayEnabled,
    overlayColor,
    overlayOpacity,
    objectFit,
    element.id,
  ]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      
      // Validar URL antes de salvar
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error('URL inválida retornada do servidor. Verifique a configuração do R2.');
      }
      
      setImageUrl(url);
      
      // Atualizar elemento imediatamente para garantir que a URL seja salva
      // Usar await para garantir que a atualização seja concluída antes de continuar
      await updateElement(element.id, { imageUrl: url });
      
      // Debug em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('Image uploaded and element updated:', {
          elementId: element.id,
          imageUrl: url,
        });
      }
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao fazer upload: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsUploading(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateWithAI = () => {
    // Layout apenas - funcionalidade será implementada depois
    toast.info('Geração de imagem com IA em breve!');
  };

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Imagem</Label>
          <div className="mt-2 space-y-2">
            <input
              ref={fileInputRef}
              id="imageUpload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto rounded-lg border border-border"
                  onError={(e) => {
                    toast.error('Erro ao carregar imagem. Verifique se a URL está correta: ' + imageUrl);
                    console.error('Erro ao carregar imagem:', imageUrl);
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
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
                        Trocar Imagem
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setImageUrl('');
                      updateElement(element.id, { imageUrl: '' });
                    }}
                    disabled={isUploading}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-border transition-colors"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhuma imagem selecionada
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
                      Selecionar Imagem
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGenerateWithAI}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar com IA
          </Button>
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
    setSize(sizeMap[value[0]] as any);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="size">Tamanho: {getSizeLabel(size)}</Label>
        <Slider
          id="size"
          min={0}
          max={3}
          step={1}
          value={[getSizeValue(size)]}
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
        <Label htmlFor="objectFit">Ajuste da Imagem</Label>
        <Select value={objectFit} onValueChange={(value) => setObjectFit(value as any)}>
          <SelectTrigger id="objectFit" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cobrir</SelectItem>
            <SelectItem value="contain">Conter</SelectItem>
            <SelectItem value="fill">Preencher</SelectItem>
            <SelectItem value="none">Nenhum</SelectItem>
            <SelectItem value="scale-down">Reduzir</SelectItem>
          </SelectContent>
        </Select>
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="overlayEnabled">Overlay</Label>
          <Switch
            id="overlayEnabled"
            checked={overlayEnabled}
            onCheckedChange={setOverlayEnabled}
          />
        </div>

        {overlayEnabled && (
          <>
            <div>
              <Label htmlFor="overlayColor">Cor do Overlay</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="overlayColor"
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="overlayOpacity">
                Opacidade: {Math.round(overlayOpacity * 100)}%
              </Label>
              <Slider
                id="overlayOpacity"
                min={0}
                max={100}
                step={1}
                value={[overlayOpacity * 100]}
                onValueChange={([value]) => setOverlayOpacity(value / 100)}
                className="mt-2"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

