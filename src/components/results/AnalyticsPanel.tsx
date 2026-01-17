import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalVisits: number;
    uniqueCountries: number;
    uniqueCities: number;
    avgVisitsPerDay: number;
  };
  entries: Array<{ date: string; count: number }>;
  continents: Array<{ name: string; count: number }>;
  countries: Array<{ name: string; count: number }>;
  cities: Array<{ name: string; count: number }>;
  referrers: Array<{ name: string; count: number }>;
  devices: Array<{ name: string; count: number }>;
  operatingSystems: Array<{ name: string; count: number }>;
  browsers: Array<{ name: string; count: number }>;
  languages: Array<{ name: string; count: number }>;
  utms: {
    sources: Array<{ name: string; count: number }>;
    mediums: Array<{ name: string; count: number }>;
    campaigns: Array<{ name: string; count: number }>;
    terms: Array<{ name: string; count: number }>;
    contents: Array<{ name: string; count: number }>;
  };
}

interface AnalyticsPanelProps {
  data: AnalyticsData;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function AnalyticsPanel({ data, isLoading }: AnalyticsPanelProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Detalhado</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            <TabsList className={isMobile ? 'inline-flex flex-nowrap gap-1 min-w-max' : 'grid grid-cols-6 lg:grid-cols-11 w-full'}>
              <TabsTrigger value="overview" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Geral' : 'Visão Geral'}
              </TabsTrigger>
              <TabsTrigger value="entries" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Entradas' : 'Entradas'}
              </TabsTrigger>
              <TabsTrigger value="continents" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Continentes' : 'Continentes'}
              </TabsTrigger>
              <TabsTrigger value="countries" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Países' : 'Países'}
              </TabsTrigger>
              <TabsTrigger value="cities" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Cidades' : 'Cidades'}
              </TabsTrigger>
              <TabsTrigger value="referrers" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Refs' : 'Referenciadores'}
              </TabsTrigger>
              <TabsTrigger value="devices" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Dispositivos' : 'Dispositivos'}
              </TabsTrigger>
              <TabsTrigger value="os" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'SO' : 'Sistema Operacional'}
              </TabsTrigger>
              <TabsTrigger value="browsers" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Navegadores' : 'Navegadores'}
              </TabsTrigger>
              <TabsTrigger value="languages" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'Idiomas' : 'Idiomas'}
              </TabsTrigger>
              <TabsTrigger value="utms" className={isMobile ? 'text-xs px-2 sm:px-3 whitespace-nowrap flex-shrink-0' : ''}>
                {isMobile ? 'UTMs' : 'UTMs'}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="p-3 md:p-4 border rounded-lg">
                <div className="text-xs md:text-sm text-muted-foreground">Total de Visitas</div>
                <div className="text-xl md:text-2xl font-bold">{data.overview.totalVisits}</div>
              </div>
              <div className="p-3 md:p-4 border rounded-lg">
                <div className="text-xs md:text-sm text-muted-foreground">Países Únicos</div>
                <div className="text-xl md:text-2xl font-bold">{data.overview.uniqueCountries}</div>
              </div>
              <div className="p-3 md:p-4 border rounded-lg">
                <div className="text-xs md:text-sm text-muted-foreground">Cidades Únicas</div>
                <div className="text-xl md:text-2xl font-bold">{data.overview.uniqueCities}</div>
              </div>
              <div className="p-3 md:p-4 border rounded-lg">
                <div className="text-xs md:text-sm text-muted-foreground">Média/Dia</div>
                <div className="text-xl md:text-2xl font-bold">{data.overview.avgVisitsPerDay.toFixed(1)}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="entries" className="space-y-4 mt-4">
            <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300} minWidth={isMobile ? 400 : 0}>
                <LineChart data={data.entries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Visitas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="continents" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300} minWidth={isMobile ? 300 : 0}>
                  <PieChart>
                    <Pie
                      data={data.continents.slice(0, 8)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 60 : 80}
                      label={!isMobile}
                    >
                      {data.continents.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Continente</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.continents.slice(0, 10).map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-sm">{item.name || 'Desconhecido'}</TableCell>
                        <TableCell className="text-right text-sm">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="countries" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300} minWidth={isMobile ? 400 : 0}>
                  <BarChart data={data.countries.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>País</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.countries.slice(0, 10).map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-sm">{item.name || 'Desconhecido'}</TableCell>
                        <TableCell className="text-right text-sm">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cities" className="space-y-4 mt-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="text-right">Visitas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cities.slice(0, 20).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="text-sm">{item.name || 'Desconhecido'}</TableCell>
                      <TableCell className="text-right text-sm">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="referrers" className="space-y-4 mt-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referenciador</TableHead>
                    <TableHead className="text-right">Visitas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.referrers.slice(0, 20).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="text-sm break-words">{item.name || 'Direto'}</TableCell>
                      <TableCell className="text-right text-sm">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300} minWidth={isMobile ? 300 : 0}>
                  <PieChart>
                    <Pie
                      data={data.devices}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 60 : 80}
                      label={!isMobile}
                    >
                      {data.devices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.devices.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="text-sm">{item.name || 'Desconhecido'}</TableCell>
                        <TableCell className="text-right text-sm">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="os" className="space-y-4 mt-4">
            <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300} minWidth={isMobile ? 400 : 0}>
                <BarChart data={data.operatingSystems.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="browsers" className="space-y-4 mt-4">
            <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300} minWidth={isMobile ? 400 : 0}>
                <BarChart data={data.browsers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="languages" className="space-y-4 mt-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Idioma</TableHead>
                    <TableHead className="text-right">Visitas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.languages.slice(0, 20).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="text-sm">{item.name || 'Desconhecido'}</TableCell>
                      <TableCell className="text-right text-sm">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="utms" className="space-y-4 md:space-y-6 mt-4">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">UTM Source</h3>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Visitas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.utms.sources.slice(0, 10).map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="text-sm break-words">{item.name || 'Desconhecido'}</TableCell>
                          <TableCell className="text-right text-sm">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">UTM Medium</h3>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medium</TableHead>
                        <TableHead className="text-right">Visitas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.utms.mediums.slice(0, 10).map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="text-sm break-words">{item.name || 'Desconhecido'}</TableCell>
                          <TableCell className="text-right text-sm">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">UTM Campaign</h3>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead className="text-right">Visitas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.utms.campaigns.slice(0, 10).map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="text-sm break-words">{item.name || 'Desconhecido'}</TableCell>
                          <TableCell className="text-right text-sm">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

