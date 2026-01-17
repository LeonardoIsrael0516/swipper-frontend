import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useBuilder, PixelsConfig } from '@/contexts/BuilderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type PixelType = 'meta' | 'google' | 'script' | null;

export function PixelsSettings() {
  const { reel, setReel, setHasUnsavedChanges } = useBuilder();
  const isMobile = useIsMobile();
  const [openSheet, setOpenSheet] = useState<PixelType>(null);

  // Estados para Meta Pixel
  const [metaPixelEnabled, setMetaPixelEnabled] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState('');

  // Estados para Google Ads
  const [googleAdsEnabled, setGoogleAdsEnabled] = useState(false);
  const [conversionId, setConversionId] = useState('');
  const [conversionLabel, setConversionLabel] = useState('');
  const [analyticsId, setAnalyticsId] = useState('');
  const [tagManagerId, setTagManagerId] = useState('');
  const [siteVerification, setSiteVerification] = useState('');

  // Estados para Scripts Personalizados
  const [customHeadScript, setCustomHeadScript] = useState('');
  const [customBodyScript, setCustomBodyScript] = useState('');
  const [customFooterScript, setCustomFooterScript] = useState('');

  // Sincronizar estados quando reel mudar
  useEffect(() => {
    if (reel?.pixelsConfig) {
      const config = reel.pixelsConfig;

      // Meta Pixel
      if (config.metaPixel) {
        setMetaPixelEnabled(config.metaPixel.enabled || false);
        setMetaPixelId(config.metaPixel.pixelId || '');
      } else {
        setMetaPixelEnabled(false);
        setMetaPixelId('');
      }

      // Google Ads
      if (config.googleAds) {
        setGoogleAdsEnabled(config.googleAds.enabled || false);
        setConversionId(config.googleAds.conversionId || '');
        setConversionLabel(config.googleAds.conversionLabel || '');
        setAnalyticsId(config.googleAds.analyticsId || '');
        setTagManagerId(config.googleAds.tagManagerId || '');
        setSiteVerification(config.googleAds.siteVerification || '');
      } else {
        setGoogleAdsEnabled(false);
        setConversionId('');
        setConversionLabel('');
        setAnalyticsId('');
        setTagManagerId('');
        setSiteVerification('');
      }

      // Scripts Personalizados
      if (config.customScripts) {
        setCustomHeadScript(config.customScripts.head || '');
        setCustomBodyScript(config.customScripts.body || '');
        setCustomFooterScript(config.customScripts.footer || '');
      } else {
        setCustomHeadScript('');
        setCustomBodyScript('');
        setCustomFooterScript('');
      }
    } else {
      // Resetar todos os estados se não houver config
      setMetaPixelEnabled(false);
      setMetaPixelId('');
      setGoogleAdsEnabled(false);
      setConversionId('');
      setConversionLabel('');
      setAnalyticsId('');
      setTagManagerId('');
      setSiteVerification('');
      setCustomHeadScript('');
      setCustomBodyScript('');
      setCustomFooterScript('');
    }
  }, [reel?.id, reel?.pixelsConfig]);

  // Função para atualizar pixelsConfig
  const updatePixelsConfig = useCallback(
    async (newConfig: PixelsConfig) => {
      if (!reel) return;

      try {
        const response = await api.patch(`/reels/${reel.id}`, {
          pixelsConfig: newConfig,
        });

        const reelData = (response as any).data || response;

        if (reel) {
          setReel({
            ...reel,
            ...reelData,
          });
        }

        setHasUnsavedChanges(true);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
        console.error('Erro ao salvar pixelsConfig:', error);
        toast.error('Erro ao salvar configurações: ' + errorMessage);
        throw error;
      }
    },
    [reel, setReel, setHasUnsavedChanges]
  );

  // Função para salvar Meta Pixel
  const saveMetaPixel = useCallback(async () => {
    if (!reel) return;
    
    const newConfig: PixelsConfig = {
      ...reel.pixelsConfig,
      metaPixel: metaPixelId ? {
        enabled: metaPixelEnabled,
        pixelId: metaPixelId,
      } : undefined,
      googleAds: reel.pixelsConfig?.googleAds,
      customScripts: reel.pixelsConfig?.customScripts,
    };

    await updatePixelsConfig(newConfig);
    if (metaPixelId) {
      toast.success('Pixel ID salvo com sucesso!');
    } else {
      toast.success('Pixel removido com sucesso!');
    }
  }, [reel, metaPixelEnabled, metaPixelId, updatePixelsConfig]);

  // Função para salvar Google Ads
  const saveGoogleAds = useCallback(async () => {
    if (!reel) return;
    
    const newConfig: PixelsConfig = {
      ...reel.pixelsConfig,
      metaPixel: reel.pixelsConfig?.metaPixel,
      googleAds: {
        enabled: googleAdsEnabled,
        conversionId: conversionId || undefined,
        conversionLabel: conversionLabel || undefined,
        analyticsId: analyticsId || undefined,
        tagManagerId: tagManagerId || undefined,
        siteVerification: siteVerification || undefined,
      },
      customScripts: reel.pixelsConfig?.customScripts,
    };

    await updatePixelsConfig(newConfig);
    toast.success('Configurações do Google salvas com sucesso!');
  }, [reel, googleAdsEnabled, conversionId, conversionLabel, analyticsId, tagManagerId, siteVerification, updatePixelsConfig]);

  // Função para salvar Scripts Personalizados
  const saveCustomScripts = useCallback(async () => {
    if (!reel) return;
    
    try {
      const newConfig: PixelsConfig = {
        ...reel.pixelsConfig,
        metaPixel: reel.pixelsConfig?.metaPixel,
        googleAds: reel.pixelsConfig?.googleAds,
        customScripts: {
          head: customHeadScript || undefined,
          body: customBodyScript || undefined,
          footer: customFooterScript || undefined,
        },
      };

      await updatePixelsConfig(newConfig);
      toast.success('Scripts personalizados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar scripts personalizados:', error);
    }
  }, [reel, customHeadScript, customBodyScript, customFooterScript, updatePixelsConfig]);

  // Verificar se está configurado
  const isMetaConfigured = !!(metaPixelEnabled && metaPixelId);
  const isGoogleConfigured = !!(googleAdsEnabled && (conversionId || analyticsId || tagManagerId || siteVerification));
  const isScriptConfigured = !!(customHeadScript || customBodyScript || customFooterScript);

  // Componente do Card
  const PixelCard = ({ 
    type, 
    title, 
    description, 
    logo, 
    isConfigured 
  }: { 
    type: PixelType; 
    title: string; 
    description: string; 
    logo: string; 
    isConfigured: boolean;
  }) => (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        'relative group'
      )}
      onClick={() => setOpenSheet(type)}
    >
      {isConfigured && (
        <div className="absolute -top-2 -right-2 z-20 pointer-events-none">
          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img 
              src={logo} 
              alt={title}
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {isConfigured && (
            <Badge variant="secondary" className="mt-2">
              Configurado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-6', !isMobile && 'space-y-8')}>
      <div>
        <h3 className={cn('font-semibold mb-2', isMobile ? 'text-xl' : 'text-2xl')}>Pixels</h3>
        <p className="text-muted-foreground">
          Configure pixels de rastreamento para monitorar conversões e injetar scripts personalizados.
        </p>
      </div>

      {/* Grid de Cards */}
      <div className={cn(
        'grid gap-4',
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
      )}>
        <PixelCard
          type="meta"
          title="Meta Ads"
          description="Configure o pixel do Meta Ads para rastrear conversões"
          logo="/meta.png"
          isConfigured={isMetaConfigured}
        />
        <PixelCard
          type="google"
          title="Google Ads & Analytics"
          description="Configure Google Ads, Analytics, Tag Manager e Site Verification"
          logo="/adwords.png"
          isConfigured={isGoogleConfigured}
        />
        <PixelCard
          type="script"
          title="Scripts Personalizados"
          description="Adicione scripts personalizados no head, body ou footer"
          logo="/script.png"
          isConfigured={isScriptConfigured}
        />
      </div>

      {/* Overlay Meta Pixel */}
      <Sheet open={openSheet === 'meta'} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Meta Ads</SheetTitle>
            <SheetDescription>
              Configure o pixel do Meta Ads para rastrear conversões
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="metaPixelEnabled">Ativar Meta Pixel</Label>
                <p className="text-sm text-muted-foreground">
                  Habilite o rastreamento do Meta Pixel
                </p>
              </div>
              <Switch
                id="metaPixelEnabled"
                checked={metaPixelEnabled}
                onCheckedChange={async (checked) => {
                  setMetaPixelEnabled(checked);
                  if (reel) {
                    const newConfig: PixelsConfig = {
                      ...reel.pixelsConfig,
                      metaPixel: {
                        enabled: checked,
                        pixelId: metaPixelId || '',
                      },
                      googleAds: reel.pixelsConfig?.googleAds,
                      customScripts: reel.pixelsConfig?.customScripts,
                    };
                    await updatePixelsConfig(newConfig);
                  }
                }}
              />
            </div>
            {metaPixelEnabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaPixelId">Pixel ID</Label>
                  <div className="relative">
                    <Input
                      id="metaPixelId"
                      value={metaPixelId}
                      onChange={(e) => setMetaPixelId(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456789012345"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={saveMetaPixel}
                      title="Salvar Pixel ID"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-10 flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Apenas números. Encontre seu Pixel ID no Gerenciador de Eventos do Meta
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Overlay Google Ads */}
      <Sheet open={openSheet === 'google'} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Google Ads & Analytics</SheetTitle>
            <SheetDescription>
              Configure Google Ads, Analytics, Tag Manager e Site Verification
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="googleAdsEnabled">Ativar Google Ads</Label>
                <p className="text-sm text-muted-foreground">
                  Habilite o rastreamento do Google Ads
                </p>
              </div>
              <Switch
                id="googleAdsEnabled"
                checked={googleAdsEnabled}
                onCheckedChange={async (checked) => {
                  setGoogleAdsEnabled(checked);
                  if (reel) {
                    const newConfig: PixelsConfig = {
                      ...reel.pixelsConfig,
                      metaPixel: reel.pixelsConfig?.metaPixel,
                      googleAds: {
                        enabled: checked,
                        conversionId: conversionId || undefined,
                        conversionLabel: conversionLabel || undefined,
                        analyticsId: analyticsId || undefined,
                        tagManagerId: tagManagerId || undefined,
                        siteVerification: siteVerification || undefined,
                      },
                      customScripts: reel.pixelsConfig?.customScripts,
                    };
                    await updatePixelsConfig(newConfig);
                  }
                }}
              />
            </div>
            {googleAdsEnabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="conversionId">Conversion ID (AW-XXXXXXX)</Label>
                  <div className="relative">
                    <Input
                      id="conversionId"
                      value={conversionId}
                      onChange={(e) => setConversionId(e.target.value)}
                      placeholder="AW-123456789"
                      className="pr-10"
                    />
                    {conversionId && (
                      <button
                        type="button"
                        onClick={saveGoogleAds}
                        title="Salvar"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-10 flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversionLabel">Conversion Label</Label>
                  <div className="relative">
                    <Input
                      id="conversionLabel"
                      value={conversionLabel}
                      onChange={(e) => setConversionLabel(e.target.value)}
                      placeholder="abc123"
                      className="pr-10"
                    />
                    {conversionLabel && (
                      <button
                        type="button"
                        onClick={saveGoogleAds}
                        title="Salvar"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-10 flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analyticsId">Google Analytics ID (G-XXXXXXXXXX)</Label>
                  <div className="relative">
                    <Input
                      id="analyticsId"
                      value={analyticsId}
                      onChange={(e) => setAnalyticsId(e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="pr-10"
                    />
                    {analyticsId && (
                      <button
                        type="button"
                        onClick={saveGoogleAds}
                        title="Salvar"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-10 flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagManagerId">Google Tag Manager ID (GTM-XXXXXXX)</Label>
                  <div className="relative">
                    <Input
                      id="tagManagerId"
                      value={tagManagerId}
                      onChange={(e) => setTagManagerId(e.target.value)}
                      placeholder="GTM-XXXXXXX"
                      className="pr-10"
                    />
                    {tagManagerId && (
                      <button
                        type="button"
                        onClick={saveGoogleAds}
                        title="Salvar"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-10 flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteVerification">Google Site Verification</Label>
                  <div className="relative">
                    <Input
                      id="siteVerification"
                      value={siteVerification}
                      onChange={(e) => setSiteVerification(e.target.value)}
                      placeholder="Verification code"
                      className="pr-10"
                    />
                    {siteVerification && (
                      <button
                        type="button"
                        onClick={saveGoogleAds}
                        title="Salvar"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-10 flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Overlay Scripts Personalizados */}
      <Sheet open={openSheet === 'script'} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Scripts Personalizados</SheetTitle>
            <SheetDescription>
              Adicione scripts personalizados no head, body ou footer da página
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customHeadScript">Scripts no &lt;head&gt;</Label>
                <Textarea
                  id="customHeadScript"
                  value={customHeadScript}
                  onChange={(e) => setCustomHeadScript(e.target.value)}
                  placeholder="<script>...</script>"
                  className="min-h-[120px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Scripts que serão injetados no &lt;head&gt; da página
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="customBodyScript">Scripts no &lt;body&gt;</Label>
                <Textarea
                  id="customBodyScript"
                  value={customBodyScript}
                  onChange={(e) => setCustomBodyScript(e.target.value)}
                  placeholder="<script>...</script>"
                  className="min-h-[120px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Scripts que serão injetados no início do &lt;body&gt;
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="customFooterScript">Scripts no Footer</Label>
                <Textarea
                  id="customFooterScript"
                  value={customFooterScript}
                  onChange={(e) => setCustomFooterScript(e.target.value)}
                  placeholder="<script>...</script>"
                  className="min-h-[120px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Scripts que serão injetados antes do fechamento do &lt;body&gt;
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={saveCustomScripts}
                className="h-10 px-4 flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer active:scale-95 text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Scripts</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
