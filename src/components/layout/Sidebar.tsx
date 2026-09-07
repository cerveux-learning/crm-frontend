import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Package,
  Receipt,
  Layers,
  UserCog,
  LogOut,
  ShieldCheck,
  UserCheck,
  Eye,
  X,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export type NavigationTab = 'dashboard' | 'pipeline' | 'customers' | 'products' | 'sales' | 'users' | 'next-contacts';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { user, logout, isAdmin, isViewer } = useAuth();

  // Close mobile drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  // Lock scroll when mobile nav is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const allNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    allowedRoles: ('ADMIN' | 'SELLER' | 'VIEWER')[];
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
      allowedRoles: ['ADMIN', 'SELLER', 'VIEWER'],
    },
    {
      id: 'pipeline',
      label: 'Pipeline de Ventas',
      icon: <Kanban className="h-5 w-5 shrink-0" />,
      allowedRoles: ['ADMIN', 'SELLER'],
    },
    {
      id: 'customers',
      label: 'Clientes & Leads',
      icon: <Users className="h-5 w-5 shrink-0" />,
      allowedRoles: ['ADMIN', 'SELLER'],
    },
    {
      id: 'products',
      label: 'Catálogo de Productos',
      icon: <Package className="h-5 w-5 shrink-0" />,
      allowedRoles: ['ADMIN', 'SELLER'],
    },
    {
      id: 'sales',
      label: 'Cotizaciones & Ventas',
      icon: <Receipt className="h-5 w-5 shrink-0" />,
      allowedRoles: ['ADMIN', 'SELLER'],
    },
    {
      id: 'next-contacts',
      label: 'Mi Agenda',
      icon: <CalendarClock className="h-5 w-5 shrink-0" />,
      allowedRoles: ['ADMIN', 'SELLER'],
    },
    {
      id: 'users',
      label: 'Gestión de Usuarios',
      icon: <UserCog className="h-5 w-5 shrink-0" />,
      allowedRoles: ['ADMIN'],
    },
  ];

  const visibleNavItems = allNavItems.filter((item) =>
    user ? item.allowedRoles.includes(user.role) : false
  );

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrador';
    if (isViewer) return 'Lector';
    return 'Vendedor';
  };

  const getRoleIcon = () => {
    if (isAdmin) return <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />;
    if (isViewer) return <Eye className="h-3.5 w-3.5 text-amber-400" />;
    return <UserCheck className="h-3.5 w-3.5 text-emerald-400" />;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg">CRM Pro</span>
              <span className="block text-[11px] text-brand-400 font-semibold uppercase tracking-wider">
                Control de Ventas
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar Menú"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="py-6 px-3 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            {isViewer ? 'Módulo Disponible' : 'Módulos'}
          </p>
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 active:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/60">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {user?.name?.slice(0, 2) || 'US'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {getRoleIcon()}
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {getRoleLabel()}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-200 flex-col shrink-0 min-h-screen border-r border-slate-800 sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onMobileClose}
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
