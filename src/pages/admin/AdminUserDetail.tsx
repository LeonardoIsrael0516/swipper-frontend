import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Key } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { UserEditModal } from '@/components/admin/UserEditModal';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const response = await api.getAdminUser<any>(id!);
      return (response as any).data || response;
    },
    enabled: !!id,
  });

  const { data: reels, isLoading: reelsLoading } = useQuery({
    queryKey: ['admin-user-reels', id],
    queryFn: async () => {
      const response = await api.getAdminUserReels<any>(id!);
      return (response as any).data || response;
    },
    enabled: !!id,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-user-analytics', id],
    queryFn: async () => {
      const response = await api.getAdminUserAnalytics<any>(id!);
      return (response as any).data || response;
    },
    enabled: !!id,
  });

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/ananindeua/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Usuário não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/ananindeua/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.name || 'Sem nome'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditingUser(user)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setPasswordChangeOpen(true)}
          >
            <Key className="mr-2 h-4 w-4" />
            Alterar Senha
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>Dados básicos do usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{user.name || 'Sem nome'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={user.role === 'REELS' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status do Email</p>
              <Badge variant={user.emailVerified ? 'default' : 'outline'}>
                {user.emailVerified ? 'Verificado' : 'Não verificado'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cadastrado em</p>
              <p className="font-medium">
                {format(new Date(user.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
            <CardDescription>Métricas do usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Reels</p>
                  <p className="text-2xl font-bold">{analytics?.totalReels || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reels Ativos</p>
                  <p className="text-2xl font-bold">{analytics?.activeReels || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Respostas</p>
                  <p className="text-2xl font-bold">{analytics?.totalResponses || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Visitas</p>
                  <p className="text-2xl font-bold">{analytics?.totalVisits || 0}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reels do Usuário</CardTitle>
          <CardDescription>Lista de reels criados por este usuário</CardDescription>
        </CardHeader>
        <CardContent>
          {reelsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : reels && reels.length > 0 ? (
            <div className="space-y-2">
              {reels.map((reel: any) => (
                <div
                  key={reel.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{reel.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {reel.slug && `/${reel.slug}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={reel.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {reel.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {reel._count?.responses || 0} respostas
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {reel._count?.visits || 0} visitas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum reel encontrado</p>
          )}
        </CardContent>
      </Card>

      <UserEditModal
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <ChangePasswordModal
        userId={id || null}
        open={passwordChangeOpen}
        onOpenChange={setPasswordChangeOpen}
      />
    </div>
  );
}

