import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { EmailProvider } from './EmailProviderList';

const smtpSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  host: z.string().min(1, 'Host é obrigatório'),
  port: z.string().min(1, 'Porta é obrigatória'),
  secure: z.boolean().optional(),
  user: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  fromEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  fromName: z.string().optional(),
});

type SMTPFormData = z.infer<typeof smtpSchema>;

interface SMTPConfigFormProps {
  provider?: EmailProvider;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function SMTPConfigForm({ provider, onSubmit, onCancel }: SMTPConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SMTPFormData>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      name: provider?.name || '',
      host: provider?.config?.host || '',
      port: provider?.config?.port || '587',
      secure: provider?.config?.secure === 'true' || provider?.config?.secure === true || false,
      user: provider?.config?.user || '',
      password: provider?.config?.password || '',
      fromEmail: provider?.config?.fromEmail || '',
      fromName: provider?.config?.fromName || '',
    },
  });

  const handleSubmit = async (data: SMTPFormData) => {
    setIsSubmitting(true);
    try {
      const submitData: any = {
        name: data.name,
        config: {
          host: data.host,
          port: data.port,
          secure: data.secure ? 'true' : 'false',
          user: data.user,
          password: data.password,
          fromEmail: data.fromEmail || undefined,
          fromName: data.fromName || undefined,
        },
      };

      // Se for criação, adicionar provider
      if (!provider) {
        submitData.provider = 'SMTP';
      }

      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração SMTP</CardTitle>
        <CardDescription>
          Configure um servidor SMTP para envio de emails transacionais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Configuração</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gmail SMTP" {...field} />
                  </FormControl>
                  <FormDescription>
                    Um nome descritivo para identificar esta configuração
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host SMTP</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta</FormLabel>
                    <FormControl>
                      <Input placeholder="587" {...field} />
                    </FormControl>
                    <FormDescription>Geralmente 587 (TLS) ou 465 (SSL)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="secure"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Conexão Segura (SSL/TLS)</FormLabel>
                    <FormDescription>
                      Ative para usar SSL/TLS (porta 465 geralmente requer isso)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="seu-email@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Origem (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="noreply@exemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se não informado, será usado o usuário acima
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Origem (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ReelQuiz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {provider ? 'Atualizar' : 'Criar'} Configuração
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

