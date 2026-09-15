import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Coins,
} from 'lucide-react';
import { KudeDocumentData } from '../types/kude';

interface DataVisualizerProps {
  document: KudeDocumentData;
  allDocuments?: KudeDocumentData[];
}

const COLORS_TAX = {
  exento: '#94a3b8', // slate-400
  iva5: '#3b82f6',  // blue-500
  iva10: '#10b981', // emerald-500
};

export const DataVisualizer: React.FC<DataVisualizerProps> = ({
  document: doc,
  allDocuments = [],
}) => {
  const isGuarani = doc.totales.moneda === 'PYG';
  const currencySymbol = isGuarani ? '₲' : '$';

  const formatMoney = (val: number) => {
    if (isGuarani) {
      return `${currencySymbol} ${Math.round(val).toLocaleString('es-PY')}`;
    }
    return `${currencySymbol} ${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Pie chart data: Tax distribution (Exenta, 5%, 10%)
  const taxData = [
    {
      name: 'Exentas (0%)',
      value: doc.totales.subtotalExento,
      color: COLORS_TAX.exento,
    },
    {
      name: 'Gravadas 5%',
      value: doc.totales.subtotal5,
      color: COLORS_TAX.iva5,
    },
    {
      name: 'Gravadas 10%',
      value: doc.totales.subtotal10,
      color: COLORS_TAX.iva10,
    },
  ].filter((d) => d.value > 0);

  // Bar chart data: Top items by total value
  const itemsData = [...doc.items]
    .sort((a, b) => b.totalItem - a.totalItem)
    .slice(0, 6)
    .map((item) => ({
      name:
        item.descripcion.length > 22
          ? `${item.descripcion.substring(0, 20)}...`
          : item.descripcion,
      fullName: item.descripcion,
      importe: item.totalItem,
      cantidad: item.cantidad,
      tasa: `${item.tasaIva}%`,
    }));

  // Tax vs Base breakdown
  const taxComparisonData = [
    {
      categoria: 'IVA 10%',
      baseGravada: doc.totales.baseGravada10,
      impuestoIva: doc.totales.totalIva10,
    },
    {
      categoria: 'IVA 5%',
      baseGravada: doc.totales.baseGravada5,
      impuestoIva: doc.totales.totalIva5,
    },
  ].filter((d) => d.baseGravada > 0 || d.impuestoIva > 0);

  // Batch stats if multiple documents loaded
  const multiDocSummary = allDocuments.length > 1 ? {
    totalDocs: allDocuments.length,
    totalFacturado: allDocuments.reduce((acc, d) => acc + d.totales.totalPagar, 0),
    totalIva: allDocuments.reduce((acc, d) => acc + d.totales.totalIva, 0),
    totalItems: allDocuments.reduce((acc, d) => acc + d.items.length, 0),
  } : null;

  return (
    <div className="space-y-4">
      {/* 1. KEY PERFORMANCE METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total General */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Facturado
            </span>
            <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {formatMoney(doc.totales.totalPagar)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Moneda: {doc.totales.moneda} {doc.condicionVenta && `• ${doc.condicionVenta}`}
          </div>
        </div>

        {/* Total IVA */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total IVA Liquidado
            </span>
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate">
            {formatMoney(doc.totales.totalIva)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            10%: {formatMoney(doc.totales.totalIva10)} | 5%: {formatMoney(doc.totales.totalIva5)}
          </div>
        </div>

        {/* Base Gravada */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Base Imponible
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {formatMoney(doc.totales.totalBaseGravada)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Exentas: {formatMoney(doc.totales.subtotalExento)}
          </div>
        </div>

        {/* Ítems procesados */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Ítems en KuDE
            </span>
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {doc.items.length} {doc.items.length === 1 ? 'línea' : 'líneas'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Descuento total: {formatMoney(doc.totales.totalDescuento)}
          </div>
        </div>
      </div>

      {/* Multi-document Batch notice if applicable */}
      {multiDocSummary && (
        <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs transition-colors">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-medium">
            <Receipt className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
            <span>
              Lote cargado: <strong>{multiDocSummary.totalDocs} documentos XML</strong> en memoria.
            </span>
          </div>
          <div className="text-indigo-950 dark:text-indigo-200 font-mono font-semibold">
            Acumulado Global:{' '}
            <span className="text-indigo-700 dark:text-indigo-400 font-bold">
              {formatMoney(multiDocSummary.totalFacturado)}
            </span>{' '}
            (IVA:{' '}
            {formatMoney(multiDocSummary.totalIva)})
          </div>
        </div>
      )}

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Pie Chart: Composición Impositiva (5 cols) */}
        <div className="lg:col-span-5 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
              <PieIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Composición por Tasa Impositiva</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">SIFEN DTE</span>
          </div>

          <div className="h-56 w-full">
            {taxData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taxData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number | string | undefined) => [
                      formatMoney(Number(val) || 0),
                      'Subtotal',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin datos de tasas para graficar
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart: Top Items por Facturación (7 cols) */}
        <div className="lg:col-span-7 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
              <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Ítems con Mayor Importe Facturado</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">En tiempo real</span>
          </div>

          <div className="h-56 w-full">
            {itemsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={itemsData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(val) =>
                      isGuarani
                        ? `${(val / 1000000).toFixed(1)}M`
                        : `${val.toFixed(0)}`
                    }
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip
                    formatter={(val: number | string | undefined, name: any, item: any) => [
                      formatMoney(Number(val) || 0),
                      `Importe (Cant: ${item.payload.cantidad} - IVA: ${item.payload.tasa})`,
                    ]}
                    labelFormatter={(_, payload) =>
                      payload[0]?.payload?.fullName || ''
                    }
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="importe"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    name="Importe"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin ítems en el documento
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
