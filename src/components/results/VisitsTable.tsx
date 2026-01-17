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
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Download, Trash2, Calendar, User } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface FormResponse {
  id: string;
  slideId: string;
  elementId: string;
  data: Record<string, any>;
  createdAt: string;
}

interface Visit {
  id: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  completed: boolean;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  slides: Record<string, {
    visited: boolean;
    views: number;
    interactions: number;
    avgTimeSpent: number;
  }>;
  formResponses?: FormResponse[];
}

interface Slide {
  id: string;
  order: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface VisitsTableProps {
  reelId: string;
  visits: Visit[];
  slides: Slide[];
  meta?: PaginationMeta;
  isLoading?: boolean;
  page: number;
  limit: number;
  onRefresh: (startDate?: string, endDate?: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function VisitsTable({ reelId, visits, slides, meta, isLoading, page, limit, onRefresh, onPageChange, onLimitChange }: VisitsTableProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useIsMobile();

  const totalPages = meta?.totalPages || 1;
  const total = meta?.total || 0;

  const getFormFieldValue = (data: Record<string, any>, field: string): string => {
    const variations = [
      field,
      field.toLowerCase(),
      field.toUpperCase(),
      field.charAt(0).toUpperCase() + field.slice(1).toLowerCase(),
    ];

    for (const variation of variations) {
      if (data[variation] !== undefined && data[variation] !== null) {
        return String(data[variation]);
      }
    }

    return '';
  };

  const getName = (data: Record<string, any>): string => {
    return getFormFieldValue(data, 'name') || getFormFieldValue(data, 'nome') || '';
  };

  const getEmail = (data: Record<string, any>): string => {
    return getFormFieldValue(data, 'email') || getFormFieldValue(data, 'e_mail') || '';
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await api.delete(`/analytics/reel/${reelId}/data`);
      toast.success('Dados limpos com sucesso!');
      onRefresh();
    } catch (error: any) {
      toast.error('Erro ao limpar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsClearing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/analytics/reel/${reelId}/export?format=csv`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reel-${reelId}-analytics.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsExporting(false);
    }
  };

  const sortedSlides = [...slides].sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitas</CardTitle>
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
          <CardTitle>Visitas</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isClearing} className="w-full sm:w-auto">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isMobile ? 'Limpar' : 'Limpar Dados'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os dados de analytics deste quiz serão permanentemente removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
                    Limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={() => handleExport()} disabled={isExporting} className="w-full sm:w-auto">
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
            {visits.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma visita encontrada
              </div>
            ) : (
              visits.map((visit) => {
                const hasFormResponse = visit.formResponses && visit.formResponses.length > 0;
                const firstFormResponse = hasFormResponse ? visit.formResponses![0] : null;
                const formData = firstFormResponse?.data || {};
                const leadName = getName(formData);
                const leadEmail = getEmail(formData);

                return (
                  <Card key={visit.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium text-sm mb-1">
                          {format(new Date(visit.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>{visit.country && visit.city ? `${visit.city}, ${visit.country}` : visit.country || 'Desconhecido'}</div>
                          <div>{visit.deviceType} • {visit.browser}</div>
                          {visit.utmSource && (
                            <div>UTM: {visit.utmSource} / {visit.utmMedium}</div>
                          )}
                        </div>
                      </div>
                      
                      {hasFormResponse && (
                        <div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <User className="w-4 h-4 mr-2" />
                                {leadName || leadEmail || 'Ver dados do lead'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Dados do Lead</DialogTitle>
                                <DialogDescription>
                                  Informações preenchidas no formulário
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                {visit.formResponses!.map((formResponse) => {
                                  const data = formResponse.data || {};
                                  const fields = Object.keys(data);

                                  return (
                                    <div key={formResponse.id} className="p-4 bg-muted rounded-lg">
                                      <h4 className="font-semibold mb-3 text-sm">
                                        Formulário enviado em {format(new Date(formResponse.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                      </h4>
                                      <div className="grid grid-cols-1 gap-4">
                                        {fields.map((field) => (
                                          <div key={field}>
                                            <span className="text-sm font-medium text-muted-foreground">{field}:</span>
                                            <p className="text-sm mt-1">{String(data[field] || 'N/A')}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      <div className="border-t pt-3">
                        <div className="text-xs font-medium mb-2">Slides visitados:</div>
                        <div className="space-y-2">
                          {sortedSlides.map((slide) => {
                            const slideData = visit.slides[slide.id];
                            if (!slideData || !slideData.visited) return null;
                            
                            return (
                              <div key={slide.id} className="flex justify-between items-center text-xs">
                                <span>Slide {slide.order}</span>
                                <div className="flex gap-2 text-muted-foreground">
                                  <span>{slideData.views} views</span>
                                  {slideData.avgTimeSpent > 0 && <span>{slideData.avgTimeSpent}s</span>}
                                  {slideData.interactions > 0 && <span>{slideData.interactions} int.</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
                  <TableHead>Lead</TableHead>
                  {sortedSlides.map((slide) => (
                    <TableHead key={slide.id} className="text-center">
                      Slide {slide.order}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={sortedSlides.length + 2} className="text-center text-muted-foreground py-8">
                      Nenhuma visita encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((visit) => {
                    const hasFormResponse = visit.formResponses && visit.formResponses.length > 0;
                    const firstFormResponse = hasFormResponse ? visit.formResponses![0] : null;
                    const formData = firstFormResponse?.data || {};
                    const leadName = getName(formData);
                    const leadEmail = getEmail(formData);

                    return (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(visit.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {visit.country && visit.city ? `${visit.city}, ${visit.country}` : visit.country || 'Desconhecido'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {visit.deviceType} • {visit.browser}
                            </span>
                            {visit.utmSource && (
                              <span className="text-xs text-muted-foreground">
                                UTM: {visit.utmSource} / {visit.utmMedium}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {hasFormResponse ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  <User className="w-4 h-4 mr-2" />
                                  {leadName || leadEmail || 'Ver dados'}
                                </Button>
                              </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Dados do Lead</DialogTitle>
                                <DialogDescription>
                                  Informações preenchidas no formulário
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                {visit.formResponses!.map((formResponse) => {
                                  const data = formResponse.data || {};
                                  const fields = Object.keys(data);

                                  return (
                                    <div key={formResponse.id} className="p-3 sm:p-4 bg-muted rounded-lg">
                                      <h4 className="font-semibold mb-3 text-sm sm:text-base">
                                        Formulário enviado em {format(new Date(formResponse.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {fields.map((field) => (
                                          <div key={field}>
                                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{field}:</span>
                                            <p className="text-xs sm:text-sm mt-1 break-words">{String(data[field] || 'N/A')}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        {sortedSlides.map((slide) => {
                          const slideData = visit.slides[slide.id];
                          if (!slideData || !slideData.visited) {
                            return (
                              <TableCell key={slide.id} className="text-center text-muted-foreground">
                                -
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={slide.id} className="text-center">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{slideData.views} visualizações</span>
                                {slideData.avgTimeSpent > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {slideData.avgTimeSpent}s médio
                                  </span>
                                )}
                                {slideData.interactions > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {slideData.interactions} interações
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
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

