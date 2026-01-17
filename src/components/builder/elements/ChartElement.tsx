import React from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
const normalizeUiConfig = (uiConfig: any): any => {
  if (!uiConfig) return {};
  if (typeof uiConfig === 'string') {
    try {
      return JSON.parse(uiConfig);
    } catch {
      return {};
    }
  }
  if (typeof uiConfig === 'object' && uiConfig !== null) {
    return uiConfig;
  }
  return {};
};

interface ChartElementProps {
  element: SlideElement;
}

export function ChartElement({ element }: ChartElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    chartType = 'bar',
    items = [],
    height = 300,
    showLegend = true,
    showGrid = true,
    backgroundColor = 'transparent',
    textColor = '#000000',
  } = config;

  // Se não houver itens, mostrar placeholder
  if (items.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          backgroundColor,
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <p style={{ fontSize: '14px', opacity: 0.6 }}>
          Adicione itens ao gráfico
        </p>
      </div>
    );
  }

  // Preparar dados para recharts
  const chartData = items.map((item: any) => ({
    name: item.label || 'Item',
    value: typeof item.value === 'number' ? item.value : 0,
    color: item.color || '#3b82f6',
  }));

  const containerStyle: React.CSSProperties = {
    height: `${height}px`,
    backgroundColor,
    color: textColor,
    padding: '8px',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '100%',
    margin: '0',
    boxSizing: 'border-box',
    display: 'block',
    position: 'relative',
  };

  // Renderizar gráfico baseado no tipo
  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
              <XAxis
                dataKey="name"
                tick={{ fill: textColor, fontSize: 12 }}
                axisLine={{ stroke: textColor, opacity: 0.3 }}
              />
              <YAxis
                tick={{ fill: textColor, fontSize: 12 }}
                axisLine={{ stroke: textColor, opacity: 0.3 }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: textColor,
                }}
              />
              <defs>
                {/* Gradiente horizontal que transiciona entre as cores dos itens */}
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  {chartData.map((item, index) => {
                    const offset = chartData.length > 1 
                      ? (index / (chartData.length - 1)) * 100 
                      : 0;
                    return (
                      <stop
                        key={`gradient-stop-${index}`}
                        offset={`${offset}%`}
                        stopColor={item.color}
                      />
                    );
                  })}
                </linearGradient>
              </defs>
              {/* Área principal com gradiente na linha */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#areaGradient)"
                strokeWidth={3}
                fill="url(#areaGradient)"
                fillOpacity={0.3}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
              <XAxis
                dataKey="name"
                tick={{ fill: textColor, fontSize: 12 }}
                axisLine={{ stroke: textColor, opacity: 0.3 }}
              />
              <YAxis
                tick={{ fill: textColor, fontSize: 12 }}
                axisLine={{ stroke: textColor, opacity: 0.3 }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: textColor,
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((item: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent, innerRadius }) => {
                  // Só mostrar label se a fatia for grande o suficiente
                  if (percent > 0.05) {
                    return `${(percent * 100).toFixed(0)}%`;
                  }
                  return '';
                }}
                outerRadius={Math.min(height * 0.25, 100)}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((item: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: textColor,
                }}
              />
              {showLegend && (
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: textColor }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'donut':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => {
                  // Só mostrar label se a fatia for grande o suficiente
                  if (percent > 0.05) {
                    return `${(percent * 100).toFixed(0)}%`;
                  }
                  return '';
                }}
                outerRadius={Math.min(height * 0.25, 100)}
                innerRadius={Math.min(height * 0.15, 60)}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((item: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: textColor,
                }}
              />
              {showLegend && (
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: textColor }}
                  formatter={(value, entry) => {
                    const item = chartData.find((d: any) => d.name === value);
                    return item ? item.name : value;
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div style={{ textAlign: 'center', color: textColor }}>
            Tipo de gráfico não suportado
          </div>
        );
    }
  };

  return (
    <div style={containerStyle} className="w-full">
      <style>{`
        .recharts-pie-label-line {
          display: none !important;
        }
        .recharts-pie-label {
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
      {renderChart()}
    </div>
  );
}

