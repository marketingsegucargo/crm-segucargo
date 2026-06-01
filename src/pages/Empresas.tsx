import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, Building2 } from 'lucide-react'
import ModuleFilters from '../components/common/ModuleFilters'

interface Empresa {
  id: string
  nombre: string
  rut: string | null
  industria: string | null
  pais: string | null
  ciudad: string | null
  email: string | null
  telefono: string | null
  sitio_web: string | null
  tipo: 'cliente' | 'proveedor' | 'prospecto' | 'socio' | null
  notas: string | null
  created_at: string
}

const defaultForm: Omit<Empresa, 'id' | 'created_at'> = {
  nombre: '',
  rut: '',
  industria: '',
  pais: '',
  ciudad: '',
  email: '',
  telefono: '',
  sitio_web: '',
  tipo: null,
  notas: '',
}

const tipoBadge: Record<string, string> = {
  cliente: 'bg-green-100 text-green-800',
  proveedor: 'bg-blue-100 text-blue-800',
  prospecto: 'bg-yellow-100 text-yellow-800',
  socio: 'bg-purple-100 text-purple-800',
}

export default function Empresas() {
  const [items, setItems] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Empresa | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('empresas')
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

  function openEdit(item: Empresa) {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      rut: item.rut || '',
      industria: item.industria || '',
      pais: item.pais || '',
      ciudad: item.ciudad || '',
      email: item.email || '',
      telefono: item.telefono || '',
      sitio_web: item.sitio_web || '',
      tipo: item.tipo,
      notas: item.notas || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = { ...form }
    if (editing) {
      await supabase.from('empresas').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('empresas').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta empresa?')) return
    await supabase.from('empresas').delete().eq('id', id)
    fetchItems()
  }

  const filtered = items.filter(i => {
    const matchSearch = i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (i.email || '').toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const record = i as unknown as Record<string, unknown>
      if (String(record[key] ?? '') !== value) return false
    }
    return true
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="text-[#001E5D]" size={28} />
          <h1 className="text-2xl font-bold text-[#001E5D]">Empresas</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus size={18} /> Nueva Empresa
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="input pl-10 w-full max-w-sm"
              placeholder="Buscar empresas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ModuleFilters
            modulo="empresas"
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({})}
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">RUT</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Industria</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">País</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">No hay empresas registradas</td>
                  </tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#001E5D]">{item.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{item.rut || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.industria || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.pais || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.email || '—'}</td>
                    <td className="px-4 py-3">
                      {item.tipo ? (
                        <span className={`badge ${tipoBadge[item.tipo] || 'bg-gray-100 text-gray-700'}`}>
                          {item.tipo}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="p-1 text-gray-500 hover:text-[#001E5D]"
                          onClick={() => openEdit(item)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="p-1 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(item.id)}
                        >
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
              {editing ? 'Editar Empresa' : 'Nueva Empresa'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre *</label>
                <input className="input w-full" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">RUT</label>
                  <input className="input w-full" value={form.rut || ''} onChange={e => setForm(f => ({ ...f, rut: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Industria</label>
                  <input className="input w-full" value={form.industria || ''} onChange={e => setForm(f => ({ ...f, industria: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">País</label>
                  <input className="input w-full" value={form.pais || ''} onChange={e => setForm(f => ({ ...f, pais: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Ciudad</label>
                  <input className="input w-full" value={form.ciudad || ''} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input className="input w-full" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input className="input w-full" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Sitio Web</label>
                <input className="input w-full" value={form.sitio_web || ''} onChange={e => setForm(f => ({ ...f, sitio_web: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input w-full" value={form.tipo || ''} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Empresa['tipo'] }))}>
                  <option value="">Seleccionar tipo...</option>
                  <option value="cliente">Cliente</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="prospecto">Prospecto</option>
                  <option value="socio">Socio</option>
                </select>
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea className="input w-full h-20 resize-none" value={form.notas || ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
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
