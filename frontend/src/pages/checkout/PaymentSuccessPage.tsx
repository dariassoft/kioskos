import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import checkoutApi from '@api/checkout.api'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const pendingId = searchParams.get('pending') ?? ''
  const [email, setEmail] = useState('')
  const [isFree, setIsFree] = useState(false)

  useEffect(() => {
    if (pendingId) {
      checkoutApi.getStatus(pendingId).then((s) => {
        setEmail(s.email ?? '')
        setIsFree(!!s.is_free)
      }).catch(() => {})
    }
  }, [pendingId])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-10 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isFree ? '¡Cuenta creada!' : '¡Suscripción activada!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isFree
              ? 'Tu cuenta gratuita en Kioskos & Despenzas ya está lista.'
              : 'Tu suscripción mensual fue activada exitosamente. MercadoPago realizará el cobro automático cada mes.'}
          </p>
          {email && (
            <p className="text-sm text-gray-500 mt-2">
              Ingresá con: <strong>{email}</strong>
            </p>
          )}
        </div>
        <Link to="/login"
          className="inline-flex items-center justify-center w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
          Ingresar a mi cuenta
        </Link>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}



