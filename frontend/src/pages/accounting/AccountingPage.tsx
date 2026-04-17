import { useState } from 'react';
import { BookOpen, Calendar, ArrowUpRight, ArrowDownRight, RefreshCcw, Download, ShieldCheck } from 'lucide-react';
import { useLedger } from '@hooks/useAccounting';
import { useSalesList, useVerifySalePayment, useRevertSalePayment } from '@hooks/useSales';
import { jsPDF as JsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AccountingPage() {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // Primer día del mes
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Hoy

  const { data: ledger = [], isLoading, refetch } = useLedger(startDate, endDate);
  const { data: pendingSales = { data: [], total: 0, page: 1, limit: 20 }, isLoading: loadingPending, refetch: refetchPending } = useSalesList({
    start_date: startDate,
    end_date: endDate,
    payment_status: 'pending',
    page: 1,
    limit: 20,
  });
  const verifyPayment = useVerifySalePayment();
  const revertPayment = useRevertSalePayment();

  // Ventas confirmadas (para control/reversión)
  const { data: verifiedSales = { data: [], total: 0, page: 1, limit: 10 }, refetch: refetchVerified } = useSalesList({
    start_date: startDate,
    end_date: endDate,
    payment_status: 'confirmed',
    page: 1,
    limit: 10,
  });

  // Calcular totales
  const totalDebit = ledger.reduce((acc: number, entry: any) => acc + Number(entry.debit), 0);
  const totalCredit = ledger.reduce((acc: number, entry: any) => acc + Number(entry.credit), 0);
  const balance = totalDebit - totalCredit; // Si es positivo, activo neto aumenta

  const handleExportPDF = () => {
    const pdfDoc = new JsPDF();

    pdfDoc.setFontSize(16);
    pdfDoc.text('Libro Diario - Kioskos & Despenzas', 14, 20);

    pdfDoc.setFontSize(10);
    pdfDoc.text(`Periodo: ${startDate} al ${endDate}`, 14, 28);
    pdfDoc.text(`Balance Total: $${Math.abs(balance).toLocaleString('es-AR')} ${balance >= 0 ? '(Favor)' : '(Contra)'}`, 14, 34);

    const tableColumn = ["Fecha", "Descripción", "Cuenta", "Debe", "Haber"];
    const tableRows = ledger.map((entry: any) => [
      new Date(entry.date).toLocaleString('es-AR'),
      entry.description,
      entry.account_name,
      Number(entry.debit) > 0 ? `$${Number(entry.debit).toLocaleString('es-AR')}` : '-',
      Number(entry.credit) > 0 ? `$${Number(entry.credit).toLocaleString('es-AR')}` : '-'
    ]);

    autoTable(pdfDoc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    pdfDoc.save(`Libro_Diario_${startDate}_${endDate}.pdf`);
  };

  const handleConfirmPayment = async (saleId: string) => {
    await verifyPayment.mutateAsync(saleId);
    await Promise.all([refetch(), refetchPending(), refetchVerified()]);
  };

  const handleRevertPayment = async (saleId: string) => {
    if (confirm('¿Estás seguro de que deseas anular esta acreditación y volverla a pendiente?')) {
      await revertPayment.mutateAsync(saleId);
      await Promise.all([refetch(), refetchPending(), refetchVerified()]);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Libro Diario (Contabilidad)</h1>
            <p className="text-muted-foreground mt-1 text-sm">Registro automático de asientos por ventas y compras</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={ledger.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors font-medium text-sm"
            >
              <RefreshCcw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><ArrowUpRight className="w-5 h-5" /></div>
              <span className="font-semibold text-sm">Total Debe (Activo/Gastos)</span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">${totalDebit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-muted-foreground">
              <div className="p-2 bg-destructive/10 text-destructive rounded-lg"><ArrowDownRight className="w-5 h-5" /></div>
              <span className="font-semibold text-sm">Total Haber (Pasivo/Ingresos)</span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">${totalCredit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className={`border p-5 rounded-2xl shadow-sm ${balance >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
            <div className="flex items-center gap-3 mb-2 text-muted-foreground">
              <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Balance del Periodo</span>
            </div>
            <p className={`text-3xl font-extrabold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ${Math.abs(balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              <span className="text-sm font-medium ml-2">{balance >= 0 ? '(Favor)' : '(Contra)'}</span>
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border border-border text-sm rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-muted-foreground font-medium">al</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border border-border text-sm rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Tabla del Libro Mayor */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-fade-in relative">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Fecha / Hora</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Cuenta</th>
                  <th className="px-6 py-4 text-right">Debe</th>
                  <th className="px-6 py-4 text-right">Haber</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                      <p className="mt-2">Cargando asientos...</p>
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-base font-medium">No hay asientos contables en este periodo</p>
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry: any) => (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                        {new Date(entry.date).toLocaleString('es-AR')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{entry.description}</p>
                        {entry.reference_id && (
                          <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">Ref: {entry.reference_id.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-semibold">
                          {entry.account_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">
                        {Number(entry.debit) > 0 ? `$${Number(entry.debit).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-muted-foreground">
                        {Number(entry.credit) > 0 ? `$${Number(entry.credit).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagos pendientes */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-fade-in relative">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pagos pendientes de acreditación</h2>
              <p className="text-sm text-muted-foreground">Transferencias, QR o links que aún no fueron confirmados</p>
            </div>
            <button
              onClick={() => refetchPending()}
              className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm font-medium"
            >
              <RefreshCcw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4">Cliente / Pagador</th>
                  <th className="px-6 py-4 text-right">Importe</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loadingPending ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Cargando pagos pendientes...</td>
                  </tr>
                ) : pendingSales.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-base font-medium">No hay pagos pendientes en este periodo</p>
                    </td>
                  </tr>
                ) : (
                  pendingSales.data.map((sale: any) => (
                    <tr key={sale.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.created_at).toLocaleString('es-AR')}</td>
                      <td className="px-6 py-4">{sale.payment_method.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{sale.customer?.name || sale.payer_name || 'Sin identificar'}</p>
                        <p className="text-xs text-muted-foreground">{sale.mp_payment_id || sale.transfer_voucher || sale.transfer_origin || 'Sin referencia'}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">${Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleConfirmPayment(sale.id)}
                          disabled={verifyPayment.isPending}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Confirmar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acreditaciones Recientes */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-fade-in relative">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground text-emerald-600">Acreditaciones Confirmadas</h2>
              <p className="text-sm text-muted-foreground">Últimos cobros verificados por el personal</p>
            </div>
            <button
              onClick={() => refetchVerified()}
              className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm font-medium"
            >
              <RefreshCcw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Método / Cliente</th>
                  <th className="px-6 py-4 text-center">Comprobante</th>
                  <th className="px-6 py-4 text-right">Importe</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {verifiedSales.data.filter((s: any) => s.payment_method !== 'cash' && s.payment_method !== 'credit_client').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">No hay acreditaciones recientes para revisar.</td>
                  </tr>
                ) : (
                  verifiedSales.data
                    .filter((s: any) => s.payment_method !== 'cash' && s.payment_method !== 'credit_client')
                    .map((sale: any) => (
                    <tr key={sale.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {new Date(sale.created_at).toLocaleString('es-AR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs uppercase text-primary">{sale.payment_method.replace('_', ' ')}</span>
                          <span className="font-medium">{sale.customer?.name || sale.payer_name || 'Consumidor Final'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sale.voucher_image_url ? (
                          <a 
                            href={`${import.meta.env.VITE_API_URL}${sale.voucher_image_url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20"
                          >
                            <Download className="w-3 h-3" /> Ver Captura
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Sin imagen</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">
                        ${Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleRevertPayment(sale.id)}
                          disabled={revertPayment.isPending}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          title="Anular acreditación (volver a pendiente)"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
