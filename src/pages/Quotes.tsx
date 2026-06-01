import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { quotesService } from '../services/quotes'
import { leadsService } from '../services/leads'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, SERVICE_LABELS } from '../lib/constants'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Quote, Lead } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  cliente: z.string().min(1, 'Requerido'),
  empresa: z.string().optional(),
  lead_id: z.string().optional(),
  servicio: z.string().min(1),
  origen: z.string().optional(),
  destino: z.string().optional(),
  tipo_transporte: z.string().optional(),
  incoterm: z.string().optional(),
  descripcion_carga: z.string().optional(),
  peso: z.coerce.number().optional(),
  volumen: z.coerce.number().optional(),
  bultos: z.coerce.number().optional(),
  moneda: z.enum(['USD','CLP','EUR']).optional().default('USD'),
  valor_neto: z.coerce.number().min(0),
  impuestos: z.coerce.number().optional(),
  valor_total: z.coerce.number().min(0),
  vigencia: z.string().optional(),
  condiciones: z.string().optional(),
  estado: z.string().default('borrador'),
  comentarios_internos: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function QuoteForm({ quote, onSubmit, onCancel }: { quote?: Quote; onSubmit: (d: FormData) => Promise<void>; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => { leadsService.getAll().then(setLeads).catch(() => {}) }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: quote ? {
      cliente: quote.cliente, empresa: quote.empresa || '', lead_id: quote.lead_id || '',
      servicio: quote.servicio, origen: quote.origen || '', destino: quote.destino || '',
      tipo_transporte: quote.tipo_transporte || '', incoterm: quote.incoterm || '',
      descripcion_carga: quote.descripcion_carga || '',
      peso: quote.peso, volumen: quote.volumen, bultos: quote.bultos,
      moneda: quote.moneda, valor_neto: quote.valor_neto, impuestos: quote.impuestos || 0,
      valor_total: quote.valor_total, vigencia: quote.vigencia || '',
      condiciones: quote.condiciones || '', estado: quote.estado,
      comentarios_internos: quote.comentarios_internos || '',
    } : { moneda: 'USD', estado: 'borrador', valor_neto: 0, valor_total: 0 }
  })

  const valorNeto = watch('valor_neto') || 0
  const impuestos = watch('impuestos') || 0

  useEffect(() => {
    setValue('valor_total', Number(valorNeto) + Number(impuestos))
  }, [valorNeto, impuestos, setValue])

  async function onSave(data: unknown) {
    setLoading(true)
    try { await onSubmit(data as FormData) } finally { setLoading(false) }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSave as any)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Cliente *</label>
          <input {...register('cliente')} className="input" />
          {errors.cliente && <p className="text-red-500 text-xs mt-1">{errors.cliente.message}</p>}
        </div>
        <div>
          <label className="label">Empresa</label>
          <input {...register('empresa')} className="input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Lead asociado</label>
          <select {...register('lead_id')} className="input">
            <option value="">Sin lead</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.nombre} — {l.empresa}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Servicio *</label>
          <select {...register('servicio')} className="input">
            {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Origen</label>
          <input {...register('origen')} className="input" placeholder="Ciudad/Puerto de origen" />
        </div>
        <div>
          <label className="label">Destino</label>
          <input {...register('destino')} className="input" placeholder="Ciudad/Puerto de destino" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tipo de transporte</label>
          <select {...register('tipo_transporte')} className="input">
            <option value="">-</option>
            <option value="FCL">FCL - Contenedor completo</option>
            <option value="LCL">LCL - Carga suelta</option>
            <option value="Aéreo">Aéreo</option>
            <option value="Terrestre">Terrestre</option>
          </select>
        </div>
        <div>
          <label className="label">Incoterm</label>
          <select {...register('incoterm')} className="input">
            <option value="">-</option>
            {['EXW','FOB','CIF','CFR','DAP','DDP','FCA','CPT'].map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Descripción de la carga</label>
        <textarea {...register('descripcion_carga')} className="input resize-none" rows={2} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Peso (kg)</label>
          <input {...register('peso')} type="number" className="input" />
        </div>
        <div>
          <label className="label">Volumen (m³)</label>
          <input {...register('volumen')} type="number" className="input" />
        </div>
        <div>
          <label className="label">Bultos</label>
          <input {...register('bultos')} type="number" className="input" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="label">Moneda</label>
          <select {...register('moneda')} className="input">
            <option value="USD">USD</option>
            <option value="CLP">CLP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="label">Valor neto *</label>
          <input {...register('valor_neto')} type="number" className="input" />
        </div>
        <div>
          <label className="label">Impuestos</label>
          <input {...register('impuestos')} type="number" className="input" />
        </div>
        <div>
          <label className="label">Valor total</label>
          <input {...register('valor_total')} type="number" className="input bg-gray-50" readOnly />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Vigencia hasta</label>
          <input {...register('vigencia')} type="date" className="input" />
        </div>
        <div>
          <label className="label">Estado</label>
          <select {...register('estado')} className="input">
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Condiciones comerciales</label>
        <textarea {...register('condiciones')} className="input resize-none" rows={3} placeholder="Condiciones, tiempos de tránsito, inclusiones/exclusiones..." />
      </div>

      <div>
        <label className="label">Comentarios internos</label>
        <textarea {...register('comentarios_internos')} className="input resize-none" rows={2} />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : quote ? 'Actualizar' : 'Crear cotización'}
        </button>
      </div>
    </form>
  )
}

export default function Quotes() {
  const { profile } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editQuote, setEditQuote] = useState<Quote | null>(null)

  async function load() {
    setLoading(true)
    const data = await quotesService.getAll()
    const filtered = search ? data.filter(q =>
      q.cliente.toLowerCase().includes(search.toLowerCase()) ||
      q.numero.toLowerCase().includes(search.toLowerCase()) ||
      (q.empresa || '').toLowerCase().includes(search.toLowerCase())
    ) : data
    setQuotes(filtered)
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  async function handleCreate(data: FormData) {
    const numero = await quotesService.getNextNumber()
    await quotesService.create({ ...data as Parameters<typeof quotesService.create>[0], numero, ejecutivo_id: profile?.id })
    setShowForm(false)
    load()
  }

  async function handleEdit(data: FormData) {
    if (!editQuote) return
    await quotesService.update(editQuote.id, data as Partial<Quote>)
    setEditQuote(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cotización?')) return
    await quotesService.delete(id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">{quotes.length} cotizaciones</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva cotización
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cotizaciones..." className="input pl-9" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center h-48 items-center">
            <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : quotes.length === 0 ? (
          <p className="text-center py-16 text-gray-400 text-sm">No se encontraron cotizaciones</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Número</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Servicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700">{q.numero}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{q.cliente}</p>
                    {q.empresa && <p className="text-xs text-gray-400">{q.empresa}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{SERVICE_LABELS[q.servicio] || q.servicio}</td>
                  <td className="px-4 py-3">
                    <Badge label={QUOTE_STATUS_LABELS[q.estado]} className={QUOTE_STATUS_COLORS[q.estado]} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(q.valor_total, q.moneda)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(q.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditQuote(q)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva Cotización" size="xl">
        <QuoteForm onSubmit={handleCreate as Parameters<typeof QuoteForm>[0]['onSubmit']} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal open={!!editQuote} onClose={() => setEditQuote(null)} title="Editar Cotización" size="xl">
        {editQuote && (
          <QuoteForm quote={editQuote} onSubmit={handleEdit as Parameters<typeof QuoteForm>[0]['onSubmit']} onCancel={() => setEditQuote(null)} />
        )}
      </Modal>
    </div>
  )
}
