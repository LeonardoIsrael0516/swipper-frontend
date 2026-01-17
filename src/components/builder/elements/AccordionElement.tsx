import React from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

interface AccordionElementProps {
  element: SlideElement;
}

export function AccordionElement({ element }: AccordionElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    items = [],
    borderRadius = 8,
    dividerColor = '#e5e7eb',
    textColor = '#000000',
    backgroundColor = '#ffffff',
    descriptionColor = '#666666',
  } = config;

  // Se não houver itens, mostrar placeholder
  if (items.length === 0) {
    return (
      <div
        className="w-full rounded-lg border p-4 text-center"
        style={{
          borderRadius: `${borderRadius}px`,
          backgroundColor,
          borderColor: dividerColor,
        }}
      >
        <p style={{ color: textColor, fontSize: '14px', opacity: 0.6 }}>
          Adicione itens ao accordion
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-lg border overflow-hidden"
      style={{
        borderRadius: `${borderRadius}px`,
        backgroundColor,
        borderColor: dividerColor,
      }}
    >
      <Accordion type="single" collapsible className="w-full">
        {items.map((item: any, index: number) => (
          <AccordionItem
            key={item.id || index}
            value={`item-${item.id || index}`}
            style={{
              borderBottomColor: index < items.length - 1 ? dividerColor : 'transparent',
            }}
          >
            <AccordionTrigger
              style={{
                color: textColor,
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              <span className="text-left font-medium">
                {item.title || `Item ${index + 1}`}
              </span>
            </AccordionTrigger>
            <AccordionContent
              style={{
                color: descriptionColor,
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              <p className="text-sm leading-relaxed">
                {item.description || 'Sem descrição'}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

