import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  settingsBranchesApi,
  settingsUsersApi,
  settingsBusinessApi,
  settingsMercadopagoApi,
} from '@api/settings.api'
import { useBranchStore } from '@store/branch.store'

// ==========================================
// SUCURSALES
// ==========================================

/**
 * Hook principal de sucursales.
 * Al cargar la lista, auto-selecciona la sucursal principal
 * si el usuario aún no tiene una sucursal activa configurada.
 */
export function useBranches() {
  const { activeBranch, setActiveBranch, setBranches } = useBranchStore()

  const query = useQuery({
    queryKey: ['settings', 'branches'],
    queryFn: settingsBranchesApi.list,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  useEffect(() => {
    if (!Array.isArray(query.data) || query.data.length === 0) return

    // Sincronizar la lista en el store
    setBranches(query.data)

    // Si no hay sucursal activa o quedó inválida → elegir la principal o la primera disponible
    const currentExists = activeBranch && query.data.some((b) => b.id === activeBranch.id)
    if (!currentExists) {
      const main = query.data.find((b) => b.is_main_branch) ?? query.data[0]
      setActiveBranch({
        id: main.id,
        name: main.name,
        is_main_branch: main.is_main_branch,
      })
    }
  }, [query.data]) // eslint-disable-line react-hooks/exhaustive-deps

  return query
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settingsBranchesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'branches'] }),
  })
}

export function useUpdateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof settingsBranchesApi.update>[1] }) =>
      settingsBranchesApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'branches'] }),
  })
}

export function useDeleteBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settingsBranchesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'branches'] }),
  })
}

// ==========================================
// USUARIOS
// ==========================================

export function useSettingsUsers() {
  return useQuery({
    queryKey: ['settings', 'users'],
    queryFn: settingsUsersApi.list,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateSettingsUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settingsUsersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'users'] }),
  })
}

export function useUpdateSettingsUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof settingsUsersApi.update>[1] }) =>
      settingsUsersApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'users'] }),
  })
}

// ==========================================
// MERCADOPAGO
// ==========================================

export function useMercadopagoConfig() {
  return useQuery({
    queryKey: ['settings', 'mercadopago'],
    queryFn: settingsMercadopagoApi.get,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveMercadopagoConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settingsMercadopagoApi.save,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'mercadopago'] }),
  })
}

// ==========================================
// PERFIL DEL NEGOCIO
// ==========================================

export function useBusinessProfile() {
  return useQuery({
    queryKey: ['settings', 'business'],
    queryFn: settingsBusinessApi.get,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settingsBusinessApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'business'] }),
  })
}
