import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  Target,
  Trophy,
  Package,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Store,
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
  onNavigate: (tab: 'pipeline' | 'customers' | 'products' | 'sales' | 'commissions') => void;
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
          <p className="mt-3 text-sm text-slate-500 font-medium">Cargando métricas del canal revendedor...</p>
        </div>
      </div>
    );
  }

  const hasPendingCommissions = metrics.pendingCommissionsAmount > 0;

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Encabezado: Panel Canal Revendedores ─────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-indigo-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-indigo-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-100 mb-3 border border-white/15">
            <Store className="h-3.5 w-3.5 text-violet-300" />
            Canal Revendedores
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Panel Comercial — Canal Revendedores
          </h2>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl hidden sm:block">
            Métricas de facturación al costo, comisiones por cobrar y desempeño del canal de distribución. Excluye ventas a Consumidor Final.
          </p>
        </div>

        {!isViewer && (
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => onNavigate('pipeline')}
              className="flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white text-violet-700 font-semibold text-xs sm:text-sm hover:bg-violet-50 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"
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

      {/* ── Alerta: Comisiones Pendientes ────────────────────────────────── */}
      {hasPendingCommissions && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              Hay {formatCurrency(metrics.pendingCommissionsAmount)} en comisiones pendientes de liquidar.
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Ingresá a la pestaña <strong>Comisiones</strong> para marcarlas como pagadas.
            </p>
          </div>
          {!isViewer && (
            <button
              onClick={() => onNavigate('commissions')}
              className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
            >
              Ir a Comisiones
            </button>
          )}
        </div>
      )}

      {/* ── KPIs: Ventas Canal Revendedor ────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 px-0.5">
          Ventas · Canal Revendedor
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title="Facturado Total (Costo)"
            value={formatCurrency(metrics.totalRevenue)}
            icon={<DollarSign className="h-5 w-5" />}
            subtitle={`Ticket promedio: ${formatCurrency(metrics.averageTicket)}`}
          />

          <StatCard
            title="Facturado Este Mes"
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
      </div>

      {/* ── KPIs: Comisiones ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Comisiones · Vendedores
          </h3>
          {!isViewer && (
            <button
              onClick={() => onNavigate('commissions')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1"
            >
              Ver detalle <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {/* Total generado */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Total Generado</p>
              <p className="text-xl font-extrabold text-slate-900 truncate">{formatCurrency(metrics.totalCommissionsResellers)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Comisiones históricas</p>
            </div>
          </div>

          {/* Pendiente de cobro */}
          <div className={`rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${hasPendingCommissions ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${hasPendingCommissions ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-[11px] font-medium uppercase tracking-wide ${hasPendingCommissions ? 'text-amber-500' : 'text-slate-400'}`}>
                Pendiente de Pago
              </p>
              <p className={`text-xl font-extrabold truncate ${hasPendingCommissions ? 'text-amber-700' : 'text-slate-900'}`}>
                {formatCurrency(metrics.pendingCommissionsAmount)}
              </p>
              <p className={`text-[11px] mt-0.5 ${hasPendingCommissions ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                {hasPendingCommissions ? '⚠ Requiere liquidación' : 'Sin pendientes'}
              </p>
            </div>
          </div>

          {/* Liquidadas */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Liquidadas</p>
              <p className="text-xl font-extrabold text-slate-900 truncate">{formatCurrency(metrics.paidCommissionsAmount)}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">✓ Comisiones pagadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráficos ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Evolución mensual de facturación a revendedores */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Evolución Facturación · Revendedores</h3>
              <p className="text-xs text-slate-500 hidden sm:block">Facturación al costo cobrada en los últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-violet-500"></span>
              <span className="text-xs text-slate-600 font-medium hidden sm:inline">Ingresos ($)</span>
            </div>
          </div>

          <div className="h-52 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Facturado (costo)']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Embudo de Ventas */}
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

      {/* ── Top Clientes Revendedores y Productos ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Clientes Revendedores */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Top Revendedores</h3>
                <p className="text-[11px] text-slate-400">Por volumen facturado al costo</p>
              </div>
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
              <p className="text-xs text-slate-400 py-6 text-center">No hay revendedores con compras aún</p>
            ) : (
              topCustomers.map((c, i) => (
                <div key={c.id} className="py-3 sm:py-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.company || 'Sin empresa'} · {c.salesCount} pedidos</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(c.totalSpent)}</p>
                    <p className="text-[11px] text-violet-600 font-medium">Al costo</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Productos Vendidos a Revendedores */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Top Productos · Revendedores</h3>
                <p className="text-[11px] text-slate-400">Más demandados por el canal</p>
              </div>
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
              <p className="text-xs text-slate-400 py-6 text-center">No hay ventas a revendedores aún</p>
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
                    <p className="text-[11px] text-slate-500">Total costo</p>
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
