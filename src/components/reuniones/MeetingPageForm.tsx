import { useState, useEffect } from 'react'
import { X, Info, Video, Copy, Check, ChevronLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Profile {
  id: string
  nombre: string
  apellido: string
  email: string
}

interface MeetingPage {
  id?: string
  nombre_interno: string
  organizador_id: string | null
  titulo_evento: string | null
  ubicacion: string | null
  video_link: string | null
  descripcion: string | null
  tipo: 'personalizada' | 'grupo' | 'rotacion'
  duraciones: number[]
  slug: string
  activo: boolean
  cancelar_reprogramar: boolean
}

interface Props {
  tipo: 'personalizada' | 'grupo' | 'rotacion'
  editing?: MeetingPage | null
  onClose: () => void
  onSaved: () => void
}

const DURACIONES_OPCIONES = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
]

const TIPO_LABEL = {
  personalizada: 'Personalizada',
  grupo: 'Grupo',
  rotacion: 'Rotación',
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const CRM_URL = window.location.origin

export default function MeetingPageForm({ tipo, editing, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<'general' | 'equipo' | 'opciones'>('general')
  const [form, setForm] = useState<MeetingPage>({
    nombre_interno: '',
    organizador_id: '',
    titulo_evento: '',
    ubicacion: '',
    video_link: '',
    descripcion: '',
    tipo,
    duraciones: [30, 60],
    slug: '',
    activo: true,
    cancelar_reprogramar: false,
  })
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('id, nombre, apellido, email').order('nombre').then(({ data }) => {
      if (data) setProfiles(data)
    })
    if (editing) setForm({ ...editing })
  }, [editing])

  function set(field: keyof MeetingPage, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleDuracion(val: number) {
    setForm(f => {
      const exists = f.duraciones.includes(val)
      if (exists && f.duraciones.length === 1) return f
      return {
        ...f,
        duraciones: exists
          ? f.duraciones.filter(d => d !== val)
          : [...f.duraciones, val].sort((a, b) => a - b),
      }
    })
  }

  function autoSlug(nombreInterno: string) {
    if (!form.slug || form.slug === slugify(form.nombre_interno)) {
      set('slug', slugify(nombreInterno))
    }
  }

  async function handleSave() {
    if (!form.nombre_interno.trim()) { setError('El nombre interno es requerido.'); return }
    if (!form.slug.trim()) { setError('El enlace (slug) es requerido.'); return }
    setSaving(true)
    setError('')
    const payload = {
      nombre_interno: form.nombre_interno.trim(),
      organizador_id: form.organizador_id || null,
      titulo_evento: ( form.titulo_evento ?? "").trim() || null,
      ubicacion: ( form.ubicacion ?? "").trim() || null,
      video_link: ( form.video_link ?? "").trim() || null,
      descripcion: ( form.descripcion ?? "").trim() || null,
      tipo: form.tipo,
      duraciones: form.duraciones,
      slug: form.slug.trim(),
      activo: form.activo,
      cancelar_reprogramar: form.cancelar_reprogramar,
    }
    let err
    if (editing?.id) {
      ;({ error: err } = await supabase.from('meeting_pages').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id))
    } else {
      ;({ error: err } = await supabase.from('meeting_pages').insert(payload))
    }
    setSaving(false)
    if (err) setError(err.message)
    else onSaved()
  }

  function copyLink() {
    navigator.clipboard.writeText(`${CRM_URL}/booking/${form.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bookingUrl = `${CRM_URL}/booking/${form.slug}`

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center z-50 pointer-events-none pt-8 pb-8 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {editing ? 'Editar página de programación' : `Nueva página — ${TIPO_LABEL[tipo]}`}
              </h2>
              {form.slug && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-400 truncate max-w-xs">{bookingUrl}</span>
                  <button onClick={copyLink} className="text-gray-400 hover:text-gray-600">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            {([
              { key: 'general', label: 'Vista general' },
              { key: 'equipo', label: 'Equipo' },
              { key: 'opciones', label: 'Opciones de programación' },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-5">
            {tab === 'general' && (
              <>
                {/* Nombre interno */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Nombre interno <span className="text-red-500">*</span>
                    <span className="ml-1 text-gray-400 cursor-help" title="Solo visible para tu equipo">
                      <Info className="w-3.5 h-3.5 inline" />
                    </span>
                  </label>
                  <input
                    value={form.nombre_interno}
                    onChange={e => { set('nombre_interno', e.target.value); autoSlug(e.target.value) }}
                    placeholder="Ej: Reunión 60 min y 30 min"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Organizador */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Organizador
                    <span className="ml-1 text-gray-400 cursor-help" title="Responsable de la reunión">
                      <Info className="w-3.5 h-3.5 inline" />
                    </span>
                  </label>
                  <select
                    value={form.organizador_id ?? ''}
                    onChange={e => set('organizador_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
                  >
                    <option value="">— Sin asignar —</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido} (yo)</option>
                    ))}
                  </select>
                </div>

                {/* Título del evento */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Título de evento
                    <span className="ml-1 text-gray-400 cursor-help" title="Visible para el contacto que reserve">
                      <Info className="w-3.5 h-3.5 inline" />
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={form.titulo_evento ?? ''}
                      onChange={e => set('titulo_evento', e.target.value)}
                      rows={2}
                      placeholder="Ej: Reunión con {nombre_contacto}"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 resize-none"
                    />
                    <button className="absolute bottom-2 right-2 text-xs text-blue-600 font-medium hover:underline">
                      Personalizar ▼
                    </button>
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Ubicación
                    <span className="ml-1 text-gray-400 cursor-help" title="Dirección física o link">
                      <Info className="w-3.5 h-3.5 inline" />
                    </span>
                  </label>
                  <input
                    value={form.ubicacion ?? ''}
                    onChange={e => set('ubicacion', e.target.value)}
                    placeholder="Ej: Av. Providencia 1234, Santiago"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
                  />
                  {/* Video link */}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const orgProfile = profiles.find(p => p.id === form.organizador_id)
                        if (orgProfile) {
                          set('video_link', `https://teams.microsoft.com/l/call/0/0?users=${encodeURIComponent(orgProfile.email)}`)
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5 text-[#6264A7]" />
                      Agregar enlace de videoconferencia (Teams) ▼
                    </button>
                    {form.video_link && (
                      <button
                        type="button"
                        onClick={() => set('video_link', '')}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  {form.video_link && (
                    <input
                      value={form.video_link ?? ''}
                      onChange={e => set('video_link', e.target.value)}
                      placeholder="https://teams.microsoft.com/..."
                      className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  )}
                </div>

                {/* Cancelar y reprogramar */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Cancelar y reprogramar</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Incluir enlaces de cancelación y reprogramación en la descripción del evento</p>
                    <button
                      type="button"
                      onClick={() => set('cancelar_reprogramar', !form.cancelar_reprogramar)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        form.cancelar_reprogramar ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.cancelar_reprogramar ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Descripción
                    <span className="ml-1 text-gray-400 cursor-help" title="Visible en la invitación del calendario">
                      <Info className="w-3.5 h-3.5 inline" />
                    </span>
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <textarea
                      value={form.descripcion ?? ''}
                      onChange={e => set('descripcion', e.target.value)}
                      rows={4}
                      placeholder="Descripción de la reunión para el contacto..."
                      className="w-full px-3 py-2.5 text-sm focus:outline-none bg-gray-50 resize-none"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-white">
                      <button className="text-gray-700 font-bold text-sm px-1 hover:bg-gray-100 rounded">B</button>
                      <button className="text-gray-700 italic text-sm px-1 hover:bg-gray-100 rounded">I</button>
                      <button className="text-gray-700 underline text-sm px-1 hover:bg-gray-100 rounded">U</button>
                      <button className="text-gray-700 text-sm px-1 hover:bg-gray-100 rounded line-through">T</button>
                      <button className="text-gray-700 text-sm px-1 hover:bg-gray-100 rounded">🔗</button>
                      <span className="ml-auto text-xs text-blue-600 font-medium cursor-pointer hover:underline">Personalizar ▼</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'equipo' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {tipo === 'personalizada'
                    ? 'El organizador seleccionado recibirá las reservas de esta página.'
                    : tipo === 'grupo'
                    ? 'Todos los miembros del equipo deben estar disponibles para que se muestre un horario.'
                    : 'Las reuniones se distribuirán automáticamente entre los miembros del equipo.'}
                </p>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Organizador principal</p>
                  <select
                    value={form.organizador_id ?? ''}
                    onChange={e => set('organizador_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">— Sin asignar —</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {tab === 'opciones' && (
              <div className="space-y-5">
                {/* Duraciones */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Duraciones disponibles
                  </label>
                  <p className="text-xs text-gray-500 mb-3">El contacto podrá elegir entre estas opciones al reservar.</p>
                  <div className="flex flex-wrap gap-2">
                    {DURACIONES_OPCIONES.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDuracion(d.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                          form.duraciones.includes(d.value)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slug / enlace */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Enlace de la página de reserva
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <span className="px-3 py-2.5 bg-gray-100 text-xs text-gray-500 border-r border-gray-300 whitespace-nowrap">
                      /booking/
                    </span>
                    <input
                      value={form.slug}
                      onChange={e => set('slug', slugify(e.target.value))}
                      placeholder="mi-reunion"
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="px-3 py-2.5 text-gray-400 hover:text-gray-600 border-l border-gray-300"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{bookingUrl}</p>
                </div>

                {/* Activo */}
                <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Página activa</p>
                    <p className="text-xs text-gray-500">Los contactos pueden acceder y reservar en esta página</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('activo', !form.activo)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      form.activo ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#001E5D' }}
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear página'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
