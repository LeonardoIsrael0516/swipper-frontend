import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateQuizModal({ open, onOpenChange }: CreateQuizModalProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Por favor, informe um nome para o Swipper');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/reels', {
        title: title.trim(),
        description: '',
        status: 'ACTIVE', // Publicar automaticamente para preview funcionar
        slides: [
          {
            question: '',
            options: [],
            elements: [],
            uiConfig: {
              backgroundConfig: {
                type: 'color',
                color: '#ffffff',
              },
            },
          },
        ],
      });

      const data = (response as any).data || response;
      
      // Invalidate queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['user-reels'] });
      
      toast.success('Swipper criado com sucesso!');
      onOpenChange(false);
      setTitle('');
      navigate(`/builder/${data.id}`);
    } catch (error: any) {
      toast.error('Erro ao criar swipper: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar novo Swipper</DialogTitle>
          <DialogDescription>
            Dê um nome ao seu Swipper. Você poderá editá-lo depois.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="swipper-title">Nome do Swipper</Label>
            <Input
              id="swipper-title"
              placeholder="Ex: Funil Low Ticket"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleCreate();
                }
              }}
              className="mt-2"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-3 sm:gap-2">
          {!isMobile && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setTitle('');
              }}
              disabled={isLoading}
              className="hover:bg-surface-hover hover:text-foreground"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleCreate}
            disabled={isLoading || !title.trim()}
            className="gradient-primary text-primary-foreground"
          >
            {isLoading ? 'Criando...' : 'Criar Swipper'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

