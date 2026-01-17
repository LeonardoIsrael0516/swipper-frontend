import { api } from './api';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface UploadResponse {
  url: string;
}

/**
 * Upload a file to the media server
 * @param file File to upload
 * @returns URL of the uploaded file
 */
export async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('Não autenticado');
  }

  // Validate file type
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
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
  const isValidType = validImageTypes.includes(file.type) || validVideoTypes.includes(file.type) || validAudioTypes.includes(file.type);

  if (!isValidType) {
    throw new Error('Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP), vídeos (MP4, WebM, OGG) ou áudio (MP3, WAV, OGG, M4A, AAC)');
  }

  // Validate file size based on type
  const isAudio = validAudioTypes.includes(file.type);
  const isVideo = validVideoTypes.includes(file.type);
  const maxSize = isAudio 
    ? 50 * 1024 * 1024 // 50MB for audio
    : isVideo
    ? 100 * 1024 * 1024 // 100MB for video
    : 10 * 1024 * 1024; // 10MB for images
  
  if (file.size > maxSize) {
    const maxSizeMB = isAudio ? 50 : isVideo ? 100 : 10;
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Header para bypass do warning do ngrok free
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao fazer upload do arquivo');
    }

    const data = await response.json();
    
    // Log para debug em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('Upload response:', data);
    }
    
    // O backend retorna { url: "..." } diretamente ou pode vir com wrapper { data: { url: "..." } }
    let url: string;
    if (data.data && data.data.url) {
      url = data.data.url;
    } else if (data.url) {
      url = data.url;
    } else {
      const errorMsg = 'URL não encontrada na resposta do servidor. Resposta: ' + JSON.stringify(data);
      if (import.meta.env.DEV) {
        console.error('Upload error - response data:', data);
      }
      throw new Error(errorMsg);
    }
    
    // Validar formato da URL
    if (!url || typeof url !== 'string') {
      const errorMsg = `URL inválida retornada do servidor. Tipo: ${typeof url}, Valor: ${url}`;
      if (import.meta.env.DEV) {
        console.error('Upload error - invalid URL:', url);
      }
      throw new Error(errorMsg);
    }
    
    // Validar que a URL começa com http
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const errorMsg = `URL inválida: deve começar com http:// ou https://. Recebido: ${url}`;
      if (import.meta.env.DEV) {
        console.error('Upload error - invalid URL format:', url);
      }
      throw new Error(errorMsg);
    }
    
    if (import.meta.env.DEV) {
      console.log('Upload successful, URL:', url);
    }
    
    return url;
  } catch (error: any) {
    // Melhorar mensagem de erro
    const errorMessage = error.message || 'Erro desconhecido';
    if (import.meta.env.DEV) {
      console.error('Upload failed:', error);
    }
    toast.error('Erro ao fazer upload: ' + errorMessage);
    throw error;
  }
}

