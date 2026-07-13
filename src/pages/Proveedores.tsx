import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, Truck } from 'lucide-react'
import PhoneInput from '../components/ui/PhoneInput'

interface Proveedor {
  id: string
  nombre: string
  rut: string | null
  pais: string | null
  ciudad: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  contacto_telefono: string | null
  servicio: string | null
  calificacion: number | null
  activo: boolean
  created_at: string
}

const defaultForm = {
  nombre: '',
  rut: '',
  pais: '',
  ciudad: '',
  contacto_nombre: '',
  contacto_email: '',
  contacto_telefono: '',
  servicio: '',
  calificacion: 3,
  activo: true,
}

function Stars({ value }: { value: number | null }) {
  if (!value) return <span className="text-gray-400">—</span>
  return (
    <span className="text-yellow-500">
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  )
}

export default function Proveedores() {
  const [items, setItems] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('proveedores')
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

  function openEdit(item: Proveedor) {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      rut: item.rut || '',
      pais: item.pais || '',
      ciudad: item.ciudad || '',
      contacto_nombre: item.contacto_nombre || '',
      contacto_email: item.contacto_email || '',
      contacto_telefono: item.contacto_telefono || '',
      servicio: item.servicio || '',
      calificacion: item.calificacion ?? 3,
      activo: item.activo,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from('proveedores').update(form).eq('id', editing.id)
    } else {
      await supabase.from('proveedores').insert(form)
    }
    setSaving(false)
    setShowModal(false)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return
    await supabase.from('proveedores').delete().eq('id', id)
    fetchItems()
  }

  const filtered = items.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.servicio || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck className="text-[#001E5D]" size={28} />
          <h1 className="text-2xl font-bold text-[#001E5D]">Proveedores</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="input pl-10 w-full max-w-sm"
            placeholder="Buscar proveedores..."
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">País</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Servicio</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Calificación</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contacto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">No hay proveedores registrados</td>
                  </tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#001E5D]">{item.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{item.pais || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.servicio || '—'}</td>
                    <td className="px-4 py-3"><Stars value={item.calificacion} /></td>
                    <td className="px-4 py-3 text-gray-600">{item.contacto_nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${item.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {item.activo ? 'Activo' : 'Inactivo'}
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
              {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre *</label>
                <input className="input w-full" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">RUT</label>
                  <input className="input w-full" value={form.rut} onChange={e => setForm(f => ({ ...f, rut: e.target.value }))} />
                </div>
                <div>
                  <label className="label">País</label>
                  <input className="input w-full" value={form.pais} onChange={e => setForm(f => ({ ...f, pais: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ciudad</label>
                  <input className="input w-full" value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Servicio</label>
                  <input className="input w-full" value={form.servicio} onChange={e => setForm(f => ({ ...f, servicio: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Contacto Nombre</label>
                <input className="input w-full" value={form.contacto_nombre} onChange={e => setForm(f => ({ ...f, contacto_nombre: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contacto Email</label>
                  <input className="input w-full" type="email" value={form.contacto_email} onChange={e => setForm(f => ({ ...f, contacto_email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Contacto Teléfono</label>
                  <PhoneInput value={form.contacto_telefono || ''} onChange={v => setForm(f => ({ ...f, contacto_telefono: v }))} />
                </div>
              </div>
              <div>
                <label className="label">Calificación (1-5)</label>
                <input
                  className="input w-full"
                  type="number"
                  min={1}
                  max={5}
                  value={form.calificacion}
                  onChange={e => setForm(f => ({ ...f, calificacion: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="label mb-0">Activo</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.activo ? 'bg-[#2AD4AE]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
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
