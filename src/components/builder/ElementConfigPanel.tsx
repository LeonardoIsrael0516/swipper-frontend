import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ThemeEditor } from '@/components/builder/ThemeEditor';
import { GamificationEditor } from '@/components/builder/GamificationEditor';

export function ElementConfigPanel() {
  const { selectedElement, isEditingBackground, selectedTab } = useBuilder();

  // Se estiver na aba Gamificação, mostrar GamificationEditor
  if (selectedTab === 'gamification') {
    return (
      <div className="basis-96 min-w-[300px] max-w-[384px] border-l border-border/50 bg-background flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Configurações</h2>
          <p className="text-xs text-muted-foreground mt-1">Gamificação</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <GamificationEditor />
        </div>
      </div>
    );
  }

  // Se estiver na aba Tema, mostrar ThemeEditor
  if (selectedTab === 'theme') {
    return (
      <div className="basis-96 min-w-[300px] max-w-[384px] border-l border-border/50 bg-background flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Configurações</h2>
          <p className="text-xs text-muted-foreground mt-1">Tema</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ThemeEditor />
        </div>
      </div>
    );
  }

  // Se estiver editando o fundo, mostrar BackgroundEditor
  if (isEditingBackground) {
    return (
      <div className="basis-96 min-w-[300px] max-w-[384px] border-l border-border/50 bg-background flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Configurações</h2>
          <p className="text-xs text-muted-foreground mt-1">Fundo</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <BackgroundEditor />
        </div>
      </div>
    );
  }

  if (!selectedElement) {
    return (
      <div className="basis-96 min-w-[300px] max-w-[384px] border-l border-border/50 bg-background p-4">
        <div className="text-center text-muted-foreground mt-8">
          <p className="text-sm">Selecione um elemento para configurar</p>
        </div>
      </div>
    );
  }

  // Elemento SPACING não tem conteúdo, mostrar apenas o editor sem abas
  if (selectedElement.elementType === 'SPACING') {
    return (
      <div className="basis-96 min-w-[300px] max-w-[384px] border-l border-border/50 bg-background flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Configurações</h2>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            {selectedElement.elementType.toLowerCase()}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SpacingElementEditor element={selectedElement} tab="design" />
        </div>
      </div>
    );
  }

  return (
    <div className="basis-96 min-w-[300px] max-w-[384px] border-l border-border/50 bg-background flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-sm font-semibold">Configurações</h2>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {selectedElement.elementType.toLowerCase()}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="content" className="flex-1">
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="design" className="flex-1">
              Design
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
}

