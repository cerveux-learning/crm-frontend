import React, { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  AlertCircle,
  CreditCard,
  Building,
  RotateCcw,
  CheckSquare,
  Square,
  Eye,
  Layers,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import type {
  Commission,
  CommissionSummary,
  CommissionStatus,
  SaleOrder,
} from '../types';

export const CommissionsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  // Data states
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [sellers, setSellers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CommissionStatus>('ALL');
  const [sellerFilter, setSellerFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Batch selection (Admin only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal: Pay Commission (Single or Batch)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Commission | null>(null); // null means batch pay of selectedIds
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0] || '');
  const [payNotes, setPayNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Modal: View Sale Detail
  const [viewingSaleId, setViewingSaleId] = useState<string | null>(null);
  const [viewingSale, setViewingSale] = useState<SaleOrder | null>(null);
  const [loadingSale, setLoadingSale] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (isAdmin && sellerFilter !== 'ALL') filters.userId = sellerFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (search.trim()) filters.search = search.trim();

      const promises: [Promise<Commission[]>, Promise<CommissionSummary>, Promise<any>?] = [
        api.commissions.getAll(filters),
        api.commissions.getSummary(isAdmin && sellerFilter !== 'ALL' ? sellerFilter : undefined),
      ];

      if (isAdmin && sellers.length === 0) {
        promises.push(api.users.getSellers());
      }

      const results = await Promise.all(promises);
      setCommissions(results[0]);
      setSummary(results[1]);

      if (results[2]) {
        setSellers(results[2]);
      }
    } catch (err) {
      console.error('Error al cargar datos de comisiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, sellerFilter, startDate, endDate]);

  // Handle text search with submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSellerFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedIds(new Set());
  };

  // Selection handlers
  const pendingCommissions = useMemo(
    () => commissions.filter((c) => c.status === 'PENDING'),
    [commissions]
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingCommissions.length && pendingCommissions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingCommissions.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Open single pay modal
  const handleOpenSinglePay = (commission: Commission) => {
    setPayTarget(commission);
    setPayDate(new Date().toISOString().split('T')[0] || '');
    setPayNotes('');
    setPayError(null);
    setIsPayModalOpen(true);
  };

  // Open batch pay modal
  const handleOpenBatchPay = () => {
    setPayTarget(null);
    setPayDate(new Date().toISOString().split('T')[0] || '');
    setPayNotes('');
    setPayError(null);
    setIsPayModalOpen(true);
  };

  // Submit payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    setIsPaying(true);

    try {
      if (payTarget) {
        // Single pay
        await api.commissions.pay(payTarget.id, {
          paidAt: payDate ? new Date(payDate).toISOString() : undefined,
          notes: payNotes.trim() || undefined,
        });
      } else {
        // Batch pay
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        await api.commissions.batchPay({
          ids,
          paidAt: payDate ? new Date(payDate).toISOString() : undefined,
          notes: payNotes.trim() || undefined,
        });
        setSelectedIds(new Set());
      }

      setIsPayModalOpen(false);
      setPayTarget(null);
      await loadData();
    } catch (err: any) {
      console.error('Error al registrar pago de comisión:', err);
      setPayError(err.message || 'Error al procesar el pago.');
    } finally {
      setIsPaying(false);
    }
  };

  // View sale order modal
  const handleOpenSaleModal = async (saleOrderId: string) => {
    setViewingSaleId(saleOrderId);
    setLoadingSale(true);
    setViewingSale(null);
    try {
      const sale = await api.sales.getById(saleOrderId);
      setViewingSale(sale);
    } catch (err) {
      console.error('Error al cargar detalle de venta:', err);
    } finally {
      setLoadingSale(false);
    }
  };

  // Calculations for batch payment modal
  const selectedCommissions = useMemo(
    () => commissions.filter((c) => selectedIds.has(c.id)),
    [commissions, selectedIds]
  );

  const batchTotalAmount = useMemo(
    () => selectedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    [selectedCommissions]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Comisiones por Cobrar / Liquidar
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Canal Revendedores
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Auditoría y liquidación del <span className="font-semibold text-slate-700">10% sobre precio de costo</span> en ventas a revendedores.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {isAdmin && selectedIds.size > 0 && (
            <button
              onClick={handleOpenBatchPay}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 animate-in fade-in"
            >
              <CreditCard className="h-4 w-4" />
              <span>Liquidar Seleccionadas ({selectedIds.size})</span>
              <span className="font-mono bg-emerald-700/60 px-2 py-0.5 rounded-md text-[11px]">
                {formatCurrency(batchTotalAmount)}
              </span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
            title="Imprimir listado / reporte actual"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Generated */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Generado</p>
            <p className="text-2xl font-black text-slate-900 truncate">
              {formatCurrency(summary?.totalGenerated.amount ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary?.totalGenerated.count ?? 0} ventas a revendedores
            </p>
          </div>
        </div>

        {/* Pending Amount */}
        <div
          className={`rounded-2xl border shadow-sm p-5 flex items-center gap-4 transition-colors ${
            (summary?.pendingAmount.amount ?? 0) > 0
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-white border-slate-100'
          }`}
        >
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
              (summary?.pendingAmount.amount ?? 0) > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Clock className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                (summary?.pendingAmount.amount ?? 0) > 0 ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              Pendiente de Liquidar
            </p>
            <p
              className={`text-2xl font-black truncate ${
                (summary?.pendingAmount.amount ?? 0) > 0 ? 'text-amber-800' : 'text-slate-900'
              }`}
            >
              {formatCurrency(summary?.pendingAmount.amount ?? 0)}
            </p>
            <p
              className={`text-xs mt-0.5 font-medium ${
                (summary?.pendingAmount.amount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              {(summary?.pendingAmount.count ?? 0) > 0
                ? `⚠ ${summary?.pendingAmount.count} pendientes de pago`
                : 'Sin saldo pendiente'}
            </p>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Liquidado</p>
            <p className="text-2xl font-black text-slate-900 truncate">
              {formatCurrency(summary?.paidAmount.amount ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary?.paidAmount.count ?? 0} comisiones abonadas
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por N° factura o cliente revendedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'ALL', label: 'Todas' },
                { id: 'PENDING', label: 'Pendientes' },
                { id: 'PAID', label: 'Pagadas' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Seller Filter (Admin Only) */}
          {isAdmin && (
            <div className="min-w-[180px]">
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="ALL">Todos los Vendedores</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-brand-500"
              title="Fecha inicial"
            />
            <span className="text-xs text-slate-400">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-brand-500"
              title="Fecha final"
            />
          </div>

          {/* Reset button */}
          {(search || statusFilter !== 'ALL' || sellerFilter !== 'ALL' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Limpiar filtros"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-400 font-bold uppercase tracking-wider">
                {isAdmin && (
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      disabled={pendingCommissions.length === 0}
                      className="text-slate-400 hover:text-brand-600 disabled:opacity-30"
                      title={
                        selectedIds.size === pendingCommissions.length && pendingCommissions.length > 0
                          ? 'Deseleccionar todas'
                          : 'Seleccionar todas las pendientes'
                      }
                    >
                      {selectedIds.size === pendingCommissions.length && pendingCommissions.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-brand-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-4">Factura / Venta</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4">Vendedor</th>
                <th className="py-3 px-4">Cliente Revendedor</th>
                <th className="py-3 px-4 text-right">Venta al Costo</th>
                <th className="py-3 px-4 text-center">% Com.</th>
                <th className="py-3 px-4 text-right">Monto Comisión</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Liquidación</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-r-transparent mb-2"></div>
                    <p className="text-xs font-medium">Cargando registros de comisiones...</p>
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No se encontraron comisiones</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter !== 'ALL'
                        ? 'Intenta ajustar los criterios de búsqueda o filtros.'
                        : 'Las facturas emitidas a revendedores generarán automáticamente comisiones aquí.'}
                    </p>
                  </td>
                </tr>
              ) : (
                commissions.map((comm) => {
                  const isPending = comm.status === 'PENDING';
                  const isSelected = selectedIds.has(comm.id);

                  return (
                    <tr
                      key={comm.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      {/* Batch Checkbox (Admin) */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(comm.id)}
                              className="text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-brand-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      )}

                      {/* Sale Order Number Link */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenSaleModal(comm.saleOrderId)}
                          className="font-mono font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1.5"
                          title="Ver detalle del comprobante de venta"
                        >
                          <FileText className="h-3.5 w-3.5 text-brand-500" />
                          <span>{comm.saleOrder?.orderNumber || 'Ver Venta'}</span>
                        </button>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {comm.saleOrder?.issueDate
                          ? new Date(comm.saleOrder.issueDate).toLocaleDateString()
                          : new Date(comm.createdAt).toLocaleDateString()}
                      </td>

                      {/* Seller */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{comm.user?.name || 'Sin asignar'}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                          {comm.user?.email || '-'}
                        </p>
                      </td>

                      {/* Reseller Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{comm.customerName || 'Revendedor'}</p>
                        <p className="text-[11px] text-slate-400">Canal Revendedor</p>
                      </td>

                      {/* Cost Subtotal */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(comm.costSubtotal)}
                      </td>

                      {/* Commission Rate */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                          {Math.round(comm.commissionRate * 100)}%
                        </span>
                      </td>

                      {/* Commission Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-extrabold text-emerald-700 text-sm">
                          {formatCurrency(comm.commissionAmount)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="commission" value={comm.status} />
                      </td>

                      {/* Payment Detail */}
                      <td className="py-3.5 px-4">
                        {comm.status === 'PAID' ? (
                          <div>
                            <p className="text-slate-900 font-medium text-[11px]">
                              {comm.paidAt ? new Date(comm.paidAt).toLocaleDateString() : 'Abonada'}
                            </p>
                            {comm.paidByUser && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                Por: {comm.paidByUser.name}
                              </p>
                            )}
                            {comm.notes && (
                              <p className="text-[10px] text-indigo-600 italic truncate max-w-[150px]" title={comm.notes}>
                                Ref: {comm.notes}
                              </p>
                            )}
                          </div>
                        ) : comm.status === 'CANCELLED' ? (
                          <span className="text-[11px] text-slate-400 italic">Venta anulada</span>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium">Por liquidar</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && isPending && (
                            <button
                              onClick={() => handleOpenSinglePay(comm)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-colors"
                              title="Liquidar / Marcar como pagada"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Liquidar</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenSaleModal(comm.saleOrderId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="Ver Comprobante"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando <span className="font-bold text-slate-700">{commissions.length}</span> comisiones
            {isAdmin && selectedIds.size > 0 && (
              <span className="ml-2 font-semibold text-brand-600">
                ({selectedIds.size} seleccionadas para liquidación)
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>
              Total en vista:{' '}
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(commissions.reduce((acc, c) => acc + c.commissionAmount, 0))}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Modal: Pay Commission (Single or Batch) */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => {
          if (!isPaying) {
            setIsPayModalOpen(false);
            setPayTarget(null);
          }
        }}
        title={
          payTarget
            ? `Liquidar Comisión — ${payTarget.saleOrder?.orderNumber || 'Factura'}`
            : `Liquidar ${selectedIds.size} Comisiones Seleccionadas`
        }
        description="Registra la liquidación efectiva del 10% para el vendedor responsable."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          {payError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{payError}</span>
            </div>
          )}

          {/* Amount Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Monto Total a Liquidar:</span>
              <span className="text-xl font-extrabold font-mono text-emerald-600">
                {formatCurrency(payTarget ? payTarget.commissionAmount : batchTotalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-200 pt-2">
              <span>Beneficiario(s):</span>
              <span className="font-semibold text-slate-900">
                {payTarget
                  ? payTarget.user?.name || 'Vendedor'
                  : `${new Set(selectedCommissions.map((c) => c.user?.name || 'Vendedor')).size} vendedor(es)`}
              </span>
            </div>
            {payTarget && (
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Cliente Revendedor:</span>
                <span className="font-medium text-slate-700">{payTarget.customerName || '-'}</span>
              </div>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Fecha de Liquidación / Pago
            </label>
            <input
              type="date"
              required
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Notes / Receipt Ref */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Comprobante / Observaciones (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Transferencia Santander #84912, liquidación quincenal de comisiones..."
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isPaying}
              onClick={() => {
                setIsPayModalOpen(false);
                setPayTarget(null);
              }}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPaying}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isPaying ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmar Liquidación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Associated Sale Detail */}
      <Modal
        isOpen={Boolean(viewingSaleId)}
        onClose={() => setViewingSaleId(null)}
        title={viewingSale ? `Factura ${viewingSale.orderNumber}` : 'Cargando Comprobante...'}
        maxWidth="2xl"
      >
        {loadingSale ? (
          <div className="py-12 text-center text-slate-400">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-r-transparent mb-2"></div>
            <p className="text-xs font-medium">Obteniendo comprobante de venta...</p>
          </div>
        ) : viewingSale ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h2 className="font-extrabold text-xl text-slate-900">CRM Pro S.A.</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Av. Libertador 1500, Oficina 401</p>
                <p className="text-xs text-slate-500">Canal Revendedores Oficial</p>
              </div>

              <div className="text-right">
                <Badge variant="sale" value={viewingSale.status} />
                <p className="text-sm font-mono font-bold text-slate-900 mt-2">{viewingSale.orderNumber}</p>
                <p className="text-xs text-slate-500">
                  Emisión: {new Date(viewingSale.issueDate).toLocaleDateString()}
                </p>
                {viewingSale.user && (
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Vendedor: {viewingSale.user.name}
                  </p>
                )}
              </div>
            </div>

            {/* Reseller Banner */}
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-bold">Venta a Revendedor (Facturada al Costo)</span>
              </div>
              <span className="text-[11px] text-indigo-700 font-semibold">Comisión del 10% computable</span>
            </div>

            {/* Customer Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Cliente Revendedor:
              </p>
              <p className="font-bold text-slate-900 text-sm">{viewingSale.customer?.name}</p>
              <p className="text-xs text-slate-600">{viewingSale.customer?.company || 'Particular'}</p>
              <p className="text-xs text-slate-500">{viewingSale.customer?.email}</p>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2">Descripción</th>
                  <th className="py-2 text-center">Cant.</th>
                  <th className="py-2 text-right">Precio Costo</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingSale.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-slate-800 font-medium">{item.description}</td>
                    <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal al Costo:</span>
                  <span className="font-mono font-semibold">{formatCurrency(viewingSale.subtotal)}</span>
                </div>
                {viewingSale.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>IVA ({Math.round(viewingSale.taxRate * 100)}%):</span>
                    <span className="font-mono font-semibold">{formatCurrency(viewingSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Facturado:</span>
                  <span className="font-mono text-brand-600">{formatCurrency(viewingSale.total)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 mt-2">
                  <span>Comisión 10% Vendedor:</span>
                  <span className="font-mono">{formatCurrency(viewingSale.subtotal * 0.10)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {viewingSale.notes && (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-bold">Observaciones: </span>
                {viewingSale.notes}
              </div>
            )}

            {/* Print Button */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Printer className="h-4 w-4" />
                Imprimir Comprobante
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No se pudo obtener la información de la venta.
          </div>
        )}
      </Modal>
    </div>
  );
};
