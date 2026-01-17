export type WebhookMethod = 'POST' | 'PUT' | 'PATCH';

export type WebhookAuthType = 'none' | 'bearer' | 'basic' | 'custom';

export interface Webhook {
  id: string;
  reelId: string;
  name: string;
  url: string;
  method: WebhookMethod;
  authType: WebhookAuthType | null;
  authToken: string | null;
  authHeader: string | null;
  events: string[];
  conditions: WebhookCondition | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  status: 'pending' | 'success' | 'failed';
  eventType: string;
  payload: any;
  response: any | null;
  statusCode: number | null;
  error: string | null;
  retryCount: number;
  createdAt: string;
}

export interface WebhookCondition {
  operator?: 'AND' | 'OR';
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

export interface WebhookEvent {
  value: string;
  label: string;
  description: string;
}

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  {
    value: 'form_submit',
    label: 'Formulário Preenchido',
    description: 'Disparado quando um usuário submete um formulário',
  },
  // Outros eventos temporariamente desabilitados
  // {
  //   value: 'option_selected',
  //   label: 'Opção Selecionada',
  //   description: 'Disparado quando um usuário seleciona uma opção de resposta',
  // },
  // {
  //   value: 'visit_started',
  //   label: 'Visita Iniciada',
  //   description: 'Disparado quando um usuário inicia o quiz',
  // },
  // {
  //   value: 'slide_view',
  //   label: 'Slide Visualizado',
  //   description: 'Disparado quando um usuário visualiza um slide',
  // },
  // {
  //   value: 'quiz_completed',
  //   label: 'Quiz Completo',
  //   description: 'Disparado quando um usuário completa todo o quiz',
  // },
];

export interface CreateWebhookDto {
  reelId: string;
  name: string;
  url: string;
  method?: WebhookMethod;
  authType?: WebhookAuthType;
  authToken?: string;
  authHeader?: string;
  events: string[];
  conditions?: WebhookCondition;
  enabled?: boolean;
}

export interface UpdateWebhookDto extends Partial<CreateWebhookDto> {}

