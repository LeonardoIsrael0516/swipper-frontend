import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Trash2, Copy } from 'lucide-react';
import { useBuilder } from '@/contexts/BuilderContext';
import { TextElementEditor } from '@/components/builder/elements/TextElementEditor';
import { ImageElementEditor } from '@/components/builder/elements/ImageElementEditor';
import { VideoElementEditor } from '@/components/builder/elements/VideoElementEditor';
import { AudioElementEditor } from '@/components/builder/elements/AudioElementEditor';
import { TimerElementEditor } from '@/components/builder/elements/TimerElementEditor';
import { CarouselElementEditor } from '@/components/builder/elements/CarouselElementEditor';
import { ButtonElementEditor } from '@/components/builder/elements/ButtonElementEditor';
import { AccordionElementEditor } from '@/components/builder/elements/AccordionElementEditor';
import { ComparativoElementEditor } from '@/components/builder/elements/ComparativoElementEditor';
import { PriceElementEditor } from '@/components/builder/elements/PriceElementEditor';
import { PlansElementEditor } from '@/components/builder/elements/PlansElementEditor';
import { QuestionnaireElementEditor } from '@/components/builder/elements/QuestionnaireElementEditor';
import { QuestionGridElementEditor } from '@/components/builder/elements/QuestionGridElementEditor';
import { ProgressElementEditor } from '@/components/builder/elements/ProgressElementEditor';
import { FormElementEditor } from '@/components/builder/elements/FormElementEditor';
import { FeedbackElementEditor } from '@/components/builder/elements/FeedbackElementEditor';
import { DashElementEditor } from '@/components/builder/elements/DashElementEditor';
import { ChartElementEditor } from '@/components/builder/elements/ChartElementEditor';
import { ScoreElementEditor } from '@/components/builder/elements/ScoreElementEditor';
import { SpacingElementEditor } from '@/components/builder/elements/SpacingElementEditor';
import { BackgroundEditor } from '@/components/builder/BackgroundEditor';

interface MobileElementEditorOverlayProps {
  onClose: () => void;
}

export function MobileElementEditorOverlay({ onClose }: MobileElementEditorOverlayProps) {
  const { selectedElement, isEditingBackground, setSelectedElement, setIsEditingBackground, removeElement, duplicateElement } = useBuilder();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Aguardar animação antes de fechar
    setTimeout(() => {
      setSelectedElement(null);
      setIsEditingBackground(false);
      onClose();
    }, 200);
  };

  const handleDelete = async () => {
    if (!selectedElement) return;
    await removeElement(selectedElement.id);
    handleClose();
  };

  const handleDuplicate = async () => {
    if (!selectedElement) return;
    await duplicateElement(selectedElement.id);
    // Não fechar após duplicar, manter o editor aberto
  };

  // Se estiver editando background
  if (isEditingBackground) {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 h-[50vh] bg-background border-t border-border/50 z-50 flex flex-col transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
          <h3 className="text-sm font-semibold">Fundo</h3>
          <Button size="sm" variant="ghost" onClick={handleClose} className="h-7 w-7 p-0" title="Fechar">
            <Check className="w-4 h-4" />
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          <BackgroundEditor />
        </div>
      </div>
    );
  }

  if (!selectedElement) {
    return null;
  }

  const elementTypeLabel = selectedElement.elementType.toLowerCase().replace('_', ' ');

  // Elemento SPACING não tem conteúdo, mostrar apenas o editor sem abas
  if (selectedElement.elementType === 'SPACING') {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 h-[50vh] bg-background border-t border-border/50 z-50 flex flex-col transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
          <h3 className="text-sm font-semibold capitalize">{elementTypeLabel}</h3>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={handleDuplicate} className="h-7 w-7 p-0" title="Duplicar">
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDelete} className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Excluir">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClose} className="h-7 w-7 p-0" title="Fechar">
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Conteúdo sem Tabs */}
        <div className="flex-1 overflow-y-auto p-4">
          <SpacingElementEditor element={selectedElement} tab="design" />
        </div>
      </div>
    );
  }

  return (
      <div
        className={`fixed bottom-0 left-0 right-0 h-[50vh] bg-background border-t border-border/50 z-50 flex flex-col transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
        <h3 className="text-sm font-semibold capitalize">{elementTypeLabel}</h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleDuplicate} className="h-7 w-7 p-0" title="Duplicar">
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClose} className="h-7 w-7 p-0" title="Fechar">
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo com Tabs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="content" className="w-full flex flex-col flex-1 overflow-hidden">
          <TabsList className="w-full rounded-none border-b flex-shrink-0">
            <TabsTrigger value="content" className="flex-1">
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="design" className="flex-1">
              Design
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="content" className="p-4 m-0">
              {selectedElement.elementType === 'TEXT' && (
                <TextElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'IMAGE' && (
                <ImageElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'VIDEO' && (
                <VideoElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'AUDIO' && (
                <AudioElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'TIMER' && (
                <TimerElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'CAROUSEL' && (
                <CarouselElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'BUTTON' && (
                <ButtonElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'ACCORDION' && (
                <AccordionElementEditor element={selectedElement} tab="content" />
              )}
              {(selectedElement.elementType === 'BENEFITS' || selectedElement.elementType === 'COMPARATIVO') && (
                <ComparativoElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'PRICE' && (
                <PriceElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'PLANS' && (
                <PlansElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'QUESTIONNAIRE' && (
                <QuestionnaireElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'QUESTION_GRID' && (
                <QuestionGridElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'PROGRESS' && (
                <ProgressElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'FORM' && (
                <FormElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'FEEDBACK' && (
                <FeedbackElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'CIRCULAR' && (
                <DashElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'CHART' && (
                <ChartElementEditor element={selectedElement} tab="content" />
              )}
              {selectedElement.elementType === 'SCORE' && (
                <ScoreElementEditor element={selectedElement} tab="content" />
              )}
            </TabsContent>

            <TabsContent value="design" className="p-4 m-0">
              {selectedElement.elementType === 'TEXT' && (
                <TextElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'IMAGE' && (
                <ImageElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'VIDEO' && (
                <VideoElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'AUDIO' && (
                <AudioElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'TIMER' && (
                <TimerElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'CAROUSEL' && (
                <CarouselElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'BUTTON' && (
                <ButtonElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'ACCORDION' && (
                <AccordionElementEditor element={selectedElement} tab="design" />
              )}
              {(selectedElement.elementType === 'BENEFITS' || selectedElement.elementType === 'COMPARATIVO') && (
                <ComparativoElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'PRICE' && (
                <PriceElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'PLANS' && (
                <PlansElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'QUESTIONNAIRE' && (
                <QuestionnaireElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'QUESTION_GRID' && (
                <QuestionGridElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'PROGRESS' && (
                <ProgressElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'FORM' && (
                <FormElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'FEEDBACK' && (
                <FeedbackElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'CIRCULAR' && (
                <DashElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'CHART' && (
                <ChartElementEditor element={selectedElement} tab="design" />
              )}
              {selectedElement.elementType === 'SCORE' && (
                <ScoreElementEditor element={selectedElement} tab="design" />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

