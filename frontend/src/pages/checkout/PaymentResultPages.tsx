import { Link } from 'react-router-dom'
import { Clock, XCircle } from 'lucide-react'
export function PaymentPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border p-10 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto"><Clock className="w-10 h-10 text-amber-600" /></div>
        <div className="space-y-2"><h1 className="text-2xl font-bold">Pago en proceso</h1><p className="text-gray-600">Tu pago está siendo verificado. Te avisaremos por email cuando tu cuenta esté activa.</p></div>
        <Link to="/" className="inline-flex items-center justify-center w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 font-semibold rounded-xl transition-colors">Volver al inicio</Link>
      </div>
    </div>
  )
}
export function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border p-10 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto"><XCircle className="w-10 h-10 text-red-600" /></div>
        <div className="space-y-2"><h1 className="text-2xl font-bold">Pago no completado</h1><p className="text-gray-600">Hubo un problema con tu pago. Podés intentar nuevamente con otro método.</p></div>
        <Link to="/#planes" className="inline-flex items-center justify-center w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">Intentar nuevamente</Link>
        <Link to="/" className="text-sm text-gray-500 block">Volver al inicio</Link>
      </div>
    </div>
  )
}
