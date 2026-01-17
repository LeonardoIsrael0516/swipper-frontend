import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { EmailProvider } from './EmailProviderList';

const sendGridSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  apiKey: z.string().min(1, 'API Key é obrigatória'),
  fromEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  fromName: z.string().optional(),
});

type SendGridFormData = z.infer<typeof sendGridSchema>;

interface SendGridConfigFormProps {
  provider?: EmailProvider;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function SendGridConfigForm({ provider, onSubmit, onCancel }: SendGridConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SendGridFormData>({
    resolver: zodResolver(sendGridSchema),
    defaultValues: {
      name: provider?.name || '',
      apiKey: provider?.config?.apiKey || '',
      fromEmail: provider?.config?.fromEmail || '',
      fromName: provider?.config?.fromName || '',
    },
  });

  const handleSubmit = async (data: SendGridFormData) => {
    setIsSubmitting(true);
    try {
      const submitData: any = {
        name: data.name,
        config: {
          apiKey: data.apiKey,
          fromEmail: data.fromEmail || undefined,
          fromName: data.fromName || undefined,
        },
      };

      // Se for criação, adicionar provider
      if (!provider) {
        submitData.provider = 'SENDGRID';
      }

      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração SendGrid</CardTitle>
        <CardDescription>
          Configure o SendGrid para envio de emails transacionais via API
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
                    <Input placeholder="Ex: SendGrid Production" {...field} />
                  </FormControl>
                  <FormDescription>
                    Um nome descritivo para identificar esta configuração
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="SG.xxxxxxxxxxxxx" {...field} />
                  </FormControl>
                  <FormDescription>
                    Sua API Key do SendGrid. Você pode criar uma em{' '}
                    <a
                      href="https://app.sendgrid.com/settings/api_keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      SendGrid Settings
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Origem</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="noreply@exemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Email verificado no SendGrid que será usado como remetente
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

