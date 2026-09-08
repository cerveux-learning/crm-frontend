import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Building2,
  Mail,
  Phone,
  StickyNote,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import { api } from '../api/client.js';
import type { NextContact } from '../types/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    LEAD: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PROSPECT: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    CUSTOMER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    INACTIVE: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  const labels: Record<string, string> = {
    LEAD: 'Lead',
    PROSPECT: 'Prospecto',
    CUSTOMER: 'Cliente',
    INACTIVE: 'Inactivo',
  };
  return { cls: map[status] ?? map.LEAD, label: labels[status] ?? status };
}

// ─────────────────────────────────────────────────────────────────────────────
// ContactCard
// ─────────────────────────────────────────────────────────────────────────────

interface ContactCardProps {
  contact: NextContact;
  onMarkDone: (id: string, done: boolean) => void;
  isLoading: boolean;
  accent: 'red' | 'blue' | 'green';
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onMarkDone, isLoading, accent }) => {
  const accentMap = {
    red: {
      border: 'border-l-rose-500',
      time: 'text-rose-400',
      btn: 'hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-300',
    },
    blue: {
      border: 'border-l-brand-500',
      time: 'text-brand-400',
      btn: 'hover:bg-brand-500/10 hover:border-brand-500/50 hover:text-brand-300',
    },
    green: {
      border: 'border-l-emerald-500',
      time: 'text-emerald-400',
      btn: 'hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300',
    },
  };

  const a = accentMap[accent];
  const { cls: statusCls, label: statusLabel } = getStatusBadge((contact.customer as any)?.status ?? '');

  return (
    <div
      className={`relative bg-slate-800/60 border border-slate-700/60 border-l-4 ${a.border} rounded-xl p-4 transition-all duration-200 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-slate-900/50 ${contact.done ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm truncate">
              {(contact.customer as any)?.name ?? '—'}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCls}`}>
              {statusLabel}
            </span>
            {contact.done && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-600/40 text-slate-400 border border-slate-600/40">
                <CheckCircle2 className="h-3 w-3" />
                Completado
              </span>
            )}
          </div>

          {(contact.customer as any)?.company && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
              <span className="text-xs text-slate-400 truncate">{(contact.customer as any).company}</span>
            </div>
          )}
        </div>

        {/* Mark done button */}
        <button
          id={`mark-done-${contact.id}`}
          onClick={() => onMarkDone(contact.id, !contact.done)}
          disabled={isLoading}
          title={contact.done ? 'Marcar como pendiente' : 'Marcar como completado'}
          className={`p-2 rounded-lg border border-transparent text-slate-400 transition-all duration-150 disabled:opacity-40 shrink-0 ${a.btn}`}
        >
          {contact.done ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Contact info row */}
      <div className="flex flex-wrap gap-3 mb-3">
        {(contact.customer as any)?.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-slate-500" />
            <span className="text-xs text-slate-400">{(contact.customer as any).email}</span>
          </div>
        )}
        {(contact.customer as any)?.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-500" />
            <span className="text-xs text-slate-400">{(contact.customer as any).phone}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="flex items-start gap-1.5 mb-3 bg-slate-900/40 rounded-lg px-3 py-2">
          <StickyNote className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">{contact.notes}</p>
        </div>
      )}

      {/* Date/time footer */}
      <div className={`flex items-center gap-1.5 text-xs font-medium ${a.time}`}>
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDate(contact.contactDate as unknown as string)}</span>
        <span className="text-slate-600">•</span>
        <span>{formatTime(contact.contactDate as unknown as string)}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SectionTabContent
// ─────────────────────────────────────────────────────────────────────────────

interface SectionTabContentProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  contacts: NextContact[];
  accent: 'red' | 'blue' | 'green';
  headerClass: string;
  countBadgeClass: string;
  emptyMessage: string;
  onMarkDone: (id: string, done: boolean) => void;
  loadingId: string | null;
}

const SectionTabContent: React.FC<SectionTabContentProps> = ({
  title,
  subtitle,
  icon,
  contacts,
  accent,
  headerClass,
  countBadgeClass,
  emptyMessage,
  onMarkDone,
  loadingId,
}) => {
  return (
    <div className="space-y-4">
      {/* Section info banner */}
      <div className={`rounded-xl p-4 border ${headerClass} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="shrink-0">{icon}</div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{subtitle}</p>
          </div>
        </div>
        <span className={`inline-flex items-center justify-center h-7 min-w-[1.75rem] px-2.5 rounded-full text-xs font-bold ${countBadgeClass}`}>
          {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
        </span>
      </div>

      {/* Cards Grid */}
      {contacts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-slate-600 font-medium text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onMarkDone={onMarkDone}
              isLoading={loadingId === c.id}
              accent={accent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NextContactsPage
// ─────────────────────────────────────────────────────────────────────────────

type AgendaTab = 'overdue' | 'today' | 'upcoming';

export const NextContactsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AgendaTab>('today');
  const [overdue, setOverdue] = useState<NextContact[]>([]);
  const [today, setToday] = useState<NextContact[]>([]);
  const [upcoming, setUpcoming] = useState<NextContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDone, setIncludeDone] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAgenda = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.nextContacts.getMyAgenda(includeDone);
      setOverdue(data.overdue);
      setToday(data.today);
      setUpcoming(data.upcoming);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [includeDone]);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  const handleMarkDone = async (id: string, done: boolean) => {
    setLoadingId(id);
    try {
      await api.nextContacts.update(id, { done });
      const data = await api.nextContacts.getMyAgenda(includeDone);
      setOverdue(data.overdue);
      setToday(data.today);
      setUpcoming(data.upcoming);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error al actualizar contacto:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Mis Próximos Contactos</h1>
          </div>
          <p className="text-sm text-slate-500 ml-12">
            Agenda de seguimiento personalizada •{' '}
            {lastUpdated
              ? `Actualizada a las ${lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Cargando...'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle completados */}
          <button
            id="toggle-include-done"
            onClick={() => setIncludeDone((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              includeDone
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {includeDone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {includeDone ? 'Ocultar completados' : 'Ver completados'}
          </button>

          {/* Refresh */}
          <button
            id="refresh-agenda"
            onClick={fetchAgenda}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border bg-white border-slate-200 text-slate-600 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Summary strip as interactive cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`bg-rose-50 border rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
              activeTab === 'overdue'
                ? 'border-rose-400 ring-2 ring-rose-400/30 shadow-xs'
                : 'border-rose-100 hover:border-rose-300'
            }`}
          >
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-rose-600">{overdue.length}</p>
              <p className="text-xs text-rose-600/90 font-medium">Atrasadas</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`bg-brand-50 border rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
              activeTab === 'today'
                ? 'border-brand-400 ring-2 ring-brand-400/30 shadow-xs'
                : 'border-brand-100 hover:border-brand-300'
            }`}
          >
            <Calendar className="h-5 w-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-brand-600">{today.length}</p>
              <p className="text-xs text-brand-600/90 font-medium">Hoy</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`bg-emerald-50 border rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'border-emerald-400 ring-2 ring-emerald-400/30 shadow-xs'
                : 'border-emerald-100 hover:border-emerald-300'
            }`}
          >
            <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-emerald-600">{upcoming.length}</p>
              <p className="text-xs text-emerald-600/90 font-medium">Próximas</p>
            </div>
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs selector */}
      {!loading && !error && (
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-full sm:w-fit overflow-x-auto">
          <button
            id="tab-overdue"
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${activeTab === 'overdue' ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>Atrasadas</span>
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'overdue'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-300/70 text-slate-600'
              }`}
            >
              {overdue.length}
            </span>
          </button>

          <button
            id="tab-today"
            type="button"
            onClick={() => setActiveTab('today')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'today'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className={`h-4 w-4 ${activeTab === 'today' ? 'text-brand-500' : 'text-slate-400'}`} />
            <span>Hoy</span>
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'today'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-slate-300/70 text-slate-600'
              }`}
            >
              {today.length}
            </span>
          </button>

          <button
            id="tab-upcoming"
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className={`h-4 w-4 ${activeTab === 'upcoming' ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span>Próximas</span>
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'upcoming'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-300/70 text-slate-600'
              }`}
            >
              {upcoming.length}
            </span>
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-11 w-72 rounded-2xl bg-slate-200/70 animate-pulse" />
          <div className="h-16 rounded-xl bg-slate-200/60 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Main content: Active tab */}
      {!loading && !error && (
        <>
          {activeTab === 'overdue' && (
            <SectionTabContent
              title="Atrasadas"
              subtitle="Contactos que pasaron su fecha sin completarse"
              icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
              contacts={overdue}
              accent="red"
              headerClass="bg-rose-50/70 border-rose-200/80"
              countBadgeClass={overdue.length > 0 ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'}
              emptyMessage="¡Sin contactos atrasados! Estás al día con tus compromisos anteriores."
              onMarkDone={handleMarkDone}
              loadingId={loadingId}
            />
          )}

          {activeTab === 'today' && (
            <SectionTabContent
              title="Hoy"
              subtitle={new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              icon={<Calendar className="h-5 w-5 text-brand-500" />}
              contacts={today}
              accent="blue"
              headerClass="bg-brand-50/70 border-brand-200/80"
              countBadgeClass={today.length > 0 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-600'}
              emptyMessage="Sin contactos pendientes para hoy."
              onMarkDone={handleMarkDone}
              loadingId={loadingId}
            />
          )}

          {activeTab === 'upcoming' && (
            <SectionTabContent
              title="Próximas"
              subtitle="Contactos programados a futuro"
              icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
              contacts={upcoming}
              accent="green"
              headerClass="bg-emerald-50/70 border-emerald-200/80"
              countBadgeClass={upcoming.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}
              emptyMessage="Sin contactos programados para las próximas fechas."
              onMarkDone={handleMarkDone}
              loadingId={loadingId}
            />
          )}
        </>
      )}
    </div>
  );
};
