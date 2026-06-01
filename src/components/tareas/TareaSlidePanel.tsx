import { useState, useEffect } from 'react'
import { X, Save, CheckSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  nombre: string
  apellido: string | null
}

interface TareaForm {
  titulo: string
  descripcion: string
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
  fecha_vencimiento: string
  asignado_a: string
  lead_relacionado: string
  contacto_relacionado: string
}

interface Tarea {
  id: string
  titulo: string
  descripcion: string | null
  prioridad: TareaForm['prioridad'] | null
  estado: TareaForm['estado'] | null
  fecha_vencimiento: string | null
  asignado_a: string | null
  lead_relacionado?: string | null
  contacto_relacionado?: string | null
}

interface Props {
  tarea: Tarea | null
  isNew?: boolean
  onClose: () => void
  onSaved: () => void
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const defaultForm: TareaForm = {
  titulo: '',
  descripcion: '',
  prioridad: 'media',
  estado: 'pendiente',
  fecha_vencimiento: '',
  asignado_a: '',
  lead_relacionado: '',
  contacto_relacionado: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TareaSlidePanel({ tarea, isNew = false, onClose, onSaved }: Props) {
  const [form, setForm]         = useState<TareaForm>(defaultForm)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, nombre, apellido')
      .eq('activo', true)
      .then(({ data }) => setProfiles(data || []))
  }, [])

  useEffect(() => {
    if (tarea && !isNew) {
      setForm({
        titulo:               tarea.titulo,
        descripcion:          tarea.descripcion || '',
        prioridad:            tarea.prioridad || 'media',
        estado:               tarea.estado || 'pendiente',
        fecha_vencimiento:    tarea.fecha_vencimiento || '',
        asignado_a:           tarea.asignado_a || '',
        lead_relacionado:     tarea.lead_relacionado || '',
        contacto_relacionado: tarea.contacto_relacionado || '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [tarea, isNew])

  function set<K extends keyof TareaForm>(field: K, value: TareaForm[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true)
    const payload = {
      titulo:               form.titulo,
      descripcion:          form.descripcion || null,
      prioridad:            form.prioridad,
      estado:               form.estado,
      fecha_vencimiento:    form.fecha_vencimiento || null,
      asignado_a:           form.asignado_a || null,
      lead_relacionado:     form.lead_relacionado || null,
      contacto_relacionado: form.contacto_relacionado || null,
    }
    if (tarea && !isNew) {
      await supabase.from('tareas').update(payload).eq('id', tarea.id)
    } else {
      await supabase.from('tareas').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  if (!tarea && !isNew) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-[#001E5D]" size={20} />
            <h2 className="text-base font-bold text-[#001E5D]">
              {isNew ? 'Nueva tarea' : 'Editar tarea'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.titulo.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#001E5D' }}
            >
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Título */}
          <div>
            <label className="label">Título *</label>
            <input
              className="input w-full"
              placeholder="Nombre de la tarea..."
              value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input w-full resize-none"
              rows={3}
              placeholder="Detalle de la tarea..."
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
            />
          </div>

          {/* Prioridad + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prioridad</label>
              <select
                className="input w-full"
                value={form.prioridad}
                onChange={e => set('prioridad', e.target.value as TareaForm['prioridad'])}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input w-full"
                value={form.estado}
                onChange={e => set('estado', e.target.value as TareaForm['estado'])}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Fecha vencimiento */}
          <div>
            <label className="label">Fecha vencimiento</label>
            <input
              className="input w-full"
              type="date"
              value={form.fecha_vencimiento}
              onChange={e => set('fecha_vencimiento', e.target.value)}
            />
          </div>

          {/* Propietario */}
          <div>
            <label className="label">Propietario</label>
            <select
              className="input w-full"
              value={form.asignado_a}
              onChange={e => set('asignado_a', e.target.value)}
            >
              <option value="">Sin asignar</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Lead relacionado */}
          <div>
            <label className="label">Lead relacionado</label>
            <input
              className="input w-full"
              placeholder="Nombre del lead o ID..."
              value={form.lead_relacionado}
              onChange={e => set('lead_relacionado', e.target.value)}
            />
          </div>

          {/* Contacto relacionado */}
          <div>
            <label className="label">Contacto relacionado</label>
            <input
              className="input w-full"
              placeholder="Nombre del contacto o ID..."
              value={form.contacto_relacionado}
              onChange={e => set('contacto_relacionado', e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.titulo.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#001E5D' }}
          >
            <Save size={14} />
            {saving ? 'Guardando...' : 'Guardar tarea'}
          </button>
        </div>
      </div>
    </>
  )
}
