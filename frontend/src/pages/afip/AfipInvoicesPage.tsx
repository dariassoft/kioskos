import { useState } from 'react'
import { useAfipInvoices, useAfipCredentials } from '@hooks/useAfip'
import { FileText, Eye, Download, AlertCircle, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { afipInvoicesApi } from '@api/afip.api'
import toast from 'react-hot-toast'

export default function AfipInvoicesPage() {
  const [page, setPage] = useState(1)
  const { data: credentials } = useAfipCredentials()
  const { data, isLoading } = useAfipInvoices(page, 20)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      setDownloadingId(invoiceId)
      const blob = await afipInvoicesApi.downloadPdf(invoiceId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      toast.error('No se pudo descargar el PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  if (!credentials?.is_configured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-foreground">Facturas ARCA</h1>
            <p className="text-sm text-muted-foreground">
              Gestioná tus comprobantes ARCA
            </p>
          </div>
        </div>

        {/* Mensaje de configuración requerida */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Configuración Requerida
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Primero debés configurar tus credenciales de ARCA en Ajustes para poder emitir
            facturas electrónicas.
          </p>
          <Link
            to="/settings"
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            Ir a Configuración
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Facturas ARCA</h1>
            <p className="text-sm text-muted-foreground">
              Comprobantes emitidos ante ARCA
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  CAE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Receptor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Importe
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Modo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando facturas...
                  </td>
                </tr>
              ) : data && data.data.length > 0 ? (
                data.data.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        Factura {invoice.tipo_comprobante === 1 ? 'A' : invoice.tipo_comprobante === 6 ? 'B' : 'C'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-foreground">
                        {String(invoice.punto_de_venta).padStart(5, '0')}-
                        {String(invoice.numero_comprobante).padStart(8, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {invoice.cae}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">
                        {invoice.nombre_receptor || 'Consumidor Final'}
                      </div>
                      {invoice.doc_nro_receptor > 0 && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {invoice.doc_nro_receptor}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-foreground">
                        ${Number(invoice.importe_total).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {new Date(invoice.fecha_comprobante).toLocaleDateString('es-AR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {invoice.is_test ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 rounded">
                          TEST
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded">
                          PROD
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(invoice.id)}
                          disabled={downloadingId === invoice.id}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                          title="Descargar PDF"
                        >
                          {downloadingId === invoice.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No hay facturas emitidas aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.total > data.limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {(page - 1) * data.limit + 1} a{' '}
              {Math.min(page * data.limit, data.total)} de {data.total} facturas
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * data.limit >= data.total}
                className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

