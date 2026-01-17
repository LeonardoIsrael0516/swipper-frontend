import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export default function AdminGateways() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gateways de Pagamento</h1>
        <p className="text-muted-foreground">Configure os gateways de pagamento</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            <CardTitle>Em Breve</CardTitle>
          </div>
          <CardDescription>
            A funcionalidade de gerenciamento de gateways de pagamento será implementada em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá configurar e gerenciar os gateways de pagamento integrados à plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

