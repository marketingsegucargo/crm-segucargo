import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Globe, MapPin, Package, Clock, User, Plus, CheckCircle } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { leadsService } from '../services/leads'
import { activitiesService } from '../services/activities'
import { quotesService } from '../services/quotes'
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, SERVICE_LABELS, ACTIVITY_TYPE_LABELS } from '../lib/constants'
import { formatCurrency, formatDate, formatRelativeTime } from '../lib/utils'
import type { Lead, Activity, Quote } from '../types'
import { useAuth } from '../hooks/useAuth'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showActivity, setShowActivity] = useState(false)
  const [actForm, setActForm] = useState({ tipo: 'nota', titulo: '', descripcion: '' })

  async function load() {
    if (!id) return
    const [l, a, q] = await Promise.all([
      leadsService.getById(id),
      activitiesService.getByLead(id),
      quotesService.getAll(id),
    ])
    setLead(l); setActivities(a); setQuotes(q)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function addActivity() {
    if (!id || !profile || !actForm.titulo) return
    await activitiesService.create({
      lead_id: id,
      usuario_id: profile.id,
      tipo: actForm.tipo as Activity['tipo'],
      titulo: actForm.titulo,
      descripcion: actForm.descripcion,
      fecha: new Date().toISOString(),
      completado: false,
    })
    setShowActivity(false)
    setActForm({ tipo: 'nota', titulo: '', descripcion: '' })
    const a = await activitiesService.getByLead(id)
    setActivities(a)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  )

  if (!lead) return <div className="text-center py-16 text-gray-400">Lead no encontrado</div>

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/leads')} className="mt-1 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lead.nombre}</h1>
              <p className="text-gray-500 text-sm">{lead.empresa}</p>
            </div>
            <Badge label={LEAD_STATUS_LABELS[lead.estado]} className={LEAD_STATUS_COLORS[lead.estado]} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Columna principal */}
        <div className="col-span-2 space-y-5">
          {/* Info */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Información del lead</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {lead.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="hover:text-brand-600">{lead.email}</a>
                </div>
              )}
              {lead.telefono && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${lead.telefono}`} className="hover:text-brand-600">{lead.telefono}</a>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-4 h-4 text-gray-400" />
                {SERVICE_LABELS[lead.servicio]}
              </div>
              {lead.origen_geo && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {lead.origen_geo} → {lead.destino_geo}
                </div>
              )}
              {lead.valor_estimado && (
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Globe className="w-4 h-4 text-green-500" />
                  {formatCurrency(lead.valor_estimado)} est.
                </div>
              )}
              {lead.ejecutivo && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  {lead.ejecutivo.nombre} {lead.ejecutivo.apellido}
                </div>
              )}
            </div>
            {lead.observaciones && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-1">Observaciones</p>
                <p className="text-sm text-gray-600">{lead.observaciones}</p>
              </div>
            )}
          </div>

          {/* Cotizaciones */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Cotizaciones ({quotes.length})</h2>
              <button onClick={() => navigate('/cotizaciones')} className="text-xs text-brand-600 hover:text-brand-700">
                Ver todas →
              </button>
            </div>
            {quotes.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin cotizaciones asociadas</p>
            ) : (
              <div className="space-y-2">
                {quotes.map(q => (
                  <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{q.numero}</p>
                      <p className="text-xs text-gray-500">{formatDate(q.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(q.valor_total, q.moneda)}</p>
                      <Badge label={q.estado} className="text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline actividades */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Actividades</h2>
              <button onClick={() => setShowActivity(true)} className="btn-primary py-1.5 text-xs">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin actividades registradas</p>
            ) : (
              <div className="space-y-3">
                {activities.map(act => (
                  <div key={act.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">
                          {ACTIVITY_TYPE_LABELS[act.tipo]}
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
        </div>

        {/* Sidebar derecho */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3 text-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Urgencia</span>
                <span className="font-medium capitalize">{lead.urgencia}</span>
              </div>
              {lead.probabilidad !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Probabilidad</span>
                  <span className="font-medium">{lead.probabilidad}%</span>
                </div>
              )}
              {lead.incoterm && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Incoterm</span>
                  <span className="font-medium">{lead.incoterm}</span>
                </div>
              )}
              {lead.tipo_carga && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo de carga</span>
                  <span className="font-medium">{lead.tipo_carga}</span>
                </div>
              )}
              {lead.peso_estimado && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Peso est.</span>
                  <span className="font-medium">{lead.peso_estimado} kg</span>
                </div>
              )}
              {lead.volumen_estimado && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Volumen est.</span>
                  <span className="font-medium">{lead.volumen_estimado} m³</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Creado</span>
                <span className="font-medium">{formatDate(lead.created_at)}</span>
              </div>
            </div>
          </div>

          {lead.proxima_accion && (
            <div className="card p-4 bg-yellow-50 border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Próxima acción</p>
              <p className="text-sm text-yellow-800">{lead.proxima_accion}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal actividad */}
      <Modal open={showActivity} onClose={() => setShowActivity(false)} title="Registrar actividad" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Tipo</label>
            <select value={actForm.tipo} onChange={e => setActForm(f => ({ ...f, tipo: e.target.value }))} className="input">
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Título *</label>
            <input value={actForm.titulo} onChange={e => setActForm(f => ({ ...f, titulo: e.target.value }))} className="input" placeholder="Descripción breve" />
          </div>
          <div>
            <label className="label">Detalle</label>
            <textarea value={actForm.descripcion} onChange={e => setActForm(f => ({ ...f, descripcion: e.target.value }))} className="input resize-none" rows={3} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowActivity(false)} className="btn-secondary">Cancelar</button>
            <button onClick={addActivity} disabled={!actForm.titulo} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
