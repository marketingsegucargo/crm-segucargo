import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, FileCode } from 'lucide-react'

interface Fragmento {
  id: string
  nombre: string
  atajo: string | null
  contenido: string
  compartido: boolean
  created_at: string
}

const defaultForm = {
  nombre: '',
  atajo: '#',
  contenido: '',
  compartido: false,
}

export default function Fragmentos() {
  const [items, setItems] = useState<Fragmento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Fragmento | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('fragmentos')
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

  function openEdit(item: Fragmento) {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      atajo: item.atajo || '#',
      contenido: item.contenido,
      compartido: item.compartido,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.contenido.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from('fragmentos').update(form).eq('id', editing.id)
    } else {
      await supabase.from('fragmentos').insert(form)
    }
    setSaving(false)
    setShowModal(false)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este fragmento?')) return
    await supabase.from('fragmentos').delete().eq('id', id)
    fetchItems()
  }

  const filtered = items.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.atajo || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileCode className="text-[#001E5D]" size={28} />
          <h1 className="text-2xl font-bold text-[#001E5D]">Fragmentos</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus size={18} /> Nuevo Fragmento
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="input pl-10 w-full max-w-sm"
            placeholder="Buscar fragmentos..."
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Atajo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vista previa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Compartido</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">No hay fragmentos registrados</td>
                  </tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#001E5D]">{item.nombre}</td>
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">{item.atajo || '—'}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{item.contenido}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${item.compartido ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {item.compartido ? 'Compartido' : 'Privado'}
                      </span>
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
          <div className="card max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#001E5D] mb-4">
              {editing ? 'Editar Fragmento' : 'Nuevo Fragmento'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre *</label>
                <input className="input w-full" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="label">Atajo (prefijo #)</label>
                <input
                  className="input w-full"
                  value={form.atajo}
                  onChange={e => {
                    let val = e.target.value
                    if (!val.startsWith('#')) val = '#' + val.replace(/^#*/, '')
                    setForm(f => ({ ...f, atajo: val }))
                  }}
                  placeholder="#mi_atajo"
                />
              </div>
              <div>
                <label className="label">Contenido *</label>
                <textarea
                  className="input w-full h-40 resize-none font-mono text-sm"
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  placeholder="Escribe el texto del fragmento aquí..."
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="label mb-0">Compartido</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, compartido: !f.compartido }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.compartido ? 'bg-[#2AD4AE]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.compartido ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-500">{form.compartido ? 'Visible para todos' : 'Solo para ti'}</span>
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
