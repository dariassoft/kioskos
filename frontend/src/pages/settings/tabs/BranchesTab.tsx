import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, MapPin, Phone, Star, Loader2, AlertCircle, X } from 'lucide-react'
import { settingsBranchesApi } from '@/api/settings.api'
import type { Branch, CreateBranchDto, UpdateBranchDto } from '@/api/settings.types'

// ==========================================
// MODAL CREAR / EDITAR SUCURSAL
// ==========================================
interface BranchModalProps {
  branch?: Branch | null
  onClose: () => void
  onSave: (data: CreateBranchDto | UpdateBranchDto) => Promise<void>
  loading: boolean
}

function BranchModal({ branch, onClose, onSave, loading }: BranchModalProps) {
  const [name, setName] = useState(branch?.name ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({ name, address: address || undefined, phone: phone || undefined })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {branch ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input w-full"
              placeholder="Sucursal Centro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Dirección</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input w-full"
              placeholder="Av. Corrientes 1234"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input w-full"
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {branch ? 'Guardar cambios' : 'Crear sucursal'}
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
export default function BranchesTab() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | Branch | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data: branches = [], isLoading, isError } = useQuery({
    queryKey: ['settings', 'branches'],
    queryFn: settingsBranchesApi.list,
  })

  const createMutation = useMutation({
    mutationFn: settingsBranchesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings', 'branches'] }); setModal(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBranchDto }) =>
      settingsBranchesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings', 'branches'] }); setModal(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: settingsBranchesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'branches'] }),
    onSettled: () => setDeleting(null),
  })

  const handleSave = async (data: CreateBranchDto | UpdateBranchDto) => {
    if (modal === 'create') {
      await createMutation.mutateAsync(data as CreateBranchDto)
    } else if (modal && typeof modal === 'object') {
      await updateMutation.mutateAsync({ id: modal.id, dto: data as UpdateBranchDto })
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando sucursales...
    </div>
  )

  if (isError) return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
      <AlertCircle className="w-5 h-5" /> Error al cargar las sucursales.
    </div>
  )

  return (
    <>
      <div className="space-y-4">
        {/* Barra de acción */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sucursales</h2>
            <p className="text-sm text-muted-foreground">
              {branches.length} sucursal{branches.length !== 1 ? 'es' : ''} registrada{branches.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva sucursal
          </button>
        </div>

        {/* Cards de sucursales */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="card p-5 border border-border rounded-xl space-y-3 relative"
            >
              {branch.is_main_branch && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 text-xs font-medium rounded-full">
                  <Star className="w-3 h-3" /> Principal
                </span>
              )}
              <div>
                <h3 className="font-semibold text-foreground text-base pr-20">{branch.name}</h3>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {branch.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {!branch.address && !branch.phone && (
                  <span className="italic">Sin datos de contacto</span>
                )}
              </div>
              <div className="flex gap-2 pt-1 border-t border-border">
                <button
                  onClick={() => setModal(branch)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                {!branch.is_main_branch && (
                  <button
                    onClick={() => { setDeleting(branch.id); deleteMutation.mutate(branch.id) }}
                    disabled={deleting === branch.id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {deleting === branch.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No hay sucursales registradas.
            </div>
          )}
        </div>
      </div>

      {modal !== null && (
        <BranchModal
          branch={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </>
  )
}

