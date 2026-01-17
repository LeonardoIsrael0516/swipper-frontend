import React, { memo } from 'react';

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

interface ReelComparativoProps {
  element: {
    id: string;
    elementType: string;
    uiConfig?: any;
  };
  className?: string;
}

export const ReelComparativo = memo(function ReelComparativo({ element, className = '' }: ReelComparativoProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    firstColumnTitle = 'Título',
    columnATitle = 'A',
    columnBTitle = 'B',
    items = [],
    borderRadius = 8,
    backgroundColor = '#ffffff',
    textColor = '#000000',
    columnABackgroundColor = '#c15772',
    columnATextColor = '#ffffff',
    columnBBackgroundColor = '#ffffff',
    columnBTextColor = '#000000',
    headerTextColor = '#000000',
    headerBackgroundColor = '#f3f4f6',
  } = config;

  // Se não houver itens, não renderizar nada
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`w-full rounded-lg border overflow-hidden ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        backgroundColor,
        borderColor: '#e5e7eb',
      }}
    >
      {/* Tabela Comparativa */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse" style={{ backgroundColor }}>
          {/* Cabeçalho */}
          <thead>
            <tr>
              <th
                className="px-4 py-3 text-left font-medium border-r border-b"
                style={{
                  backgroundColor: headerBackgroundColor,
                  color: headerTextColor,
                  borderColor: '#e5e7eb',
                  width: '50%',
                }}
              >
                {firstColumnTitle}
              </th>
              <th
                className="px-4 py-3 text-center font-medium border-r border-b"
                style={{
                  backgroundColor: columnABackgroundColor,
                  color: columnATextColor,
                  borderColor: '#e5e7eb',
                  width: '25%',
                }}
              >
                {columnATitle}
              </th>
              <th
                className="px-4 py-3 text-center font-medium border-b"
                style={{
                  backgroundColor: columnBBackgroundColor,
                  color: columnBTextColor,
                  borderColor: '#e5e7eb',
                  width: '25%',
                }}
              >
                {columnBTitle}
              </th>
            </tr>
          </thead>

          {/* Corpo da Tabela */}
          <tbody>
            {items.map((item: any, index: number) => (
              <tr key={item.id || index}>
                <td
                  className="px-4 py-3 border-r border-b"
                  style={{
                    color: textColor,
                    borderColor: '#e5e7eb',
                  }}
                >
                  {item.title || `Item ${index + 1}`}
                </td>
                <td
                  className="px-4 py-3 text-center border-r border-b"
                  style={{
                    backgroundColor: columnABackgroundColor,
                    color: columnATextColor,
                    borderColor: '#e5e7eb',
                  }}
                >
                  {item.valueA || '-'}
                </td>
                <td
                  className="px-4 py-3 text-center border-b"
                  style={{
                    backgroundColor: columnBBackgroundColor,
                    color: columnBTextColor,
                    borderColor: '#e5e7eb',
                  }}
                >
                  {item.valueB || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

