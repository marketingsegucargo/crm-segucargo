import { useState, useEffect } from 'react'
import { X, Save, TrendingUp, Tag, User, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types'
import type { Negocio, NegocioUpdate } from '../../services/negocios'

interface Props {
  negocio: Negocio | null
  onClose: () => void
  onSaved: () => void
}

export const ZOHO_ETAPAS = [
  'PASADO A PRICING',
  '1 SIN DETALLE DE CARGA',
  '2 COSTO A PROVEEDOR',
  '3 GENERAR PROPUESTA COMERCIAL',
  '5 PROPUESTA ENVIADA',
  '6 RECOTIZACIÓN ACTUAL',
  '7 RECOTIZACIÓN FUTURO',
  '8.1 SEGUIMIENTO DE SOLICITUD A LA REUNIÓN',
  '8.2 SEGUIMIENTO DE SOLICITUD A LA REUNIÓN',
  '9.1 NEGOCIO GANADO SIN INSTRUIR',
  '9.2 ENVIO DE FICHA DE CLIENTE',
  '9.3 NEGOCIO GANADO',
  '10 NEGOCIO PERDIDO',
  'NEGOCIO CANCELADO',
  'NEGOCIO GANADO FUTURO',
  'TRASPASO',
  'CN SOLICITUD DE COSTO A NUESTRO PROVEEDOR',
  'CN SIN DETALLE DE CARGA COPLETO',
  'CN Propuesta Enviada',
  'CN Seguimiento N° 1 propuesta enviada',
  'CN Seguimiento N° 2 propuesta enviada',
  'CN Recotización Futuro',
  'CN Recotizacion Actual',
  'CN Generar propuesta de Venta',
  'CN Negocio Ganado',
  'CN Negocio Perdido',
  'CN Negocio Cancelado',
  'CN Sin instruir (Negocio Ganado)',
  'LNE Solicitud de Costo a nuestro Proveedor',
  'LNE Sin Detalle de Carga Completo',
  'LNE Generar propuesta de Venta',
  'LNE Propuesta Enviada',
  'LNE Agregados en Secuencia  (Cotización Enviada)',
  'LNE Seguimiento N° 1 cotización enviada',
  'LNE Pasado a Pricing',
  'LNE Negocio Ganado',
  'LNE Negocio Perdido',
  'LNE Negocio Cancelado',
  'LNI Sin detalle de Carga',
  'LNI Propuesta enviada',
  'LNI Negocio Ganado',
  'M Sin detalle de Carga Completo',
  'M Sin Instruir (Negocio Ganado)',
  'M Propuesta Enviada',
  'M Agregados en Secuencia  (Cotización Enviada)',
  'M Seguimiento N°1 Propuesta enviada',
  'M Seguimiento N°2 Propuesta enviada',
  'M Recotización Futuro',
  'M Inventario Enviado',
  'M Pasado a Pricing',
  'M Negocio Ganado',
  'M Negocio Ganado Futuros',
  'M Negocio Perdido',
  'M Negocio Cancelado',
  'PASADO A PRICING',
  'Negocio Gandos Futuros',
]

export const ETAPA_COLORS: Record<string, string> = {
  'PASADO A PRICING':                         'bg-sky-100 text-sky-800',
  '1 SIN DETALLE DE CARGA':                   'bg-yellow-100 text-yellow-800',
  '2 COSTO A PROVEEDOR':                      'bg-orange-100 text-orange-800',
  '3 GENERAR PROPUESTA COMERCIAL':            'bg-amber-100 text-amber-800',
  '5 PROPUESTA ENVIADA':                      'bg-purple-100 text-purple-800',
  '6 RECOTIZACIÓN ACTUAL':                    'bg-indigo-100 text-indigo-800',
  '7 RECOTIZACIÓN FUTURO':                    'bg-blue-100 text-blue-800',
  '8.1 SEGUIMIENTO DE SOLICITUD A LA REUNIÓN':'bg-pink-100 text-pink-800',
  '8.2 SEGUIMIENTO DE SOLICITUD A LA REUNIÓN':'bg-pink-100 text-pink-800',
  '9.1 NEGOCIO GANADO SIN INSTRUIR':          'bg-emerald-100 text-emerald-800',
  '9.2 ENVIO DE FICHA DE CLIENTE':            'bg-emerald-100 text-emerald-800',
  '9.3 NEGOCIO GANADO':                       'bg-green-100 text-green-800',
  '10 NEGOCIO PERDIDO':                       'bg-red-100 text-red-800',
  'NEGOCIO CANCELADO':                        'bg-gray-100 text-gray-600',
  'TRASPASO':                                 'bg-slate-100 text-slate-700',
  'CN Negocio Ganado':                        'bg-green-100 text-green-800',
  'CN Negocio Perdido':                       'bg-red-100 text-red-800',
  'CN Negocio Cancelado':                     'bg-gray-100 text-gray-600',
  'CN Propuesta Enviada':                     'bg-purple-100 text-purple-800',
  'LNE Negocio Ganado':                       'bg-green-100 text-green-800',
  'LNE Negocio Perdido':                      'bg-red-100 text-red-800',
  'LNI Negocio Ganado':                       'bg-green-100 text-green-800',
  'M Negocio Ganado':                         'bg-green-100 text-green-800',
  'M Negocio Perdido':                        'bg-red-100 text-red-800',
  'M Negocio Cancelado':                      'bg-gray-100 text-gray-600',
  'M Propuesta Enviada':                      'bg-purple-100 text-purple-800',
  'NEGOCIO GANADO FUTURO':                    'bg-teal-100 text-teal-800',
}

const SERVICE_OPTIONS = [
  'maritimo', 'aereo', 'terrestre', 'importacion_china',
  'mudanza', 'freight_forwarder', 'carga_proyecto', 'otro',
]

const SERVICE_LABELS: Record<string, string> = {
  maritimo: 'Transporte Marítimo',
  aereo: 'Transporte Aéreo',
  terrestre: 'Transporte Terrestre',
  importacion_china: 'Importación desde China',
  mudanza: 'Mudanza Internacional',
  freight_forwarder: 'Freight Forwarder',
  carga_proyecto: 'Carga Proyecto',
  otro: 'Otro',
}

export default function NegocioSlidePanel({ negocio, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Negocio>>({})
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'detalles' | 'notas'>('info')

  useEffect(() => {
    if (negocio) {
      setForm({ ...negocio })
      setActiveTab('info')
    }
  }, [negocio])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id,nombre,apellido')
      .eq('activo', true)
      .then(({ data }) => setProfiles((data || []) as Profile[]))
  }, [])

  function set(field: keyof Negocio, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!negocio) return
    setSaving(true)
    try {
      const { profiles: _p, id: _id, created_at: _ca, updated_at: _ua, ...rest } = form as Negocio
      await supabase
        .from('negocios')
        .update({ ...(rest as NegocioUpdate), updated_at: new Date().toISOString() })
        .eq('id', negocio.id)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  if (!negocio) return null

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
              placeholder="Nombre del negocio"
            />
            <p className="text-xs text-gray-400 mt-0.5 px-1">
              ID: {negocio.id.slice(0, 8)}... · Creado: {new Date(negocio.created_at).toLocaleDateString('es-CL')}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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

        {/* Etapa rápida */}
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-2">Etapa:</p>
          <div className="flex flex-wrap gap-1.5">
            {ZOHO_ETAPAS.map(e => (
              <button
                key={e}
                onClick={() => set('etapa', e)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  form.etapa === e
                    ? (ETAPA_COLORS[e] || 'bg-blue-100 text-blue-800') + ' border-current ring-1 ring-current'
                    : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                }`}
              >
                {e}
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
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' ? 'Información' : tab === 'detalles' ? 'Detalles' : 'Notas'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {activeTab === 'info' && (
            <div className="space-y-4">
              <Section title="Datos del negocio" icon={User}>
                <Field label="Empresa / Cliente">
                  <input className="input" value={form.empresa || ''} onChange={e => set('empresa', e.target.value)} placeholder="Nombre empresa" />
                </Field>
                <Field label="Contacto">
                  <input className="input" value={form.contacto_nombre || ''} onChange={e => set('contacto_nombre', e.target.value)} placeholder="Nombre contacto" />
                </Field>
              </Section>

              <Section title="Asignación" icon={Tag}>
                <Field label="Propietario">
                  <select className="input" value={form.ejecutivo_id || ''} onChange={e => set('ejecutivo_id', e.target.value || null)}>
                    <option value="">Sin asignar</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Servicio">
                  <select className="input" value={form.servicio || ''} onChange={e => set('servicio', e.target.value || null)}>
                    <option value="">Seleccionar...</option>
                    {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
                  </select>
                </Field>
                <Field label="Pipeline">
                  <input className="input" value={form.pipeline || ''} onChange={e => set('pipeline', e.target.value)} placeholder="Ej: Importaciones" />
                </Field>
                <Field label="Origen">
                  <input className="input" value={form.origen || ''} onChange={e => set('origen', e.target.value)} placeholder="Ej: Web, Referido..." />
                </Field>
              </Section>

              <Section title="Valor y probabilidad" icon={TrendingUp}>
                <Field label="Valor">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.valor ?? ''}
                    onChange={e => set('valor', e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Moneda">
                  <select className="input" value={form.moneda || 'USD'} onChange={e => set('moneda', e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="CLP">CLP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </Field>
                <Field label="Probabilidad (%)">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={form.probabilidad ?? ''}
                    onChange={e => set('probabilidad', e.target.value ? Number(e.target.value) : null)}
                    placeholder="0–100"
                  />
                </Field>
                <Field label="Fecha cierre est.">
                  <input
                    className="input"
                    type="date"
                    value={form.fecha_cierre_estimada || ''}
                    onChange={e => set('fecha_cierre_estimada', e.target.value || null)}
                  />
                </Field>
              </Section>
            </div>
          )}

          {activeTab === 'detalles' && (
            <div className="space-y-4">
              <Section title="Tipo de servicio" icon={FileText}>
                <Field label="Tipo servicio">
                  <input className="input" value={form.tipo_servicio || ''} onChange={e => set('tipo_servicio', e.target.value)} placeholder="Ej: FCL 20', LCL..." />
                </Field>
                <Field label="Etapa actual">
                  <select className="input" value={form.etapa || ''} onChange={e => set('etapa', e.target.value)}>
                    <option value="">Sin etapa</option>
                    {ZOHO_ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Field>
              </Section>
            </div>
          )}

          {activeTab === 'notas' && (
            <div>
              <label className="label">Notas internas</label>
              <textarea
                className="input resize-none"
                rows={14}
                value={form.notas || ''}
                onChange={e => set('notas', e.target.value)}
                placeholder="Notas internas sobre este negocio..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end">
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
