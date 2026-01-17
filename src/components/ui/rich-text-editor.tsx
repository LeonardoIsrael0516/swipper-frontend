import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Underline, Link, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<string>(value);
  const isInternalChangeRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Preservar posição do cursor
  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0);
  };

  const restoreSelection = (range: Range | null) => {
    if (!range || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Inicializar conteúdo na primeira montagem
  useEffect(() => {
    if (editorRef.current && isInitialMountRef.current) {
      editorRef.current.innerHTML = value || '';
      contentRef.current = value;
      isInitialMountRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && contentRef.current !== value && !isInternalChangeRef.current) {
      // Salvar posição do cursor antes de atualizar
      const range = saveSelection();
      
      editorRef.current.innerHTML = value || '';
      contentRef.current = value;
      
      // Restaurar posição do cursor
      if (range) {
        // Aguardar próximo frame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          restoreSelection(range);
        });
      }
    }
    isInternalChangeRef.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      contentRef.current = html;
      isInternalChangeRef.current = true;
      onChange(html);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const isActive = (command: string) => {
    return document.queryCommandState(command);
  };

  const applyFontSize = (size: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Se não há seleção, aplicar ao texto todo
      editorRef.current.style.fontSize = `${size}px`;
      handleInput();
      return;
    }

    // Aplicar tamanho à seleção usando estilo inline
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${size}px`;
    
    try {
      range.surroundContents(span);
    } catch (e) {
      // Se surroundContents falhar, usar extractContents
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    editorRef.current.focus();
    handleInput();
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <div className="border-b p-1 flex flex-wrap gap-1 bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => execCommand('bold')}
          data-active={isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => execCommand('italic')}
          data-active={isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => execCommand('underline')}
          data-active={isActive('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <div className="flex items-center gap-1">
          <Type className="h-4 w-4 text-muted-foreground" />
          <Select
            defaultValue="16"
            onValueChange={applyFontSize}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue placeholder="Tamanho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8px</SelectItem>
              <SelectItem value="10">10px</SelectItem>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="18">18px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
              <SelectItem value="24">24px</SelectItem>
              <SelectItem value="28">28px</SelectItem>
              <SelectItem value="32">32px</SelectItem>
              <SelectItem value="36">36px</SelectItem>
              <SelectItem value="48">48px</SelectItem>
              <SelectItem value="60">60px</SelectItem>
              <SelectItem value="72">72px</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => {
            const url = prompt('URL do link:');
            if (url) execCommand('createLink', url);
          }}
        >
          <Link className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => execCommand('justifyLeft')}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => execCommand('justifyCenter')}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => execCommand('justifyRight')}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
          onClick={() => execCommand('justifyFull')}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[200px] p-3 focus:outline-none prose prose-sm max-w-none bg-surface-elevated dark:bg-[hsl(240_10%_15%)]"
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}

