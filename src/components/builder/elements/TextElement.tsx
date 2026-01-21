import { memo, useEffect, useRef } from 'react';
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

// Função para processar HTML e aplicar textColor apenas aos elementos sem cor definida
// Preserva cores inline quando aplicadas via editor (não sobrescreve)
// Também garante que strong e em tenham estilos corretos
const applyTextColorToHtml = (html: string, textColor: string): string => {
  if (!html) return html;
  
  try {
    // Se estiver no browser, usar DOM manipulation (mais preciso)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Garantir que strong e em tenham estilos corretos (SEMPRE aplicar, mesmo se já tiver)
      // MAS preservar a cor que já existe (não sobrescrever)
      const strongElements = tempDiv.querySelectorAll('strong');
      strongElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Preservar a cor existente antes de aplicar fontWeight
        const existingColor = htmlEl.style.color || 
                             (htmlEl.parentElement as HTMLElement)?.style?.color ||
                             null;
        // Sempre aplicar fontWeight bold, mesmo se já tiver estilo
        htmlEl.style.fontWeight = 'bold';
        // Restaurar a cor se existia (não aplicar cor padrão se já tinha cor)
        if (existingColor && existingColor !== 'rgb(0, 0, 0)' && existingColor !== '#000000' && existingColor !== 'rgb(0,0,0)') {
          htmlEl.style.color = existingColor;
        }
      });
      
      const emElements = tempDiv.querySelectorAll('em');
      emElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Sempre aplicar fontStyle italic, mesmo se já tiver estilo
        htmlEl.style.fontStyle = 'italic';
        // Garantir que não seja sobrescrito
        htmlEl.setAttribute('style', htmlEl.getAttribute('style') || '');
      });
      
      const uElements = tempDiv.querySelectorAll('u');
      uElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Sempre aplicar textDecoration underline
        htmlEl.style.textDecoration = 'underline';
        // Garantir que não seja sobrescrito
        htmlEl.setAttribute('style', htmlEl.getAttribute('style') || '');
      });
      
      // Aplicar cor apenas aos elementos sem cor definida (preservar cores inline)
      // IMPORTANTE: Não sobrescrever cores que já estão definidas (especialmente em strong, em, etc)
      // Primeiro, verificar se há elementos com cor definida (como spans com color)
      const allElements = tempDiv.querySelectorAll('*');
      const elementsWithColor: Set<HTMLElement> = new Set();
      
      // Primeiro passo: identificar elementos que já têm cor definida
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style && htmlEl.style.color) {
          const color = htmlEl.style.color;
          // Se não é preto padrão, marcar como tendo cor definida
          if (color !== 'rgb(0, 0, 0)' && color !== '#000000' && color !== 'rgb(0,0,0)' && color !== '') {
            elementsWithColor.add(htmlEl);
            // Também marcar elementos filhos que herdam essa cor
            Array.from(htmlEl.querySelectorAll('*')).forEach((child) => {
              const childEl = child as HTMLElement;
              if (childEl.tagName === 'STRONG' || childEl.tagName === 'EM' || childEl.tagName === 'U') {
                // Preservar a cor do pai para elementos de formatação
                if (!childEl.style.color || childEl.style.color === 'rgb(0, 0, 0)' || childEl.style.color === '#000000') {
                  childEl.style.color = color;
                  elementsWithColor.add(childEl);
                }
              }
            });
          }
        }
      });
      
      // Segundo passo: aplicar cor apenas aos elementos sem cor definida
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style && !elementsWithColor.has(htmlEl)) {
          const currentColor = htmlEl.style.color;
          const isDefaultBlack = !currentColor || 
                                 currentColor === 'rgb(0, 0, 0)' || 
                                 currentColor === '#000000' ||
                                 currentColor === 'rgb(0,0,0)';
          
          if (isDefaultBlack) {
            // Verificar se o elemento tem texto (não aplicar a elementos vazios)
            if (htmlEl.textContent && htmlEl.textContent.trim()) {
              htmlEl.style.color = textColor;
            }
          }
        }
      });
      
      // Aplicar cor ao próprio container se não houver elementos filhos com cor
      if (!tempDiv.style.color) {
        tempDiv.style.color = textColor;
      }
      
      return tempDiv.innerHTML;
    }
    
    // Fallback: usar regex apenas para elementos sem cor definida
    // Não substituir cores existentes, apenas adicionar onde não há
    return html;
  } catch (error) {
    // Em caso de erro, retornar HTML original
    return html;
  }
};

export const TextElement = memo(function TextElement({ element }: TextElementProps) {
  const contentRef = useRef<HTMLDivElement>(null);
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

  // Sanitizar HTML para prevenir XSS - configuração restritiva
  // Permitir font-family no style para preservar fontes aplicadas no editor
  const sanitizedContent = processedContent 
    ? (typeof window !== 'undefined' ? DOMPurify.sanitize(processedContent, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'mark'],
        ALLOWED_ATTR: ['style', 'href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_TRUSTED_TYPE: false,
      }) : processedContent)
    : '';

  // Garantir que strong e em tenham estilos corretos após renderização
  useEffect(() => {
    if (contentRef.current && sanitizedContent) {
      const strongElements = contentRef.current.querySelectorAll('strong');
      strongElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          htmlEl.style.fontWeight = 'bold';
        }
      });
      
      const emElements = contentRef.current.querySelectorAll('em');
      emElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          htmlEl.style.fontStyle = 'italic';
        }
      });
      
      const uElements = contentRef.current.querySelectorAll('u');
      uElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style) {
          htmlEl.style.textDecoration = 'underline';
        }
      });
    }
  }, [sanitizedContent]);

  const style: React.CSSProperties = {
    color: textColor,
    backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
    fontSize: `${fontSize}px`,
    // Não aplicar fontWeight aqui para não sobrescrever strong/em
    // fontWeight será aplicado apenas se não houver formatação inline
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
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          style={{
            // Aplicar fontWeight apenas se não houver formatação inline no HTML
            fontWeight: fontWeight !== 'normal' ? fontWeight : undefined,
          }}
          // Usar CSS específico para garantir que strong/em funcionem
          className="[&_strong]:!font-bold [&_em]:!italic [&_u]:!underline"
        />
      ) : (
        <p className="text-sm opacity-60" style={{ color: textColor }}>Texto vazio</p>
      )}
    </div>
  );
});

