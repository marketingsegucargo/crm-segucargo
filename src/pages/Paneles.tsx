import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, LayoutDashboard } from 'lucide-react'

interface Panel {
  id: string
  nombre: string
  descripcion: string | null
  compartido: boolean
  created_at: string
}

interface Metricas {
  totalLeads: number
  totalNegocios: number
  totalCotizaciones: number
}

const defaultForm = {
  nombre: '',
  descripcion: '',
  compartido: false,
}

export default function Paneles() {
  const [items, setItems] = useState<Panel[]>([])
  const [metricas, setMetricas] = useState<Metricas>({ totalLeads: 0, totalNegocios: 0, totalCotizaciones: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Panel | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchItems()
    fetchMetricas()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('paneles')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function fetchMetricas() {
    const [leads, negocios, cotizaciones] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('negocios').select('id', { count: 'exact', head: true }),
      supabase.from('quotes').select('id', { count: 'exact', head: true }),
    ])
    setMetricas({
      totalLeads: leads.count || 0,
      totalNegocios: negocios.count || 0,
      totalCotizaciones: cotizaciones.count || 0,
    })
  }

  function openNew() {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  function openEdit(item: Panel) {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      compartido: item.compartido,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = { ...form, descripcion: form.descripcion || null }
    if (editing) {
      await supabase.from('paneles').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('paneles').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este panel?')) return
    await supabase.from('paneles').delete().eq('id', id)
    fetchItems()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-[#001E5D]" size={28} />
          <h1 className="text-2xl font-bold text-[#001E5D]">Paneles de Reportes</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus size={18} /> Nuevo Panel
        </button>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-[#001E5D]">{metricas.totalLeads}</p>
          <p className="text-sm text-gray-500 mt-1">Total Leads</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-[#001E5D]">{metricas.totalNegocios}</p>
          <p className="text-sm text-gray-500 mt-1">Total Negocios</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-[#001E5D]">{metricas.totalCotizaciones}</p>
          <p className="text-sm text-gray-500 mt-1">Total Cotizaciones</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001E5D]" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <LayoutDashboard className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-400 mb-4">No hay paneles creados</p>
          <button className="btn-primary" onClick={openNew}>Crear primer panel</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#001E5D]">{item.nombre}</h3>
                    {item.compartido && (
                      <span className="badge bg-blue-100 text-blue-800 text-xs">Compartido</span>
                    )}
                  </div>
                  {item.descripcion && (
                    <p className="text-sm text-gray-500">{item.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button className="p-1 text-gray-400 hover:text-[#001E5D]" onClick={() => openEdit(item)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Métricas del panel */}
              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-[#001E5D]">{metricas.totalLeads}</p>
                  <p className="text-xs text-gray-400">Leads</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#001E5D]">{metricas.totalNegocios}</p>
                  <p className="text-xs text-gray-400">Negocios</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#001E5D]">{metricas.totalCotizaciones}</p>
                  <p className="text-xs text-gray-400">Cotiz.</p>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Creado: {new Date(item.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-lg w-full mx-4">
            <h2 className="text-lg font-bold text-[#001E5D] mb-4">
              {editing ? 'Editar Panel' : 'Nuevo Panel'}
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
              <div className="flex items-center gap-3">
                <label className="label mb-0">Compartido</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, compartido: !f.compartido }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.compartido ? 'bg-[#2AD4AE]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.compartido ? 'translate-x-6' : 'translate-x-1'}`} />
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
