import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bold, Italic, Underline, Link, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FontSize } from './tiptap-extensions/font-size';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Lista de fontes Google disponíveis
const AVAILABLE_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
];

const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '60', '72'];

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const [isTextColorPickerOpen, setIsTextColorPickerOpen] = useState(false);
  const [isBackgroundColorPickerOpen, setIsBackgroundColorPickerOpen] = useState(false);
  const [isColorPickerInteracting, setIsColorPickerInteracting] = useState(false);
  const [isBackgroundColorPickerInteracting, setIsBackgroundColorPickerInteracting] = useState(false);
  const textColorPickerRef = useRef<HTMLInputElement>(null);
  const backgroundColorPickerRef = useRef<HTMLInputElement>(null);
  const isMouseDownRef = useRef(false);
  const isBackgroundMouseDownRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desabilitar heading, blockquote, code, etc se não precisar
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
      }),
      TextStyle,
      Color,
      FontSize,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Se o conteúdo está vazio, garantir que está centralizado
      const isEmpty = !html || html.trim() === '' || html.trim() === '<p></p>' || html.trim() === '<p><br></p>';
      if (isEmpty && !editor.isActive({ textAlign: 'center' })) {
        editor.commands.setTextAlign('center');
      }
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'min-h-[200px] p-3 focus:outline-none prose prose-sm max-w-none bg-surface-elevated dark:bg-[hsl(240_10%_15%)]',
        style: 'white-space: pre-wrap;',
      },
    },
  });

  // Sincronizar valor externo com editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
      
      // Após definir conteúdo, verificar se está vazio e centralizar
      setTimeout(() => {
        const html = editor.getHTML();
        const isEmpty = !html || html.trim() === '' || html.trim() === '<p></p>' || html.trim() === '<p><br></p>';
        
        if (isEmpty && !editor.isActive({ textAlign: 'center' })) {
          editor.commands.setTextAlign('center');
        }
      }, 0);
    }
  }, [value, editor]);

  // Centralizar texto por padrão quando o editor é inicializado vazio
  useEffect(() => {
    if (editor) {
      // Aguardar um frame para garantir que o editor está totalmente inicializado
      requestAnimationFrame(() => {
        const html = editor.getHTML();
        // Verificar se o conteúdo está vazio ou contém apenas tags vazias
        const isEmpty = !html || html.trim() === '' || html.trim() === '<p></p>' || html.trim() === '<p><br></p>';
        
        // Verificar se já tem alinhamento definido
        const hasAlignment = html.includes('text-align') || editor.isActive({ textAlign: 'left' }) || editor.isActive({ textAlign: 'right' }) || editor.isActive({ textAlign: 'justify' });
        
        if (isEmpty && !hasAlignment) {
          // Centralizar o texto por padrão
          editor.commands.setTextAlign('center');
        }
      });
    }
  }, [editor]);

  // Centralizar quando o editor recebe foco e está vazio
  useEffect(() => {
    if (!editor) return;

    const handleFocus = () => {
      const html = editor.getHTML();
      const isEmpty = !html || html.trim() === '' || html.trim() === '<p></p>' || html.trim() === '<p><br></p>';
      
      if (isEmpty && !editor.isActive({ textAlign: 'center' })) {
        setTimeout(() => {
          editor.commands.setTextAlign('center');
        }, 0);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('focus', handleFocus);

    return () => {
      editorElement.removeEventListener('focus', handleFocus);
    };
  }, [editor]);

  // Obter estilos atuais da seleção
  const getCurrentStyles = () => {
    if (!editor) {
      return {
        fontSize: '16',
        fontFamily: 'Inter',
        color: '#000000',
        backgroundColor: 'transparent',
      };
    }

    const { fontSize, fontFamily, color } = editor.getAttributes('textStyle');
    const highlight = editor.getAttributes('highlight');

    return {
      fontSize: fontSize || '16',
      fontFamily: fontFamily || 'Inter',
      color: color || '#000000',
      backgroundColor: highlight?.color || 'transparent',
    };
  };

  const currentStyles = editor ? getCurrentStyles() : {
    fontSize: '16',
    fontFamily: 'Inter',
    color: '#000000',
    backgroundColor: 'transparent',
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <div className="border-b p-1 flex flex-wrap gap-1 bg-muted/50">
        {/* Formatação básica */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive('bold') && "bg-surface-hover"
          )}
          onClick={() => {
            // Preservar a cor atual ao aplicar negrito
            const currentColor = editor.getAttributes('textStyle').color;
            editor.chain().focus().toggleBold().run();
            // Se havia uma cor definida, restaurá-la após aplicar negrito
            if (currentColor) {
              setTimeout(() => {
                editor.chain().focus().setColor(currentColor).run();
              }, 0);
            }
          }}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive('italic') && "bg-surface-hover"
          )}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive('underline') && "bg-surface-hover"
          )}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Seletor de Fontes */}
        <div className="flex items-center gap-1">
          <Select
            value={currentStyles.fontFamily}
            onValueChange={(fontFamily) => {
              editor.chain().focus().setFontFamily(`'${fontFamily}', sans-serif`).run();
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: `'${font.value}', sans-serif` }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Seletor de Tamanho */}
        <div className="flex items-center gap-1">
          <Type className="h-4 w-4 text-muted-foreground" />
          <Select
            value={currentStyles.fontSize}
            onValueChange={(size) => {
              editor.chain().focus().setFontSize(size).run();
            }}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue placeholder="Tamanho" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Color Picker - Texto */}
        <Popover 
          open={isTextColorPickerOpen} 
          modal={false}
          onOpenChange={(open) => {
            // Prevenir fechamento se estiver interagindo com o color picker
            if (!open && (isColorPickerInteracting || isMouseDownRef.current)) {
              return;
            }
            setIsTextColorPickerOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
              title="Cor do texto"
            >
              <div className="relative">
                <Palette className="h-4 w-4" />
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-sm"
                  style={{ backgroundColor: currentStyles.color }}
                />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-2"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              // Prevenir fechamento durante interação com color picker
              const target = e.target as HTMLElement;
              if (target.closest('input[type="color"]') || isColorPickerInteracting || isMouseDownRef.current) {
                e.preventDefault();
              }
            }}
            onPointerDownOutside={(e) => {
              // Prevenir fechamento durante interação com color picker
              const target = e.target as HTMLElement;
              if (target.closest('input[type="color"]') || isColorPickerInteracting || isMouseDownRef.current) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              // Permitir fechar com ESC apenas se não estiver interagindo
              if (isColorPickerInteracting || isMouseDownRef.current) {
                e.preventDefault();
              }
            }}
          >
            <div 
              className="space-y-2"
              onMouseDown={(e) => {
                // Capturar qualquer clique dentro do popover
                const target = e.target as HTMLElement;
                if (target.closest('input[type="color"]')) {
                  e.stopPropagation();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Cor do Texto</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-surface-hover"
                  onClick={() => setIsTextColorPickerOpen(false)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={textColorPickerRef}
                  type="color"
                  value={currentStyles.color}
                  onChange={(e) => {
                    editor.chain().focus().setColor(e.target.value).run();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    isMouseDownRef.current = true;
                    setIsColorPickerInteracting(true);
                    
                    // Listener global para mouseup - capturar em qualquer lugar
                    const handleMouseUp = (event: MouseEvent) => {
                      // Se o mouseup foi no color picker ou dentro do popover, não fazer nada ainda
                      const target = event.target as HTMLElement;
                      if (target.closest('[role="dialog"]') || target.closest('input[type="color"]')) {
                        return;
                      }
                      
                      isMouseDownRef.current = false;
                      // Aguardar um pouco antes de permitir fechamento
                      setTimeout(() => {
                        setIsColorPickerInteracting(false);
                      }, 500);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mouseup', handleMouseUp, true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    isMouseDownRef.current = true;
                    setIsColorPickerInteracting(true);
                    
                    const handleTouchEnd = (event: TouchEvent) => {
                      const target = event.target as HTMLElement;
                      if (target.closest('[role="dialog"]') || target.closest('input[type="color"]')) {
                        return;
                      }
                      
                      isMouseDownRef.current = false;
                      setTimeout(() => {
                        setIsColorPickerInteracting(false);
                      }, 500);
                      document.removeEventListener('touchend', handleTouchEnd, true);
                    };
                    document.addEventListener('touchend', handleTouchEnd, true);
                  }}
                  className="w-12 h-8 cursor-pointer rounded border flex-shrink-0"
                />
                <input
                  type="text"
                  value={currentStyles.color}
                  onChange={(e) => {
                    const color = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(color)) {
                      editor.chain().focus().setColor(color).run();
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs border rounded"
                  placeholder="#000000"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Color Picker - Fundo */}
        <Popover 
          open={isBackgroundColorPickerOpen} 
          modal={false}
          onOpenChange={(open) => {
            // Prevenir fechamento se estiver interagindo com o color picker
            if (!open && (isBackgroundColorPickerInteracting || isBackgroundMouseDownRef.current)) {
              return;
            }
            setIsBackgroundColorPickerOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground"
              title="Cor de fundo do texto"
            >
              <div className="relative">
                <div className="h-4 w-4 border border-border rounded" style={{ backgroundColor: currentStyles.backgroundColor === 'transparent' ? 'transparent' : currentStyles.backgroundColor }} />
                <div
                  className="absolute inset-0 border border-border rounded"
                  style={{
                    backgroundImage: currentStyles.backgroundColor === 'transparent'
                      ? 'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                      : 'none',
                    backgroundSize: currentStyles.backgroundColor === 'transparent' ? '4px 4px' : 'auto',
                    backgroundPosition: currentStyles.backgroundColor === 'transparent' ? '0 0, 2px 2px' : 'auto'
                  }}
                />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-2"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              // Prevenir fechamento durante interação com color picker
              const target = e.target as HTMLElement;
              if (target.closest('input[type="color"]') || isBackgroundColorPickerInteracting || isBackgroundMouseDownRef.current) {
                e.preventDefault();
              }
            }}
            onPointerDownOutside={(e) => {
              // Prevenir fechamento durante interação com color picker
              const target = e.target as HTMLElement;
              if (target.closest('input[type="color"]') || isBackgroundColorPickerInteracting || isBackgroundMouseDownRef.current) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              // Permitir fechar com ESC apenas se não estiver interagindo
              if (isBackgroundColorPickerInteracting || isBackgroundMouseDownRef.current) {
                e.preventDefault();
              }
            }}
          >
            <div 
              className="space-y-2"
              onMouseDown={(e) => {
                // Capturar qualquer clique dentro do popover
                const target = e.target as HTMLElement;
                if (target.closest('input[type="color"]')) {
                  e.stopPropagation();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Cor de Fundo</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-surface-hover"
                  onClick={() => setIsBackgroundColorPickerOpen(false)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={backgroundColorPickerRef}
                  type="color"
                  value={currentStyles.backgroundColor === 'transparent' ? '#000000' : currentStyles.backgroundColor}
                  onChange={(e) => {
                    const color = e.target.value;
                    editor.chain().focus().toggleHighlight({ color }).run();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    isBackgroundMouseDownRef.current = true;
                    setIsBackgroundColorPickerInteracting(true);
                    
                    // Listener global para mouseup - capturar em qualquer lugar
                    const handleMouseUp = (event: MouseEvent) => {
                      // Se o mouseup foi no color picker ou dentro do popover, não fazer nada ainda
                      const target = event.target as HTMLElement;
                      if (target.closest('[role="dialog"]') || target.closest('input[type="color"]')) {
                        return;
                      }
                      
                      isBackgroundMouseDownRef.current = false;
                      // Aguardar um pouco antes de permitir fechamento
                      setTimeout(() => {
                        setIsBackgroundColorPickerInteracting(false);
                      }, 500);
                      document.removeEventListener('mouseup', handleMouseUp, true);
                    };
                    document.addEventListener('mouseup', handleMouseUp, true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    isBackgroundMouseDownRef.current = true;
                    setIsBackgroundColorPickerInteracting(true);
                    
                    const handleTouchEnd = (event: TouchEvent) => {
                      const target = event.target as HTMLElement;
                      if (target.closest('[role="dialog"]') || target.closest('input[type="color"]')) {
                        return;
                      }
                      
                      isBackgroundMouseDownRef.current = false;
                      setTimeout(() => {
                        setIsBackgroundColorPickerInteracting(false);
                      }, 500);
                      document.removeEventListener('touchend', handleTouchEnd, true);
                    };
                    document.addEventListener('touchend', handleTouchEnd, true);
                  }}
                  className="w-12 h-8 cursor-pointer rounded border flex-shrink-0"
                />
                <input
                  type="text"
                  value={currentStyles.backgroundColor}
                  onChange={(e) => {
                    const value = e.target.value || 'transparent';
                    if (value === 'transparent') {
                      editor.chain().focus().unsetHighlight().run();
                    } else if (/^#[0-9A-F]{6}$/i.test(value)) {
                      editor.chain().focus().toggleHighlight({ color: value }).run();
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs border rounded"
                  placeholder="transparent"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                }}
              >
                Remover Fundo
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Link */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive('link') && "bg-surface-hover"
          )}
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              const url = prompt('URL do link:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }
          }}
        >
          <Link className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Alinhamento */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive({ textAlign: 'left' }) && "bg-surface-hover"
          )}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive({ textAlign: 'center' }) && "bg-surface-hover"
          )}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive({ textAlign: 'right' }) && "bg-surface-hover"
          )}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-surface-hover hover:text-foreground",
            editor.isActive({ textAlign: 'justify' }) && "bg-surface-hover"
          )}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
