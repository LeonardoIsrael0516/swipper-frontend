import { useState, useEffect } from 'react';
import { useBuilder, GamificationConfig } from '@/contexts/BuilderContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Volume2, Sparkles, Play, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const defaultGamificationConfig: GamificationConfig = {
  enabled: false,
  pointsConfig: {
    pointsPerAnswer: 10,
    pointsPerCorrectAnswer: 20,
    pointsPerWrongAnswer: 5,
    pointsPerFormComplete: 50,
    pointsPerSlideVisit: 5,
  },
  elements: {
    pointsBadge: {
      enabled: true,
      position: 'top-right',
      duration: 2000,
      textFormat: '+{points} pontos',
      backgroundColor: '#4CAF50',
      textColor: '#ffffff',
    },
    successSound: {
      enabled: true,
      soundType: 'success',
      volume: 0.5,
    },
    confetti: {
      enabled: true,
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
      particleCount: 50,
      duration: 3000,
      direction: 'top',
    },
    particles: {
      enabled: false,
      particleType: 'star',
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
      particleCount: 30,
    },
    pointsProgress: {
      enabled: false,
      position: 'top',
      style: 'bar',
      milestone: 100,
      progressColor: '#4CAF50',
      backgroundColor: '#e5e7eb',
      textColor: '#1f2937',
      cardBackgroundColor: 'rgba(255, 255, 255, 0.9)',
      circularProgressColor: '#4CAF50',
      circularBackgroundColor: '#e5e7eb',
    },
    achievement: {
      enabled: false,
      title: 'Conquista Desbloqueada!',
      description: 'Parabéns!',
      icon: '🏆',
      condition: {
        type: 'points',
        value: 100,
      },
    },
  },
};

export function GamificationEditor() {
  const { reel, setReel, hasUnsavedChanges, setHasUnsavedChanges } = useBuilder();
  
  const [gamificationConfig, setGamificationConfig] = useState<GamificationConfig>(
    reel?.gamificationConfig || defaultGamificationConfig
  );

  // Sincronizar com reel quando mudar
  useEffect(() => {
    if (reel?.gamificationConfig) {
      setGamificationConfig(reel.gamificationConfig);
    }
  }, [reel?.gamificationConfig]);

  // Debounce para atualizar reel
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (reel) {
        setReel({ ...reel, gamificationConfig });
        setHasUnsavedChanges(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [gamificationConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateConfig = (updates: Partial<GamificationConfig>) => {
    setGamificationConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateElementConfig = (
    elementName: keyof GamificationConfig['elements'],
    updates: Partial<GamificationConfig['elements'][typeof elementName]>
  ) => {
    setGamificationConfig((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementName]: { ...prev.elements[elementName], ...updates },
      },
    }));
  };

  // Função para tocar preview do som
  const playSoundPreview = (soundType: string, volume: number) => {
    const defaultSounds: Record<string, string> = {
      success: '/sounds/success.wav',
      coin: '/sounds/coin.wav',
      ding: '/sounds/ding.wav',
      achievement: '/sounds/achievement.wav',
    };

    const soundToPlay = defaultSounds[soundType] || defaultSounds.success;
    
    try {
      const audio = new Audio(soundToPlay);
      audio.volume = Math.max(0, Math.min(1, volume));
      
      // Tratamento de erro com fallback sintético
      audio.onerror = () => {
        // Fallback: som sintético usando Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          const soundConfigs: Record<string, { frequencies: number[]; duration: number; type: OscillatorType }> = {
            success: { frequencies: [523.25, 659.25, 783.99], duration: 0.3, type: 'sine' },
            coin: { frequencies: [880, 1108.73], duration: 0.15, type: 'triangle' },
            ding: { frequencies: [800], duration: 0.2, type: 'sine' },
            achievement: { frequencies: [523.25, 659.25, 783.99, 1046.50], duration: 0.4, type: 'sine' },
          };

          const config = soundConfigs[soundType] || soundConfigs.success;
          const now = audioContext.currentTime;

          config.frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = config.type;

            const startTime = now + index * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + config.duration);
          });
        } catch (e) {
          console.warn('Erro ao tocar som de fallback:', e);
        }
      };

      audio.play().catch((error) => {
        // Se autoplay for bloqueado, tentar fallback
        console.debug('Erro ao tocar áudio, tentando fallback:', error);
        audio.onerror?.(new Event('error'));
      });
    } catch (error) {
      console.warn('Erro ao tocar som:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Gamificação</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure elementos de gamificação para aumentar o engajamento
        </p>
      </div>

      {/* Habilitar Gamificação */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="gamificationEnabled">Habilitar Gamificação</Label>
            <p className="text-xs text-muted-foreground">
              Ativa o sistema de pontos e elementos de gamificação
            </p>
          </div>
          <Switch
            id="gamificationEnabled"
            checked={gamificationConfig.enabled || false}
            onCheckedChange={(checked) => {
              updateConfig({ enabled: checked });
            }}
          />
        </div>
      </div>

      {gamificationConfig.enabled && (
        <div className="space-y-4">
          {/* Points Badge */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <CardTitle>Badge de Pontos</CardTitle>
                  </div>
                  <CardDescription>
                    Notificação visual quando pontos são ganhos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Habilitar</Label>
                    <Switch
                      checked={gamificationConfig.elements.pointsBadge.enabled}
                      onCheckedChange={(checked) =>
                        updateElementConfig('pointsBadge', { enabled: checked })
                      }
                    />
                  </div>
                  {gamificationConfig.elements.pointsBadge.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Posição</Label>
                        <Select
                          value={gamificationConfig.elements.pointsBadge.position}
                          onValueChange={(value: any) =>
                            updateElementConfig('pointsBadge', { position: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-right">Superior Direita</SelectItem>
                            <SelectItem value="top-left">Superior Esquerda</SelectItem>
                            <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                            <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Formato do Texto</Label>
                        <Input
                          value={gamificationConfig.elements.pointsBadge.textFormat}
                          onChange={(e) =>
                            updateElementConfig('pointsBadge', { textFormat: e.target.value })
                          }
                          placeholder="+{points} pontos"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use {'{points}'} para o valor dos pontos
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cor de Fundo</Label>
                          <Input
                            type="color"
                            value={gamificationConfig.elements.pointsBadge.backgroundColor}
                            onChange={(e) =>
                              updateElementConfig('pointsBadge', { backgroundColor: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cor do Texto</Label>
                          <Input
                            type="color"
                            value={gamificationConfig.elements.pointsBadge.textColor}
                            onChange={(e) =>
                              updateElementConfig('pointsBadge', { textColor: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Success Sound */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    <CardTitle>Som de Sucesso</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Habilitar</Label>
                    <Switch
                      checked={gamificationConfig.elements.successSound.enabled}
                      onCheckedChange={(checked) =>
                        updateElementConfig('successSound', { enabled: checked })
                      }
                    />
                  </div>
                  {gamificationConfig.elements.successSound.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Tipo de Som</Label>
                        <div className="flex gap-2">
                          <Select
                            value={gamificationConfig.elements.successSound.soundType}
                            onValueChange={(value: any) =>
                              updateElementConfig('successSound', { soundType: value })
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="success">Sucesso</SelectItem>
                              <SelectItem value="coin">Moeda</SelectItem>
                              <SelectItem value="ding">Ding</SelectItem>
                              <SelectItem value="achievement">Conquista</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => playSoundPreview(
                              gamificationConfig.elements.successSound.soundType,
                              gamificationConfig.elements.successSound.volume ?? 0.5
                            )}
                            title="Ouvir preview do som"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Volume (0-1)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={gamificationConfig.elements.successSound.volume}
                          onChange={(e) =>
                            updateElementConfig('successSound', { volume: parseFloat(e.target.value) || 0.5 })
                          }
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Confetti */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <CardTitle>Confetes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Habilitar</Label>
                    <Switch
                      checked={gamificationConfig.elements.confetti.enabled}
                      onCheckedChange={(checked) =>
                        updateElementConfig('confetti', { enabled: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Points Progress */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    <CardTitle>Barra de Progresso de Pontos</CardTitle>
                  </div>
                  <CardDescription>
                    Exibe uma barra de progresso com a pontuação atual
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Habilitar</Label>
                    <Switch
                      checked={gamificationConfig.elements.pointsProgress.enabled}
                      onCheckedChange={(checked) =>
                        updateElementConfig('pointsProgress', { enabled: checked })
                      }
                    />
                  </div>
                  {gamificationConfig.elements.pointsProgress.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Posição</Label>
                        <Select
                          value={gamificationConfig.elements.pointsProgress.position}
                          onValueChange={(value: any) =>
                            updateElementConfig('pointsProgress', { position: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Superior Centro</SelectItem>
                            <SelectItem value="bottom">Inferior Centro</SelectItem>
                            <SelectItem value="top-left">Superior Esquerda</SelectItem>
                            <SelectItem value="top-right">Superior Direita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Estilo</Label>
                        <Select
                          value={gamificationConfig.elements.pointsProgress.style}
                          onValueChange={(value: any) =>
                            updateElementConfig('pointsProgress', { style: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar">Barra</SelectItem>
                            <SelectItem value="circular">Circular</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Meta de Pontos</Label>
                        <Input
                          type="number"
                          min="1"
                          value={gamificationConfig.elements.pointsProgress.milestone}
                          onChange={(e) =>
                            updateElementConfig('pointsProgress', { milestone: parseInt(e.target.value) || 100 })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Pontos necessários para completar a barra
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Cores</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Cor da Barra</Label>
                            <Input
                              type="color"
                              value={gamificationConfig.elements.pointsProgress.progressColor || '#4CAF50'}
                              onChange={(e) =>
                                updateElementConfig('pointsProgress', { progressColor: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Fundo da Barra</Label>
                            <Input
                              type="color"
                              value={gamificationConfig.elements.pointsProgress.backgroundColor || '#e5e7eb'}
                              onChange={(e) =>
                                updateElementConfig('pointsProgress', { backgroundColor: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Cor do Texto</Label>
                            <Input
                              type="color"
                              value={gamificationConfig.elements.pointsProgress.textColor || '#1f2937'}
                              onChange={(e) =>
                                updateElementConfig('pointsProgress', { textColor: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Fundo do Card</Label>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                value={gamificationConfig.elements.pointsProgress.cardBackgroundColor || 'rgba(255, 255, 255, 0.9)'}
                                onChange={(e) =>
                                  updateElementConfig('pointsProgress', { cardBackgroundColor: e.target.value })
                                }
                                placeholder="rgba(255, 255, 255, 0.9)"
                                className="flex-1"
                              />
                              <Input
                                type="color"
                                value={gamificationConfig.elements.pointsProgress.cardBackgroundColor?.startsWith('rgba') 
                                  ? '#ffffff' 
                                  : (gamificationConfig.elements.pointsProgress.cardBackgroundColor || '#ffffff')}
                                onChange={(e) => {
                                  // Converter hex para rgba com transparência
                                  const hex = e.target.value;
                                  const r = parseInt(hex.slice(1, 3), 16);
                                  const g = parseInt(hex.slice(3, 5), 16);
                                  const b = parseInt(hex.slice(5, 7), 16);
                                  updateElementConfig('pointsProgress', { 
                                    cardBackgroundColor: `rgba(${r}, ${g}, ${b}, 0.9)` 
                                  });
                                }}
                                className="w-16"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Aceita rgba para transparência (ex: rgba(255, 255, 255, 0.9))
                            </p>
                          </div>
                        </div>
                        {gamificationConfig.elements.pointsProgress.style === 'circular' && (
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                              <Label className="text-xs">Cor do Círculo</Label>
                              <Input
                                type="color"
                                value={gamificationConfig.elements.pointsProgress.circularProgressColor || '#4CAF50'}
                                onChange={(e) =>
                                  updateElementConfig('pointsProgress', { circularProgressColor: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Fundo do Círculo</Label>
                              <Input
                                type="color"
                                value={gamificationConfig.elements.pointsProgress.circularBackgroundColor || '#e5e7eb'}
                                onChange={(e) =>
                                  updateElementConfig('pointsProgress', { circularBackgroundColor: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
        </div>
      )}
    </div>
  );
}

