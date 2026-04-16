import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Loader2, AlertCircle, X, UserCheck, UserX, Eye, EyeOff,
  ShieldCheck, Users, Briefcase,
} from 'lucide-react'
import { settingsUsersApi, settingsBranchesApi } from '@/api/settings.api'
import type { UserItem, CreateUserDto, UpdateUserDto, UserRole } from '@/api/settings.types'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-500/10 text-purple-600',
  manager: 'bg-blue-500/10 text-blue-600',
  cashier: 'bg-green-500/10 text-green-600',
}

const ROLE_ICONS: Record<UserRole, typeof Users> = {
  admin: ShieldCheck,
  manager: Briefcase,
  cashier: Users,
}

// ==========================================
// MODAL
// ==========================================
interface UserModalProps {
  user?: UserItem | null
  branches: { id: string; name: string }[]
  onClose: () => void
  onSave: (data: CreateUserDto | UpdateUserDto) => Promise<void>
  loading: boolean
}

function UserModal({ user, branches, onClose, onSave, loading }: UserModalProps) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'cashier')
  const [branchId, setBranchId] = useState(user?.branch_id ?? '')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user) {
      const dto: UpdateUserDto = { name, role, branch_id: branchId || null }
      if (password) dto.password = password
      await onSave(dto)
    } else {
      await onSave({ name, email, password, role, branch_id: branchId || undefined } as CreateUserDto)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre completo *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input w-full" placeholder="Juan Pérez" />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="input w-full" placeholder="juan@kiosko.com" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {user ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
            </label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required={!user}
                minLength={6}
                className="input w-full pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Rol *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="input w-full">
              <option value="cashier">Cajero</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sucursal asignada</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input w-full">
              <option value="">Sin sucursal específica</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {user ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// TAB PRINCIPAL
// ==========================================
export default function UsersTab() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | UserItem | null>(null)

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['settings', 'users'],
    queryFn: settingsUsersApi.list,
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['settings', 'branches'],
    queryFn: settingsBranchesApi.list,
  })

  const createMutation = useMutation({
    mutationFn: settingsUsersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings', 'users'] }); setModal(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => settingsUsersApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings', 'users'] }); setModal(null) },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      settingsUsersApi.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'users'] }),
  })

  const handleSave = async (data: CreateUserDto | UpdateUserDto) => {
    if (modal === 'create') {
      await createMutation.mutateAsync(data as CreateUserDto)
    } else if (modal && typeof modal === 'object') {
      await updateMutation.mutateAsync({ id: modal.id, dto: data as UpdateUserDto })
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando usuarios...
    </div>
  )

  if (isError) return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
      <AlertCircle className="w-5 h-5" /> Error al cargar los usuarios.
    </div>
  )

  return (
    <>
      <div className="space-y-4">
        {/* Barra de acción */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Usuarios del negocio</h2>
            <p className="text-sm text-muted-foreground">
              {users.filter((u) => u.is_active).length} activo{users.filter((u) => u.is_active).length !== 1 ? 's' : ''} de {users.length} total
            </p>
          </div>
          <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo usuario
          </button>
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Sucursal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const RoleIcon = ROLE_ICONS[user.role] ?? Users
                return (
                  <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${!user.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {user.branch_name ?? <span className="italic text-xs">Todas</span>}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><UserCheck className="w-3.5 h-3.5" />Activo</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><UserX className="w-3.5 h-3.5" />Inactivo</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal(user)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: user.id, is_active: !user.is_active })}
                          className={`p-1.5 rounded-md transition-colors ${user.is_active
                            ? 'hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600'
                            : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600'}`}
                          title={user.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <UserModal
          user={modal === 'create' ? null : modal}
          branches={branches}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </>
  )
}



