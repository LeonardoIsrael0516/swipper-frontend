# Sons de Gamificação

Coloque seus arquivos de áudio aqui:

- `success.wav` - Som de sucesso
- `coin.wav` - Som de moeda
- `ding.wav` - Som de notificação
- `achievement.wav` - Som de conquista

## Formatos suportados
- WAV (recomendado)
- MP3
- OGG

## Onde encontrar sons gratuitos
- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [OpenGameArt](https://opengameart.org/)

## Alternativa: Usar sua CDN

Se preferir usar sua própria CDN, edite o arquivo:
`frontend/src/components/reels/elements/ReelSuccessSound.tsx`

E altere as URLs em `defaultSounds` para suas URLs da CDN:
```typescript
const defaultSounds: Record<string, string> = {
  success: 'https://cdn.seudominio.com/sounds/success.wav',
  coin: 'https://cdn.seudominio.com/sounds/coin.wav',
  ding: 'https://cdn.seudominio.com/sounds/ding.wav',
  achievement: 'https://cdn.seudominio.com/sounds/achievement.wav',
};
```

## Fallback automático

Se os arquivos não estiverem disponíveis, o sistema usará sons sintéticos gerados via Web Audio API como fallback.

