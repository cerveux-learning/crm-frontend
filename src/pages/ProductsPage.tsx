import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Package,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  PackagePlus,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Calendar,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import type { Product, ProductCategory, CreateProductInput, StockMovement } from '../types';

export const ProductsPage: React.FC = () => {
  const { isViewer } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State (Create / Edit general info)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductInput>({
    code: '',
    name: '',
    description: '',
    category: 'PRODUCT',
    unitPrice: 100,
    cost: 50,
    stock: 0,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Restock / Inflow Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [stockNotes, setStockNotes] = useState<string>('');
  const [submittingStock, setSubmittingStock] = useState(false);

  // History Movements Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (isViewer) return;
    setEditingProduct(null);
    setForm({
      code: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      description: '',
      category: 'PRODUCT',
      unitPrice: 100,
      cost: 50,
      stock: 0,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    if (isViewer) return;
    setEditingProduct(p);
    setForm({
      code: p.code,
      name: p.name,
      description: p.description || '',
      category: p.category,
      unitPrice: p.unitPrice,
      cost: p.cost || 0,
      stock: p.stock,
      active: p.active,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        unitPrice: Number(form.unitPrice),
        cost: form.cost ? Number(form.cost) : undefined,
        stock: form.stock !== undefined ? Number(form.stock) : 0,
      };

      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
      } else {
        await api.products.create(payload);
      }

      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error al guardar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (isViewer) return;
    if (!confirm('¿Seguro que deseas eliminar este producto/servicio del catálogo?')) return;
    try {
      await api.products.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
    }
  };

  // Stock Inflow Modal handlers
  const handleOpenStockModal = (product: Product) => {
    if (isViewer) return;
    setStockProduct(product);
    setStockQuantity(1);
    setStockNotes('');
    setIsStockModalOpen(true);
  };

  const handleSaveStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !stockProduct) return;

    if (!stockQuantity || stockQuantity <= 0) {
      alert('La cantidad a ingresar es requerida y debe ser mayor a 0.');
      return;
    }

    try {
      setSubmittingStock(true);
      await api.stock.createEntry({
        productId: stockProduct.id,
        quantity: Number(stockQuantity),
        notes: stockNotes.trim() ? stockNotes.trim() : null,
      });

      setIsStockModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error al registrar el ingreso de mercadería');
    } finally {
      setSubmittingStock(false);
    }
  };

  // History Movements Modal handlers
  const handleOpenHistoryModal = async (product: Product) => {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
    try {
      setLoadingMovements(true);
      const data = await api.stock.getMovements({ productId: product.id });
      setMovements(data);
    } catch (err) {
      console.error('Error loading movements:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código SKU, nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PRODUCT', label: 'Productos Físicos' },
            { id: 'SERVICE', label: 'Servicios' },
            { id: 'SUBSCRIPTION', label: 'Suscripciones' },
            { id: 'OTHER', label: 'Otros' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        {!isViewer && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ítem
          </button>
        )}
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-100 text-center text-slate-400">
            No se encontraron productos o servicios registrados.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const margin = product.cost && product.unitPrice > 0
              ? Math.round(((product.unitPrice - product.cost) / product.unitPrice) * 100)
              : null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {product.code}
                    </span>
                    <Badge variant="category" value={product.category} />
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug mb-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {product.description || 'Sin descripción adicional.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">Precio Unitario</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(product.unitPrice)}
                      </p>
                    </div>

                    {margin !== null && (
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase">Margen Est.</p>
                        <p className="text-xs font-bold text-emerald-600">{margin}%</p>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">Stock Actual</p>
                      <span className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                        product.stock > 10
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : product.stock > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        {product.stock} u.
                      </span>
                    </div>
                  </div>

                  {/* Stock Entry & History Action Bar */}
                  <div className={`flex items-center ${isViewer ? 'justify-end' : 'justify-between'} gap-2 pt-2 border-t border-slate-50`}>
                    {!isViewer && (
                      <button
                        onClick={() => handleOpenStockModal(product)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors border border-emerald-200/60"
                        title="Registrar ingreso de mercadería"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Ingreso de Mercadería
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenHistoryModal(product)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-brand-700 bg-slate-100 hover:bg-slate-200/80 font-medium text-xs transition-colors"
                      title="Ver historial de ingresos y salidas de stock"
                    >
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      Historial
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs">
                      {product.active ? (
                        <span className="inline-flex items-center text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-400 font-medium">
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Inactivo
                        </span>
                      )}
                    </div>

                    {!isViewer && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Editar Datos Generales"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Ítem del Catálogo' : 'Nuevo Producto / Servicio'}
        description={
          editingProduct
            ? 'Modifica los datos comerciales del producto. El stock se controla exclusivamente por movimientos de ingreso.'
            : 'Define las características, categoría y precio unitario.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Código / SKU *
              </label>
              <input
                type="text"
                required
                placeholder="SRV-01 o PRD-101"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Categoría *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="PRODUCT">Producto Físico</option>
                <option value="SERVICE">Servicio</option>
                <option value="SUBSCRIPTION">Suscripción Recurrente</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nombre del Producto / Servicio *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Terminal POS o Licencia ERP"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Descripción Comercial
            </label>
            <textarea
              rows={2}
              placeholder="Detalle de las características o alcance..."
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Precio Unitario ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Costo Unitario ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost || 0}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {!editingProduct && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Stock Inicial (Opcional)
              </label>
              <input
                type="number"
                min="0"
                value={form.stock || 0}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Si defines stock inicial mayor a 0, se registrará un movimiento automático de ingreso.
              </p>
            </div>
          )}

          {editingProduct && (
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>
                <strong>Stock Actual:</strong> {editingProduct.stock} unidades.
              </span>
              <span className="text-[11px] text-amber-700">
                Para modificar el stock usa el botón "Ingreso de Mercadería".
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="product-active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="product-active" className="text-sm font-medium text-slate-700">
              Disponible en cotizaciones y ventas activas
            </label>
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
              {submitting ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear Ítem'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Restock / Ingreso de Mercadería Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Ingreso de Mercadería"
        description={`Registra la entrada de nuevas unidades para ${stockProduct?.name || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStockEntry} className="space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">{stockProduct?.name}</p>
              <p className="text-[11px] font-mono text-slate-500">SKU: {stockProduct?.code}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Stock Actual</p>
              <p className="text-sm font-bold text-slate-800">{stockProduct?.stock || 0} u.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Cantidad de Productos a Ingresar *
            </label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Ej: 50"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Campo obligatorio. Nuevo stock estimado:{' '}
              <strong className="text-emerald-600">
                {(stockProduct?.stock || 0) + (Number(stockQuantity) || 0)} unidades
              </strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              rows={3}
              value={stockNotes}
              onChange={(e) => setStockNotes(e.target.value)}
              placeholder="Detalles del ingreso: proveedor, número de remito, motivo de recepción..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Las observaciones quedarán registradas en la tabla de control de movimientos junto a la fecha y hora exacta.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingStock}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <PackagePlus className="h-4 w-4" />
              {submittingStock ? 'Registrando...' : 'Confirmar Ingreso'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History of Stock Movements Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Historial de Movimientos: ${historyProduct?.name || ''}`}
        description="Control de ingresos y salidas con fecha, horario y comprobantes asociados."
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 mr-2">
                {historyProduct?.code}
              </span>
              <span className="text-sm font-bold text-slate-900">{historyProduct?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-2">Stock Disponible:</span>
              <span className="text-sm font-extrabold text-slate-900">{historyProduct?.stock || 0} u.</span>
            </div>
          </div>

          {loadingMovements ? (
            <div className="py-12 text-center text-slate-400">
              Cargando historial de movimientos...
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              No hay movimientos registrados para este producto todavía.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Fecha y Hora</th>
                    <th className="py-2.5 px-4">Tipo</th>
                    <th className="py-2.5 px-4 text-center">Cantidad</th>
                    <th className="py-2.5 px-4">Venta / Factura</th>
                    <th className="py-2.5 px-4">Observaciones</th>
                    <th className="py-2.5 px-4">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {movements.map((mov) => {
                    const dateObj = new Date(mov.createdAt);
                    const isIncome = mov.type === 'IN';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{dateObj.toLocaleDateString('es-AR')}</span>
                            <Clock className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" />
                            <span>{dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isIncome ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <ArrowDownLeft className="h-3 w-3" />
                              Ingreso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <ArrowUpRight className="h-3 w-3" />
                              Salida (Venta)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-bold whitespace-nowrap">
                          <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                            {isIncome ? `+${mov.quantity}` : `-${mov.quantity}`} u.
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {mov.saleOrder ? (
                            <span className="font-mono font-bold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                              {mov.saleOrder.orderNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={mov.notes || ''}>
                          {mov.notes || '-'}
                        </td>

                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {mov.user?.name || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
