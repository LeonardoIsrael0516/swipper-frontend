import { useBuilder } from '@/contexts/BuilderContext';
import { MobileSlidesTimeline } from './MobileSlidesTimeline';
import { MobileElementsCarousel } from './MobileElementsCarousel';
import { MobileElementEditorOverlay } from './MobileElementEditorOverlay';

export function MobileBuilderControls() {
  const { selectedElement, isEditingBackground } = useBuilder();

  // Mostrar overlay do editor quando elemento estiver selecionado ou editando background
  const shouldShowEditor = selectedElement || isEditingBackground;

  return (
    <>
      <div className="flex flex-col">
        {/* Timeline de Slides */}
        <div className="flex-shrink-0 border-b border-border/50">
          <MobileSlidesTimeline />
        </div>

        {/* Carrossel de Elementos */}
        <div className="flex-shrink-0">
          <MobileElementsCarousel />
        </div>
      </div>

      {/* Overlay do Editor - renderizado como overlay fixo */}
      {shouldShowEditor && (
        <MobileElementEditorOverlay
          onClose={() => {
            // O overlay vai limpar os estados no handleClose
          }}
        />
      )}
    </>
  );
}

