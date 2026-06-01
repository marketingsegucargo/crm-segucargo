import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Video, Link, Info, Plus, Trash2 } from 'lucide-react'

interface Profile {
  id: string
  nombre: string
  apellido: string
  email: string
}

interface ReuniónFormProps {
  onClose: () => void
  onSaved: () => void
  editing?: Record<string, unknown> | null
}

const DURACIONES = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
]

const ESTADOS = [
  { value: 'programada', label: 'Programada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
]

const defaultForm = {
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  duracion_minutos: 60,
  participantes: [] as string[],
  ejecutivo_id: '',
  estado: 'programada',
  teams_link: '',
}

export default function ReuniónForm({ onClose, onSaved, editing }: ReuniónFormProps) {
  const [form, setForm] = useState(defaultForm)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [nuevoParticipante, setNuevoParticipante] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfiles()
    if (editing) {
      setForm({
        titulo: (editing.titulo as string) ?? '',
        descripcion: (editing.descripcion as string) ?? '',
        fecha_inicio: editing.fecha_inicio
          ? new Date(editing.fecha_inicio as string).toISOString().slice(0, 16)
          : '',
        duracion_minutos: (editing.duracion_minutos as number) ?? 60,
        participantes: Array.isArray(editing.participantes)
          ? (editing.participantes as string[])
          : [],
        ejecutivo_id: (editing.ejecutivo_id as string) ?? '',
        estado: (editing.estado as string) ?? 'programada',
        teams_link: (editing.teams_link as string) ?? '',
      })
    }
  }, [editing])

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('id, nombre, apellido, email').order('nombre')
    if (data) setProfiles(data)
  }

  function generarLinkTeams() {
    const ejecutivo = profiles.find(p => p.id === form.ejecutivo_id)
    if (ejecutivo) {
      const link = `https://teams.microsoft.com/l/call/0/0?users=${encodeURIComponent(ejecutivo.email)}`
      setForm(f => ({ ...f, teams_link: link }))
    } else if (form.participantes.length > 0) {
      const usuarios = form.participantes.map(encodeURIComponent).join(',')
      const link = `https://teams.microsoft.com/l/call/0/0?users=${usuarios}`
      setForm(f => ({ ...f, teams_link: link }))
    }
  }

  function agregarParticipante() {
    const email = nuevoParticipante.trim()
    if (!email) return
    if (form.participantes.includes(email)) return
    setForm(f => ({ ...f, participantes: [...f.participantes, email] }))
    setNuevoParticipante('')
  }

  function quitarParticipante(email: string) {
    setForm(f => ({ ...f, participantes: f.participantes.filter(p => p !== email) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo || !form.fecha_inicio) {
      setError('Completa los campos obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      fecha_inicio: new Date(form.fecha_inicio).toISOString(),
      duracion_minutos: form.duracion_minutos,
      participantes: form.participantes,
      ejecutivo_id: form.ejecutivo_id || null,
      estado: form.estado,
      teams_link: form.teams_link || null,
    }
    let err
    if (editing?.id) {
      ;({ error: err } = await supabase.from('reuniones').update(payload).eq('id', editing.id))
    } else {
      ;({ error: err } = await supabase.from('reuniones').insert(payload))
    }
    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#001E5D] rounded-t-xl">
          <h2 className="text-lg font-semibold text-white">
            {editing ? 'Editar reunión' : 'Nueva reunión'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Reunión de presentación"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              placeholder="Agenda u observaciones..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40 resize-none"
            />
          </div>

          {/* Fecha y duración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y hora inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
              <select
                value={form.duracion_minutos}
                onChange={e => setForm(f => ({ ...f, duracion_minutos: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40"
              >
                {DURACIONES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ejecutivo y Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ejecutivo asignado</label>
              <select
                value={form.ejecutivo_id}
                onChange={e => setForm(f => ({ ...f, ejecutivo_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40"
              >
                <option value="">— Sin asignar —</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40"
              >
                {ESTADOS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Participantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Participantes (emails)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={nuevoParticipante}
                onChange={e => setNuevoParticipante(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarParticipante() } }}
                placeholder="email@ejemplo.com"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40"
              />
              <button
                type="button"
                onClick={agregarParticipante}
                className="px-3 py-2 bg-[#001E5D] text-white rounded-lg hover:bg-[#002a7a] text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.participantes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.participantes.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 rounded-full px-3 py-1 text-xs"
                  >
                    {email}
                    <button type="button" onClick={() => quitarParticipante(email)}>
                      <Trash2 className="w-3 h-3 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Videoconferencia */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#001E5D]" />
              <span className="text-sm font-medium text-gray-700">Videoconferencia</span>
            </div>

            {/* Instrucciones Teams */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-xs text-blue-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Cómo crear una reunión en Teams:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Haz clic en "Abrir Teams" para iniciar una llamada rápida.</li>
                  <li>O crea la reunión en tu <strong>calendario de Teams/Outlook</strong> y pega el enlace abajo.</li>
                  <li>Para reuniones programadas con invitación, usa el calendario de Microsoft.</li>
                </ol>
              </div>
            </div>

            {/* Botón Teams */}
            <button
              type="button"
              onClick={generarLinkTeams}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#6264A7] text-white rounded-lg text-sm hover:bg-[#4f5192] transition-colors"
            >
              <Video className="w-4 h-4" />
              Abrir Teams (llamada ad-hoc)
            </button>

            {/* Link manual */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Link className="w-3 h-3 inline mr-1" />
                Pegar link de reunión (Teams / Zoom / Google Meet)
              </label>
              <input
                type="url"
                value={form.teams_link}
                onChange={e => setForm(f => ({ ...f, teams_link: e.target.value }))}
                placeholder="https://teams.microsoft.com/l/meetup-join/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#001E5D]/40"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-[#001E5D] text-white rounded-lg hover:bg-[#002a7a] disabled:opacity-60"
            >
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear reunión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
