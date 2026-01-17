import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash2, GripVertical } from 'lucide-react';
import { SlideElement } from '@/contexts/BuilderContext';
import { useBuilder } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';

interface InteractiveElementProps {
  element: SlideElement;
  children: ReactNode;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export function InteractiveElement({
  element,
  children,
  isDragging = false,
  dragHandleProps,
}: InteractiveElementProps) {
  const { selectedElement, setSelectedElement, setIsEditingBackground, duplicateElement, removeElement } = useBuilder();
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedElement?.id === element.id;

  const handleEdit = () => {
    setSelectedElement(element);
    setIsEditingBackground(false);
  };

  const handleDuplicate = async () => {
    await duplicateElement(element.id);
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja remover este elemento?')) {
      await removeElement(element.id);
    }
  };

  return (
    <div
      className={cn(
        'relative group',
        isDragging && 'opacity-50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container com padding para stroke */}
      <div
        className={cn(
          'transition-all p-3 rounded-lg border',
          (isHovered || isSelected) ? 'border-primary' : 'border-transparent',
          !isDragging && 'cursor-pointer'
        )}
        style={(isHovered || isSelected) ? { borderWidth: '0.5px' } : { borderWidth: '0px' }}
        onClick={(e) => {
          // Selecionar elemento ao clicar, mas não interferir com drag
          if (!isDragging) {
            handleEdit();
          }
        }}
      >
        {children}
      </div>

      {/* Botões de ação à direita */}
      {isHovered && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-background rounded-lg p-1 shadow-lg border border-border">
            {/* Botão Editar */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              title="Editar"
            >
              <Edit className="w-3 h-3" />
            </Button>

            {/* Botão Duplicar */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate();
              }}
              title="Duplicar"
            >
              <Copy className="w-3 h-3" />
            </Button>

            {/* Botão Mover (drag handle) */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
              title="Mover"
              onClick={(e) => {
                e.stopPropagation();
              }}
              {...dragHandleProps}
            >
              <GripVertical className="w-3 h-3" />
            </Button>

            {/* Botão Apagar */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Apagar"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

