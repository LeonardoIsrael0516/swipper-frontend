import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Camera, Lock, Loader2, Eye, EyeOff, Save } from 'lucide-react';

// Helper para obter iniciais
const getInitials = (name: string | null | undefined, email: string): string => {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }
  return email[0].toUpperCase();
};

export default function Profile() {
  const { user: authUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do formulário de perfil
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Estados do formulário de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de loading
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Buscar dados do perfil
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.getMyProfile<any>();
      return (response as any).data || response;
    },
    enabled: !!authUser,
  });

  // Inicializar estados quando dados carregarem
  useEffect(() => {
    if (profileData) {
      setName(profileData.name || '');
      setEmail(profileData.email || '');
      setAvatar(profileData.avatar || null);
    }
  }, [profileData]);

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; avatar?: string }) => {
      return api.updateMyProfile<any>(data);
    },
    onSuccess: (data) => {
      const updatedData = (data as any).data || data;
      toast.success('Perfil atualizado com sucesso!');
      
      // Atualizar cache
      queryClient.setQueryData(['user-profile'], updatedData);
      
      // Atualizar AuthContext
      if (refreshUser) {
        refreshUser();
      }
      
      // Atualizar estados locais
      if (updatedData.name !== undefined) setName(updatedData.name || '');
      if (updatedData.avatar !== undefined) setAvatar(updatedData.avatar || null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    },
  });

  // Mutation para mudança de senha
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return api.changePassword<any>(data.currentPassword, data.newPassword);
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      // Limpar formulário
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      // Extrair mensagem de erro de forma mais específica
      let errorMessage = 'Erro ao alterar senha';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Traduzir mensagens comuns
      if (errorMessage.includes('senha atual') || errorMessage.includes('Current password')) {
        errorMessage = 'A senha atual está incorreta';
      } else if (errorMessage.includes('must be different')) {
        errorMessage = 'A nova senha deve ser diferente da senha atual';
      }
      
      toast.error(errorMessage);
    },
  });

  // Handler para upload de avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Por favor, selecione uma imagem válida (JPG, PNG, GIF ou WEBP)');
      return;
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);

      // Fazer upload para o backend
      const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao fazer upload da imagem');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url || uploadData.data?.url;

      if (!imageUrl) {
        throw new Error('URL da imagem não recebida');
      }

      // Atualizar perfil com nova URL do avatar
      await updateProfileMutation.mutateAsync({ avatar: imageUrl });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload do avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handler para salvar perfil
  const handleSaveProfile = () => {
    const updates: { name?: string } = {};
    
    if (name !== profileData?.name) {
      updates.name = name;
    }

    if (Object.keys(updates).length === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  // Handler para mudança de senha
  const handleChangePassword = () => {
    // Validações
    if (!currentPassword) {
      toast.error('Por favor, informe sua senha atual');
      return;
    }

    if (!newPassword) {
      toast.error('Por favor, informe a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  // Verificar se há alterações não salvas
  const hasProfileChanges = name !== (profileData?.name || '');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        <div className="space-y-6">
          {/* Card: Informações do Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  {avatar ? (
                    <AvatarImage src={avatar} alt={name || email || 'Avatar'} />
                  ) : null}
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                    {getInitials(name || authUser?.name, email || authUser?.email || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Alterar foto
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG ou GIF. Máximo 10MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  disabled={updateProfileMutation.isPending}
                />
              </div>

              {/* Email Field (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email || profileData?.email || authUser?.email || ''}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveProfile}
                disabled={!hasProfileChanges || updateProfileMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Card: Mudança de Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Mudança de Senha
              </CardTitle>
              <CardDescription>
                Altere sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    disabled={changePasswordMutation.isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    disabled={changePasswordMutation.isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    disabled={changePasswordMutation.isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
              <Button
                onClick={handleChangePassword}
                disabled={
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  changePasswordMutation.isPending
                }
                className="w-full sm:w-auto"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Alterar senha
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

