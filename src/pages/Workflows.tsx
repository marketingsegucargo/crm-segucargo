import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, Zap } from 'lucide-react'

interface Workflow {
  id: string
  nombre: string
  descripcion: string | null
  trigger_tipo: string | null
  estado: 'activo' | 'pausado' | 'borrador' | null
  veces_ejecutado: number | null
  ultima_ejecucion: string | null
  created_at: string
}

const estadoBadge: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  pausado: 'bg-yellow-100 text-yellow-800',
  borrador: 'bg-gray-100 text-gray-700',
}

const triggerLabels: Record<string, string> = {
  manual: 'Manual',
  nuevo_lead: 'Nuevo lead',
  cambio_estado: 'Cambio de estado',
  formulario: 'Formulario',
  fecha: 'Por fecha',
}

const defaultForm = {
  nombre: '',
  descripcion: '',
  trigger_tipo: 'manual',
  estado: 'borrador' as Workflow['estado'],
}

export default function Workflows() {
  const [items, setItems] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  function openEdit(item: Workflow) {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      trigger_tipo: item.trigger_tipo || 'manual',
      estado: item.estado,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = { ...form, descripcion: form.descripcion || null }
    if (editing) {
      await supabase.from('workflows').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('workflows').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este workflow?')) return
    await supabase.from('workflows').delete().eq('id', id)
    fetchItems()
  }

  async function toggleEstado(item: Workflow) {
    const nuevoEstado = item.estado === 'activo' ? 'pausado' : 'activo'
    await supabase.from('workflows').update({ estado: nuevoEstado }).eq('id', item.id)
    fetchItems()
  }

  const filtered = items.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.trigger_tipo || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="text-[#001E5D]" size={28} />
          <h1 className="text-2xl font-bold text-[#001E5D]">Workflows</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus size={18} /> Nuevo Workflow
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="input pl-10 w-full max-w-sm"
            placeholder="Buscar workflows..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001E5D]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Trigger</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ejecuciones</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Última ejecución</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">No hay workflows registrados</td>
                  </tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#001E5D]">
                      <div>{item.nombre}</div>
                      {item.descripcion && <div className="text-xs text-gray-400 mt-0.5">{item.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEstado(item)} title="Activar/Pausar">
                        <span className={`badge cursor-pointer hover:opacity-80 ${estadoBadge[item.estado || ''] || 'bg-gray-100 text-gray-700'}`}>
                          {item.estado || 'borrador'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {triggerLabels[item.trigger_tipo || ''] || item.trigger_tipo || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.veces_ejecutado ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.ultima_ejecucion
                        ? new Date(item.ultima_ejecucion).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="p-1 text-gray-500 hover:text-[#001E5D]" onClick={() => openEdit(item)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1 text-gray-500 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-lg w-full mx-4">
            <h2 className="text-lg font-bold text-[#001E5D] mb-4">
              {editing ? 'Editar Workflow' : 'Nuevo Workflow'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre *</label>
                <input className="input w-full" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea className="input w-full h-20 resize-none" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div>
                <label className="label">Trigger</label>
                <select className="input w-full" value={form.trigger_tipo} onChange={e => setForm(f => ({ ...f, trigger_tipo: e.target.value }))}>
                  <option value="manual">Manual</option>
                  <option value="nuevo_lead">Nuevo lead</option>
                  <option value="cambio_estado">Cambio de estado</option>
                  <option value="formulario">Formulario</option>
                  <option value="fecha">Por fecha</option>
                </select>
              </div>
              <div>
                <label className="label">Estado inicial</label>
                <select className="input w-full" value={form.estado || 'borrador'} onChange={e => setForm(f => ({ ...f, estado: e.target.value as Workflow['estado'] }))}>
                  <option value="borrador">Borrador</option>
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
