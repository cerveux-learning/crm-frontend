import React, { useState, useRef, useEffect } from 'react';
import { Plus, RefreshCw, KeyRound, LogOut, ShieldCheck, UserCheck, Eye, ChevronDown, Menu } from 'lucide-react';
import type { NavigationTab } from './Sidebar.js';
import { useAuth } from '../../context/AuthContext.js';
import { ChangePasswordModal } from '../common/ChangePasswordModal.js';

interface NavbarProps {
  activeTab: NavigationTab;
  onQuickAction?: (type: 'deal' | 'customer' | 'sale' | 'product') => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onQuickAction,
  onRefresh,
  isRefreshing = false,
  onOpenMobileNav,
}) => {
  const { user, logout, isAdmin, isViewer, isSeller } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Panel Comercial — Canal Revendedores', subtitle: 'Métricas de facturación al costo, comisiones y distribución' },
    pipeline: { title: 'Pipeline de Oportunidades', subtitle: 'Seguimiento visual de tratos por etapas' },
    customers: { title: 'Clientes y Prospectos', subtitle: 'Directorio de contactos, empresas e interacciones' },
    products: { title: 'Catálogo de Productos y Servicios', subtitle: 'Gestión de inventario y precios' },
    sales: {
      title: isSeller ? 'Mis Cotizaciones y Facturas' : 'Cotizaciones y Facturación',
      subtitle: isSeller
        ? 'Gestión de tus documentos comerciales personales'
        : 'Emisión de presupuestos, facturas y cobros de todos los vendedores',
    },
    users: { title: 'Gestión de Usuarios y Permisos', subtitle: 'Administración de cuentas, accesos y roles' },
    'next-contacts': { title: 'Mi Agenda de Contactos', subtitle: 'Seguimientos pendientes, de hoy y programados' },
    commissions: { title: 'Comisiones por Cobrar', subtitle: 'Estado de comisiones pendientes y liquidadas por vendedor' },
  };

  const current = titles[activeTab] || titles.dashboard;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200">
          <ShieldCheck className="h-3 w-3" />
          Administrador
        </span>
      );
    }
    if (isViewer) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
          <Eye className="h-3 w-3" />
          Lector
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
        <UserCheck className="h-3 w-3" />
        Vendedor
      </span>
    );
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-100 px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Hamburger button for mobile */}
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {current.title}
            </h1>
            <p className="text-xs text-slate-500 hidden lg:block truncate">{current.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Recargar datos"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            </button>
          )}

          {/* Quick Actions (only for non-viewers) */}
          {!isViewer && onQuickAction && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {activeTab === 'pipeline' && (
                <button
                  onClick={() => onQuickAction('deal')}
                  className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-sm transition-colors"
                  title="Nueva Oportunidad"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Oportunidad</span>
                </button>
              )}
              {activeTab === 'customers' && (
                <button
                  onClick={() => onQuickAction('customer')}
                  className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-sm transition-colors"
                  title="Nuevo Cliente"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo Cliente</span>
                </button>
              )}
              {activeTab === 'products' && (
                <button
                  onClick={() => onQuickAction('product')}
                  className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-sm transition-colors"
                  title="Nuevo Producto"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo Producto</span>
                </button>
              )}
              {activeTab === 'sales' && (
                <button
                  onClick={() => onQuickAction('sale')}
                  className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl shadow-sm transition-colors"
                  title="Nueva Cotización / Factura"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Cotización / Factura</span>
                </button>
              )}
            </div>
          )}

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pl-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.name?.slice(0, 2) || 'US'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.name}</p>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</p>
                  <div className="mt-1.5">{getRoleBadge()}</div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound className="h-4 w-4 text-slate-400" />
                    Cambiar Contraseña
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};
