import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { operationsService } from '../services/operations'
import { OPERATION_STATUS_LABELS, SERVICE_LABELS } from '../lib/constants'
import { formatDate } from '../lib/utils'
import type { Operation } from '../types'

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  en_transito: 'bg-blue-100 text-blue-700',
  en_aduana: 'bg-purple-100 text-purple-700',
  entregado: 'bg-green-100 text-green-700',
  cerrado: 'bg-gray-100 text-gray-600',
}

interface OpForm {
  numero_operacion: string
  estado: string
  servicio: string
  origen: string
  destino: string
  fecha_embarque: string
  fecha_eta: string
  nombre_carga: string
  peso: string
  volumen: string
  bultos: string
  naviera: string
  bl_numero: string
  contenedor: string
  notas: string
}

const emptyForm: OpForm = {
  numero_operacion: '', estado: 'pendiente', servicio: '', origen: '', destino: '',
  fecha_embarque: '', fecha_eta: '', nombre_carga: '', peso: '', volumen: '', bultos: '',
  naviera: '', bl_numero: '', contenedor: '', notas: '',
}

export default function Operations() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editOp, setEditOp] = useState<Operation | null>(null)
  const [form, setForm] = useState<OpForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await operationsService.getAll()
      const filtered = search
        ? data.filter(o =>
            o.numero_operacion?.toLowerCase().includes(search.toLowerCase()) ||
            o.nombre_carga?.toLowerCase().includes(search.toLowerCase()) ||
            (o.lead as { nombre?: string })?.nombre?.toLowerCase().includes(search.toLowerCase())
          )
        : data
      setOperations(filtered)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  function openCreate() {
    setForm(emptyForm)
    setEditOp(null)
    setShowForm(true)
  }

  function openEdit(op: Operation) {
    setEditOp(op)
    setForm({
      numero_operacion: op.numero_operacion || '',
      estado: op.estado || 'pendiente',
      servicio: op.servicio || '',
      origen: op.origen || '',
      destino: op.destino || '',
      fecha_embarque: op.fecha_embarque || '',
      fecha_eta: op.fecha_eta || '',
      nombre_carga: op.nombre_carga || '',
      peso: op.peso?.toString() || '',
      volumen: op.volumen?.toString() || '',
      bultos: op.bultos?.toString() || '',
      naviera: op.naviera || '',
      bl_numero: op.bl_numero || '',
      contenedor: op.contenedor || '',
      notas: op.notas || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        peso: form.peso ? Number(form.peso) : undefined,
        volumen: form.volumen ? Number(form.volumen) : undefined,
        bultos: form.bultos ? Number(form.bultos) : undefined,
      }
      if (editOp) {
        await operationsService.update(editOp.id, payload as Partial<Operation>)
      } else {
        await operationsService.create(payload as Parameters<typeof operationsService.create>[0])
      }
      setShowForm(false)
      load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta operación?')) return
    await operationsService.delete(id)
    load()
  }

  const f = (k: keyof OpForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">{operations.length} operaciones activas</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva operación
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar operaciones..." className="input pl-9" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center h-48 items-center">
            <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : operations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron operaciones</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Operación</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Carga / Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Servicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ruta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ETA</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {operations.map(op => (
                <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700">{op.numero_operacion}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{op.nombre_carga || '—'}</p>
                    {(op.lead as { nombre?: string })?.nombre && (
                      <p className="text-xs text-gray-400">{(op.lead as { nombre: string }).nombre}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{SERVICE_LABELS[op.servicio as keyof typeof SERVICE_LABELS] || op.servicio || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {op.origen && op.destino ? `${op.origen} → ${op.destino}` : op.origen || op.destino || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={OPERATION_STATUS_LABELS[op.estado as keyof typeof OPERATION_STATUS_LABELS] || op.estado} className={STATUS_COLORS[op.estado] || 'bg-gray-100 text-gray-600'} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{op.fecha_eta ? formatDate(op.fecha_eta) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(op)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(op.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editOp ? 'Editar Operación' : 'Nueva Operación'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">N° Operación *</label>
              <input value={form.numero_operacion} onChange={f('numero_operacion')} className="input" placeholder="OP-2024-001" />
            </div>
            <div>
              <label className="label">Estado</label>
              <select value={form.estado} onChange={f('estado')} className="input">
                <option value="pendiente">Pendiente</option>
                <option value="en_transito">En tránsito</option>
                <option value="en_aduana">En aduana</option>
                <option value="entregado">Entregado</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Servicio</label>
              <select value={form.servicio} onChange={f('servicio')} className="input">
                <option value="">-</option>
                <option value="maritimo_import">Marítimo Importación</option>
                <option value="maritimo_export">Marítimo Exportación</option>
                <option value="aereo_import">Aéreo Importación</option>
                <option value="aereo_export">Aéreo Exportación</option>
                <option value="terrestre">Terrestre</option>
                <option value="china_import">China Importación</option>
                <option value="mudanza">Mudanza Internacional</option>
              </select>
            </div>
            <div>
              <label className="label">Nombre de la carga</label>
              <input value={form.nombre_carga} onChange={f('nombre_carga')} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Origen</label>
              <input value={form.origen} onChange={f('origen')} className="input" placeholder="Puerto/ciudad origen" />
            </div>
            <div>
              <label className="label">Destino</label>
              <input value={form.destino} onChange={f('destino')} className="input" placeholder="Puerto/ciudad destino" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha embarque</label>
              <input type="date" value={form.fecha_embarque} onChange={f('fecha_embarque')} className="input" />
            </div>
            <div>
              <label className="label">ETA (fecha estimada llegada)</label>
              <input type="date" value={form.fecha_eta} onChange={f('fecha_eta')} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Peso (kg)</label>
              <input type="number" value={form.peso} onChange={f('peso')} className="input" />
            </div>
            <div>
              <label className="label">Volumen (m³)</label>
              <input type="number" value={form.volumen} onChange={f('volumen')} className="input" />
            </div>
            <div>
              <label className="label">Bultos</label>
              <input type="number" value={form.bultos} onChange={f('bultos')} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Naviera / Aerolínea</label>
              <input value={form.naviera} onChange={f('naviera')} className="input" />
            </div>
            <div>
              <label className="label">BL / AWB</label>
              <input value={form.bl_numero} onChange={f('bl_numero')} className="input" />
            </div>
            <div>
              <label className="label">Contenedor</label>
              <input value={form.contenedor} onChange={f('contenedor')} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea value={form.notas} onChange={f('notas')} className="input resize-none" rows={2} />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.numero_operacion} className="btn-primary">
              {saving ? 'Guardando...' : editOp ? 'Actualizar' : 'Crear operación'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
