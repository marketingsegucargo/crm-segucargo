import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Shield, UsersRound, Plus, UserPlus, X, Check, ChevronDown, Trash2, Eye, EyeOff } from 'lucide-react'

interface Profile {
  id: string
  nombre: string
  apellido: string | null
  email: string | null
  rol: string | null
  activo: boolean
  licencia_id: string | null
  licencias?: { nombre: string } | null
}

interface Licencia { id: string; nombre: string; tipo: string; descripcion: string; permisos: Record<string, boolean> }
interface Equipo { id: string; nombre: string; descripcion: string | null; activo: boolean; miembros_count?: number }
interface EquipoMiembro { id: string; profile_id: string; equipo_id: string; profiles?: { nombre: string; apellido: string | null } | null }

type Tab = 'usuarios' | 'licencias' | 'equipos'

const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador', gerencia: 'Gerencia', ejecutivo: 'Ejecutivo', operaciones: 'Operaciones'
}
const ROL_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800', gerencia: 'bg-blue-100 text-blue-800',
  ejecutivo: 'bg-green-100 text-green-800', operaciones: 'bg-orange-100 text-orange-800'
}

export default function Usuarios() {
  const [tab, setTab] = useState<Tab>('usuarios')

  // Usuarios
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [licencias, setLicencias] = useState<Licencia[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [asignandoLicencia, setAsignandoLicencia] = useState<string | null>(null)
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState<Record<string, string>>({})

  // Equipos
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loadingEquipos, setLoadingEquipos] = useState(true)
  const [showEquipoModal, setShowEquipoModal] = useState(false)
  const [equipoForm, setEquipoForm] = useState({ nombre: '', descripcion: '' })
  const [savingEquipo, setSavingEquipo] = useState(false)
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
  const [miembros, setMiembros] = useState<EquipoMiembro[]>([])
  const [miembroSeleccionado, setMiembroSeleccionado] = useState('')

  useEffect(() => { fetchProfiles(); fetchLicencias(); fetchEquipos() }, [])

  async function fetchProfiles() {
    setLoadingUsers(true)
    const { data } = await supabase.from('profiles').select('*, licencias(nombre)').order('nombre')
    setProfiles(data || [])
    setLoadingUsers(false)
  }

  async function fetchLicencias() {
    const { data } = await supabase.from('licencias').select('*')
    setLicencias((data || []) as Licencia[])
  }

  async function fetchEquipos() {
    setLoadingEquipos(true)
    const { data: equiposData } = await supabase.from('equipos').select('*').order('nombre')
    const { data: miembrosData } = await supabase.from('equipo_miembros').select('equipo_id')
    const counts: Record<string, number> = {}
    ;(miembrosData || []).forEach((m: { equipo_id: string }) => { counts[m.equipo_id] = (counts[m.equipo_id] || 0) + 1 })
    setEquipos((equiposData || []).map((e: Equipo) => ({ ...e, miembros_count: counts[e.id] || 0 })))
    setLoadingEquipos(false)
  }

  async function toggleActivo(profile: Profile) {
    await supabase.from('profiles').update({ activo: !profile.activo }).eq('id', profile.id)
    fetchProfiles()
  }

  async function asignarLicencia(profileId: string) {
    const licId = licenciaSeleccionada[profileId]
    if (!licId) return
    await supabase.from('profiles').update({ licencia_id: licId }).eq('id', profileId)
    setAsignandoLicencia(null)
    fetchProfiles()
  }

  async function saveEquipo() {
    if (!equipoForm.nombre.trim()) return
    setSavingEquipo(true)
    await supabase.from('equipos').insert({ nombre: equipoForm.nombre, descripcion: equipoForm.descripcion || null })
    setSavingEquipo(false)
    setShowEquipoModal(false)
    setEquipoForm({ nombre: '', descripcion: '' })
    fetchEquipos()
  }

  async function loadMiembros(equipo: Equipo) {
    setSelectedEquipo(equipo)
    const { data } = await supabase.from('equipo_miembros').select('*, profiles(nombre, apellido)').eq('equipo_id', equipo.id)
    setMiembros((data || []) as EquipoMiembro[])
  }

  async function addMiembro() {
    if (!miembroSeleccionado || !selectedEquipo) return
    await supabase.from('equipo_miembros').insert({ equipo_id: selectedEquipo.id, profile_id: miembroSeleccionado })
    loadMiembros(selectedEquipo)
    fetchEquipos()
    setMiembroSeleccionado('')
  }

  async function removeMiembro(id: string) {
    await supabase.from('equipo_miembros').delete().eq('id', id)
    if (selectedEquipo) loadMiembros(selectedEquipo)
    fetchEquipos()
  }

  const miembroIds = miembros.map(m => m.profile_id)
  const profilesDisponibles = profiles.filter(p => !miembroIds.includes(p.id))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
        {tab === 'usuarios' && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors" style={{ backgroundColor: '#001E5D' }}>
            <UserPlus className="w-4 h-4" /> Crear usuario
          </button>
        )}
        {tab === 'equipos' && (
          <button onClick={() => setShowEquipoModal(true)} className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg" style={{ backgroundColor: '#001E5D' }}>
            <Plus className="w-4 h-4" /> Nuevo equipo
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {([['usuarios', 'Usuarios', Users], ['licencias', 'Licencias', Shield], ['equipos', 'Equipos', UsersRound]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ─── TAB USUARIOS ─── */}
      {tab === 'usuarios' && (
        <div className="card overflow-hidden">
          {loadingUsers ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Correo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Licencia</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#2AD4AE', color: '#001E5D' }}>
                          {p.nombre?.charAt(0)}{p.apellido?.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{p.nombre} {p.apellido}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ROL_COLORS[p.rol || ''] || 'bg-gray-100 text-gray-700'}`}>
                        {ROL_LABELS[p.rol || ''] || p.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {asignandoLicencia === p.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="input text-xs py-1"
                            value={licenciaSeleccionada[p.id] || ''}
                            onChange={e => setLicenciaSeleccionada(prev => ({ ...prev, [p.id]: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            {licencias.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                          </select>
                          <button onClick={() => asignarLicencia(p.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setAsignandoLicencia(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setAsignandoLicencia(p.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                          {p.licencias?.nombre || 'Sin licencia'} <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActivo(p)} className="text-xs text-gray-400 hover:text-gray-700 underline">
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── TAB LICENCIAS ─── */}
      {tab === 'licencias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {licencias.map(lic => (
            <div key={lic.id} className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: lic.tipo === 'administrador' ? '#001E5D' : '#e5e7eb' }}>
                  <Shield className="w-5 h-5" style={{ color: lic.tipo === 'administrador' ? '#2AD4AE' : '#6b7280' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{lic.nombre}</h3>
                  <p className="text-xs text-gray-500 capitalize">{lic.tipo}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{lic.descripcion}</p>
              <ul className="space-y-1.5">
                {Object.entries(lic.permisos || {}).map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2 text-sm">
                    {v ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    <span className={v ? 'text-gray-700' : 'text-gray-400'}>{k.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB EQUIPOS ─── */}
      {tab === 'equipos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {loadingEquipos ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : equipos.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 text-sm">No hay equipos creados</div>
            ) : (
              equipos.map(eq => (
                <div key={eq.id} className={`card p-4 cursor-pointer transition-all ${selectedEquipo?.id === eq.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                  onClick={() => loadMiembros(eq)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{eq.nombre}</p>
                      {eq.descripcion && <p className="text-xs text-gray-500 mt-0.5">{eq.descripcion}</p>}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                      {eq.miembros_count || 0} miembros
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedEquipo && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Miembros — {selectedEquipo.nombre}</h3>
              <div className="flex gap-2 mb-4">
                <select className="input flex-1" value={miembroSeleccionado} onChange={e => setMiembroSeleccionado(e.target.value)}>
                  <option value="">Agregar miembro...</option>
                  {profilesDisponibles.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
                <button onClick={addMiembro} disabled={!miembroSeleccionado} className="px-3 py-2 text-white rounded-lg disabled:opacity-40 transition-colors" style={{ backgroundColor: '#001E5D' }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {miembros.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Sin miembros aún</p>
                ) : miembros.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#2AD4AE', color: '#001E5D' }}>
                        {m.profiles?.nombre?.charAt(0)}{m.profiles?.apellido?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{m.profiles?.nombre} {m.profiles?.apellido}</span>
                    </div>
                    <button onClick={() => removeMiembro(m.id)} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL CREAR USUARIO ─── */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchProfiles() }}
        />
      )}

      {/* ─── MODAL CREAR EQUIPO ─── */}
      {showEquipoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nuevo equipo</h2>
              <button onClick={() => setShowEquipoModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input className="input" value={equipoForm.nombre} onChange={e => setEquipoForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Equipo Comercial" />
              </div>
              <div>
                <label className="label">Descripción</label>
                <input className="input" value={equipoForm.descripcion} onChange={e => setEquipoForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción opcional" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEquipoModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={saveEquipo} disabled={savingEquipo || !equipoForm.nombre.trim()} className="btn-primary">
                {savingEquipo ? 'Guardando...' : 'Crear equipo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MODAL CREAR USUARIO ─────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', rol: 'ejecutivo', telefono: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleCreate() {
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      setError('Completa todos los campos obligatorios')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(form),
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok || result.error) {
      setError(result.error || 'Error al crear usuario')
      return
    }

    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#001E5D' }}>
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Crear usuario</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan" />
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input className="input" value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Pérez" />
            </div>
          </div>

          <div>
            <label className="label">Correo electrónico *</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="usuario@segucargo.cl" />
          </div>

          <div>
            <label className="label">Contraseña inicial *</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rol</label>
              <select className="input" value={form.rol} onChange={e => set('rol', e.target.value)}>
                <option value="ejecutivo">Ejecutivo</option>
                <option value="operaciones">Operaciones</option>
                <option value="gerencia">Gerencia</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 XXXX XXXX" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#001E5D' }}
          >
            <UserPlus className="w-4 h-4" />
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}
