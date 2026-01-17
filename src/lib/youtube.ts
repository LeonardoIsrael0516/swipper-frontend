/**
 * Extrai o ID do vídeo de uma URL do YouTube
 * Suporta múltiplos formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Regex para extrair ID do YouTube
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID ou youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    // youtube.com/v/VIDEO_ID
    /youtube\.com\/v\/([^"&?\/\s]{11})/,
    // youtube.com/embed/VIDEO_ID (sem https)
    /youtube\.com\/embed\/([^"&?\/\s]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Valida se uma URL é válida do YouTube
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Gera URL de embed do YouTube a partir de um ID
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    start?: number;
    end?: number;
  },
): string {
  const params = new URLSearchParams();

  // Autoplay funciona apenas quando muted=true no YouTube
  // Se autoplay=true mas muted=false explicitamente, NÃO usar autoplay (YouTube não permite)
  // Se muted for explicitamente false, não adicionar mute
  const shouldUseAutoplay = options?.autoplay && (options?.muted !== false);
  const shouldMute = options?.muted === undefined 
    ? (options?.autoplay ? true : false) // Se não especificado, mute se autoplay
    : options?.muted; // Se especificado, usar o valor
  
  if (shouldUseAutoplay) {
    params.append('autoplay', '1');
  }
  
  // Muted é necessário para autoplay funcionar
  if (shouldMute) {
    params.append('mute', '1');
  }
  
  // Loop requer playlist com o mesmo videoId
  if (options?.loop) {
    params.append('loop', '1');
    params.append('playlist', videoId);
  }
  
  // Controles: 0 = escondido, 1 = visível (padrão)
  if (options?.controls === false) {
    params.append('controls', '0');
  }
  
  // Parâmetros para esconder elementos do YouTube
  params.append('modestbranding', '1'); // Remove logo do YouTube
  params.append('playsinline', '1'); // Permite play inline no iOS
  params.append('rel', '0'); // Esconde vídeos relacionados no final
  params.append('iv_load_policy', '3'); // Esconde anotações/vídeos sugeridos
  params.append('fs', '0'); // Desabilita botão de fullscreen
  params.append('cc_load_policy', '0'); // Esconde legendas por padrão
  params.append('disablekb', '1'); // Desabilita controles de teclado
  params.append('enablejsapi', '1'); // Habilita JavaScript API (pode ajudar com autoplay)
  
  // Origin pode ajudar com autoplay em alguns navegadores
  if (typeof window !== 'undefined') {
    params.append('origin', window.location.origin);
  }
  
  if (options?.start) params.append('start', options.start.toString());
  if (options?.end) params.append('end', options.end.toString());

  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Gera URL de thumbnail do YouTube a partir de um ID
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  // YouTube fornece thumbnails em diferentes qualidades
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

