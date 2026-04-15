import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { Store, CheckCircle, XCircle } from 'lucide-react'

type TenantStatus = 'active' | 'suspended' | 'trial' | 'past_due'

const statusConfig: Record<TenantStatus, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'badge-active' },
  trial: { label: 'Prueba', className: 'badge-trial' },
  suspended: { label: 'Suspendido', className: 'badge-suspended' },
  past_due: { label: 'Vencido', className: 'badge-past-due' },
}

export default function TenantsPage() {
  const queryClient = useQueryClient()

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await apiClient.get('/tenants')
      return res.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TenantStatus }) => {
      const res = await apiClient.patch(`/tenants/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-metrics'] })
      toast.success('Estado actualizado correctamente')
    },
    onError: () => toast.error('Error al actualizar el estado'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Negocios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de todos los tenants de la plataforma
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <Store className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Sin negocios registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los negocios aparecerán aquí cuando se registren en la plataforma.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Negocio</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((tenant: any) => {
                const cfg = statusConfig[tenant.status as TenantStatus] ?? statusConfig.trial
                return (
                  <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <Store className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="font-medium text-foreground">{tenant.business_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tenant.owner_email}</td>
                    <td className="px-4 py-3">
                      <span className={cfg.className}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {tenant.status !== 'active' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: tenant.id, status: 'active' })}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                            title="Activar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {tenant.status !== 'suspended' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: tenant.id, status: 'suspended' })}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Suspender"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
