export interface PlanFeature {
  text: string;
  icon?: string; // Nome do ícone Lucide ou URL/emoji
  iconColor?: string; // Cor do ícone (hex, rgb, ou nome de classe CSS)
}

export interface PlanLimit {
  label: string; // Ex: "Até 2 funis", "Webhook"
  value: string | number | boolean; // Valor ou true/false para features booleanas
  icon?: string; // Ícone opcional (seta →, check ✔, X ✗, etc)
}

export interface PlanLimits {
  maxSwippers: number | null;
  maxVisits: number | null;
  maxIntegrations: number | null;
  customDomain: boolean | null;
  // Ícones opcionais para cada limite
  maxSwippersIcon?: string;
  maxVisitsIcon?: string;
  maxIntegrationsIcon?: string;
  customDomainIcon?: string;
}

export interface Plan {
  id: string;
  title: string;
  description?: string;
  price: number;
  isPopular: boolean;
  features: PlanFeature[];
  limits: PlanLimits;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

