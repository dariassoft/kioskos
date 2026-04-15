import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@store/auth.store'
import apiClient from '@api/client'
import toast from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiClient.post('/auth/login', data)
      return res.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
      toast.success(`¡Bienvenido, ${data.user.name}!`)

      if (data.user.role === 'superadmin') {
        navigate('/superadmin')
      } else if (data.user.role === 'cashier') {
        navigate('/pos')
      } else {
        navigate('/dashboard')
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Credenciales incorrectas. Intenta nuevamente.',
      )
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Iniciar sesión</h2>
        <p className="text-slate-400 text-sm mt-1">Accede a tu negocio</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       focus:border-transparent text-sm transition-colors"
            placeholder="tu@negocio.com"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full px-3 py-2.5 pr-10 bg-slate-700/50 border border-slate-600 rounded-lg
                         text-white placeholder-slate-400 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 focus:border-transparent text-sm transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800
                     disabled:cursor-not-allowed text-white font-semibold rounded-lg
                     transition-colors flex items-center justify-center gap-2 text-sm mt-2"
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mutation.isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-xs mt-6">
        ¿Problemas para acceder?{' '}
        <a href="mailto:soporte@Kioskos&Despenzas.com" className="text-indigo-400 hover:text-indigo-300">
          Contactar soporte
        </a>
      </p>
    </div>
  )
}
