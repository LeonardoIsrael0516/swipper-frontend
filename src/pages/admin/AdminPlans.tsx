import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Edit, Trash2, GripVertical, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Plan, PlanFeature } from '@/types/plan';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { IconEmojiSelector } from '@/components/builder/elements/IconEmojiSelector';

function formatPrice(price: number): string {
  if (isNaN(price) || price === null || price === undefined) {
    return 'R$ 0';
  }
  
  // Se for um número inteiro, formatar sem centavos
  if (Number.isInteger(price)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  // Se tiver decimais, formatar normalmente
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

function normalizePrice(price: any): number {
  if (price === null || price === undefined) {
    return 0;
  }
  
  if (typeof price === 'number') {
    return isNaN(price) ? 0 : price;
  }
  
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  if (price && typeof price === 'object') {
    // Tentar converter objeto Decimal
    if (typeof price.toNumber === 'function') {
      return price.toNumber();
    }
    const parsed = parseFloat(String(price));
    return isNaN(parsed) ? 0 : parsed;
  }
  
  const num = Number(price);
  return isNaN(num) ? 0 : num;
}

export default function AdminPlans() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const response = await api.getAdminPlans<Plan[]>();
      // Garantir que seja array
      return Array.isArray(response) ? response : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.createPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano criado com sucesso!');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao criar plano');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await api.updatePlan(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano atualizado com sucesso!');
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao atualizar plano');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deletePlan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plano deletado com sucesso!');
      setDeletePlanId(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao deletar plano');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.togglePlanActive(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Status do plano atualizado!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao atualizar status');
    },
  });

  const handleDelete = () => {
    if (deletePlanId) {
      deleteMutation.mutate(deletePlanId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos de assinatura</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Plano
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans && plans.length > 0 ? (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.title}</TableCell>
                      <TableCell>
                        {(() => {
                          const priceValue = normalizePrice(plan.price);
                          return priceValue === 0 ? 'Grátis' : formatPrice(priceValue);
                        })()}
                      </TableCell>
                      <TableCell>
                        {plan.isPopular && <Badge variant="default">Popular</Badge>}
                      </TableCell>
                      <TableCell>{plan.features?.length || 0} itens</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPlan(plan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate(plan.id)}
                          >
                            {plan.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletePlanId(plan.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum plano encontrado. Crie o primeiro plano.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingPlan) && (
        <PlanFormModal
          plan={editingPlan}
          open={isCreateModalOpen || !!editingPlan}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              setEditingPlan(null);
            }
          }}
          onSubmit={(data) => {
            if (editingPlan) {
              updateMutation.mutate({ id: editingPlan.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePlanId} onOpenChange={(open) => !open && setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este plano? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PlanFormModalProps {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function PlanFormModal({ plan, open, onOpenChange, onSubmit, isLoading }: PlanFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [isPopular, setIsPopular] = useState(false);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [maxSwippers, setMaxSwippers] = useState<number | null>(0);
  const [maxVisits, setMaxVisits] = useState<number | null>(0);
  const [maxIntegrations, setMaxIntegrations] = useState<number | null>(0);
  const [customDomain, setCustomDomain] = useState<boolean | null>(false);
  const [enableMaxSwippers, setEnableMaxSwippers] = useState(true);
  const [enableMaxVisits, setEnableMaxVisits] = useState(true);
  const [enableMaxIntegrations, setEnableMaxIntegrations] = useState(true);
  const [enableCustomDomain, setEnableCustomDomain] = useState(true);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDescription(plan.description || '');
      setPrice(normalizePrice(plan.price));
      
      setIsPopular(plan.isPopular);
      setFeatures(plan.features || []);
      
      const limits = plan.limits;
      if (limits) {
        const hasMaxSwippers = limits.maxSwippers !== null && limits.maxSwippers !== undefined;
        const hasMaxVisits = limits.maxVisits !== null && limits.maxVisits !== undefined;
        const hasMaxIntegrations = limits.maxIntegrations !== null && limits.maxIntegrations !== undefined;
        const hasCustomDomain = limits.customDomain !== null && limits.customDomain !== undefined;
        
        setEnableMaxSwippers(hasMaxSwippers);
        setEnableMaxVisits(hasMaxVisits);
        setEnableMaxIntegrations(hasMaxIntegrations);
        setEnableCustomDomain(hasCustomDomain);
        
        setMaxSwippers(hasMaxSwippers ? (limits.maxSwippers ?? 0) : 0);
        setMaxVisits(hasMaxVisits ? (limits.maxVisits ?? 0) : 0);
        setMaxIntegrations(hasMaxIntegrations ? (limits.maxIntegrations ?? 0) : 0);
        setCustomDomain(hasCustomDomain ? (limits.customDomain ?? false) : false);
      } else {
        setEnableMaxSwippers(true);
        setEnableMaxVisits(true);
        setEnableMaxIntegrations(true);
        setEnableCustomDomain(true);
        setMaxSwippers(0);
        setMaxVisits(0);
        setMaxIntegrations(0);
        setCustomDomain(false);
      }
      
      setOrder(plan.order || 0);
      setIsActive(plan.isActive);
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setPrice(0);
      setIsPopular(false);
      setFeatures([{ text: '' }]);
      setMaxSwippers(0);
      setMaxVisits(0);
      setMaxIntegrations(0);
      setCustomDomain(false);
      setEnableMaxSwippers(true);
      setEnableMaxVisits(true);
      setEnableMaxIntegrations(true);
      setEnableCustomDomain(true);
      setOrder(0);
      setIsActive(true);
    }
  }, [plan, open]);

  const handleAddFeature = () => {
    setFeatures([...features, { text: '' }]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, field: 'text' | 'icon' | 'iconColor', value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar features
    const validFeatures = features.filter(f => f.text.trim() !== '');
    if (validFeatures.length === 0) {
      toast.error('Adicione pelo menos uma feature');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      isPopular,
      features: validFeatures,
      limits: {
        maxSwippers: enableMaxSwippers ? Number(maxSwippers || 0) : null,
        maxVisits: enableMaxVisits ? Number(maxVisits || 0) : null,
        maxIntegrations: enableMaxIntegrations ? Number(maxIntegrations || 0) : null,
        customDomain: enableCustomDomain ? customDomain : null,
      },
      order: Number(order),
      isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Plano' : 'Criar Plano'}</DialogTitle>
          <DialogDescription>
            Configure as informações do plano de assinatura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Plano Básico"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do plano"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$) * (0 = Gratuito)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = val === '' ? 0 : parseFloat(val);
                      setPrice(isNaN(numVal) ? 0 : Math.max(0, numVal));
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="order">Ordem</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPopular"
                    checked={isPopular}
                    onCheckedChange={setIsPopular}
                  />
                  <Label htmlFor="isPopular">Plano Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Ativo</Label>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Features *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddFeature}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Texto da feature"
                        value={feature.text}
                        onChange={(e) => handleFeatureChange(index, 'text', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Ícone (opcional)</Label>
                      <IconEmojiSelector
                        value={feature.icon || ''}
                        onChange={(value) => handleFeatureChange(index, 'icon', value)}
                        mode="both"
                      />
                      {feature.icon && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`iconColor-${index}`} className="text-xs text-muted-foreground whitespace-nowrap">
                            Cor do ícone:
                          </Label>
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              id={`iconColor-${index}`}
                              type="color"
                              value={feature.iconColor || '#6366f1'}
                              onChange={(e) => handleFeatureChange(index, 'iconColor', e.target.value)}
                              className="h-8 w-20 cursor-pointer"
                            />
                            <Input
                              type="text"
                              placeholder="#6366f1"
                              value={feature.iconColor || ''}
                              onChange={(e) => handleFeatureChange(index, 'iconColor', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-4">
              <Label>Limites (Configuração Interna)</Label>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enableMaxSwippers"
                      checked={enableMaxSwippers}
                      onCheckedChange={setEnableMaxSwippers}
                    />
                    <Label htmlFor="enableMaxSwippers">Habilitar limite de Swippers</Label>
                  </div>
                  {enableMaxSwippers && (
                    <div>
                      <Label htmlFor="maxSwippers">Max Swippers (0 = ilimitado)</Label>
                      <Input
                        id="maxSwippers"
                        type="number"
                        min="0"
                        value={maxSwippers ?? 0}
                        onChange={(e) => setMaxSwippers(Number(e.target.value) || 0)}
                        placeholder="0 = ilimitado"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enableMaxVisits"
                      checked={enableMaxVisits}
                      onCheckedChange={setEnableMaxVisits}
                    />
                    <Label htmlFor="enableMaxVisits">Habilitar limite de Visitas</Label>
                  </div>
                  {enableMaxVisits && (
                    <div>
                      <Label htmlFor="maxVisits">Max Visitas/mês (0 = ilimitado)</Label>
                      <Input
                        id="maxVisits"
                        type="number"
                        min="0"
                        value={maxVisits ?? 0}
                        onChange={(e) => setMaxVisits(Number(e.target.value) || 0)}
                        placeholder="0 = ilimitado"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enableMaxIntegrations"
                      checked={enableMaxIntegrations}
                      onCheckedChange={setEnableMaxIntegrations}
                    />
                    <Label htmlFor="enableMaxIntegrations">Habilitar limite de Integrações</Label>
                  </div>
                  {enableMaxIntegrations && (
                    <div>
                      <Label htmlFor="maxIntegrations">Max Integrações (0 = ilimitado)</Label>
                      <Input
                        id="maxIntegrations"
                        type="number"
                        min="0"
                        value={maxIntegrations ?? 0}
                        onChange={(e) => setMaxIntegrations(Number(e.target.value) || 0)}
                        placeholder="0 = ilimitado"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enableCustomDomain"
                      checked={enableCustomDomain}
                      onCheckedChange={setEnableCustomDomain}
                    />
                    <Label htmlFor="enableCustomDomain">Habilitar controle de Domínio</Label>
                  </div>
                  {enableCustomDomain && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="customDomain"
                        checked={customDomain ?? false}
                        onCheckedChange={setCustomDomain}
                      />
                      <Label htmlFor="customDomain">Domínio Personalizado Ativado</Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : plan ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
