import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, Search, Phone, PhoneIncoming, PhoneOutgoing,
  Play, ArrowDownLeft, ArrowUpRight, Info, X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  nombre: string
  apellido: string | null
  voipstudio_extension?: string | null
}

interface Contact {
  id: string
  nombre: string
  apellido: string | null
}

interface Llamada {
  id: string
  contact_id: string | null
  lead_id: string | null
  ejecutivo_id: string | null
  telefono_destino: string | null
  direccion: 'entrante' | 'saliente' | null
  duracion_segundos: number | null
  estado: string | null
  notas: string | null
  fecha: string | null
  grabacion_url: string | null
  voipstudio_call_id: string | null
  contacts?: { nombre: string; apellido: string | null } | null
  profiles?: { nombre: string; apellido: string | null } | null
  created_at: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const estadoBadge: Record<string, string> = {
  completada:   'bg-green-100 text-green-800',
  no_contesto:  'bg-gray-100 text-gray-600',
  buzon:        'bg-yellow-100 text-yellow-800',
  fallida:      'bg-red-100 text-red-700',
}

function formatDuracion(seg: number | null): string {
  if (!seg) return '—'
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const defaultForm = {
  contact_id: '',
  telefono_destino: '',
  direccion: 'saliente' as 'entrante' | 'saliente',
  duracion_segundos: '' as string | number,
  estado: 'completada',
  notas: '',
  fecha: '',
  ejecutivo_id: '',
  grabacion_url: '',
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Llamadas() {
  const { user } = useAuth()

  const [items, setItems]           = useState<Llamada[]>([])
  const [contacts, setContacts]     = useState<Contact[]>([])
  const [profiles, setProfiles]     = useState<Profile[]>([])
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)

  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterDir, setFilterDir]   = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterEjecutivo, setFilterEjecutivo] = useState('')

  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Llamada | null>(null)
  const [form, setForm]             = useState(defaultForm)
  const [saving, setSaving]         = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  // Click-to-call widget state
  const [ctcNumber, setCtcNumber]   = useState('')
  const [ctcDone, setCtcDone]       = useState(false)

  useEffect(() => {
    fetchItems()
    fetchContacts()
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (user && profiles.length) {
      const p = profiles.find(p => p.id === user.id) || null
      setCurrentProfile(p)
    }
  }, [user, profiles])

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('llamadas')
      .select('*, contacts(nombre, apellido), profiles!ejecutivo_id(nombre, apellido)')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function fetchContacts() {
    const { data } = await supabase.from('contacts').select('id, nombre, apellido').order('nombre')
    setContacts(data || [])
  }

  async function fetchProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, voipstudio_extension')
      .eq('activo', true)
    setProfiles(data || [])
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openNew() {
    setEditing(null)
    setForm({ ...defaultForm, fecha: new Date().toISOString().slice(0, 16) })
    setContactSearch('')
    setShowModal(true)
  }

  function openEdit(item: Llamada) {
    setEditing(item)
    setForm({
      contact_id:        item.contact_id || '',
      telefono_destino:  item.telefono_destino || '',
      direccion:         item.direccion || 'saliente',
      duracion_segundos: item.duracion_segundos ?? '',
      estado:            item.estado || 'completada',
      notas:             item.notas || '',
      fecha:             item.fecha ? item.fecha.slice(0, 16) : '',
      ejecutivo_id:      item.ejecutivo_id || '',
      grabacion_url:     item.grabacion_url || '',
    })
    if (item.contacts) {
      setContactSearch(`${item.contacts.nombre} ${item.contacts.apellido || ''}`.trim())
    } else {
      setContactSearch('')
    }
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      contact_id:        form.contact_id || null,
      ejecutivo_id:      form.ejecutivo_id || null,
      duracion_segundos: form.duracion_segundos !== '' ? Number(form.duracion_segundos) : null,
      fecha:             form.fecha || null,
      telefono_destino:  form.telefono_destino || null,
      grabacion_url:     form.grabacion_url || null,
    }
    if (editing) {
      await supabase.from('llamadas').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('llamadas').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta llamada?')) return
    await supabase.from('llamadas').delete().eq('id', id)
    fetchItems()
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const name = i.contacts
      ? `${i.contacts.nombre} ${i.contacts.apellido || ''}`.toLowerCase()
      : (i.telefono_destino || '').toLowerCase()
    const matchSearch    = name.includes(q) || (i.estado || '').toLowerCase().includes(q)
    const matchDir       = filterDir ? i.direccion === filterDir : true
    const matchEstado    = filterEstado ? i.estado === filterEstado : true
    const matchEjecutivo = filterEjecutivo ? i.ejecutivo_id === filterEjecutivo : true
    return matchSearch && matchDir && matchEstado && matchEjecutivo
  })

  const filteredContacts = contacts.filter(c =>
    `${c.nombre} ${c.apellido || ''}`.toLowerCase().includes(contactSearch.toLowerCase())
  )

  // ── Click-to-call ──────────────────────────────────────────────────────────

  function handleCall() {
    if (!ctcNumber.trim()) return
    window.location.href = `tel:${ctcNumber.trim()}`
    setCtcDone(true)
    setTimeout(() => setCtcDone(false), 3000)
  }

  const hasExtension = !!(currentProfile?.voipstudio_extension)

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Phone className="text-[#001E5D]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-[#001E5D]">Llamadas</h1>
            <p className="text-sm text-gray-500">{items.length} registradas</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus size={18} /> Registrar llamada
        </button>
      </div>

      {/* VoipStudio info banner */}
      <div className="mb-5 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        <Info size={18} className="flex-shrink-0 mt-0.5 text-blue-500" />
        <span>
          Conecta VoipStudio configurando tu extensión en{' '}
          <strong>Administración &gt; Usuarios</strong>. Una vez configurada,
          verás el widget de marcado rápido en la esquina inferior derecha.
        </span>
      </div>

      {/* Filters */}
      <div className="card mb-5 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input pl-9 w-full"
            placeholder="Buscar por contacto, estado..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-44" value={filterDir} onChange={e => setFilterDir(e.target.value)}>
          <option value="">Todas las direcciones</option>
          <option value="entrante">Entrante</option>
          <option value="saliente">Saliente</option>
        </select>
        <select className="input w-40" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="completada">Completada</option>
          <option value="no_contesto">No contestó</option>
          <option value="buzon">Buzón</option>
          <option value="fallida">Fallida</option>
        </select>
        <select className="input w-44" value={filterEjecutivo} onChange={e => setFilterEjecutivo(e.target.value)}>
          <option value="">Todos los ejecutivos</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>
          ))}
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Número / Contacto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Dirección</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Duración</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ejecutivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Notas</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Grabación</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">
                      No hay llamadas registradas
                    </td>
                  </tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Número / Contacto */}
                    <td className="px-4 py-3 font-medium text-[#001E5D]">
                      {item.contacts
                        ? `${item.contacts.nombre} ${item.contacts.apellido || ''}`.trim()
                        : item.telefono_destino || '—'}
                      {item.telefono_destino && item.contacts && (
                        <div className="text-xs text-gray-400 font-normal">{item.telefono_destino}</div>
                      )}
                    </td>

                    {/* Dirección */}
                    <td className="px-4 py-3">
                      {item.direccion === 'entrante' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          <ArrowDownLeft size={12} /> Entrante
                        </span>
                      ) : item.direccion === 'saliente' ? (
                        <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          <ArrowUpRight size={12} /> Saliente
                        </span>
                      ) : '—'}
                    </td>

                    {/* Duración */}
                    <td className="px-4 py-3 text-gray-600 tabular-nums">
                      {formatDuracion(item.duracion_segundos)}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      {item.estado ? (
                        <span className={`badge ${estadoBadge[item.estado] || 'bg-gray-100 text-gray-600'}`}>
                          {item.estado.replace(/_/g, ' ')}
                        </span>
                      ) : '—'}
                    </td>

                    {/* Ejecutivo */}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {item.profiles
                        ? `${item.profiles.nombre} ${item.profiles.apellido || ''}`.trim()
                        : '—'}
                    </td>

                    {/* Notas */}
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate text-xs">
                      {item.notas || '—'}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {item.fecha
                        ? new Date(item.fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>

                    {/* Grabación */}
                    <td className="px-4 py-3">
                      {item.grabacion_url ? (
                        <a
                          href={item.grabacion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 transition-colors"
                        >
                          <Play size={10} /> Escuchar
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          className="p-1.5 text-gray-400 hover:text-[#001E5D] hover:bg-gray-100 rounded transition-colors"
                          title="Editar"
                          onClick={() => openEdit(item)}
                        >
                          <PhoneOutgoing size={14} />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                          onClick={() => handleDelete(item.id)}
                        >
                          <X size={14} />
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

      {/* ── VoipStudio floating widget (only when extension is set) ── */}
      {hasExtension && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 overflow-hidden">
          <div className="bg-[#001E5D] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-xs font-semibold">
                Extensión: {currentProfile?.voipstudio_extension} · Disponible
              </span>
            </div>
            <PhoneIncoming size={14} className="text-blue-300" />
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">Llamada rápida</p>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="+56 9 XXXX XXXX"
                value={ctcNumber}
                onChange={e => setCtcNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCall()}
              />
              <button
                onClick={handleCall}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Phone size={14} /> Llamar
              </button>
            </div>
            {ctcDone && (
              <p className="text-xs text-green-600 mt-1.5">Marcando {ctcNumber}…</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5">
              Abre tu cliente SIP/VoIP por defecto (tel: protocol)
            </p>
          </div>
        </div>
      )}

      {/* ── Register/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#001E5D]">
                {editing ? 'Editar llamada' : 'Registrar llamada'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Contacto */}
              <div>
                <label className="label">Contacto</label>
                <input
                  className="input w-full mb-1"
                  placeholder="Buscar contacto..."
                  value={contactSearch}
                  onChange={e => {
                    setContactSearch(e.target.value)
                    setForm(f => ({ ...f, contact_id: '' }))
                  }}
                />
                {contactSearch && !form.contact_id && (
                  <div className="border border-gray-200 rounded-lg max-h-32 overflow-y-auto shadow-sm">
                    {filteredContacts.slice(0, 6).map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0 border-gray-100"
                        onClick={() => {
                          setForm(f => ({ ...f, contact_id: c.id }))
                          setContactSearch(`${c.nombre} ${c.apellido || ''}`.trim())
                        }}
                      >
                        {c.nombre} {c.apellido || ''}
                      </button>
                    ))}
                    {filteredContacts.length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
                    )}
                  </div>
                )}
              </div>

              {/* Teléfono destino */}
              <div>
                <label className="label">Teléfono destino</label>
                <input
                  className="input w-full"
                  placeholder="+56 9 XXXX XXXX"
                  value={form.telefono_destino}
                  onChange={e => setForm(f => ({ ...f, telefono_destino: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Dirección */}
                <div>
                  <label className="label">Dirección</label>
                  <select
                    className="input w-full"
                    value={form.direccion}
                    onChange={e => setForm(f => ({ ...f, direccion: e.target.value as 'entrante' | 'saliente' }))}
                  >
                    <option value="saliente">Saliente</option>
                    <option value="entrante">Entrante</option>
                  </select>
                </div>
                {/* Duración */}
                <div>
                  <label className="label">Duración (seg)</label>
                  <input
                    className="input w-full"
                    type="number"
                    min={0}
                    value={form.duracion_segundos}
                    onChange={e => setForm(f => ({ ...f, duracion_segundos: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Estado */}
                <div>
                  <label className="label">Estado</label>
                  <select
                    className="input w-full"
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                  >
                    <option value="completada">Completada</option>
                    <option value="no_contesto">No contestó</option>
                    <option value="buzon">Buzón</option>
                    <option value="fallida">Fallida</option>
                  </select>
                </div>
                {/* Fecha */}
                <div>
                  <label className="label">Fecha y hora</label>
                  <input
                    className="input w-full"
                    type="datetime-local"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  />
                </div>
              </div>

              {/* Ejecutivo */}
              <div>
                <label className="label">Ejecutivo</label>
                <select
                  className="input w-full"
                  value={form.ejecutivo_id}
                  onChange={e => setForm(f => ({ ...f, ejecutivo_id: e.target.value }))}
                >
                  <option value="">Sin asignar</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>
                  ))}
                </select>
              </div>

              {/* URL grabación */}
              <div>
                <label className="label">URL grabación (opcional)</label>
                <input
                  className="input w-full"
                  placeholder="https://..."
                  value={form.grabacion_url}
                  onChange={e => setForm(f => ({ ...f, grabacion_url: e.target.value }))}
                />
              </div>

              {/* Notas */}
              <div>
                <label className="label">Notas</label>
                <textarea
                  className="input w-full h-20 resize-none"
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                />
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
