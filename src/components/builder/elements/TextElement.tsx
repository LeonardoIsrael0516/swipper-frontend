import { memo } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import DOMPurify from 'dompurify';

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

interface TextElementProps {
  element: SlideElement;
}

// Função para processar HTML e aplicar textColor a todos os elementos
// Substitui cores inline no estilo dos elementos pelo textColor configurado
const applyTextColorToHtml = (html: string, textColor: string): string => {
  if (!html) return html;
  
  try {
    // Se estiver no browser, usar DOM manipulation (mais preciso)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Encontrar todos os elementos com atributo style
      const allElements = tempDiv.querySelectorAll('[style*="color"]');
      
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          // Substituir qualquer cor pelo textColor configurado
          htmlEl.style.color = textColor;
        }
      });
      
      // Também aplicar cor a todos os elementos sem estilo definido
      const allElementsWithStyle = tempDiv.querySelectorAll('*');
      allElementsWithStyle.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style && !htmlEl.style.color) {
          htmlEl.style.color = textColor;
        }
      });
      
      return tempDiv.innerHTML;
    }
    
    // Fallback: usar regex para substituir cores inline (funciona em qualquer ambiente)
    // Substituir color: seguido de qualquer valor de cor
    return html.replace(
      /style="([^"]*color:\s*)[^;"]+([^"]*)"/gi,
      (match, prefix, suffix) => {
        return `style="${prefix}${textColor}${suffix}"`;
      }
    ).replace(
      /style='([^']*color:\s*)[^;']+([^']*)'/gi,
      (match, prefix, suffix) => {
        return `style='${prefix}${textColor}${suffix}'`;
      }
    );
  } catch (error) {
    // Em caso de erro, retornar HTML original
    console.error('Erro ao processar HTML para aplicar cor:', error);
    return html;
  }
};

export const TextElement = memo(function TextElement({ element }: TextElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    content = '',
    alignment = 'left',
    textColor = '#FFFFFF',
    backgroundColor = 'transparent',
    fontSize = 16,
    fontWeight = 'normal',
    padding = { top: 0, right: 0, bottom: 0, left: 0 },
    borderRadius = 0,
    maxHeight,
  } = config;

  // Processar HTML para aplicar textColor corretamente
  const processedContent = content ? applyTextColorToHtml(content, textColor) : '';

  // Sanitizar HTML para prevenir XSS
  const sanitizedContent = processedContent 
    ? (typeof window !== 'undefined' ? DOMPurify.sanitize(processedContent, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div'],
        ALLOWED_ATTR: ['style', 'href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
      }) : processedContent)
    : '';

  const style: React.CSSProperties = {
    color: textColor,
    backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
    fontSize: `${fontSize}px`,
    fontWeight,
    textAlign: alignment as 'left' | 'center' | 'right' | 'justify',
    padding: padding
      ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`
      : '0',
    borderRadius: `${borderRadius}px`,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
    overflow: maxHeight ? 'auto' : undefined,
  };

  return (
    <div style={style}>
      {sanitizedContent ? (
        <div 
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          style={{ color: textColor }}
        />
      ) : (
        <p className="text-sm opacity-60" style={{ color: textColor }}>Texto vazio</p>
      )}
    </div>
  );
});

