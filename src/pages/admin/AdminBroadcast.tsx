import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function AdminBroadcast() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Broadcast</h1>
        <p className="text-muted-foreground">Envie mensagens em massa para usuários</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            <CardTitle>Em Breve</CardTitle>
          </div>
          <CardDescription>
            A funcionalidade de broadcast será implementada em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você poderá enviar mensagens em massa para todos os usuários ou grupos específicos da plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

