import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Phone, Pencil, Plus, Clock, CheckCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ZOHO_ETAPAS, ETAPA_COLORS } from '../components/negocios/NegocioSlidePanel'
import type { Negocio, NegocioUpdate } from '../services/negocios'
import { useAuth } from '../hooks/useAuth'
import { activitiesService } from '../services/activities'
import type { Activity } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────


const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  nota: 'Nota',
  llamada: 'Llamada',
  reunion: 'Reunión',
  email: 'Email',
  tarea: 'Tarea',
}

function formatCurrency(valor: number | null, moneda: string | null) {
  if (!valor) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda || 'USD',
    maximumFractionDigits: 0,
  }).format(valor)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatRelativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  return `hace ${Math.floor(hrs / 24)} días`
}

// ─── InlineField ──────────────────────────────────────────────────────────────

interface InlineFieldProps {
  label: string
  value: string | number | null | undefined
  onSave: (val: string) => Promise<void>
  type?: 'text' | 'number' | 'date'
  select?: { value: string; label: string }[]
}

function InlineField({ label, value, onSave, type = 'text', select }: InlineFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement & HTMLSelectElement>(null)

  function startEdit() {
    setDraft(value !== null && value !== undefined ? String(value) : '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function commit() {
    setEditing(false)
    if (draft !== String(value ?? '')) await onSave(draft)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  const displayVal = (() => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-300 italic">—</span>
    if (select) {
      const found = select.find(o => o.value === String(value))
      return found ? found.label : String(value)
    }
    return String(value)
  })()

  return (
    <div className="grid grid-cols-[180px_1fr] items-start py-2.5 border-b border-gray-100 last:border-0 group">
      <span className="text-sm text-gray-500 pt-0.5">{label}</span>
      <div className="flex items-center gap-1.5">
        {editing ? (
          select ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
            >
              <option value="">— Sin asignar —</option>
              {select.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKey}
            />
          )
        ) : (
          <>
            <span className="text-sm text-gray-800 flex-1">{displayVal}</span>
            <button
              onClick={startEdit}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded transition-all"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── PipelineBar ──────────────────────────────────────────────────────────────

function PipelineBar({ etapaActual }: { etapaActual: string | null }) {
  const [offset, setOffset] = useState(0)
  const VISIBLE = 5

  // Determine which etapas to show based on pipeline prefix
  const etapas = ZOHO_ETAPAS.slice(0, 16) // first 16 are the main pipeline

  const currentIdx = etapas.findIndex(e => e === etapaActual)

  useEffect(() => {
    if (currentIdx >= 0 && currentIdx < offset) setOffset(currentIdx)
    if (currentIdx >= 0 && currentIdx >= offset + VISIBLE) setOffset(currentIdx - VISIBLE + 1)
  }, [currentIdx, offset])

  const visible = etapas.slice(offset, offset + VISIBLE)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOffset(o => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-1 overflow-hidden">
          {visible.map((etapa, i) => {
            const globalIdx = offset + i
            const isActive = etapa === etapaActual
            const isPast = currentIdx >= 0 && globalIdx < currentIdx
            const isNext = currentIdx >= 0 && globalIdx > currentIdx

            return (
              <div
                key={etapa}
                className={`
                  relative flex-1 text-center text-xs font-medium py-2 px-3 select-none
                  ${i === 0 ? 'rounded-l-md' : ''}
                  ${i === visible.length - 1 ? 'rounded-r-md' : ''}
                  ${isActive
                    ? 'text-white z-10'
                    : isPast
                      ? 'bg-gray-100 text-gray-500'
                      : isNext
                        ? 'bg-white text-gray-400 border border-gray-200'
                        : 'bg-white text-gray-400 border border-gray-200'}
                `}
                style={isActive ? { backgroundColor: '#001E5D' } : undefined}
              >
                <span className="truncate block leading-tight">{etapa}</span>
                {/* Chevron arrow */}
                {i < visible.length - 1 && (
                  <span
                    className="absolute right-0 top-0 bottom-0 w-3 z-10"
                    style={{
                      background: 'inherit',
                      clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setOffset(o => Math.min(etapas.length - VISIBLE, o + 1))}
          disabled={offset + VISIBLE >= etapas.length}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({
  negocioId,
  activities,
  onRefresh,
}: {
  negocioId: string
  activities: Activity[]
  onRefresh: () => void
}) {
  const { profile } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ tipo: 'nota', titulo: '', descripcion: '' })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.titulo || !profile) return
    setSaving(true)
    try {
      await activitiesService.create({
        lead_id: negocioId,
        usuario_id: profile.id,
        tipo: form.tipo as Activity['tipo'],
        titulo: form.titulo,
        descripcion: form.descripcion,
        fecha: new Date().toISOString(),
        completado: false,
      })
      setForm({ tipo: 'nota', titulo: '', descripcion: '' })
      setShowForm(false)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Cronología de actividades</h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-white rounded-lg"
          style={{ backgroundColor: '#001E5D' }}
        >
          <Plus className="w-3 h-3" /> Registrar actividad
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Tipo</label>
              <select
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              >
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Título *</label>
              <input
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Descripción breve"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Detalle</label>
            <textarea
              className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              rows={2}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || !form.titulo}
              className="text-xs px-3 py-1.5 text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: '#001E5D' }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-300">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm text-gray-400">Sin actividades registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map(act => (
            <div key={act.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#001E5D' }}>
                    {ACTIVITY_TYPE_LABELS[act.tipo] || act.tipo}
                  </span>
                  {act.completado && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                </div>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{act.titulo}</p>
                {act.descripcion && <p className="text-xs text-gray-500 mt-0.5">{act.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {act.usuario ? `${act.usuario.nombre} · ` : ''}{formatRelativeTime(act.fecha)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NegocioDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'general' | 'cronologia'>('general')
  const [profiles, setProfiles] = useState<{ id: string; nombre: string; apellido: string | null }[]>([])

  async function load() {
    if (!id) return
    const [{ data: neg }, acts] = await Promise.all([
      supabase.from('negocios').select('*, profiles!ejecutivo_id(nombre, apellido)').eq('id', id).single(),
      activitiesService.getByLead(id).catch(() => [] as Activity[]),
    ])
    if (neg) setNegocio(neg as Negocio)
    setActivities(acts)
    setLoading(false)
  }

  async function loadProfiles() {
    const { data } = await supabase.from('profiles').select('id,nombre,apellido').eq('activo', true)
    setProfiles(data || [])
  }

  useEffect(() => {
    load()
    loadProfiles()
  }, [id])

  async function updateField(field: keyof NegocioUpdate, rawVal: string) {
    if (!id) return
    let value: string | number | null = rawVal || null
    if (field === 'valor' || field === 'probabilidad') {
      value = rawVal ? Number(rawVal) : null
    }
    const { data } = await supabase
      .from('negocios')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, profiles!ejecutivo_id(nombre, apellido)')
      .single()
    if (data) setNegocio(data as Negocio)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!negocio) {
    return <div className="text-center py-16 text-gray-400">Negocio no encontrado</div>
  }

  const propietario = negocio.profiles
    ? `${negocio.profiles.nombre} ${negocio.profiles.apellido || ''}`.trim()
    : null

  const etapaColorClass = negocio.etapa ? (ETAPA_COLORS[negocio.etapa] || 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700'

  const profileOptions = profiles.map(p => ({
    value: p.id,
    label: `${p.nombre} ${p.apellido || ''}`.trim(),
  }))

  const serviceOptions = [
    { value: 'maritimo', label: 'Transporte Marítimo' },
    { value: 'aereo', label: 'Transporte Aéreo' },
    { value: 'terrestre', label: 'Transporte Terrestre' },
    { value: 'importacion_china', label: 'Importación desde China' },
    { value: 'mudanza', label: 'Mudanza Internacional' },
    { value: 'freight_forwarder', label: 'Freight Forwarder' },
    { value: 'carga_proyecto', label: 'Carga Proyecto' },
    { value: 'otro', label: 'Otro' },
  ]

  const etapaOptions = ZOHO_ETAPAS.map(e => ({ value: e, label: e }))
  const monedaOptions = [{ value: 'USD', label: 'USD' }, { value: 'CLP', label: 'CLP' }, { value: 'EUR', label: 'EUR' }]

  return (
    <div className="bg-gray-50 min-h-full">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start gap-3 max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/negocios')}
            className="mt-1 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{negocio.nombre}</h1>
                {negocio.empresa && (
                  <p className="text-sm text-gray-500 mt-0.5">{negocio.empresa}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {negocio.etapa && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${etapaColorClass}`}>
                    {negocio.etapa}
                  </span>
                )}
                {negocio.valor && (
                  <span className="text-sm font-semibold text-gray-700">
                    {formatCurrency(negocio.valor, negocio.moneda)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex gap-5">

        {/* Left sidebar */}
        <aside className="w-52 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Lista relacionada</p>
            <nav className="space-y-1.5">
              {[
                { label: 'Notas', count: null },
                { label: 'Actividades', count: activities.length },
                { label: 'Archivos adjuntos', count: null },
                { label: 'Historial de fases', count: null },
                { label: 'Contactos', count: null },
                { label: 'Documentos', count: null },
              ].map(item => (
                <button
                  key={item.label}
                  className="flex items-center justify-between w-full text-left text-sm text-blue-600 hover:underline py-0.5"
                  onClick={() => item.label === 'Actividades' && setTab('cronologia')}
                >
                  <span>{item.label}</span>
                  {item.count !== null && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Tabs */}
          <div className="flex gap-0 mb-5 border-b border-gray-200">
            {(['general', 'cronologia'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'general' ? 'Visión general' : 'Cronología'}
              </button>
            ))}
          </div>

          {/* Pipeline bar */}
          <PipelineBar etapaActual={negocio.etapa} />

          {tab === 'general' && (
            <div className="space-y-4">

              {/* Owner card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Propietario del Negocio</h2>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: '#001E5D' }}
                  >
                    {propietario ? propietario[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{propietario || 'Sin asignar'}</p>
                    {negocio.etapa && (
                      <p className="text-xs text-gray-500 mt-0.5">Fase: {negocio.etapa}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact card */}
              {(negocio.contacto_nombre) && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Persona de contacto</h2>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{negocio.contacto_nombre}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Sin email</span>
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Sin teléfono</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info del negocio */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Información del Negocio</h2>
                <div>
                  <InlineField
                    label="Propietario"
                    value={negocio.ejecutivo_id}
                    onSave={v => updateField('ejecutivo_id', v)}
                    select={profileOptions}
                  />
                  <InlineField
                    label="Nombre contacto"
                    value={negocio.contacto_nombre}
                    onSave={v => updateField('contacto_nombre', v)}
                  />
                  <InlineField
                    label="Nombre negocio"
                    value={negocio.nombre}
                    onSave={v => updateField('nombre', v)}
                  />
                  <InlineField
                    label="Canal / Origen"
                    value={negocio.origen}
                    onSave={v => updateField('origen', v)}
                  />
                  <InlineField
                    label="Fase"
                    value={negocio.etapa}
                    onSave={v => updateField('etapa', v)}
                    select={etapaOptions}
                  />
                  <InlineField
                    label="Empresa"
                    value={negocio.empresa}
                    onSave={v => updateField('empresa', v)}
                  />
                  <InlineField
                    label="Fecha cierre estimada"
                    value={negocio.fecha_cierre_estimada}
                    onSave={v => updateField('fecha_cierre_estimada', v)}
                    type="date"
                  />
                  <InlineField
                    label="Importe"
                    value={negocio.valor}
                    onSave={v => updateField('valor', v)}
                    type="number"
                  />
                  <InlineField
                    label="Moneda"
                    value={negocio.moneda}
                    onSave={v => updateField('moneda', v)}
                    select={monedaOptions}
                  />
                  <InlineField
                    label="Servicio"
                    value={negocio.servicio}
                    onSave={v => updateField('servicio', v)}
                    select={serviceOptions}
                  />
                  <InlineField
                    label="Pipeline"
                    value={negocio.pipeline}
                    onSave={v => updateField('pipeline', v)}
                  />
                  <InlineField
                    label="Notas"
                    value={negocio.notas}
                    onSave={v => updateField('notas', v)}
                  />
                </div>
              </div>

              {/* Extra details */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Detalles adicionales</h2>
                <div>
                  {negocio.probabilidad !== null && (
                    <div className="grid grid-cols-[180px_1fr] items-center py-2.5 border-b border-gray-100 text-sm">
                      <span className="text-gray-500">Probabilidad</span>
                      <span className="text-gray-800 font-medium">{negocio.probabilidad}%</span>
                    </div>
                  )}
                  <div className="grid grid-cols-[180px_1fr] items-center py-2.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Tipo de servicio</span>
                    <span className="text-gray-800">{negocio.tipo_servicio || <span className="text-gray-300 italic">—</span>}</span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr] items-center py-2.5 text-sm">
                    <span className="text-gray-500">Creado</span>
                    <span className="text-gray-800">{formatDate(negocio.created_at)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {tab === 'cronologia' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <TimelineTab
                negocioId={negocio.id}
                activities={activities}
                onRefresh={load}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
