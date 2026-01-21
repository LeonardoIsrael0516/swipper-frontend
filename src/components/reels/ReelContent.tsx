import { ReactNode, memo } from 'react';

interface ReelContentProps {
  children: ReactNode;
  type?: 'video' | 'image' | 'text' | 'mixed';
  className?: string;
}

export const ReelContent = memo(function ReelContent({ children, type = 'mixed', className = '' }: ReelContentProps) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center p-4 md:p-8 reel-content-wrapper ${className}`}
      style={{ 
        zIndex: 30,
        position: 'absolute',
        isolation: 'isolate', // Criar novo contexto de empilhamento
        overflow: 'hidden', // Garantir que elementos não escapem
      }}
    >
      {/* 
        Importante: evitar "scroll duplo" no mobile.
        O container que realmente precisa rolar deve ser o conteúdo específico da página (ex: PublicQuiz/PreviewQuiz),
        e não o wrapper genérico aqui. 
      */}
      {/* No desktop, container com aspect ratio 9:15.35 (como mobile preview) */}
      <div 
        className="w-full h-full min-h-0 max-w-[1920px] mx-auto flex flex-col justify-start reel-content-inner md:w-auto md:max-w-none md:aspect-[9/15.35] md:max-h-[90vh]"
        style={{
          position: 'relative',
          isolation: 'isolate', // Criar novo contexto de empilhamento
          overflow: 'hidden', // Garantir que elementos não escapem
        }}
      >
        {children}
      </div>
    </div>
  );
});

