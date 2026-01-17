import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UsersTable } from '@/components/admin/UsersTable';
import { UserEditModal } from '@/components/admin/UserEditModal';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date | string;
  reelsCount?: number;
  responsesCount?: number;
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: async () => {
      const query: any = { page, limit: 20 };
      if (search) query.search = search;
      if (roleFilter !== 'all') query.role = roleFilter;
      const response = await api.getAdminUsers<any>(query);
      return (response as any).data || response;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.deleteAdminUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao deletar usuário');
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = (userId: string) => {
    deleteMutation.mutate(userId);
  };

  const handlePasswordChange = (userId: string) => {
    setPasswordChangeUserId(userId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerencie todos os usuários do sistema</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <UsersTable
          users={data?.users || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPasswordChange={handlePasswordChange}
          currentPage={data?.page || 1}
          totalPages={data?.totalPages || 1}
          onPageChange={setPage}
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
        />
      )}

      <UserEditModal
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <ChangePasswordModal
        userId={passwordChangeUserId}
        open={!!passwordChangeUserId}
        onOpenChange={(open) => !open && setPasswordChangeUserId(null)}
      />
    </div>
  );
}

