import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  Target,
  Trophy,
  Package,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { api } from '../api/client.js';
import { StatCard } from '../components/common/StatCard.js';
import { useAuth } from '../context/AuthContext.js';
import type { DashboardMetrics, MonthlySalesData, DealsByStageData, TopCustomerData, TopProductData } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: 'pipeline' | 'customers' | 'products' | 'sales') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { isViewer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [dealsByStage, setDealsByStage] = useState<DealsByStageData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.analytics.getDashboard();
      setMetrics(data.metrics);
      setMonthlySales(data.monthlySales);
      setDealsByStage(data.dealsByStage);
      setTopCustomers(data.topCustomers);
      setTopProducts(data.topProducts);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Cargando métricas y analíticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-indigo-600 to-indigo-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-indigo-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-100 mb-3 border border-white/15">
            <TrendingUp className="h-3.5 w-3.5 text-brand-300" />
            Rendimiento Comercial
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Bienvenido al Panel de Ventas
          </h2>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl hidden sm:block">
            Monitoreo en tiempo real del embudo comercial, ingresos cobrados, clientes activos y oportunidades.
          </p>
        </div>

        {!isViewer && (
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => onNavigate('pipeline')}
              className="flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white text-brand-700 font-semibold text-xs sm:text-sm hover:bg-indigo-50 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"
            >
              Ver Pipeline
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('sales')}
              className="flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-white font-semibold text-xs sm:text-sm transition-colors border border-white/20 inline-flex items-center justify-center gap-1.5"
            >
              Nueva Venta
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Ingresos Totales Cobrados"
          value={formatCurrency(metrics.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle={`Ticket promedio: ${formatCurrency(metrics.averageTicket)}`}
        />

        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(metrics.monthlyRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{
            value: metrics.revenueGrowthPercentage,
            isPositive: metrics.revenueGrowthPercentage >= 0,
          }}
          subtitle="Respecto al mes anterior"
        />

        <StatCard
          title="Pipeline Activo"
          value={formatCurrency(metrics.dealsPipelineValue)}
          icon={<Target className="h-5 w-5" />}
          subtitle={`${metrics.activeDealsCount} oportunidades en curso`}
        />

        <StatCard
          title="Tasa de Cierre (Win Rate)"
          value={`${metrics.winRate}%`}
          icon={<Trophy className="h-5 w-5" />}
          subtitle={`${metrics.dealsWonCount} ganadas · ${metrics.dealsLostCount} perdidas`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Evolución de Ingresos</h3>
              <p className="text-xs text-slate-500 hidden sm:block">Facturación cobrada en los últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-brand-500"></span>
              <span className="text-xs text-slate-600 font-medium hidden sm:inline">Ingresos ($)</span>
            </div>
          </div>

          <div className="h-52 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  width={45}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Ingresos']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deals by Stage Distribution (1 col) */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Embudo de Ventas</h3>
              {!isViewer && (
                <button
                  onClick={() => onNavigate('pipeline')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center"
                >
                  Ver Kanban <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-4">Valor total de oportunidades por etapa</p>

            <div className="h-44 sm:h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsByStage} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${formatCurrency(Number(val))} (${item.payload.count} tratos)`,
                      'Valor',
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="totalValue" radius={[0, 6, 6, 0]}>
                    {dealsByStage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Prospección</p>
              <p className="text-xs font-bold text-slate-700">
                {dealsByStage.find(d => d.stage === 'LEAD')?.count || 0}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Propuesta</p>
              <p className="text-xs font-bold text-slate-700">
                {dealsByStage.find(d => d.stage === 'PROPOSAL')?.count || 0}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Ganadas</p>
              <p className="text-xs font-bold text-emerald-600">
                {dealsByStage.find(d => d.stage === 'WON')?.count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Customers */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Top Clientes por Facturación</h3>
            </div>
            {!isViewer && (
              <button
                onClick={() => onNavigate('customers')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold shrink-0"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {topCustomers.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No hay clientes con compras aún</p>
            ) : (
              topCustomers.map((c, i) => (
                <div key={c.id} className="py-3 sm:py-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.company || 'Particular'} · {c.salesCount} pedidos</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(c.totalSpent)}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Facturado</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Productos & Servicios Destacados</h3>
            </div>
            {!isViewer && (
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold shrink-0"
              >
                Ver catálogo
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No hay ventas registradas aún</p>
            ) : (
              topProducts.map((p) => (
                <div key={p.id} className="py-3 sm:py-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-indigo-50 text-brand-600 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {p.code.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{p.code} · {p.unitsSold} u.</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(p.totalRevenue)}</p>
                    <p className="text-[11px] text-slate-500">Total</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
