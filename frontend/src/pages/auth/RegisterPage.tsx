import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div>
      <button
        onClick={() => navigate('/auth/login')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al login
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Crear cuenta</h2>
        <p className="text-slate-400 text-sm mt-1">
          El registro está disponible para administradores del sistema.
        </p>
      </div>

      <div className="text-center py-8 text-slate-400 text-sm">
        Para registrar un nuevo negocio, contacta al equipo de Kioskos & Despenzas.
        <br />
        <a
          href="mailto:soporte@Kioskos&Despenzas.com"
          className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
        >
          soporte@Kioskos&Despenzas.com
        </a>
      </div>
    </div>
  )
}
