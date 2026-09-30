import React from 'react';
import type { CustomerStatus, DealStage, DealPriority, SaleStatus, ProductCategory } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'customer' | 'stage' | 'priority' | 'sale' | 'category' | 'default';
  value?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', value, className = '' }) => {
  const text = children || value;

  // Colors & labels by variant
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'customer') {
    switch (value as CustomerStatus) {
      case 'LEAD':
        styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'PROSPECT':
        styleClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'CUSTOMER':
        styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'INACTIVE':
        styleClasses = 'bg-slate-100 text-slate-500 border-slate-200';
        break;
    }
  } else if (variant === 'stage') {
    switch (value as DealStage) {
      case 'LEAD':
        styleClasses = 'bg-slate-100 text-slate-700 border-slate-300';
        break;
      case 'QUALIFIED':
        styleClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'PROPOSAL':
        styleClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'NEGOTIATION':
        styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'WON':
        styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'LOST':
        styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }
  } else if (variant === 'priority') {
    switch (value as DealPriority) {
      case 'HIGH':
        styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'MEDIUM':
        styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'LOW':
        styleClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else if (variant === 'sale') {
    switch (value as SaleStatus) {
      case 'DRAFT':
        styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
      case 'SENT':
        styleClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'ACCEPTED':
        styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'REJECTED':
        styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'PAID':
        styleClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
        break;
      case 'CANCELLED':
        styleClasses = 'bg-slate-200 text-slate-600 border-slate-300';
        break;
    }
  } else if (variant === 'category') {
    switch (value as ProductCategory) {
      case 'SERVICE':
        styleClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'SUBSCRIPTION':
        styleClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        break;
      case 'PRODUCT':
        styleClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'OTHER':
        styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  }

  // Label mappings for Spanish display
  const labelMap: Record<string, string> = {
    LEAD: 'Lead',
    PROSPECT: 'Prospecto',
    CUSTOMER: 'Cliente',
    INACTIVE: 'Inactivo',
    QUALIFIED: 'Calificado',
    PROPOSAL: 'Propuesta',
    NEGOTIATION: 'Negociación',
    WON: 'Ganada',
    LOST: 'Perdida',
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    ACCEPTED: 'Aceptada',
    REJECTED: 'Rechazada',
    PAID: 'Pagada',
    CANCELLED: 'Cancelada',
    SERVICE: 'Servicio',
    SUBSCRIPTION: 'Suscripción',
    PRODUCT: 'Producto',
    OTHER: 'Otro',
    QUOTE: 'Cotización',
    INVOICE: 'Factura',
    CONSIGNMENT: 'Consignación',
  };

  const displayText = value && labelMap[value] ? labelMap[value] : text;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClasses} ${className}`}
    >
      {displayText}
    </span>
  );
};
