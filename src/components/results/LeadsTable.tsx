import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface Lead {
  id: string;
  reelId: string;
  slideId: string;
  elementId: string;
  userId: string | null;
  data: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  visit: {
    country: string | null;
    city: string | null;
    deviceType: string | null;
    os: string | null;
    browser: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  } | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LeadsTableProps {
  reelId: string;
  leads: Lead[];
  meta?: PaginationMeta;
  isLoading?: boolean;
  page: number;
  limit: number;
  onRefresh: (startDate?: string, endDate?: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function LeadsTable({ reelId, leads, meta, isLoading, page, limit, onRefresh, onPageChange, onLimitChange }: LeadsTableProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const totalPages = meta?.totalPages || 1;
  const total = meta?.total || 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Buscar todos os leads (sem paginação) para exportação
      const response = await api.get(`/analytics/reel/${reelId}/leads?limit=10000`);
      const data = (response as any).data || response;
      const allLeads = data.data || [];

      // CSV format
      const headers = ['Data/Hora', 'Nome', 'Email', 'Telefone', 'Localização', 'Dispositivo', 'UTM Source', 'UTM Medium', 'UTM Campaign'];
      
      // Adicionar todos os campos do formulário como colunas adicionais
      const allFormFields = new Set<string>();
      allLeads.forEach((lead: Lead) => {
        Object.keys(lead.data || {}).forEach((key) => {
          if (!['name', 'nome', 'email', 'e_mail', 'phone', 'telefone', 'celular'].includes(key)) {
            allFormFields.add(key);
          }
        });
      });

      const additionalHeaders = Array.from(allFormFields);
      const csvHeaders = [...headers, ...additionalHeaders];
      const csvRows = allLeads.map((lead: Lead) => {
        const formData = lead.data || {};
        const baseRow = [
          format(new Date(lead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
          formData.name || formData.nome || '',
          formData.email || formData.e_mail || '',
          formData.phone || formData.telefone || formData.celular || '',
          lead.visit?.city && lead.visit?.country
            ? `${lead.visit.city}, ${lead.visit.country}`
            : lead.visit?.country || '',
          lead.visit?.deviceType || '',
          lead.visit?.utmSource || '',
          lead.visit?.utmMedium || '',
          lead.visit?.utmCampaign || '',
        ];
        const additionalValues = additionalHeaders.map((field) => {
          const value = formData[field];
          return value !== undefined && value !== null ? String(value) : '';
        });
        return [...baseRow, ...additionalValues];
      });

      const csv = [csvHeaders.join(','), ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reel-${reelId}-leads.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Leads exportados com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar leads: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsExporting(false);
    }
  };

  const getFormFieldValue = (data: Record<string, any>, field: string): string => {
    if (!data || typeof data !== 'object') return '';
    
    // Tentar diferentes variações do campo
    const variations = [
      field,
      field.toLowerCase(),
      field.toUpperCase(),
      field.charAt(0).toUpperCase() + field.slice(1).toLowerCase(),
    ];

    for (const variation of variations) {
      if (data[variation] !== undefined && data[variation] !== null && data[variation] !== '') {
        return String(data[variation]);
      }
    }

    return '';
  };

  const getName = (data: Record<string, any>): string => {
    if (!data || typeof data !== 'object') return '';
    
    // Primeiro, tentar campos com nomes exatos (case-insensitive)
    const nameFields = ['name', 'nome', 'fullName', 'full_name', 'firstName', 'first_name', 'nome_completo', 'nomeCompleto'];
    for (const field of nameFields) {
      const value = getFormFieldValue(data, field);
      if (value) return value;
    }
    
    // Se não encontrar, buscar qualquer campo que contenha palavras-chave de nome
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      const value = data[key];
      
      // Verificar se o valor existe e não está vazio
      if (value !== undefined && value !== null && value !== '') {
        const strValue = String(value).trim();
        if (!strValue) continue;
        
        // Verificar se a chave contém palavras-chave de nome
        if (lowerKey.includes('nome') || 
            lowerKey.includes('name') || 
            lowerKey.includes('fullname') ||
            lowerKey.includes('firstname') ||
            lowerKey.includes('sobrenome') ||
            lowerKey.includes('surname') ||
            lowerKey.includes('lastname')) {
          return strValue;
        }
        
        // Se o valor parece um nome (não é email, não é número, tem mais de 2 caracteres)
        // e ainda não encontramos um nome, usar este como fallback
        if (!strValue.includes('@') && 
            isNaN(Number(strValue)) && 
            strValue.length > 2 &&
            !lowerKey.includes('email') &&
            !lowerKey.includes('mail') &&
            !lowerKey.includes('phone') &&
            !lowerKey.includes('telefone')) {
          // Este pode ser um nome, mas só usar se não tiver encontrado nenhum ainda
          // (vamos continuar procurando por um campo mais específico)
        }
      }
    }
    
    return '';
  };

  const getEmail = (data: Record<string, any>): string => {
    if (!data || typeof data !== 'object') return '';
    
    // Primeiro, tentar campos com nomes exatos (case-insensitive)
    const emailFields = ['email', 'e_mail', 'e-mail', 'mail', 'correio', 'correio_eletronico', 'correioEletronico'];
    for (const field of emailFields) {
      const value = getFormFieldValue(data, field);
      if (value) return value;
    }
    
    // Se não encontrar, buscar qualquer campo que contenha palavras-chave de email
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      const value = data[key];
      
      // Verificar se o valor existe e não está vazio
      if (value !== undefined && value !== null && value !== '') {
        const strValue = String(value).trim();
        if (!strValue) continue;
        
        // Verificar se a chave contém palavras-chave de email
        if (lowerKey.includes('email') || 
            lowerKey.includes('mail') || 
            lowerKey.includes('e-mail') ||
            lowerKey.includes('correio')) {
          // Verificar se o valor parece um email (contém @)
          if (strValue.includes('@')) {
            return strValue;
          }
        }
        
        // Se o valor parece um email (contém @) independente do nome do campo
        if (strValue.includes('@') && strValue.includes('.')) {
          return strValue;
        }
      }
    }
    
    return '';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Leads</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport()} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isMobile ? 'CSV' : 'Exportar CSV'}
            </Button>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2 mt-4 sm:justify-start flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36 sm:w-40 text-xs sm:text-sm"
              placeholder="Data inicial"
            />
          </div>
          <span className="text-muted-foreground whitespace-nowrap hidden sm:inline">até</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 sm:w-40 text-xs sm:text-sm"
            placeholder="Data final"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRefresh(startDate || undefined, endDate || undefined);
              }}
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Aplicar
            </Button>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  onRefresh();
                }}
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Layout mobile: cards ao invés de tabela
          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum lead encontrado
              </div>
            ) : (
              leads.map((lead) => {
                const formData = lead.data || {};
                
                // Debug: log dos dados para verificar estrutura (apenas primeiro lead)
                if (import.meta.env.DEV && leads.length > 0 && lead.id === leads[0].id) {
                  console.log('Lead data structure:', formData);
                  console.log('All keys:', Object.keys(formData));
                  Object.keys(formData).forEach(key => {
                    console.log(`  ${key}:`, formData[key], typeof formData[key]);
                  });
                }
                
                let name = getName(formData);
                let email = getEmail(formData);
                
                // Se ainda não encontrou, tentar busca mais agressiva
                if (!name || !email) {
                  const allKeys = Object.keys(formData);
                  for (const key of allKeys) {
                    const value = formData[key];
                    if (!value || value === '') continue;
                    
                    const strValue = String(value).trim();
                    const lowerKey = key.toLowerCase();
                    
                    // Se não tem nome ainda e o valor parece um nome (não é email, não é número)
                    if (!name && !strValue.includes('@') && isNaN(Number(strValue)) && strValue.length > 2) {
                      // Evitar campos que claramente não são nome
                      if (!lowerKey.includes('email') && 
                          !lowerKey.includes('mail') && 
                          !lowerKey.includes('phone') && 
                          !lowerKey.includes('telefone') &&
                          !lowerKey.includes('celular') &&
                          !lowerKey.includes('cpf') &&
                          !lowerKey.includes('cnpj')) {
                        name = strValue;
                      }
                    }
                    
                    // Se não tem email ainda e o valor parece um email
                    if (!email && strValue.includes('@') && strValue.includes('.')) {
                      email = strValue;
                    }
                  }
                }
                
                const isExpanded = expandedLead === lead.id;

                return (
                  <Card key={lead.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium text-sm mb-1">
                          {format(new Date(lead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        {name && (
                          <div className="text-sm font-medium mt-1">{name}</div>
                        )}
                        {email && (
                          <div className="text-sm text-muted-foreground mt-1">{email}</div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          {lead.visit?.city && lead.visit?.country
                            ? `${lead.visit.city}, ${lead.visit.country}`
                            : lead.visit?.country || 'Desconhecido'}
                        </div>
                        <div>
                          {lead.visit?.deviceType && lead.visit?.browser
                            ? `${lead.visit.deviceType} • ${lead.visit.browser}`
                            : lead.visit?.deviceType || 'Desconhecido'}
                        </div>
                        {lead.visit?.utmSource && (
                          <div>UTM: {lead.visit.utmSource} / {lead.visit.utmMedium}</div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                        className="w-full"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Ocultar dados
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4 mr-1" />
                            Ver dados completos
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          // Layout desktop: tabela
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>UTM</TableHead>
                  <TableHead>Dados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => {
                    const formData = lead.data || {};
                    
                    // Debug: log dos dados para verificar estrutura (apenas primeiro lead)
                    if (import.meta.env.DEV && leads.length > 0 && lead.id === leads[0].id) {
                      console.log('Lead data structure:', formData);
                      console.log('All keys:', Object.keys(formData));
                      Object.keys(formData).forEach(key => {
                        console.log(`  ${key}:`, formData[key], typeof formData[key]);
                      });
                    }
                    
                    let name = getName(formData);
                    let email = getEmail(formData);
                    
                    // Se ainda não encontrou, tentar busca mais agressiva
                    if (!name || !email) {
                      const allKeys = Object.keys(formData);
                      for (const key of allKeys) {
                        const value = formData[key];
                        if (!value || value === '') continue;
                        
                        const strValue = String(value).trim();
                        const lowerKey = key.toLowerCase();
                        
                        // Se não tem nome ainda e o valor parece um nome (não é email, não é número)
                        if (!name && !strValue.includes('@') && isNaN(Number(strValue)) && strValue.length > 2) {
                          // Evitar campos que claramente não são nome
                          if (!lowerKey.includes('email') && 
                              !lowerKey.includes('mail') && 
                              !lowerKey.includes('phone') && 
                              !lowerKey.includes('telefone') &&
                              !lowerKey.includes('celular') &&
                              !lowerKey.includes('cpf') &&
                              !lowerKey.includes('cnpj')) {
                            name = strValue;
                          }
                        }
                        
                        // Se não tem email ainda e o valor parece um email
                        if (!email && strValue.includes('@') && strValue.includes('.')) {
                          email = strValue;
                        }
                      }
                    }
                    
                    const isExpanded = expandedLead === lead.id;

                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(lead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {name ? (
                            <span className="font-medium">{name}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {email ? (
                            <span className="font-medium">{email}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.visit?.city && lead.visit?.country
                            ? `${lead.visit.city}, ${lead.visit.country}`
                            : lead.visit?.country || 'Desconhecido'}
                        </TableCell>
                        <TableCell>
                          {lead.visit?.deviceType && lead.visit?.browser
                            ? `${lead.visit.deviceType} • ${lead.visit.browser}`
                            : lead.visit?.deviceType || 'Desconhecido'}
                        </TableCell>
                        <TableCell>
                          {lead.visit?.utmSource && lead.visit?.utmMedium
                            ? `${lead.visit.utmSource} / ${lead.visit.utmMedium}`
                            : lead.visit?.utmSource || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Ver dados
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

          {/* Expandir dados do formulário - Desktop */}
          {!isMobile && leads.map((lead) => {
            if (expandedLead !== lead.id) return null;

            const formData = lead.data || {};
            // Mostrar TODOS os campos do formulário, incluindo nome e email
            const formFields = Object.keys(formData);

            return (
              <div key={`expand-${lead.id}`} className="mt-4 p-3 sm:p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Dados do Formulário</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {formFields.length > 0 ? (
                    formFields.map((field) => {
                      const value = formData[field];
                      return (
                        <div key={field}>
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground">{field}:</span>
                          <p className="text-xs sm:text-sm mt-1 break-words">
                            {value !== undefined && value !== null && value !== '' 
                              ? String(value) 
                              : '-'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground">Nenhum dado encontrado</p>
                  )}
                </div>
                {lead.visit && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm sm:text-base">Informações de Tracking</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {lead.visit.os && (
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground">Sistema Operacional:</span>
                          <p className="text-xs sm:text-sm mt-1">{lead.visit.os}</p>
                        </div>
                      )}
                      {lead.visit.utmCampaign && (
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground">UTM Campaign:</span>
                          <p className="text-xs sm:text-sm mt-1">{lead.visit.utmCampaign}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Expandir dados do formulário - Mobile (dentro do card) */}
          {isMobile && leads.map((lead) => {
            if (expandedLead !== lead.id) return null;

            const formData = lead.data || {};
            const formFields = Object.keys(formData);

            return (
              <Card key={`expand-mobile-${lead.id}`} className="mt-4 p-4">
                <h4 className="font-semibold mb-3 text-sm">Dados do Formulário</h4>
                <div className="grid grid-cols-1 gap-3">
                  {formFields.length > 0 ? (
                    formFields.map((field) => {
                      const value = formData[field];
                      return (
                        <div key={field}>
                          <span className="text-xs font-medium text-muted-foreground">{field}:</span>
                          <p className="text-xs mt-1 break-words">
                            {value !== undefined && value !== null && value !== '' 
                              ? String(value) 
                              : '-'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum dado encontrado</p>
                  )}
                </div>
                {lead.visit && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm">Informações de Tracking</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {lead.visit.os && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Sistema Operacional:</span>
                          <p className="text-xs mt-1">{lead.visit.os}</p>
                        </div>
                      )}
                      {lead.visit.utmCampaign && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">UTM Campaign:</span>
                          <p className="text-xs mt-1">{lead.visit.utmCampaign}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        
        {/* Pagination */}
        {meta && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <Select
                value={limit.toString()}
                onValueChange={(value) => onLimitChange(parseInt(value, 10))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              {totalPages > 1 && (
                <span className="text-sm text-muted-foreground">
                  Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total}
                </span>
              )}
            </div>
            {totalPages > 1 && (
              <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) {
                        onPageChange(page - 1);
                      }
                    }}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* First page */}
                {page > 2 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(1);
                        }}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {page > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}
                
                {/* Previous page */}
                {page > 1 && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(page - 1);
                      }}
                      className="cursor-pointer"
                    >
                      {page - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Current page */}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
                
                {/* Next page */}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(page + 1);
                      }}
                      className="cursor-pointer"
                    >
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Last page */}
                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(totalPages);
                        }}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) {
                        onPageChange(page + 1);
                      }
                    }}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

