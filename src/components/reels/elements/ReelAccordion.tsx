import { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ReelAccordionItem {
  title: string;
  content: ReactNode;
}

interface ReelAccordionProps {
  items: ReelAccordionItem[];
  className?: string;
}

export function ReelAccordion({ items, className = '' }: ReelAccordionProps) {
  return (
    <Accordion type="single" collapsible className={`w-full ${className}`}>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-white hover:text-white/80">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="text-white/90">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

