import axios from 'axios'
import { useAuthStore } from '@store/auth.store'

/**
 * Cliente HTTP principal de Kioskos & Despenzas.
 *
 * - Interceptor de request: agrega el token JWT Bearer automáticamente
 * - Interceptor de response: maneja errores 401 (token expirado → logout)
 * - Base URL configurada desde variables de entorno
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ==========================================
// REQUEST INTERCEPTOR — Agregar JWT
// ==========================================
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ==========================================
// RESPONSE INTERCEPTOR — Manejo de errores
// ==========================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → logout automático
      useAuthStore.getState().logout()
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
