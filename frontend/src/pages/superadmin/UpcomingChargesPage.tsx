import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@api/client'
import { CalendarCheck, Loader2, AlertTriangle, Gift } from 'lucide-react'

export default function UpcomingChargesPage() {
  const [days, setDays] = useState(30)

  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['upcoming-charges', days],
    queryFn: async () => (await apiClient.get(`/billing/upcoming-charges?days=${days}`)).data,
  })

  const fmt = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)
  const totalExpected = charges.reduce((sum: number, c: any) => sum + c.charge_amount, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-emerald-500" /> Cobros Próximos
          </h1>
          <p className="text-sm text-slate-400 mt-1">Visibilidad completa de qué se cobra, a quién y cuándo</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white">
          <option value={7}>Próximos 7 días</option>
          <option value={15}>Próximos 15 días</option>
          <option value={30}>Próximos 30 días</option>
          <option value={60}>Próximos 60 días</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingreso Esperado</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{fmt(totalExpected)}</p>
          <p className="text-xs text-slate-400 mt-1">en los próximos {days} días</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cobros Programados</p>
          <p className="text-3xl font-black text-white mt-1">{charges.length}</p>
          <p className="text-xs text-slate-400 mt-1">suscripciones a renovar</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : charges.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Sin cobros programados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Negocio</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Monto</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Fecha Cobro</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Días</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Promo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {charges.map((c: any) => (
                <tr key={c.subscription_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{c.business_name}</td>
                  <td className="px-4 py-3 text-slate-300">{c.plan_name}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">{fmt(c.charge_amount)}</td>
                  <td className="px-4 py-3 text-slate-300">{new Date(c.next_billing_date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      c.days_until_due <= 3 ? 'bg-red-500/20 text-red-400' : c.days_until_due <= 7 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {c.days_until_due <= 0 ? <AlertTriangle className="w-3 h-3" /> : null}
                      {c.days_until_due} d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.has_promo ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded-full text-xs font-bold">
                        <Gift className="w-3 h-3" /> Sí
                      </span>
                    ) : <span className="text-slate-500">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
