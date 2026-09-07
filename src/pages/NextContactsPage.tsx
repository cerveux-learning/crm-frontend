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
// SectionColumn
// ─────────────────────────────────────────────────────────────────────────────

interface SectionColumnProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  contacts: NextContact[];
  accent: 'red' | 'blue' | 'green';
  headerClass: string;
  countBadgeClass: string;
  onMarkDone: (id: string, done: boolean) => void;
  loadingId: string | null;
}

const SectionColumn: React.FC<SectionColumnProps> = ({
  title,
  subtitle,
  icon,
  contacts,
  accent,
  headerClass,
  countBadgeClass,
  onMarkDone,
  loadingId,
}) => {
  return (
    <div className="flex flex-col min-h-0">
      {/* Column header */}
      <div className={`rounded-xl p-4 mb-4 border ${headerClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {icon}
            <div>
              <h2 className="font-bold text-sm text-white">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <span className={`inline-flex items-center justify-center h-7 min-w-[1.75rem] px-2 rounded-full text-xs font-bold ${countBadgeClass}`}>
            {contacts.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="text-slate-600 text-4xl mb-2">✓</div>
            <p className="text-slate-500 text-sm">Sin contactos en esta sección</p>
          </div>
        ) : (
          contacts.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onMarkDone={onMarkDone}
              isLoading={loadingId === c.id}
              accent={accent}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NextContactsPage
// ─────────────────────────────────────────────────────────────────────────────

export const NextContactsPage: React.FC = () => {
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

  const totalCount = overdue.length + today.length + upcoming.length;

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

      {/* Summary strip */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 sm:p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-rose-600">{overdue.length}</p>
              <p className="text-xs text-rose-500 font-medium">Atrasadas</p>
            </div>
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 sm:p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-brand-600">{today.length}</p>
              <p className="text-xs text-brand-500 font-medium">Hoy</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-emerald-600">{upcoming.length}</p>
              <p className="text-xs text-emerald-500 font-medium">Próximas</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
              {[0, 1].map((j) => (
                <div key={j} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Main content: 3 columns */}
      {!loading && !error && (
        <>
          {totalCount === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <CalendarClock className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">Todo al día</h3>
              <p className="text-slate-500 text-sm">No tenés contactos pendientes en tu agenda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* OVERDUE */}
              <SectionColumn
                title="Atrasadas"
                subtitle="Contactos que pasaron su fecha"
                icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
                contacts={overdue}
                accent="red"
                headerClass="bg-rose-500/5 border-rose-500/20"
                countBadgeClass={overdue.length > 0 ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}
                onMarkDone={handleMarkDone}
                loadingId={loadingId}
              />

              {/* TODAY */}
              <SectionColumn
                title="Hoy"
                subtitle={new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}
                icon={<Calendar className="h-5 w-5 text-brand-400" />}
                contacts={today}
                accent="blue"
                headerClass="bg-brand-500/5 border-brand-500/20"
                countBadgeClass={today.length > 0 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'}
                onMarkDone={handleMarkDone}
                loadingId={loadingId}
              />

              {/* UPCOMING */}
              <SectionColumn
                title="Próximas"
                subtitle="Contactos programados a futuro"
                icon={<Sparkles className="h-5 w-5 text-emerald-400" />}
                contacts={upcoming}
                accent="green"
                headerClass="bg-emerald-500/5 border-emerald-500/20"
                countBadgeClass={upcoming.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}
                onMarkDone={handleMarkDone}
                loadingId={loadingId}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
