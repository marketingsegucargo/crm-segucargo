import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ExternalLink, Eye, EyeOff, Save, RefreshCw, Plus, Pencil, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConexionConfig {
  voipstudio_api_key?: string
  voipstudio_domain?: string
  slack_webhook_url?: string
  slack_bot_token?: string
  microsoft_client_id?: string
  microsoft_tenant_id?: string
}

type PropertyTipo =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'currency'

interface ModuleProperty {
  id: string
  modulo: string
  grupo: string
  nombre: string
  etiqueta: string
  tipo: PropertyTipo
  opciones: { label: string; value: string }[]
  requerido: boolean
  solo_lectura: boolean
  descripcion: string | null
  orden: number
  activo: boolean
  created_at: string
}

// ─── Connection Card ─────────────────────────────────────────────────────────

function ConexionCard({
  title,
  description,
  logo,
  connected,
  children,
}: {
  title: string
  description: string
  logo: React.ReactNode
  connected: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-2xl">
            {logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              {connected ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <CheckCircle className="w-3 h-3" /> Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                  <XCircle className="w-3 h-3" /> No conectado
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-sm font-medium text-[#001E5D] hover:underline"
        >
          {open ? 'Cerrar' : 'Configurar'}
        </button>
      </div>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          {children}
        </div>
      )}
    </div>
  )
}

function SecretInput({
  label, value, onChange, placeholder, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Properties Tab ───────────────────────────────────────────────────────────

const TIPO_ICONS: Record<PropertyTipo, string> = {
  text: 'T',
  number: '#',
  date: '📅',
  select: '▾',
  checkbox: '☑',
  url: '🔗',
  email: '@',
  phone: '☎',
  textarea: '¶',
  currency: '$',
}

const TIPO_LABELS: Record<PropertyTipo, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Fecha',
  select: 'Selección',
  checkbox: 'Casilla',
  url: 'URL',
  email: 'Email',
  phone: 'Teléfono',
  textarea: 'Texto largo',
  currency: 'Moneda',
}

const MODULES = [
  { key: 'negocios', label: 'Negocios' },
  { key: 'leads', label: 'Leads' },
  { key: 'contacts', label: 'Contactos' },
  { key: 'empresas', label: 'Empresas' },
] as const

type ModuloKey = (typeof MODULES)[number]['key']

const GROUP_SUGGESTIONS = [
  'Información general',
  'Información de Negocio',
  'Información de Lead',
  'Datos de Contacto',
  'Datos de Empresa',
]

interface PropertyForm {
  id?: string
  modulo: ModuloKey
  grupo: string
  nombre: string
  etiqueta: string
  tipo: PropertyTipo
  opciones: string // textarea: one per line
  requerido: boolean
  descripcion: string
}

function toSnakeCase(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

function PropertyModal({
  initial,
  activeModulo,
  onClose,
  onSave,
}: {
  initial?: ModuleProperty | null
  activeModulo: ModuloKey
  onClose: () => void
  onSave: (data: Omit<ModuleProperty, 'id' | 'created_at'> & { id?: string }) => Promise<void>
}) {
  const [form, setForm] = useState<PropertyForm>({
    id: initial?.id,
    modulo: (initial?.modulo as ModuloKey) ?? activeModulo,
    grupo: initial?.grupo ?? 'Información general',
    nombre: initial?.nombre ?? '',
    etiqueta: initial?.etiqueta ?? '',
    tipo: initial?.tipo ?? 'text',
    opciones: initial?.opciones?.map(o => o.label).join('\n') ?? '',
    requerido: initial?.requerido ?? false,
    descripcion: initial?.descripcion ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [etiquetaTouched, setEtiquetaTouched] = useState(!!initial)

  const setField = <K extends keyof PropertyForm>(k: K, v: PropertyForm[K]) => {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const handleEtiqueta = (v: string) => {
    setField('etiqueta', v)
    if (!etiquetaTouched) setField('nombre', toSnakeCase(v))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const opcionesArr =
      form.tipo === 'select'
        ? form.opciones
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => ({ label: s, value: toSnakeCase(s) }))
        : []
    await onSave({
      id: form.id,
      modulo: form.modulo,
      grupo: form.grupo,
      nombre: form.nombre,
      etiqueta: form.etiqueta,
      tipo: form.tipo,
      opciones: opcionesArr,
      requerido: form.requerido,
      solo_lectura: initial?.solo_lectura ?? false,
      descripcion: form.descripcion || null,
      orden: initial?.orden ?? 0,
      activo: initial?.activo ?? true,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {initial ? 'Editar propiedad' : 'Nueva propiedad'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Etiqueta */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Etiqueta <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.etiqueta}
              onChange={e => handleEtiqueta(e.target.value)}
              placeholder="Ej: Tipo de carga"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
            />
          </div>

          {/* Nombre interno */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre interno</label>
            <input
              required
              type="text"
              value={form.nombre}
              onChange={e => {
                setEtiquetaTouched(true)
                setField('nombre', e.target.value)
              }}
              placeholder="tipo_carga"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
            />
            <p className="text-xs text-gray-400 mt-1">Snake_case, usado en la API</p>
          </div>

          {/* Módulo + Grupo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Módulo</label>
              <select
                value={form.modulo}
                onChange={e => setField('modulo', e.target.value as ModuloKey)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
              >
                {MODULES.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Grupo</label>
              <input
                list="group-suggestions"
                type="text"
                value={form.grupo}
                onChange={e => setField('grupo', e.target.value)}
                placeholder="Información general"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
              />
              <datalist id="group-suggestions">
                {GROUP_SUGGESTIONS.map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de campo</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(TIPO_ICONS) as PropertyTipo[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField('tipo', t)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-colors ${
                    form.tipo === t
                      ? 'border-[#2AD4AE] bg-[#2AD4AE]/10 text-[#001E5D]'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-lg leading-none">{TIPO_ICONS[t]}</span>
                  <span className="text-[10px] font-medium leading-tight">{TIPO_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opciones (solo si tipo=select) */}
          {form.tipo === 'select' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Opciones <span className="text-gray-400">(una por línea)</span>
              </label>
              <textarea
                rows={4}
                value={form.opciones}
                onChange={e => setField('opciones', e.target.value)}
                placeholder={"Opción A\nOpción B\nOpción C"}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D] resize-none"
              />
            </div>
          )}

          {/* Requerido */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setField('requerido', !form.requerido)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.requerido ? 'bg-[#2AD4AE]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.requerido ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Campo requerido</span>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Descripción <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={e => setField('descripcion', e.target.value)}
              placeholder="Ayuda contextual para el usuario..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] disabled:opacity-60 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar propiedad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PropiedadesTab() {
  const [activeModulo, setActiveModulo] = useState<ModuloKey>('negocios')
  const [properties, setProperties] = useState<ModuleProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProp, setEditingProp] = useState<ModuleProperty | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadProperties = async (modulo: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('module_properties')
      .select('*')
      .eq('modulo', modulo)
      .eq('activo', true)
      .order('orden', { ascending: true })
    setProperties((data as ModuleProperty[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadProperties(activeModulo)
  }, [activeModulo])

  const grouped = properties.reduce<Record<string, ModuleProperty[]>>((acc, p) => {
    if (!acc[p.grupo]) acc[p.grupo] = []
    acc[p.grupo].push(p)
    return acc
  }, {})

  const toggleGroup = (g: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  const handleSave = async (data: Omit<ModuleProperty, 'id' | 'created_at'> & { id?: string }) => {
    if (data.id) {
      const { id, ...rest } = data
      await supabase.from('module_properties').update(rest).eq('id', id)
    } else {
      await supabase.from('module_properties').insert(data)
    }
    setModalOpen(false)
    setEditingProp(null)
    loadProperties(activeModulo)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('module_properties').update({ activo: false }).eq('id', id)
    setDeleteConfirm(null)
    loadProperties(activeModulo)
  }

  const handleToggleRequired = async (prop: ModuleProperty) => {
    await supabase
      .from('module_properties')
      .update({ requerido: !prop.requerido })
      .eq('id', prop.id)
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, requerido: !p.requerido } : p))
  }

  return (
    <div>
      {/* Module selector */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {MODULES.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveModulo(m.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeModulo === m.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {properties.length} propiedad{properties.length !== 1 ? 'es' : ''} en{' '}
          <strong>{MODULES.find(m => m.key === activeModulo)?.label}</strong>
        </p>
        <button
          onClick={() => { setEditingProp(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva propiedad
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Cargando propiedades...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No hay propiedades en este módulo.</p>
          <button
            onClick={() => { setEditingProp(null); setModalOpen(true) }}
            className="mt-3 text-sm text-[#001E5D] font-medium hover:underline"
          >
            + Crear primera propiedad
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([grupo, props]) => {
            const isCollapsed = collapsedGroups.has(grupo)
            return (
              <div key={grupo} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Group header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroup(grupo)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed
                      ? <ChevronRight className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                    <span className="font-medium text-sm text-gray-800">{grupo}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {props.length}
                    </span>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setEditingProp(null)
                      setModalOpen(true)
                    }}
                    className="flex items-center gap-1 text-xs text-[#001E5D] hover:underline font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar al grupo
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                          <th className="text-left px-4 py-2">Etiqueta</th>
                          <th className="text-left px-4 py-2">Tipo</th>
                          <th className="text-left px-4 py-2 hidden md:table-cell">Nombre interno</th>
                          <th className="text-center px-4 py-2">Requerido</th>
                          <th className="text-right px-4 py-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {props.map(prop => (
                          <tr key={prop.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-gray-800">{prop.etiqueta}</td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#001E5D]/8 text-[#001E5D] border border-[#001E5D]/15">
                                <span>{TIPO_ICONS[prop.tipo]}</span>
                                {TIPO_LABELS[prop.tipo]}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 hidden md:table-cell">
                              <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{prop.nombre}</code>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => handleToggleRequired(prop)}
                                disabled={prop.solo_lectura}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 ${
                                  prop.requerido ? 'bg-[#2AD4AE]' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    prop.requerido ? 'translate-x-4' : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => { setEditingProp(prop); setModalOpen(true) }}
                                  className="p-1.5 text-gray-400 hover:text-[#001E5D] rounded-md hover:bg-gray-100 transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {deleteConfirm === prop.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDelete(prop.id)}
                                      className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                      Eliminar
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(prop.id)}
                                    disabled={prop.solo_lectura}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors disabled:opacity-30"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <PropertyModal
          initial={editingProp}
          activeModulo={activeModulo}
          onClose={() => { setModalOpen(false); setEditingProp(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Configuracion() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<'conexiones' | 'perfil' | 'general' | 'propiedades'>('conexiones')
  const [config, setConfig] = useState<ConexionConfig>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [msProfile, setMsProfile] = useState<{ email?: string; token?: string }>({})

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('profiles')
      .select('voipstudio_extension, microsoft_email, microsoft_access_token')
      .eq('id', profile.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setConfig(prev => ({ ...prev, voipstudio_api_key: data.voipstudio_extension || '' }))
          setMsProfile({ email: data.microsoft_email || '', token: data.microsoft_access_token || '' })
        }
      })
  }, [profile?.id])

  useEffect(() => {
    supabase.from('app_config').select('*').single().then(({ data }) => {
      if (data) setConfig(prev => ({ ...prev, ...data.config }))
    })
  }, [])

  const setField = (key: keyof ConexionConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const saveVoipStudio = async () => {
    if (!profile?.id) return
    setSaving(true)
    await supabase.from('profiles').update({ voipstudio_extension: config.voipstudio_api_key }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveSlack = async () => {
    setSaving(true)
    await supabase.from('app_config').upsert({ id: 1, config: { slack_webhook_url: config.slack_webhook_url, slack_bot_token: config.slack_bot_token } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const conectarMicrosoft = () => {
    const clientId = config.microsoft_client_id || import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
    const tenant = config.microsoft_tenant_id || 'common'
    const redirectUri = encodeURIComponent(`${window.location.origin}/oauth/microsoft/callback`)
    const scopes = encodeURIComponent('offline_access Mail.Send Mail.Read Calendars.ReadWrite')
    const state = profile?.id || ''
    if (!clientId) {
      alert('Primero configura el Client ID de Microsoft Azure')
      return
    }
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&response_mode=query`
    window.open(url, '_blank', 'width=600,height=700')
  }

  const desconectarMicrosoft = async () => {
    if (!profile?.id) return
    await supabase.from('profiles').update({ microsoft_access_token: null, microsoft_refresh_token: null, microsoft_email: null }).eq('id', profile.id)
    setMsProfile({})
  }

  const TABS = [
    { key: 'conexiones', label: 'Conexiones' },
    { key: 'perfil', label: 'Mi perfil' },
    { key: 'general', label: 'General' },
    { key: 'propiedades', label: 'Propiedades' },
  ] as const

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Administra las conexiones e integraciones del CRM</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <CheckCircle className="w-4 h-4" /> Guardado correctamente
        </div>
      )}

      {/* ─── CONEXIONES ─────────────────────────────────────────────────────── */}
      {tab === 'conexiones' && (
        <div className="space-y-4">

          <ConexionCard
            title="Microsoft 365"
            description="Envía correos y accede al calendario desde el CRM"
            logo="🔵"
            connected={!!msProfile.token}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Azure Application (Client) ID</label>
                  <input
                    type="text"
                    value={config.microsoft_client_id || ''}
                    onChange={e => setField('microsoft_client_id', e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tenant ID (o "common")</label>
                  <input
                    type="text"
                    value={config.microsoft_tenant_id || ''}
                    onChange={e => setField('microsoft_tenant_id', e.target.value)}
                    placeholder="common"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D] font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Crea una aplicación en{' '}
                <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="text-[#001E5D] underline inline-flex items-center gap-0.5">
                  portal.azure.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                con permisos: Mail.Send, Mail.Read, Calendars.ReadWrite, offline_access.
                URI de redirección: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/oauth/microsoft/callback</code>
              </p>
              {msProfile.email && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4" />
                  Conectado como <strong>{msProfile.email}</strong>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={conectarMicrosoft}
                  className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] transition-colors"
                >
                  {msProfile.token ? <RefreshCw className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {msProfile.token ? 'Reconectar' : 'Conectar con Microsoft'}
                </button>
                {msProfile.token && (
                  <button
                    onClick={desconectarMicrosoft}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          </ConexionCard>

          <ConexionCard
            title="Microsoft Teams"
            description="Crea videollamadas y reuniones Teams desde el CRM"
            logo="🟣"
            connected={!!msProfile.token}
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Teams utiliza la misma conexión Microsoft 365. Una vez conectada la cuenta de Microsoft, podrás generar links de reuniones Teams directamente desde el módulo de Reuniones.</p>
              </div>
              {!msProfile.token && (
                <p className="text-xs text-gray-500">Primero conecta tu cuenta de Microsoft 365 arriba.</p>
              )}
            </div>
          </ConexionCard>

          <ConexionCard
            title="VoipStudio"
            description="Realiza y registra llamadas directamente desde el CRM"
            logo="📞"
            connected={!!config.voipstudio_api_key}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SecretInput
                  label="Extensión / Número SIP"
                  value={config.voipstudio_api_key || ''}
                  onChange={v => setField('voipstudio_api_key', v)}
                  placeholder="Ej: 1001"
                  hint="Tu extensión en VoipStudio"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dominio SIP</label>
                  <input
                    type="text"
                    value={config.voipstudio_domain || ''}
                    onChange={e => setField('voipstudio_domain', e.target.value)}
                    placeholder="tu-cuenta.voipstudio.com"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Encuentra tu extensión en{' '}
                <a href="https://app.voipstudio.com" target="_blank" rel="noreferrer" className="text-[#001E5D] underline inline-flex items-center gap-0.5">
                  app.voipstudio.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                → Usuarios → Tu usuario.
              </p>
              <button
                onClick={saveVoipStudio}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </ConexionCard>

          <ConexionCard
            title="Slack"
            description="Recibe notificaciones de leads y eventos en canales Slack"
            logo="💬"
            connected={!!config.slack_webhook_url}
          >
            <div className="space-y-4">
              <SecretInput
                label="Webhook URL"
                value={config.slack_webhook_url || ''}
                onChange={v => setField('slack_webhook_url', v)}
                placeholder="https://hooks.slack.com/services/..."
                hint="Crea un Incoming Webhook en api.slack.com/apps"
              />
              <SecretInput
                label="Bot Token (opcional)"
                value={config.slack_bot_token || ''}
                onChange={v => setField('slack_bot_token', v)}
                placeholder="xoxb-..."
                hint="Para enviar mensajes personalizados por canal"
              />
              <p className="text-xs text-gray-400">
                Configura un Incoming Webhook en{' '}
                <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-[#001E5D] underline inline-flex items-center gap-0.5">
                  api.slack.com/apps <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <button
                onClick={saveSlack}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </ConexionCard>

        </div>
      )}

      {/* ─── PERFIL ──────────────────────────────────────────────────────────── */}
      {tab === 'perfil' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-500">Panel de perfil de usuario — próximamente.</p>
        </div>
      )}

      {/* ─── GENERAL ─────────────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-500">Configuración general del sistema — próximamente.</p>
        </div>
      )}

      {/* ─── PROPIEDADES ─────────────────────────────────────────────────────── */}
      {tab === 'propiedades' && <PropiedadesTab />}
    </div>
  )
}
