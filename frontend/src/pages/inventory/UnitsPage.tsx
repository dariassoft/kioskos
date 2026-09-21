import { useState } from 'react'
import { Plus, Pencil, Trash2, Ruler } from 'lucide-react'
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '@hooks/useInventory'
import type { Unit } from '@api/inventory.types'

export default function UnitsPage() {
  const { data: units = [], isLoading } = useUnits()
  const create = useCreateUnit(); const update = useUpdateUnit(); const remove = useDeleteUnit()
  const [editing, setEditing] = useState<Unit | null>(null); const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState(''); const [abbreviation, setAbbreviation] = useState('')
  const open = (unit?: Unit) => { setEditing(unit ?? null); setName(unit?.name ?? ''); setAbbreviation(unit?.abbreviation ?? ''); setShowModal(true) }
  const close = () => { setEditing(null); setName(''); setAbbreviation(''); setShowModal(false) }
  const save = () => { const data = { name, abbreviation }; editing ? update.mutate({ id: editing.id, data }, { onSuccess: close }) : create.mutate(data, { onSuccess: close }) }
  const del = (unit: Unit) => { if (window.confirm(`¿Eliminar la unidad ${unit.name}? Los productos quedarán sin unidad.`)) remove.mutate(unit.id) }
  return <div className="space-y-4">
    <div className="flex justify-between items-center"><p className="text-sm text-muted-foreground">{units.length} unidades</p><button onClick={() => open()} className="flex gap-2 items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"><Plus className="w-4 h-4" />Nueva unidad</button></div>
    <div className="bg-card border border-border rounded-xl divide-y divide-border">{isLoading ? <p className="p-6 text-center">Cargando...</p> : units.map((unit: Unit) => <div key={unit.id} className="p-4 flex items-center gap-3"><Ruler className="w-5 h-5 text-primary" /><div className="flex-1"><b>{unit.name}</b><span className="ml-2 text-sm text-muted-foreground">{unit.abbreviation || 'Sin abreviatura'}</span></div><button onClick={() => open(unit)} className="p-2 hover:bg-accent rounded"><Pencil className="w-4 h-4" /></button><button onClick={() => del(unit)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="w-4 h-4" /></button></div>)}</div>
    {showModal && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="bg-card p-6 rounded-2xl w-full max-w-sm space-y-4"><h2 className="font-bold">{editing ? 'Editar unidad' : 'Nueva unidad'}</h2><input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="w-full px-3 py-2 border border-border rounded-lg" autoFocus /><input value={abbreviation} onChange={e => setAbbreviation(e.target.value)} placeholder="Abreviatura" className="w-full px-3 py-2 border border-border rounded-lg" /><div className="flex gap-2"><button onClick={close} className="flex-1 py-2 border rounded-lg">Cancelar</button><button disabled={!name.trim()} onClick={save} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg">Guardar</button></div></div></div>}
  </div>
}
