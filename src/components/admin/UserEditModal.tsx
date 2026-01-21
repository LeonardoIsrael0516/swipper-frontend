import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  plan?: {
    id: string;
    title: string;
  } | null;
}

interface UserEditModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditModal({ user, open, onOpenChange }: UserEditModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'USER' | 'REELS'>('USER');
  const [emailVerified, setEmailVerified] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Buscar planos disponíveis
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const response = await api.getAdminPlans<any>();
      return (response as any).data || response;
    },
    enabled: open, // Só buscar quando o modal estiver aberto
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email);
      setRole(user.role as 'USER' | 'REELS');
      setEmailVerified(user.emailVerified);
      setPlanId(user.plan?.id || null);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      email?: string;
      role?: string;
      emailVerified?: boolean;
      planId?: string | null;
    }) => {
      if (!user) throw new Error('User not found');
      const response = await api.updateAdminUser(user.id, data);
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário atualizado com sucesso!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao atualizar usuário');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: name || undefined,
      email,
      role,
      emailVerified,
      planId: planId || null,
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'USER' | 'REELS')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="REELS">REELS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailVerified">Email Verificado</Label>
              <Switch
                id="emailVerified"
                checked={emailVerified}
                onCheckedChange={setEmailVerified}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plano</Label>
              {plansLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={planId || 'none'}
                  onValueChange={(value) => setPlanId(value === 'none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem plano</SelectItem>
                    {(plans || []).map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

