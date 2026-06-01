import { useState, useEffect } from 'react'
import { X, Save, ExternalLink, MapPin, Package, User, TrendingUp, Tag, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, SERVICE_LABELS, ORIGIN_LABELS, LOST_REASONS } from '../../lib/constants'
import type { Lead, Profile } from '../../types'

interface Props {
  lead: Lead | null
  onClose: () => void
  onSaved: () => void
}

const STATUS_OPTIONS = [
  'Nuevo Lead',
  '1° Intento de contacto',
  '2° Sin Detalle de Carga STD',
  'Sin detalle de Carga MDZ',
  'Sin detalle de Carga Automovil',
  'Inventario Enviado',
  '3° Negocio Abierto',
  '4° Negocio Ganado',
  '5° Contacto Manual',
  '0° Lead No Califica',
  'No le interesa',
  'Proveedor',
]

const SERVICE_OPTIONS = [
  'maritimo','aereo','terrestre','importacion_china','mudanza','freight_forwarder','carga_proyecto','otro'
] as const

const ORIGIN_OPTIONS = [
  'google_ads','meta_ads','linkedin','whatsapp','web','referido','email','organico'
] as const

export default function LeadSlidePanel({ lead, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Lead>>({})
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'detalles' | 'notas'>('info')

  useEffect(() => {
    if (lead) setForm({ ...lead })
  }, [lead])

  useEffect(() => {
    supabase.from('profiles').select('id,nombre,apellido').eq('activo', true).then(({ data }) => {
      setProfiles((data || []) as Profile[])
    })
  }, [])

  async function handleSave() {
    if (!lead) return
    setSaving(true)
    const { ejecutivo, contact, ...rest } = form as Lead & { ejecutivo?: unknown; contact?: unknown }
    await supabase.from('leads').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', lead.id)
    setSaving(false)
    onSaved()
  }

  function set(field: keyof Lead, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  if (!lead) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <input
              className="text-lg font-bold text-gray-900 bg-transparent border-0 outline-none w-full focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1"
              value={form.nombre || ''}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Nombre del lead"
            />
            <p className="text-xs text-gray-400 mt-0.5 px-1">ID: {lead.id.slice(0, 8)}... · Creado: {new Date(lead.created_at).toLocaleDateString('es-CL')}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-600 text-white text-sm font-medium rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#001E5D' }}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Estado rápido */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Estado:</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => set('estado', s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  form.estado === s
                    ? LEAD_STATUS_COLORS[s] + ' border-current ring-1 ring-current'
                    : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                }`}
              >
                {LEAD_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['info', 'detalles', 'notas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' ? 'Información' : tab === 'detalles' ? 'Detalles de carga' : 'Notas'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {activeTab === 'info' && (
            <div className="space-y-4">

              {/* Contacto */}
              <Section title="Datos de contacto" icon={User}>
                <Field label="Empresa">
                  <input className="input" value={form.empresa || ''} onChange={e => set('empresa', e.target.value)} placeholder="Nombre empresa" />
                </Field>
                <Field label="Email">
                  <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" />
                </Field>
                <Field label="Teléfono">
                  <input className="input" value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 XXXX XXXX" />
                </Field>
              </Section>

              {/* Asignación */}
              <Section title="Asignación y fuente" icon={Tag}>
                <Field label="Propietario (Ejecutivo)">
                  <select className="input" value={form.ejecutivo_id || ''} onChange={e => set('ejecutivo_id', e.target.value || null)}>
                    <option value="">Sin asignar</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fuente de Posible cliente">
                  <select className="input" value={form.origen || ''} onChange={e => set('origen', e.target.value)}>
                    {ORIGIN_OPTIONS.map(o => <option key={o} value={o}>{ORIGIN_LABELS[o]}</option>)}
                  </select>
                </Field>
                <Field label="Servicio">
                  <select className="input" value={form.servicio || ''} onChange={e => set('servicio', e.target.value)}>
                    {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
                  </select>
                </Field>
                <Field label="Urgencia">
                  <select className="input" value={form.urgencia || 'media'} onChange={e => set('urgencia', e.target.value)}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </Field>
              </Section>

              {/* Valor */}
              <Section title="Valor y probabilidad" icon={TrendingUp}>
                <Field label="Valor estimado (USD)">
                  <input className="input" type="number" value={form.valor_estimado || ''} onChange={e => set('valor_estimado', e.target.value ? Number(e.target.value) : null)} placeholder="0" />
                </Field>
                <Field label="Probabilidad (%)">
                  <input className="input" type="number" min="0" max="100" value={form.probabilidad || ''} onChange={e => set('probabilidad', e.target.value ? Number(e.target.value) : null)} placeholder="0-100" />
                </Field>
                <Field label="Próxima acción">
                  <input className="input" value={form.proxima_accion || ''} onChange={e => set('proxima_accion', e.target.value)} placeholder="Ej: Llamar para seguimiento" />
                </Field>
                <Field label="Fecha próxima acción">
                  <input className="input" type="date" value={form.fecha_proxima_accion || ''} onChange={e => set('fecha_proxima_accion', e.target.value)} />
                </Field>
              </Section>

              {/* Pérdida */}
              {form.estado === 'perdido' && (
                <Section title="Motivo de pérdida" icon={AlertCircle}>
                  <Field label="Razón">
                    <select className="input" value={form.motivo_perdida || ''} onChange={e => set('motivo_perdida', e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {LOST_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'detalles' && (
            <div className="space-y-4">
              <Section title="Ruta" icon={MapPin}>
                <Field label="País origen">
                  <input className="input" value={form.pais_origen || ''} onChange={e => set('pais_origen', e.target.value)} placeholder="Ej: China" />
                </Field>
                <Field label="País destino">
                  <input className="input" value={form.pais_destino || ''} onChange={e => set('pais_destino', e.target.value)} placeholder="Ej: Chile" />
                </Field>
                <Field label="Origen (ciudad/puerto)">
                  <input className="input" value={form.origen_geo || ''} onChange={e => set('origen_geo', e.target.value)} placeholder="Ej: Shanghai" />
                </Field>
                <Field label="Destino (ciudad/puerto)">
                  <input className="input" value={form.destino_geo || ''} onChange={e => set('destino_geo', e.target.value)} placeholder="Ej: San Antonio" />
                </Field>
              </Section>

              <Section title="Carga" icon={Package}>
                <Field label="Tipo de carga">
                  <input className="input" value={form.tipo_carga || ''} onChange={e => set('tipo_carga', e.target.value)} placeholder="Ej: Maquinaria, Electrónicos..." />
                </Field>
                <Field label="Incoterm">
                  <select className="input" value={form.incoterm || ''} onChange={e => set('incoterm', e.target.value)}>
                    <option value="">Seleccionar</option>
                    {['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Peso estimado (kg)">
                  <input className="input" type="number" value={form.peso_estimado || ''} onChange={e => set('peso_estimado', e.target.value ? Number(e.target.value) : null)} placeholder="0" />
                </Field>
                <Field label="Volumen estimado (m³)">
                  <input className="input" type="number" value={form.volumen_estimado || ''} onChange={e => set('volumen_estimado', e.target.value ? Number(e.target.value) : null)} placeholder="0" />
                </Field>
                <Field label="Presupuesto estimado (USD)">
                  <input className="input" type="number" value={form.presupuesto_estimado || ''} onChange={e => set('presupuesto_estimado', e.target.value ? Number(e.target.value) : null)} placeholder="0" />
                </Field>
              </Section>
            </div>
          )}

          {activeTab === 'notas' && (
            <div>
              <label className="label">Observaciones</label>
              <textarea
                className="input resize-none"
                rows={12}
                value={form.observaciones || ''}
                onChange={e => set('observaciones', e.target.value)}
                placeholder="Notas internas sobre este lead..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-between items-center">
          <a
            href={`/leads/${lead.id}`}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver página completa
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#001E5D' }}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  )
}
