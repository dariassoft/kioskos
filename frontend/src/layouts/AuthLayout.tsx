import { Outlet } from 'react-router-dom'
import { usePWA } from '@hooks/usePWA'
import { Download } from 'lucide-react'

/**
 * AuthLayout — Centra el formulario de login/registro en pantalla completa.
 * Fondo con gradiente oscuro y logo de la marca.
 */
export default function AuthLayout() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Kioskos & Despenzas</h1>
          <p className="text-slate-400 text-sm mt-1">ERP · POS · Multi-tenant</p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>

        {/* Sugerencia de instalación PWA */}
        {isInstallable && !isInstalled && (
          <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button
               onClick={installApp}
               className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 group shadow-lg"
            >
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-600/30 transition-colors">
                <Download className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white leading-tight">Instalar Kioskos & Despenzas</p>
                <p className="text-xs text-slate-400 leading-tight">Acceso rápido desde tu pantalla de inicio</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
