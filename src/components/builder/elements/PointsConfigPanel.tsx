import { usePoints, PointsConfig } from '@/contexts/PointsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PointsConfigPanel() {
  const { config, setConfig } = usePoints();

  const updateConfig = (updates: Partial<PointsConfig>) => {
    setConfig({ ...config, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Pontos</CardTitle>
        <CardDescription>
          Configure quantos pontos o usuário ganha por cada ação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pointsPerAnswer">Pontos por Resposta</Label>
            <Input
              id="pointsPerAnswer"
              type="number"
              min="0"
              value={config.pointsPerAnswer || 10}
              onChange={(e) => updateConfig({ pointsPerAnswer: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsPerCorrectAnswer">Pontos por Resposta Correta</Label>
            <Input
              id="pointsPerCorrectAnswer"
              type="number"
              min="0"
              value={config.pointsPerCorrectAnswer || 20}
              onChange={(e) => updateConfig({ pointsPerCorrectAnswer: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsPerWrongAnswer">Pontos por Resposta Errada</Label>
            <Input
              id="pointsPerWrongAnswer"
              type="number"
              min="0"
              value={config.pointsPerWrongAnswer || 5}
              onChange={(e) => updateConfig({ pointsPerWrongAnswer: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsPerFormComplete">Pontos por Formulário Completo</Label>
            <Input
              id="pointsPerFormComplete"
              type="number"
              min="0"
              value={config.pointsPerFormComplete || 50}
              onChange={(e) => updateConfig({ pointsPerFormComplete: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsPerSlideVisit">Pontos por Slide Visitado</Label>
            <Input
              id="pointsPerSlideVisit"
              type="number"
              min="0"
              value={config.pointsPerSlideVisit || 5}
              onChange={(e) => updateConfig({ pointsPerSlideVisit: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="timeBonusEnabled">Bônus por Velocidade</Label>
              <p className="text-sm text-muted-foreground">
                Adiciona bônus quando o usuário responde rapidamente
              </p>
            </div>
            <Switch
              id="timeBonusEnabled"
              checked={config.timeBonusEnabled || false}
              onCheckedChange={(checked) => updateConfig({ timeBonusEnabled: checked })}
            />
          </div>

          {config.timeBonusEnabled && (
            <div className="space-y-2">
              <Label htmlFor="timeBonusMultiplier">Multiplicador de Bônus</Label>
              <Input
                id="timeBonusMultiplier"
                type="number"
                min="1"
                step="0.1"
                value={config.timeBonusMultiplier || 1.5}
                onChange={(e) => updateConfig({ timeBonusMultiplier: parseFloat(e.target.value) || 1.5 })}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="streakEnabled">Sistema de Sequência</Label>
              <p className="text-sm text-muted-foreground">
                Bônus por acertos consecutivos
              </p>
            </div>
            <Switch
              id="streakEnabled"
              checked={config.streakEnabled || false}
              onCheckedChange={(checked) => updateConfig({ streakEnabled: checked })}
            />
          </div>

          {config.streakEnabled && (
            <div className="space-y-2">
              <Label htmlFor="streakMultiplier">Multiplicador de Sequência</Label>
              <Input
                id="streakMultiplier"
                type="number"
                min="1"
                step="0.1"
                value={config.streakMultiplier || 2}
                onChange={(e) => updateConfig({ streakMultiplier: parseFloat(e.target.value) || 2 })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

