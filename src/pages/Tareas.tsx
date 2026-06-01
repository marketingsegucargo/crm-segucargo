import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Trash2, CheckSquare, AlertCircle } from 'lucide-react'
import TareaSlidePanel from '../components/tareas/TareaSlidePanel'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tarea {
  id: string
  titulo: string
  descripcion: string | null
  asignado_a: string | null
  prioridad: 'baja' | 'media' | 'alta' | 'urgente' | null
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada' | null
  fecha_vencimiento: string | null
  lead_relacionado?: string | null
  contacto_relacionado?: string | null
  profiles?: { nombre: string; apellido: string | null } | null
  created_at: string
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const prioridadStyle: Record<string, { badge: string; label: string }> = {
  baja:    { badge: 'bg-gray-100 text-gray-600',      label: 'Baja' },
  media:   { badge: 'bg-blue-100 text-blue-700',      label: 'Media' },
  alta:    { badge: 'bg-orange-100 text-orange-700',  label: 'Alta' },
  urgente: { badge: 'bg-red-100 text-red-700',        label: 'Urgente' },
}

const estadoStyle: Record<string, { badge: string; label: string }> = {
  pendiente:   { badge: 'bg-gray-100 text-gray-600',   label: 'Pendiente' },
  en_progreso: { badge: 'bg-blue-100 text-blue-700',   label: 'En progreso' },
  completada:  { badge: 'bg-green-100 text-green-700', label: 'Completada' },
  cancelada:   { badge: 'bg-red-100 text-red-600',     label: 'Cancelada' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isVencida(fecha: string | null, estado: string | null): boolean {
  if (!fecha || estado === 'completada' || estado === 'cancelada') return false
  return new Date(fecha) < new Date()
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Tareas() {
  const [items, setItems]           = useState<Tarea[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState('')

  // Slide panel
  const [panelOpen, setPanelOpen]   = useState(false)
  const [panelTarea, setPanelTarea] = useState<Tarea | null>(null)
  const [panelIsNew, setPanelIsNew] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  // ── Data ───────────────────────────────────────────────────────────────────

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('tareas')
      .select('*, profiles!asignado_a(nombre, apellido)')
      .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    setItems(data || [])
    setLoading(false)
  }

  async function toggleCompletada(item: Tarea) {
    const nuevoEstado = item.estado === 'completada' ? 'pendiente' : 'completada'
    await supabase.from('tareas').update({ estado: nuevoEstado }).eq('id', item.id)
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, estado: nuevoEstado } : i))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tareas').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  // ── Panel helpers ──────────────────────────────────────────────────────────

  function openNew() {
    setPanelTarea(null)
    setPanelIsNew(true)
    setPanelOpen(true)
  }

  function openEdit(tarea: Tarea) {
    setPanelTarea(tarea)
    setPanelIsNew(false)
    setPanelOpen(true)
  }

  function handlePanelSaved() {
    setPanelOpen(false)
    fetchItems()
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchSearch    = i.titulo.toLowerCase().includes(q)
    const matchEstado    = filterEstado    ? i.estado    === filterEstado    : true
    const matchPrioridad = filterPrioridad ? i.prioridad === filterPrioridad : true
    return matchSearch && matchEstado && matchPrioridad
  })

  // Count by state for header
  const pendientes  = items.filter(i => i.estado === 'pendiente' || i.estado === 'en_progreso').length
  const vencidas    = items.filter(i => isVencida(i.fecha_vencimiento, i.estado)).length

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckSquare className="text-[#001E5D]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-[#001E5D]">Tareas</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-gray-500">{pendientes} activas</span>
              {vencidas > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertCircle size={12} /> {vencidas} vencida{vencidas > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus size={18} /> Nueva tarea
        </button>
      </div>

      {/* Toolbar */}
      <div className="card mb-5 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input pl-9 w-full"
            placeholder="Buscar tareas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-44"
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select
          className="input w-44"
          value={filterPrioridad}
          onChange={e => setFilterPrioridad(e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      {/* Table */}
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
                  <th className="px-4 py-3 w-8"></th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Título</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Prioridad</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vencimiento</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Propietario</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      No hay tareas que coincidan
                    </td>
                  </tr>
                ) : filtered.map(item => {
                  const vencida   = isVencida(item.fecha_vencimiento, item.estado)
                  const completada = item.estado === 'completada'
                  const pStyle    = item.prioridad ? prioridadStyle[item.prioridad] : null
                  const eStyle    = item.estado    ? estadoStyle[item.estado]       : null

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 transition-colors ${
                        vencida
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'hover:bg-gray-50'
                      } ${completada ? 'opacity-60' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={completada}
                          onChange={() => toggleCompletada(item)}
                          className="w-4 h-4 accent-[#001E5D] cursor-pointer"
                        />
                      </td>

                      {/* Título */}
                      <td className="px-4 py-3 max-w-xs">
                        <button
                          className={`text-left font-medium text-[#001E5D] hover:underline ${completada ? 'line-through text-gray-400' : ''}`}
                          onClick={() => openEdit(item)}
                        >
                          {item.titulo}
                        </button>
                        {item.descripcion && (
                          <p className="text-xs text-gray-400 truncate max-w-[220px] mt-0.5">{item.descripcion}</p>
                        )}
                      </td>

                      {/* Prioridad */}
                      <td className="px-4 py-3">
                        {pStyle ? (
                          <span className={`badge ${pStyle.badge}`}>{pStyle.label}</span>
                        ) : '—'}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        {eStyle ? (
                          <span className={`badge ${eStyle.badge}`}>{eStyle.label}</span>
                        ) : '—'}
                      </td>

                      {/* Vencimiento */}
                      <td className="px-4 py-3">
                        {item.fecha_vencimiento ? (
                          <span className={`text-xs font-medium ${vencida ? 'text-red-600' : 'text-gray-600'}`}>
                            {vencida && <AlertCircle size={11} className="inline mr-1 -mt-0.5" />}
                            {new Date(item.fecha_vencimiento).toLocaleDateString('es-CL')}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Propietario */}
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {item.profiles
                          ? `${item.profiles.nombre} ${item.profiles.apellido || ''}`.trim()
                          : '—'}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide Panel */}
      {panelOpen && (
        <TareaSlidePanel
          tarea={panelTarea}
          isNew={panelIsNew}
          onClose={() => setPanelOpen(false)}
          onSaved={handlePanelSaved}
        />
      )}
    </div>
  )
}
