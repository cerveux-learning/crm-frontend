import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  MapPin,
  Trash2,
  Edit2,
  ExternalLink,
  Tag,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import type { Customer, CustomerStatus, CreateCustomerInput, ActivityType } from '../types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'LEAD',
    address: '',
    tags: [],
    notes: '',
  });
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<(Customer & { deals: any[]; sales: any[]; activities: any[] }) | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Activity in Detail Modal
  const [activityForm, setActivityForm] = useState<{ type: ActivityType; title: string; description: string }>({
    type: 'NOTE',
    title: '',
    description: '',
  });
  const [submittingActivity, setSubmittingActivity] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.customers.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      status: 'LEAD',
      address: '',
      tags: [],
      notes: '',
    });
    setTagsInput('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      company: c.company || '',
      position: c.position || '',
      status: c.status,
      address: c.address || '',
      tags: c.tags || [],
      notes: c.notes || '',
    });
    setTagsInput(c.tags ? c.tags.join(', ') : '');
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = async (customerId: string) => {
    try {
      setIsDetailModalOpen(true);
      setLoadingDetail(true);
      const detail = await api.customers.getById(customerId);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error('Error loading customer detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const tagsArray = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        ...form,
        tags: tagsArray,
      };

      if (editingCustomer) {
        await api.customers.update(editingCustomer.id, payload);
      } else {
        await api.customers.create(payload);
      }

      setIsFormModalOpen(false);
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Error al guardar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cliente? Se eliminarán también sus oportunidades asociadas.')) return;
    try {
      await api.customers.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (selectedCustomer?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar cliente');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setSubmittingActivity(true);
      await api.customers.addActivity(selectedCustomer.id, activityForm);
      setActivityForm({ type: 'NOTE', title: '', description: '' });
      // Refresh detail
      const refreshed = await api.customers.getById(selectedCustomer.id);
      setSelectedCustomer(refreshed);
    } catch (err: any) {
      alert(err.message || 'Error al registrar actividad');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
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
            placeholder="Buscar por nombre, email, empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'CUSTOMER', label: 'Clientes' },
            { id: 'PROSPECT', label: 'Prospectos' },
            { id: 'LEAD', label: 'Leads' },
            { id: 'INACTIVE', label: 'Inactivos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreateModal}
          className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nuevo Contacto
        </button>
      </div>

      {/* Customers List: Mobile Cards + Desktop Table */}
      {/* Mobile Card List (< lg) */}
      <div className="block lg:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-6">
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
            >
              {/* Header: Name + Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {customer.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => handleOpenDetail(customer.id)}
                      className="font-bold text-slate-900 hover:text-brand-600 text-left text-sm truncate block"
                    >
                      {customer.name}
                    </button>
                    <p className="text-xs text-slate-400 truncate">{customer.company || 'Particular'}{customer.position ? ` · ${customer.position}` : ''}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Badge variant="customer" value={customer.status} />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 text-slate-700 hover:text-brand-600 truncate"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </a>
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 text-slate-700 hover:text-brand-600"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{customer.phone}</span>
                  </a>
                )}
              </div>

              {/* Tags & Counts */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
                <div className="flex flex-wrap gap-1 min-w-0">
                  {customer.tags && customer.tags.length > 0 ? (
                    customer.tags.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium truncate"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400">Sin etiquetas</span>
                  )}
                </div>

                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  {customer._count?.deals || 0} tratos · {customer._count?.sales || 0} ventas
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenDetail(customer.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-brand-700 hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver Ficha
                </button>
                <button
                  onClick={() => handleOpenEditModal(customer)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Cliente / Contacto</th>
                <th className="py-3.5 px-6">Empresa & Cargo</th>
                <th className="py-3.5 px-6">Contacto</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6">Etiquetas</th>
                <th className="py-3.5 px-6 text-center">Tratos / Ventas</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Name & Initials */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => handleOpenDetail(customer.id)}
                            className="font-bold text-slate-900 hover:text-brand-600 text-left transition-colors"
                          >
                            {customer.name}
                          </button>
                          <p className="text-xs text-slate-400">{customer.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800">{customer.company || '—'}</p>
                      <p className="text-xs text-slate-400">{customer.position || '—'}</p>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <Badge variant="customer" value={customer.status} />
                    </td>

                    {/* Tags */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {customer.tags && customer.tags.length > 0 ? (
                          customer.tags.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Counters */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span>{customer._count?.deals || 0} tratos</span>
                        <span>·</span>
                        <span>{customer._count?.sales || 0} ventas</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(customer.id)}
                          title="Ver Ficha Completa"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(customer)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal (Create / Edit) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente / Prospecto'}
        description="Ingresa la información básica y de contacto."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Laura Martínez"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                placeholder="laura@empresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                placeholder="+34 600 000 000"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="LEAD">Lead (Potencial)</option>
                <option value="PROSPECT">Prospecto (En evaluación)</option>
                <option value="CUSTOMER">Cliente Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Empresa
              </label>
              <input
                type="text"
                placeholder="Nombre de la empresa"
                value={form.company || ''}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Cargo / Posición
              </label>
              <input
                type="text"
                placeholder="Ej: Gerente de Compras"
                value={form.position || ''}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Dirección
            </label>
            <input
              type="text"
              placeholder="Calle, Ciudad, Código Postal"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Etiquetas (separadas por comas)
            </label>
            <input
              type="text"
              placeholder="B2B, VIP, Retail, Prioritario"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notas Internas
            </label>
            <textarea
              rows={2}
              placeholder="Comentarios clave sobre este contacto..."
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : editingCustomer ? 'Actualizar' : 'Crear Contacto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Drawer Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCustomer?.name || 'Ficha del Cliente'}
        description={selectedCustomer?.company ? `${selectedCustomer.company} · ${selectedCustomer.position || ''}` : 'Detalles completos e historial'}
        maxWidth="4xl"
      >
        {loadingDetail || !selectedCustomer ? (
          <div className="py-12 text-center">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-semibold uppercase">Email & Teléfono</p>
                <p className="text-sm font-medium text-slate-800">{selectedCustomer.email}</p>
                <p className="text-xs text-slate-500">{selectedCustomer.phone || 'Sin teléfono'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-semibold uppercase">Ubicación</p>
                <p className="text-sm text-slate-700">{selectedCustomer.address || 'Sin dirección registrada'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-semibold uppercase">Estado del Cliente</p>
                <Badge variant="customer" value={selectedCustomer.status} />
              </div>
            </div>

            {/* Grid 2 Cols: Left = Deals & Sales / Right = Activity Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Deals & Sales */}
              <div className="space-y-5">
                {/* Linked Deals */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
                    <span>Oportunidades en Pipeline ({selectedCustomer.deals?.length || 0})</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.deals?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center">
                        Sin oportunidades registradas
                      </p>
                    ) : (
                      selectedCustomer.deals?.map((deal) => (
                        <div key={deal.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{deal.title}</p>
                            <p className="text-slate-500 font-mono font-semibold text-brand-600">${deal.value.toLocaleString()}</p>
                          </div>
                          <Badge variant="stage" value={deal.stage} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Linked Invoices & Quotes */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-3">
                    Documentos de Venta ({selectedCustomer.sales?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.sales?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center">
                        Sin ventas o cotizaciones
                      </p>
                    ) : (
                      selectedCustomer.sales?.map((sale) => (
                        <div key={sale.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900 font-mono">{sale.orderNumber}</p>
                            <p className="text-slate-500">${sale.total.toLocaleString()} · {sale.type === 'QUOTE' ? 'Cotización' : 'Factura'}</p>
                          </div>
                          <Badge variant="sale" value={sale.status} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Interaction History & Add Activity */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Historial de Interacciones</h4>

                {/* Add Note / Activity Form */}
                <form onSubmit={handleAddActivity} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex gap-2">
                    <select
                      value={activityForm.type}
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none"
                    >
                      <option value="NOTE">Nota</option>
                      <option value="CALL">Llamada</option>
                      <option value="MEETING">Reunión</option>
                      <option value="EMAIL">Email</option>
                      <option value="TASK">Tarea</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Título de la interacción..."
                      value={activityForm.title}
                      onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                      className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Descripción o resumen..."
                    value={activityForm.description}
                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingActivity}
                      className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      Registrar
                    </button>
                  </div>
                </form>

                {/* Activities Timeline */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedCustomer.activities?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No hay interacciones registradas.</p>
                  ) : (
                    selectedCustomer.activities?.map((act) => (
                      <div key={act.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{act.title}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(act.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-xs text-slate-600">{act.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
