import { useState } from 'react';
import { BookOpen, Calendar, ArrowUpRight, ArrowDownRight, RefreshCcw, Download } from 'lucide-react';
import { useLedger } from '@hooks/useAccounting';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AccountingPage() {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // Primer día del mes
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Hoy

  const { data: ledger = [], isLoading, refetch } = useLedger(startDate, endDate);

  // Calcular totales
  const totalDebit = ledger.reduce((acc: number, entry: any) => acc + Number(entry.debit), 0);
  const totalCredit = ledger.reduce((acc: number, entry: any) => acc + Number(entry.credit), 0);
  const balance = totalDebit - totalCredit; // Si es positivo, activo neto aumenta

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Libro Diario - Kioskos & Despenzas', 14, 20);

    doc.setFontSize(10);
    doc.text(`Periodo: ${startDate} al ${endDate}`, 14, 28);
    doc.text(`Balance Total: $${Math.abs(balance).toLocaleString('es-AR')} ${balance >= 0 ? '(Favor)' : '(Contra)'}`, 14, 34);

    const tableColumn = ["Fecha", "Descripción", "Cuenta", "Debe", "Haber"];
    const tableRows = ledger.map((entry: any) => [
      new Date(entry.date).toLocaleString('es-AR'),
      entry.description,
      entry.account_name,
      Number(entry.debit) > 0 ? `$${Number(entry.debit).toLocaleString('es-AR')}` : '-',
      Number(entry.credit) > 0 ? `$${Number(entry.credit).toLocaleString('es-AR')}` : '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`Libro_Diario_${startDate}_${endDate}.pdf`);
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
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border border-border text-sm rounded-lg px-3 py-2 text-foreground outline-none"
              />
              <span className="text-muted-foreground font-medium">al</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border border-border text-sm rounded-lg px-3 py-2 text-foreground outline-none"
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

      </div>
    </>
  );
}
