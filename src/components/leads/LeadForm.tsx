import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Lead, Profile } from '../../types'
import { SERVICE_LABELS, ORIGIN_LABELS } from '../../lib/constants'
import { usersService } from '../../services/users'
import PhoneInput from '../ui/PhoneInput'

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  empresa: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  servicio: z.string().min(1, 'Selecciona un servicio'),
  origen: z.string().min(1, 'Selecciona un origen'),
  origen_geo: z.string().optional(),
  destino_geo: z.string().optional(),
  pais_origen: z.string().optional(),
  pais_destino: z.string().optional(),
  tipo_carga: z.string().optional(),
  peso_estimado: z.coerce.number().optional(),
  volumen_estimado: z.coerce.number().optional(),
  incoterm: z.string().optional(),
  presupuesto_estimado: z.coerce.number().optional(),
  urgencia: z.enum(['baja','media','alta']).optional().default('media'),
  estado: z.string().default('nuevo'),
  ejecutivo_id: z.string().optional(),
  probabilidad: z.coerce.number().min(0).max(100).optional(),
  valor_estimado: z.coerce.number().optional(),
  proxima_accion: z.string().optional(),
  observaciones: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  lead?: Lead
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
}

export default function LeadForm({ lead, onSubmit, onCancel }: Props) {
  const [ejecutivos, setEjecutivos] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: lead ? {
      nombre: lead.nombre,
      empresa: lead.empresa || '',
      email: lead.email || '',
      telefono: lead.telefono || '',
      servicio: lead.servicio,
      origen: lead.origen,
      origen_geo: lead.origen_geo || '',
      destino_geo: lead.destino_geo || '',
      pais_origen: lead.pais_origen || '',
      pais_destino: lead.pais_destino || '',
      tipo_carga: lead.tipo_carga || '',
      peso_estimado: lead.peso_estimado,
      volumen_estimado: lead.volumen_estimado,
      incoterm: lead.incoterm || '',
      presupuesto_estimado: lead.presupuesto_estimado,
      urgencia: lead.urgencia || 'media',
      estado: lead.estado,
      ejecutivo_id: lead.ejecutivo_id || '',
      probabilidad: lead.probabilidad,
      valor_estimado: lead.valor_estimado,
      proxima_accion: lead.proxima_accion || '',
      observaciones: lead.observaciones || '',
    } : { urgencia: 'media', estado: 'nuevo' }
  })

  useEffect(() => {
    usersService.getAll().then(setEjecutivos).catch(() => {})
  }, [])

  async function handleFormSubmit(data: unknown) {
    setLoading(true)
    try { await onSubmit(data as FormData) } finally { setLoading(false) }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre del lead *</label>
          <input {...register('nombre')} className="input" placeholder="Nombre del negocio" />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="label">Empresa</label>
          <input {...register('empresa')} className="input" placeholder="Empresa cliente" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className="input" placeholder="email@empresa.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Teléfono</label>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => <PhoneInput value={field.value || ''} onChange={field.onChange} />}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Servicio *</label>
          <select {...register('servicio')} className="input">
            <option value="">Seleccionar...</option>
            {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {errors.servicio && <p className="text-red-500 text-xs mt-1">{errors.servicio.message}</p>}
        </div>
        <div>
          <label className="label">Canal de origen *</label>
          <select {...register('origen')} className="input">
            <option value="">Seleccionar...</option>
            {Object.entries(ORIGIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {errors.origen && <p className="text-red-500 text-xs mt-1">{errors.origen.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Origen (ciudad/puerto)</label>
          <input {...register('origen_geo')} className="input" placeholder="Ej: Shanghái, China" />
        </div>
        <div>
          <label className="label">Destino (ciudad/puerto)</label>
          <input {...register('destino_geo')} className="input" placeholder="Ej: San Antonio, Chile" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Tipo de carga</label>
          <input {...register('tipo_carga')} className="input" placeholder="Ej: Electrónica" />
        </div>
        <div>
          <label className="label">Peso (kg)</label>
          <input {...register('peso_estimado')} type="number" className="input" placeholder="0" />
        </div>
        <div>
          <label className="label">Volumen (m³)</label>
          <input {...register('volumen_estimado')} type="number" className="input" placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Incoterm</label>
          <select {...register('incoterm')} className="input">
            <option value="">-</option>
            {['EXW','FOB','CIF','CFR','DAP','DDP','FCA','CPT'].map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Presupuesto est. (USD)</label>
          <input {...register('presupuesto_estimado')} type="number" className="input" placeholder="0" />
        </div>
        <div>
          <label className="label">Valor estimado (USD)</label>
          <input {...register('valor_estimado')} type="number" className="input" placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Urgencia</label>
          <select {...register('urgencia')} className="input">
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select {...register('estado')} className="input">
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="en_levantamiento">En levantamiento</option>
            <option value="cotizacion_solicitada">Cotización solicitada</option>
            <option value="cotizacion_enviada">Cotización enviada</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="negociacion">Negociación</option>
            <option value="ganado">Ganado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
        <div>
          <label className="label">Probabilidad (%)</label>
          <input {...register('probabilidad')} type="number" min="0" max="100" className="input" placeholder="50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Ejecutivo asignado</label>
          <select {...register('ejecutivo_id')} className="input">
            <option value="">Sin asignar</option>
            {ejecutivos.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Próxima acción</label>
          <input {...register('proxima_accion')} className="input" placeholder="Ej: Enviar cotización" />
        </div>
      </div>

      <div>
        <label className="label">Observaciones</label>
        <textarea {...register('observaciones')} className="input resize-none" rows={3} placeholder="Notas adicionales..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : lead ? 'Actualizar lead' : 'Crear lead'}
        </button>
      </div>
    </form>
  )
}
