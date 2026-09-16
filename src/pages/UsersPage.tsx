import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  Eye,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Key,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Modal } from '../components/common/Modal.js';
import type { User, UserRole, CreateUserInput, UpdateUserInput } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<(User & { _count?: { sales: number; deals: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    name: '',
    email: '',
    password: '',
    role: 'SELLER',
  });
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserInput>({
    name: '',
    email: '',
    role: 'SELLER',
    password: '',
    active: true,
  });
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (createForm.password.length > 72) {
      setCreateError('La contraseña no puede superar los 72 caracteres');
      return;
    }
    try {
      setSubmitting(true);
      await api.users.create(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'SELLER' });
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear el usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
      active: u.active,
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    try {
      setSubmitting(true);
      const payload: UpdateUserInput = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        active: editForm.active,
      };
      if (editForm.password) {
        if (editForm.password.length > 72) {
          setEditError('La contraseña no puede superar los 72 caracteres');
          return;
        }
        if (editForm.password.trim().length >= 6) {
          payload.password = editForm.password;
        }
      }
      await api.users.update(editingUser.id, payload);
      setIsEditModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar o desactivar el usuario "${name}"?`)) return;
    try {
      await api.users.delete(id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Administrador
          </span>
        );
      case 'SELLER':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
            <UserCheck className="h-3.5 w-3.5" />
            Vendedor
          </span>
        );
      case 'VIEWER':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">
            <Eye className="h-3.5 w-3.5" />
            Lector
          </span>
        );
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header / Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'ADMIN', label: 'Administradores' },
            { id: 'SELLER', label: 'Vendedores' },
            { id: 'VIEWER', label: 'Lectores' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Users List: Mobile Cards + Desktop Table */}
      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-6">
            Cargando lista de usuarios...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-6">
            No se encontraron usuarios registrados.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
            >
              {/* Header: Avatar + Name + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {u.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  {u.active ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-semibold">
                      <XCircle className="h-3.5 w-3.5" /> Inactivo
                    </span>
                  )}
                </div>
              </div>

              {/* Role & Stats */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                <div>{renderRoleBadge(u.role)}</div>
                <span className="text-slate-500 text-[11px]">
                  <strong>{u._count?.sales || 0}</strong> ventas · <strong>{u._count?.deals || 0}</strong> tratos
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Reg: {new Date(u.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Eliminar o Desactivar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Usuario</th>
                <th className="py-3.5 px-6">Rol y Permisos</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6">Ventas / Deals</th>
                <th className="py-3.5 px-6">Fecha Registro</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Cargando lista de usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {u.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">{renderRoleBadge(u.role)}</td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <CheckCircle className="h-3.5 w-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-semibold">
                          <XCircle className="h-3.5 w-3.5" /> Inactivo
                        </span>
                      )}
                    </td>

                    {/* Sales & Deals Counts */}
                    <td className="py-4 px-6">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">{u._count?.sales || 0}</span> ventas ·{' '}
                        <span className="font-semibold">{u._count?.deals || 0}</span> tratos
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                          title="Editar Usuario"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                          title="Eliminar o Desactivar"
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

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Usuario"
        description="Genera una cuenta de acceso asignando el rol correspondiente."
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              placeholder="juan.perez@empresa.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Contraseña Inicial *
            </label>
            <input
              type="password"
              required
              minLength={6}
              maxLength={72}
              placeholder="Mínimo 6 caracteres (máx. 72)"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Rol en el Sistema *
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="SELLER">Vendedor (Ve sus propias ventas y cambia su clave)</option>
              <option value="ADMIN">Administrador (Acceso total y gestión de usuarios)</option>
              <option value="VIEWER">Lector (Solo visualización del Dashboard)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Editar Usuario: ${editingUser?.name}`}
        description="Modifica los datos, asigna un nuevo rol o restablece la contraseña."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Rol del Usuario *
            </label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="SELLER">Vendedor (Ve sus propias ventas y cambia su clave)</option>
              <option value="ADMIN">Administrador (Acceso total y gestión de usuarios)</option>
              <option value="VIEWER">Lector (Solo visualización del Dashboard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Restablecer Contraseña (Opcional)
            </label>
            <div className="relative">
              <Key className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                maxLength={72}
                placeholder="Dejar vacío para no cambiar (máx. 72)"
                value={editForm.password || ''}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">Usuario Activo</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
