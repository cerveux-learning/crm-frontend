import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Receipt,
  FileText,
  DollarSign,
  CheckCircle,
  ArrowRightCircle,
  Trash2,
  Printer,
  Calendar,
  Layers,
  UserCheck,
  User as UserIcon,
  Ban,
  Package,
  Info,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import { CONSUMIDOR_FINAL_CUSTOMER_ID, RESELLER_COMMISSION_RATE } from '../config/constants.js';
import type { SaleOrder, SaleType, Customer, Product, CreateSaleOrderItemInput } from '../types';

export const SalesPage: React.FC = () => {
  const { user, isAdmin, isSeller } = useAuth();
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sellerFilter, setSellerFilter] = useState<string>('ALL');

  // New Sale Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saleType, setSaleType] = useState<SaleType>('QUOTE');
  const [customerId, setCustomerId] = useState<string>('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('Condiciones de pago: Transferencia a 30 días.');
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(21);
  const [useCostPrice, setUseCostPrice] = useState(false);
  const [items, setItems] = useState<CreateSaleOrderItemInput[]>([
    { productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Derived state: Reseller check
  const isReseller = Boolean(customerId && customerId !== CONSUMIDOR_FINAL_CUSTOMER_ID);

  // View / Print Document Modal
  const [viewingSale, setViewingSale] = useState<SaleOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [sellerFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (isAdmin && sellerFilter !== 'ALL') {
        filters.userId = sellerFilter;
      }

      const promises: Promise<any>[] = [
        api.sales.getAll(filters),
        api.customers.getAll(),
        api.products.getAll(),
      ];

      if (isAdmin) {
        promises.push(api.users.getSellers());
      }

      const results = await Promise.all(promises);
      setSales(results[0]);
      setCustomers(results[1]);
      setProducts(results[2]);

      if (isAdmin && results[3]) {
        setSellers(results[3]);
      }

      if (results[1].length > 0 && !customerId && results[1][0]) {
        setCustomerId(results[1][0]!.id);
      }
    } catch (err) {
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (newCustomerId: string) => {
    setCustomerId(newCustomerId);
    const nextIsReseller = Boolean(newCustomerId && newCustomerId !== CONSUMIDOR_FINAL_CUSTOMER_ID);

    if (nextIsReseller) {
      setUseCostPrice(false);
      setItems(prevItems =>
        prevItems.map(item => {
          let selected = products.find(p => p.id === item.productId);
          if (!selected && products.length > 0) {
            selected = products[0];
          }
          return {
            ...item,
            productId: selected?.id || '',
            description: selected?.name || item.description,
            unitPrice: selected?.cost ?? 0,
            discount: 0,
          };
        })
      );
    } else {
      setItems(prevItems =>
        prevItems.map(item => {
          const selected = products.find(p => p.id === item.productId);
          return {
            ...item,
            unitPrice: selected ? (useCostPrice ? (selected.cost ?? 0) : selected.unitPrice) : item.unitPrice,
          };
        })
      );
    }
  };

  const handleOpenCreateModal = (defaultType: SaleType = 'QUOTE') => {
    setSaleType(defaultType);
    setAssignedUserId(user?.id || '');
    setApplyTax(true);
    setTaxRatePercent(21);
    setUseCostPrice(false);

    const initialCustomerId = customerId || (customers[0]?.id || '');
    if (!customerId && initialCustomerId) {
      setCustomerId(initialCustomerId);
    }
    const initialIsReseller = Boolean(initialCustomerId && initialCustomerId !== CONSUMIDOR_FINAL_CUSTOMER_ID);

    if (defaultType === 'CONSIGNMENT') {
      setNotes('Mercadería entregada en consignación. Sujeta a liquidación o devolución.');
    } else {
      setNotes('Condiciones de pago: Transferencia a 30 días.');
    }

    if (products.length > 0 && products[0]) {
      const first = products[0];
      setItems([
        {
          productId: first.id,
          description: first.name,
          quantity: 1,
          unitPrice: initialIsReseller ? (first.cost ?? 0) : first.unitPrice,
          discount: 0,
        },
      ]);
    } else {
      setItems([{ productId: '', description: '', quantity: 1, unitPrice: 100, discount: 0 }]);
    }
    const todayPlus30 = new Date();
    todayPlus30.setDate(todayPlus30.getDate() + 30);
    setDueDate(todayPlus30.toISOString().split('T')[0]!);
    setIsModalOpen(true);
  };

  const handleProductSelect = (index: number, pId: string) => {
    const selected = products.find(p => p.id === pId);
    const updated = [...items];
    if (selected && updated[index]) {
      updated[index].productId = selected.id;
      updated[index].description = selected.name;
      updated[index].unitPrice = (isReseller || useCostPrice) ? (selected.cost ?? 0) : selected.unitPrice;
      if (isReseller) {
        updated[index].discount = 0;
      }
    } else if (updated[index]) {
      updated[index].productId = '';
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof CreateSaleOrderItemInput, val: any) => {
    const updated = [...items];
    if (updated[index]) {
      if (isReseller && (field === 'unitPrice' || field === 'discount')) {
        return;
      }
      (updated[index] as any)[field] = val;
    }
    setItems(updated);
  };

  const handleAddItem = () => {
    if (isReseller && products.length > 0) {
      const first = products[0]!;
      setItems([
        ...items,
        {
          productId: first.id,
          description: first.name,
          quantity: 1,
          unitPrice: first.cost ?? 0,
          discount: 0,
        },
      ]);
    } else {
      setItems([
        ...items,
        { productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0 },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      const disc = item.discount ? (lineTotal * item.discount) / 100 : 0;
      return sum + (lineTotal - disc);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const taxRate = applyTax ? (Number(taxRatePercent) || 0) / 100 : 0;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;
  const estimatedCommission = isReseller ? subtotal * RESELLER_COMMISSION_RATE : 0;

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Debes seleccionar un cliente.');
      return;
    }

    if (isReseller) {
      const missingCatalogProduct = items.some(it => !it.productId);
      if (missingCatalogProduct) {
        alert('Las ventas a revendedores requieren que todos los productos se seleccionen del catálogo con su costo registrado.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.sales.create({
        type: saleType,
        customerId,
        userId: isAdmin ? (assignedUserId || user?.id) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        taxRate,
        notes,
        useCostPrice: !isReseller && isAdmin && saleType === 'INVOICE' && useCostPrice,
        items: items.map(it => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discount: isReseller ? 0 : Number(it.discount || 0),
        })),
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al crear el documento de venta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertQuote = async (quoteId: string) => {
    if (!confirm('¿Deseas convertir esta cotización en una factura formal?')) return;
    try {
      await api.sales.convertQuoteToInvoice(quoteId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al convertir cotización');
    }
  };

  const handleMarkAsPaid = async (saleId: string) => {
    try {
      await api.sales.updateStatus(saleId, 'PAID');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al marcar como pagada');
    }
  };

  const handleCancelInvoice = async (saleId: string) => {
    if (!confirm('¿Deseas anular y cancelar esta factura? El stock de los productos será devuelto automáticamente al inventario.')) return;
    try {
      await api.sales.updateStatus(saleId, 'CANCELLED');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la factura');
    }
  };

  const handleCancelConsignment = async (saleId: string) => {
    if (!confirm('¿Deseas anular esta consignación? El stock de los productos será devuelto automáticamente al inventario.')) return;
    try {
      await api.sales.updateStatus(saleId, 'CANCELLED');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al anular la consignación');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este documento?')) return;
    try {
      await api.sales.delete(id);
      setSales(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar documento');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const filteredSales = sales.filter(s => {
    const matchesType = typeFilter === 'ALL' || s.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch =
      s.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.company && s.customer.company.toLowerCase().includes(search.toLowerCase())) ||
      (s.user?.name && s.user.name.toLowerCase().includes(search.toLowerCase()));

    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Seller scope banner if seller */}
      {isSeller && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Modo Vendedor:</strong> Estás visualizando exclusivamente tus cotizaciones y facturas personales.
            </span>
          </div>
          <span className="font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs hidden sm:inline">
            {filteredSales.length} comprobantes
          </span>
        </div>
      )}

      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar comprobante, cliente o vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Type, Status & Seller Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
          {/* Type tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'QUOTE', label: 'Cotizaciones' },
              { id: 'INVOICE', label: 'Facturas' },
              { id: 'CONSIGNMENT', label: 'Consignaciones' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  typeFilter === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="SENT">Enviada</option>
            <option value="PAID">Pagada</option>
            <option value="ACCEPTED">Aceptada</option>
            <option value="REJECTED">Rechazada</option>
          </select>

          {/* Seller Filter (Only for Admin) */}
          {isAdmin && sellers.length > 0 && (
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="bg-indigo-50/50 border border-indigo-200 text-xs sm:text-sm rounded-xl px-3 py-2 text-indigo-900 font-medium focus:outline-none"
            >
              <option value="ALL">Todos los vendedores</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  Vendedor: {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => handleOpenCreateModal('QUOTE')}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Cotización
          </button>
          <button
            onClick={() => handleOpenCreateModal('CONSIGNMENT')}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
            title="Registrar entrega de mercadería en consignación (egresa inventario sin cobro inmediato)"
          >
            <Package className="h-4 w-4" />
            Consignación
          </button>
          <button
            onClick={() => handleOpenCreateModal('INVOICE')}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva Factura
          </button>
        </div>
      </div>

      {/* Sales Orders List: Mobile Cards + Desktop Table */}
      {/* Mobile Card List (< lg) */}
      <div className="block lg:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-6">
            No se encontraron cotizaciones ni facturas registradas.
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
            >
              {/* Header: Order Number & Type + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      sale.type === 'INVOICE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : sale.type === 'CONSIGNMENT'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-indigo-50 text-brand-700'
                    }`}
                  >
                    {sale.type === 'INVOICE' ? (
                      <Receipt className="h-4 w-4" />
                    ) : sale.type === 'CONSIGNMENT' ? (
                      <Package className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => {
                        setViewingSale(sale);
                        setIsViewModalOpen(true);
                      }}
                      className="font-mono font-bold text-slate-900 hover:text-brand-600 text-left text-sm truncate block"
                    >
                      {sale.orderNumber}
                    </button>
                    <p className="text-xs text-slate-400">
                      {sale.type === 'INVOICE' ? 'Factura' : sale.type === 'CONSIGNMENT' ? 'Consignación' : 'Cotización'} · {new Date(sale.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Badge variant="sale" value={sale.status} />
                </div>
              </div>

              {/* Customer & Seller info + Channel & Commission */}
              <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-800">
                  <span className="font-semibold truncate">{sale.customer?.name}</span>
                  <span className="text-slate-400 text-[11px] truncate">{sale.customer?.company || 'Particular'}</span>
                </div>

                <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1.5 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sale.customerId === CONSUMIDOR_FINAL_CUSTOMER_ID ? (
                      <span className="inline-flex items-center text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 px-2 py-0.5 rounded-md">
                        Consumidor Final
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md">
                        Revendedor
                      </span>
                    )}

                    {sale.customerId !== CONSUMIDOR_FINAL_CUSTOMER_ID && sale.type === 'INVOICE' && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                          sale.commission?.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sale.commission?.status === 'CANCELLED'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                        title={`Comisión del 10%: ${formatCurrency(sale.commission?.commissionAmount ?? (sale.subtotal * RESELLER_COMMISSION_RATE))} (${
                          sale.commission?.status === 'PAID' ? 'Pagada' : sale.commission?.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'
                        })`}
                      >
                        <DollarSign className="h-2.5 w-2.5" />
                        Comisión: {formatCurrency(sale.commission?.commissionAmount ?? (sale.subtotal * RESELLER_COMMISSION_RATE))}
                        <span className="font-bold">
                          {sale.commission?.status === 'PAID' ? '· Pagada' : sale.commission?.status === 'CANCELLED' ? '· Cancelada' : '· Pend.'}
                        </span>
                      </span>
                    )}
                  </div>

                  {isAdmin && sale.user && (
                    <p className="text-slate-500 text-[11px] ml-auto">Vendedor: {sale.user.name}</p>
                  )}
                </div>
              </div>

              {/* Total & Due date */}
              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                <div>
                  <p className="text-[11px] text-slate-400">
                    {sale.dueDate ? `Vence: ${new Date(sale.dueDate).toLocaleDateString()}` : 'Sin vencimiento'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(sale.total)}
                  </span>
                  {sale.taxAmount > 0 ? (
                    <span className="text-[11px] text-slate-400 ml-1 font-mono">
                      (IVA {Math.round(sale.taxRate * 100)}%: {formatCurrency(sale.taxAmount)})
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 ml-1 font-mono">
                      (Sin IVA)
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setViewingSale(sale);
                    setIsViewModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Ver / Imprimir
                </button>

                {sale.type === 'QUOTE' && sale.status !== 'ACCEPTED' && (
                  <button
                    onClick={() => handleConvertQuote(sale.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-brand-700 hover:bg-indigo-100 transition-colors"
                    title="Convertir a Factura"
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5" />
                    Facturar
                  </button>
                )}

                {sale.type === 'INVOICE' && sale.status !== 'PAID' && sale.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleMarkAsPaid(sale.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    title="Marcar como Cobrada"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Cobrada
                  </button>
                )}

                {sale.type === 'INVOICE' && sale.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelInvoice(sale.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                    title="Anular Factura y devolver stock"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Anular
                  </button>
                )}

                {sale.type === 'CONSIGNMENT' && sale.status !== 'PAID' && sale.status !== 'CANCELLED' && (
                  <>
                    <button
                      onClick={() => handleMarkAsPaid(sale.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Liquidar o registrar cobro de la consignación"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Cobrada
                    </button>
                    <button
                      onClick={() => handleCancelConsignment(sale.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                      title="Anular consignación y devolver mercadería al inventario"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Anular
                    </button>
                  </>
                )}

                {sale.type === 'QUOTE' && isAdmin && (
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Eliminar documento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Sales Orders Table (>= lg) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">Documento</th>
                <th className="py-3 px-6">Cliente</th>
                {isAdmin && <th className="py-3 px-6">Vendedor</th>}
                <th className="py-3 px-6">Fecha / Vencimiento</th>
                <th className="py-3 px-6">Total / IVA</th>
                <th className="py-3 px-6">Estado</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400">
                    No se encontraron cotizaciones ni facturas registradas.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Document & Type */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
                            sale.type === 'INVOICE'
                              ? 'bg-emerald-50 text-emerald-600'
                              : sale.type === 'CONSIGNMENT'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-indigo-50 text-brand-600'
                          }`}
                        >
                          {sale.type === 'INVOICE' ? (
                            <Receipt className="h-4 w-4" />
                          ) : sale.type === 'CONSIGNMENT' ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setViewingSale(sale);
                              setIsViewModalOpen(true);
                            }}
                            className="font-mono font-bold text-slate-900 hover:text-brand-600 transition-colors text-xs"
                          >
                            {sale.orderNumber}
                          </button>
                          <p className="text-[11px] text-slate-400">
                            {sale.type === 'INVOICE' ? 'Factura' : sale.type === 'CONSIGNMENT' ? 'Consignación' : 'Cotización'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Customer & Channel */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 text-xs">{sale.customer?.name}</p>
                        {sale.customerId === CONSUMIDOR_FINAL_CUSTOMER_ID ? (
                          <span className="inline-flex items-center text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 px-2 py-0.5 rounded-md shrink-0">
                            Consumidor Final
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md shrink-0">
                            Revendedor
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-slate-400">
                          {sale.customer?.company || 'Particular'}
                        </p>
                        {sale.customerId !== CONSUMIDOR_FINAL_CUSTOMER_ID && sale.type === 'INVOICE' && (
                          <span
                            className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              sale.commission?.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : sale.commission?.status === 'CANCELLED'
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                            title={`Comisión de revendedor (10% sobre costo): ${formatCurrency(sale.commission?.commissionAmount ?? (sale.subtotal * RESELLER_COMMISSION_RATE))} (${
                              sale.commission?.status === 'PAID' ? 'Liquidada / Pagada' : sale.commission?.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente de cobro'
                            })`}
                          >
                            <DollarSign className="h-2.5 w-2.5" />
                            {formatCurrency(sale.commission?.commissionAmount ?? (sale.subtotal * RESELLER_COMMISSION_RATE))}
                            <span className="font-semibold text-[9px]">
                              ({sale.commission?.status === 'PAID' ? 'Pagada' : sale.commission?.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'})
                            </span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Seller */}
                    {isAdmin && (
                      <td className="py-4 px-6">
                        <span className="text-xs text-slate-600 font-medium">
                          {sale.user?.name || '-'}
                        </span>
                      </td>
                    )}

                    {/* Dates */}
                    <td className="py-4 px-6">
                      <p className="text-xs text-slate-700">
                        {new Date(sale.issueDate).toLocaleDateString()}
                      </p>
                      {sale.dueDate && (
                        <p className="text-[11px] text-slate-400">
                          Vence: {new Date(sale.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>

                    {/* Total / IVA */}
                    <td className="py-4 px-6">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(sale.total)}
                      </p>
                      {sale.taxAmount > 0 ? (
                        <p className="text-[11px] text-slate-400 font-mono">
                          IVA ({Math.round(sale.taxRate * 100)}%): {formatCurrency(sale.taxAmount)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-mono">
                          Sin IVA
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <Badge variant="sale" value={sale.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setViewingSale(sale);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Ver / Imprimir Comprobante"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {sale.type === 'QUOTE' && sale.status !== 'ACCEPTED' && (
                          <button
                            onClick={() => handleConvertQuote(sale.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="Convertir a Factura"
                          >
                            <ArrowRightCircle className="h-4 w-4" />
                          </button>
                        )}

                        {sale.type === 'INVOICE' && sale.status !== 'PAID' && sale.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleMarkAsPaid(sale.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                            title="Marcar como Pagada"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        {sale.type === 'INVOICE' && sale.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelInvoice(sale.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                            title="Anular Factura y devolver stock"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        {sale.type === 'CONSIGNMENT' && sale.status !== 'PAID' && sale.status !== 'CANCELLED' && (
                          <>
                            <button
                              onClick={() => handleMarkAsPaid(sale.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                              title="Liquidar / Marcar como Cobrada"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelConsignment(sale.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                              title="Anular Consignación y devolver stock"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {sale.type === 'QUOTE' && isAdmin && (
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale / Quote Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          saleType === 'QUOTE'
            ? 'Nueva Cotización / Presupuesto'
            : saleType === 'CONSIGNMENT'
            ? 'Nuevo Remito de Mercadería en Consignación'
            : 'Emitir Nueva Factura'
        }
        description={
          saleType === 'CONSIGNMENT'
            ? 'La mercadería se descontará inmediatamente del inventario, sin registrar cobro en el momento.'
            : 'Selecciona el cliente y detalla los conceptos y cantidades.'
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateSale} className="space-y-6">
          {saleType === 'CONSIGNMENT' && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-900 p-3.5 rounded-xl flex items-start gap-3 text-xs">
              <Package className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Movimiento de Inventario en Consignación</p>
                <p className="text-amber-800 text-[12px] mt-0.5 leading-relaxed">
                  Los productos detallados <strong>saldrán automáticamente del stock disponible</strong>. Este remito de consignación no se computa como cobrado en caja hasta que el cliente rinda y pague la mercadería, o puede anularse para reintegrar el stock.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={saleType}
                onChange={(e) => {
                  const nextType = e.target.value as SaleType;
                  setSaleType(nextType);
                  if (nextType !== 'INVOICE') setUseCostPrice(false);
                  if (nextType === 'CONSIGNMENT' && (!notes || notes === 'Condiciones de pago: Transferencia a 30 días.')) {
                    setNotes('Mercadería entregada en consignación. Sujeta a liquidación o devolución.');
                  } else if (nextType !== 'CONSIGNMENT' && notes === 'Mercadería entregada en consignación. Sujeta a liquidación o devolución.') {
                    setNotes('Condiciones de pago: Transferencia a 30 días.');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="QUOTE">Cotización (Presupuesto)</option>
                <option value="INVOICE">Factura Comercial</option>
                <option value="CONSIGNMENT">Mercadería en Consignación (Remito)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Cliente *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} {c.id === CONSUMIDOR_FINAL_CUSTOMER_ID ? '· [Consumidor Final]' : '· [Revendedor]'}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Vendedor Responsable
                </label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/30 text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={user?.id || ''}>Yo ({user?.name})</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            )}
          </div>

          {/* Informative Channel Banner */}
          {isReseller ? (
            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-900 p-3.5 rounded-xl flex items-start gap-3 text-xs">
              <DollarSign className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-bold text-purple-950">Venta a Revendedor (Canal Mayorista)</p>
                  <span className="font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs">
                    Comisión del 10%: {formatCurrency(estimatedCommission)}
                  </span>
                </div>
                <p className="text-purple-800 text-[12px] mt-0.5 leading-relaxed">
                  Precios fijados automáticamente a <strong>precio de costo</strong>. Descuentos deshabilitados (0%).
                  {saleType === 'INVOICE'
                    ? ` Comisión del ${Math.round(RESELLER_COMMISSION_RATE * 100)}% calculada automáticamente para el vendedor (${formatCurrency(estimatedCommission)}).`
                    : ` Al facturar esta cotización se generará automáticamente la comisión del ${Math.round(RESELLER_COMMISSION_RATE * 100)}% (${formatCurrency(estimatedCommission)}).`}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-sky-500/10 border border-sky-500/20 text-sky-900 p-3.5 rounded-xl flex items-start gap-3 text-xs">
              <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sky-950">Venta a Consumidor Final</p>
                <p className="text-sky-800 text-[12px] mt-0.5 leading-relaxed">
                  Precios a <strong>valor de lista</strong> (con margen comercial). No genera comisión de revendedor.
                </p>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {!isReseller && saleType === 'INVOICE' && (
                <div className="sm:col-span-2 flex items-end">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 w-full">
                    <input
                      type="checkbox"
                      checked={useCostPrice}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setUseCostPrice(enabled);
                        if (enabled) {
                          setItems(currentItems => currentItems.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            return product
                              ? { ...item, unitPrice: product.cost ?? 0, discount: 0 }
                              : { ...item, discount: 0 };
                          }));
                        } else {
                          setItems(currentItems => currentItems.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            return product
                              ? { ...item, unitPrice: product.unitPrice }
                              : item;
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                    />
                    <span>
                      <span className="block text-xs font-bold text-amber-900">Venta al costo (Excepción Admin)</span>
                      <span className="block text-[11px] text-amber-700">Usa el costo registrado para consumidor final; sin descuentos.</span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Line Items Table Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Líneas de Detalle / Ítems *
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Ítem
              </button>
            </div>

            <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
              {items.map((item, index) => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                const discountVal = item.discount ? (lineTotal * item.discount) / 100 : 0;
                const rowTotal = lineTotal - discountVal;

                return (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Catálogo</label>
                      <select
                        value={item.productId || ''}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                      >
                        <option value="" disabled={isReseller || useCostPrice}>Personalizado</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} {isReseller ? `(Costo: $${p.cost ?? 0})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Descripción *</label>
                      <input
                        type="text"
                        required
                        placeholder="Descripción del concepto"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">P. Unit ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        disabled={isReseller || useCostPrice}
                        title={isReseller ? 'Fijado al precio de costo del producto para revendedores' : undefined}
                        className={`w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none ${
                          isReseller || useCostPrice ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-medium' : ''
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Desc %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount || 0}
                        onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                        disabled={isReseller || useCostPrice}
                        title={isReseller ? 'Descuentos no permitidos en ventas a revendedores' : undefined}
                        className={`w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none ${
                          isReseller || useCostPrice ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-medium' : ''
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-between gap-1">
                      <div className="text-right flex-1 font-mono font-bold text-xs text-slate-800">
                        ${rowTotal.toFixed(0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="text-slate-300 hover:text-rose-500 disabled:opacity-30 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calculations Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              {/* Impuestos / IVA Configuration */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-700">Aplicar IVA a la venta</span>
                  </label>
                  {applyTax && (
                    <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                      {taxRatePercent}%
                    </span>
                  )}
                </div>

                {applyTax && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center gap-2">
                    <label className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                      Alícuota IVA:
                    </label>
                    <select
                      value={[21, 10.5, 27].includes(taxRatePercent) ? taxRatePercent : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setTaxRatePercent(Number(val));
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 flex-1"
                    >
                      <option value={21}>21% (IVA General)</option>
                      <option value={10.5}>10.5% (IVA Reducido)</option>
                      <option value={27}>27% (IVA Servicios/Especial)</option>
                      <option value="custom">Personalizado...</option>
                    </select>

                    {![21, 10.5, 27].includes(taxRatePercent) && (
                      <div className="flex items-center gap-1 w-20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={taxRatePercent}
                          onChange={(e) => setTaxRatePercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notas y Términos
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {isReseller && (
                <div className="flex justify-between text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg font-medium text-xs border border-purple-100">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Comisión Estimada Vendedor (10%):
                  </span>
                  <span className="font-mono font-bold text-purple-900">{formatCurrency(estimatedCommission)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>IVA {applyTax ? `(${taxRatePercent}%)` : '(Sin IVA)'}:</span>
                <span className="font-mono font-semibold">{applyTax ? formatCurrency(taxAmount) : '$0'}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total a Pagar:</span>
                <span className="font-mono text-brand-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting
                ? 'Generando...'
                : saleType === 'QUOTE'
                ? 'Crear Cotización'
                : saleType === 'CONSIGNMENT'
                ? 'Emitir Consignación'
                : 'Emitir Factura'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View / Print Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={
          viewingSale?.type === 'QUOTE'
            ? `Cotización ${viewingSale?.orderNumber}`
            : viewingSale?.type === 'CONSIGNMENT'
            ? `Remito de Consignación ${viewingSale?.orderNumber}`
            : `Factura ${viewingSale?.orderNumber}`
        }
        maxWidth="2xl"
      >
        {viewingSale && (
          <div className="space-y-6 print:p-0">
            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h2 className="font-extrabold text-xl text-slate-900">CRM Pro S.A.</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Av. Libertador 1500, Oficina 401</p>
                <p className="text-xs text-slate-500">contacto@crmpro.com</p>
              </div>

              <div className="text-right">
                <Badge variant="sale" value={viewingSale.status} />
                <p className="text-sm font-mono font-bold text-slate-900 mt-2">{viewingSale.orderNumber}</p>
                <p className="text-xs text-slate-500">
                  {viewingSale.type === 'CONSIGNMENT' ? 'Tipo: Remito de Consignación' : `Emisión: ${new Date(viewingSale.issueDate).toLocaleDateString()}`}
                </p>
                {viewingSale.user && (
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Asesor: {viewingSale.user.name}
                  </p>
                )}
              </div>
            </div>

            {/* Consignment Banner */}
            {viewingSale.type === 'CONSIGNMENT' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="font-bold">Comprobante de Entrega en Consignación</span>
                </div>
                <span className="text-[11px] text-amber-700 font-medium">Mercadería egresada de inventario</span>
              </div>
            )}

            {/* Client Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {viewingSale.type === 'CONSIGNMENT' ? 'Consignatario / Destinatario:' : 'Facturar a:'}
                </p>
                <p className="font-bold text-slate-900 text-sm">{viewingSale.customer?.name}</p>
                <p className="text-xs text-slate-600">{viewingSale.customer?.company || 'Particular'}</p>
                <p className="text-xs text-slate-500">{viewingSale.customer?.email}</p>
              </div>

              <div className="sm:text-right space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Canal Comercial:
                </span>
                {viewingSale.customerId === CONSUMIDOR_FINAL_CUSTOMER_ID ? (
                  <span className="inline-flex items-center text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-lg">
                    Consumidor Final
                  </span>
                ) : (
                  <div className="space-y-1">
                    <span className="inline-flex items-center text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
                      Revendedor (Precio Costo)
                    </span>
                    {viewingSale.type === 'INVOICE' && (
                      <p className="text-[11px] text-purple-900 font-medium">
                        Comisión (10%): {formatCurrency(viewingSale.commission?.commissionAmount ?? (viewingSale.subtotal * RESELLER_COMMISSION_RATE))}
                        <span className={`ml-1 font-bold ${viewingSale.commission?.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          ({viewingSale.commission?.status === 'PAID' ? 'Liquidada' : viewingSale.commission?.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'})
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2">Descripción</th>
                  <th className="py-2 text-center">Cant.</th>
                  <th className="py-2 text-right">P. Unit</th>
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
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(viewingSale.subtotal)}</span>
                </div>
                {viewingSale.customerId !== CONSUMIDOR_FINAL_CUSTOMER_ID && viewingSale.type === 'INVOICE' && (
                  <div className="flex justify-between text-purple-700 bg-purple-50 px-2 py-1 rounded font-medium text-[11px] border border-purple-100">
                    <span>Comisión Vendedor (10%):</span>
                    <span className="font-mono font-bold text-purple-900">
                      {formatCurrency(viewingSale.commission?.commissionAmount ?? (viewingSale.subtotal * RESELLER_COMMISSION_RATE))}
                    </span>
                  </div>
                )}
                {viewingSale.taxAmount > 0 ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IVA ({Math.round(viewingSale.taxRate * 100)}%):</span>
                    <span className="font-mono font-semibold">{formatCurrency(viewingSale.taxAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-400">
                    <span>IVA:</span>
                    <span className="font-mono font-semibold">Sin IVA / Exento</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>{viewingSale.type === 'CONSIGNMENT' ? 'Total Valor Consignado:' : 'Total Documento:'}</span>
                  <span className="font-mono text-brand-600">{formatCurrency(viewingSale.total)}</span>
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
                Imprimir / PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
