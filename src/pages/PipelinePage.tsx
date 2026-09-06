import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  Building,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Filter,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import type { Deal, Customer, DealStage, CreateDealInput } from '../types';

const STAGES: { id: DealStage; label: string; bgHeader: string; borderAccent: string }[] = [
  { id: 'LEAD', label: 'Prospección', bgHeader: 'bg-slate-100 text-slate-800', borderAccent: 'border-slate-300' },
  { id: 'QUALIFIED', label: 'Calificado', bgHeader: 'bg-sky-50 text-sky-800', borderAccent: 'border-sky-300' },
  { id: 'PROPOSAL', label: 'Propuesta', bgHeader: 'bg-indigo-50 text-indigo-800', borderAccent: 'border-indigo-300' },
  { id: 'NEGOTIATION', label: 'Negociación', bgHeader: 'bg-amber-50 text-amber-800', borderAccent: 'border-amber-300' },
  { id: 'WON', label: 'Ganada', bgHeader: 'bg-emerald-50 text-emerald-800', borderAccent: 'border-emerald-300' },
  { id: 'LOST', label: 'Perdida', bgHeader: 'bg-rose-50 text-rose-800', borderAccent: 'border-rose-300' },
];

export const PipelinePage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // New Deal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateDealInput>({
    title: '',
    value: 1000,
    currency: 'ARS',
    stage: 'LEAD',
    priority: 'MEDIUM',
    probability: 20,
    customerId: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dealsData, customersData] = await Promise.all([
        api.deals.getAll(),
        api.customers.getAll(),
      ]);
      setDeals(dealsData);
      setCustomers(customersData);
      if (customersData.length > 0 && !form.customerId && customersData[0]) {
        setForm(prev => ({ ...prev, customerId: customersData[0]!.id }));
      }
    } catch (err) {
      console.error('Error loading pipeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      // Optimistic update
      setDeals(prev =>
        prev.map(d => (d.id === dealId ? { ...d, stage: newStage } : d))
      );
      await api.deals.updateStage(dealId, newStage);
      loadData();
    } catch (err) {
      console.error('Error updating deal stage:', err);
      loadData();
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta oportunidad?')) return;
    try {
      setDeals(prev => prev.filter(d => d.id !== dealId));
      await api.deals.delete(dealId);
    } catch (err) {
      console.error('Error deleting deal:', err);
      loadData();
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) {
      alert('Debes seleccionar o registrar un cliente');
      return;
    }

    try {
      setSubmitting(true);
      await api.deals.create({
        ...form,
        value: Number(form.value),
        probability: Number(form.probability),
      });
      setIsModalOpen(false);
      setForm({
        title: '',
        value: 1000,
        currency: 'ARS',
        stage: 'LEAD',
        priority: 'MEDIUM',
        probability: 20,
        customerId: customers[0]?.id || '',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al crear la oportunidad');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.title.toLowerCase().includes(search.toLowerCase()) ||
      deal.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      (deal.customer?.company && deal.customer.company.toLowerCase().includes(search.toLowerCase()));

    const matchesPriority = priorityFilter === 'ALL' || deal.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const getAdjacentStage = (currentStage: DealStage, direction: 'prev' | 'next'): DealStage | null => {
    const index = STAGES.findIndex(s => s.id === currentStage);
    if (direction === 'prev' && index > 0) return STAGES[index - 1]!.id;
    if (direction === 'next' && index < STAGES.length - 1) return STAGES[index + 1]!.id;
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 sm:max-w-md">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por oportunidad, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">Todas las prioridades</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Oportunidad</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-3 sm:gap-4 min-w-[900px] sm:min-w-[1100px]">
          {STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const totalStageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={stage.id}
                className="flex-1 bg-slate-100/70 rounded-2xl p-3 flex flex-col min-w-[210px] border border-slate-200/60 shadow-xs"
              >
                {/* Column Header */}
                <div className={`rounded-xl p-3 mb-3 border ${stage.borderAccent} ${stage.bgHeader}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider">{stage.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/80 shadow-xs">
                      {stageDeals.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold opacity-90">
                    {formatCurrency(totalStageValue)}
                  </p>
                </div>

                {/* Cards Column */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
                      Sin oportunidades
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const prevStage = getAdjacentStage(deal.stage, 'prev');
                      const nextStage = getAdjacentStage(deal.stage, 'next');

                      return (
                        <div
                          key={deal.id}
                          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group"
                        >
                          {/* Card Header: Priority & Actions */}
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="priority" value={deal.priority} />
                            <button
                              onClick={() => handleDelete(deal.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                              title="Eliminar oportunidad"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Deal Title */}
                          <h4 className="font-bold text-sm text-slate-900 leading-snug mb-1">
                            {deal.title}
                          </h4>

                          {/* Customer & Company */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                            <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {deal.customer?.company ? `${deal.customer.company} (${deal.customer.name})` : deal.customer?.name}
                            </span>
                          </div>

                          {/* Amount */}
                          <div className="flex items-center justify-between py-2 border-t border-slate-100">
                            <div className="flex items-center text-sm font-extrabold text-slate-900">
                              <DollarSign className="h-4 w-4 text-emerald-600 -mr-0.5" />
                              <span>{formatCurrency(deal.value)}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {deal.probability}% prob.
                            </span>
                          </div>

                          {/* Probability Bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                            <div
                              className={`h-full rounded-full ${
                                deal.probability >= 70
                                  ? 'bg-emerald-500'
                                  : deal.probability >= 40
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>

                          {/* Stage Transition Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            {prevStage ? (
                              <button
                                onClick={() => handleStageChange(deal.id, prevStage)}
                                className="text-[11px] font-medium text-slate-500 hover:text-brand-600 flex items-center gap-0.5 transition-colors"
                                title="Mover a etapa anterior"
                              >
                                <ArrowLeft className="h-3 w-3" />
                                Retroceder
                              </button>
                            ) : <div />}

                            {nextStage ? (
                              <button
                                onClick={() => handleStageChange(deal.id, nextStage)}
                                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 transition-colors"
                                title="Avanzar a siguiente etapa"
                              >
                                Avanzar
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            ) : <div />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Oportunidad"
        description="Agrega un nuevo trato o negocio al pipeline de ventas."
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Título de la Oportunidad *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Licencia ERP Anual + Consultoría"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Cliente Asociado *
              </label>
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Valor Estimado ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Etapa Inicial
              </label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Prioridad
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Probabilidad (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notas y Requerimientos
            </label>
            <textarea
              rows={3}
              placeholder="Detalles sobre las necesidades del cliente y próximos pasos..."
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
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
              {submitting ? 'Creando...' : 'Crear Oportunidad'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
