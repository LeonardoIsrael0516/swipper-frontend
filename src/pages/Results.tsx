import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ResultsHeader } from '@/components/builder/ResultsHeader';
import { MetricsCards } from '@/components/results/MetricsCards';
import { VisitsTable } from '@/components/results/VisitsTable';
import { LeadsTable } from '@/components/results/LeadsTable';
import { AnalyticsPanel } from '@/components/results/AnalyticsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function Results() {
  const { reelId } = useParams<{ reelId: string }>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [visitsPage, setVisitsPage] = useState<number>(1);
  const [visitsLimit, setVisitsLimit] = useState<number>(15);
  const [leadsPage, setLeadsPage] = useState<number>(1);
  const [leadsLimit, setLeadsLimit] = useState<number>(15);

  const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['reel-metrics', reelId],
    queryFn: async () => {
      const response = await api.get(`/analytics/reel/${reelId}/metrics`);
      // api.get() já extrai o data do TransformInterceptor
      return response;
    },
    enabled: !!reelId,
  });

  const { data: visitsData, isLoading: isLoadingVisits, refetch: refetchVisits, error: visitsError } = useQuery({
    queryKey: ['reel-visits', reelId, startDate, endDate, visitsPage, visitsLimit],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', visitsPage.toString());
        params.append('limit', visitsLimit.toString());
        
        const queryString = params.toString();
        const url = `/analytics/reel/${reelId}/visits?${queryString}`;
        const response = await api.get(url);
        // api.get() já extrai o data do TransformInterceptor
        // A resposta já é { data: [...], meta: {...}, slides: [...] }
        return response;
      } catch (error: any) {
        const errorMessage = error?.message || 'Erro ao carregar visitas';
        toast.error(errorMessage);
        throw error;
      }
    },
    enabled: !!reelId,
    retry: 1,
  });

  const { data: analyticsData, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['reel-analytics', reelId],
    queryFn: async () => {
      const response = await api.get(`/analytics/reel/${reelId}/analytics`);
      // api.get() já extrai o data do TransformInterceptor
      return response;
    },
    enabled: !!reelId,
  });

  const { data: leadsData, isLoading: isLoadingLeads, refetch: refetchLeads, error: leadsError } = useQuery({
    queryKey: ['reel-leads', reelId, startDate, endDate, leadsPage, leadsLimit],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', leadsPage.toString());
        params.append('limit', leadsLimit.toString());
        
        const queryString = params.toString();
        const url = `/analytics/reel/${reelId}/leads?${queryString}`;
        const response = await api.get(url);
        // api.get() já extrai o data do TransformInterceptor
        // A resposta já é { data: [...], meta: {...} }
        return response;
      } catch (error: any) {
        const errorMessage = error?.message || 'Erro ao carregar leads';
        toast.error(errorMessage);
        throw error;
      }
    },
    enabled: !!reelId,
    retry: 1,
  });

  const handleRefresh = (startDate?: string, endDate?: string) => {
    if (startDate || endDate) {
      setStartDate(startDate || '');
      setEndDate(endDate || '');
    } else {
      setStartDate('');
      setEndDate('');
    }
    // Reset pagination when filters change
    setVisitsPage(1);
    setLeadsPage(1);
    refetchMetrics();
    refetchVisits();
    refetchAnalytics();
    refetchLeads();
  };

  const handleVisitsPageChange = (page: number) => {
    setVisitsPage(page);
  };

  const handleVisitsLimitChange = (limit: number) => {
    setVisitsLimit(limit);
    setVisitsPage(1); // Reset to first page when limit changes
  };

  const handleLeadsPageChange = (page: number) => {
    setLeadsPage(page);
  };

  const handleLeadsLimitChange = (limit: number) => {
    setLeadsLimit(limit);
    setLeadsPage(1); // Reset to first page when limit changes
  };

  if (!reelId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">ID do quiz não encontrado</p>
        </div>
      </div>
    );
  }

  if (isLoadingMetrics && !metrics) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <ResultsHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ResultsHeader />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Metrics Cards */}
          <MetricsCards metrics={metrics || {
            totalVisitors: 0,
            totalVisits: 0,
            completedFirstStep: 0,
            reached50Percent: 0,
            interactionRate: 0,
            completedFunnel: 0,
            totalLeads: 0,
          }} isLoading={isLoadingMetrics} />

          {/* Tabs: Visitas e Leads */}
          <Tabs defaultValue="visits" className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex sm:grid-cols-none justify-start">
              <TabsTrigger value="visits">Visitas</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
            </TabsList>
            <TabsContent value="visits" className="mt-4 sm:mt-6">
              {visitsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro ao carregar visitas</AlertTitle>
                  <AlertDescription>
                    {(visitsError as any)?.message || 'Ocorreu um erro ao carregar as visitas. Tente novamente.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <VisitsTable
                  reelId={reelId}
                  visits={visitsData?.data || []}
                  slides={visitsData?.slides || []}
                  meta={visitsData?.meta}
                  isLoading={isLoadingVisits}
                  page={visitsPage}
                  limit={visitsLimit}
                  onRefresh={handleRefresh}
                  onPageChange={handleVisitsPageChange}
                  onLimitChange={handleVisitsLimitChange}
                />
              )}
            </TabsContent>
            <TabsContent value="leads" className="mt-4 sm:mt-6">
              {leadsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro ao carregar leads</AlertTitle>
                  <AlertDescription>
                    {(leadsError as any)?.message || 'Ocorreu um erro ao carregar os leads. Tente novamente.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <LeadsTable
                  reelId={reelId}
                  leads={leadsData?.data || []}
                  meta={leadsData?.meta}
                  isLoading={isLoadingLeads}
                  page={leadsPage}
                  limit={leadsLimit}
                  onRefresh={handleRefresh}
                  onPageChange={handleLeadsPageChange}
                  onLimitChange={handleLeadsLimitChange}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Analytics Panel */}
          {analyticsData && (
            <AnalyticsPanel
              data={analyticsData}
              isLoading={isLoadingAnalytics}
            />
          )}
        </div>
      </div>
    </div>
  );
}

