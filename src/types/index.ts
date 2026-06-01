// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'ejecutivo' | 'operaciones' | 'gerencia'

export type LeadStatus = string

export type ServiceType =
  | 'maritimo'
  | 'aereo'
  | 'terrestre'
  | 'importacion_china'
  | 'mudanza'
  | 'freight_forwarder'
  | 'carga_proyecto'
  | 'otro'

export type LeadOrigin =
  | 'google_ads'
  | 'meta_ads'
  | 'linkedin'
  | 'whatsapp'
  | 'web'
  | 'referido'
  | 'email'
  | 'organico'

export type QuoteStatus = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida'

export type ActivityType =
  | 'llamada'
  | 'email'
  | 'whatsapp'
  | 'reunion'
  | 'nota'
  | 'tarea'
  | 'cambio_estado'
  | 'cotizacion_enviada'

export type OperationStatus =
  | 'pendiente_documentacion'
  | 'en_coordinacion'
  | 'reservado'
  | 'en_transito'
  | 'en_destino'
  | 'entregado'
  | 'finalizado'

export type LostReason =
  | 'precio'
  | 'no_responde'
  | 'otro_proveedor'
  | 'servicio_no_disponible'
  | 'sin_presupuesto'
  | 'otro'

// ─── Database types ───────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: UserRole
  telefono?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  nombre: string
  apellido: string
  empresa?: string
  email?: string
  telefono?: string
  cargo?: string
  pais?: string
  ciudad?: string
  origen: LeadOrigin
  observaciones?: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  contact_id?: string
  nombre: string
  empresa?: string
  email?: string
  telefono?: string
  servicio: ServiceType
  origen: LeadOrigin
  origen_geo?: string
  destino_geo?: string
  pais_origen?: string
  pais_destino?: string
  tipo_carga?: string
  volumen_estimado?: number
  peso_estimado?: number
  incoterm?: string
  presupuesto_estimado?: number
  urgencia?: 'baja' | 'media' | 'alta'
  estado: LeadStatus
  ejecutivo_id?: string
  probabilidad?: number
  valor_estimado?: number
  proxima_accion?: string
  fecha_proxima_accion?: string
  observaciones?: string
  motivo_perdida?: LostReason
  created_at: string
  updated_at: string
  // joins
  ejecutivo?: Profile
  contact?: Contact
}

export interface Quote {
  id: string
  lead_id?: string
  numero: string
  cliente: string
  empresa?: string
  servicio: ServiceType
  origen?: string
  destino?: string
  tipo_transporte?: string
  incoterm?: string
  descripcion_carga?: string
  peso?: number
  volumen?: number
  bultos?: number
  moneda: 'USD' | 'CLP' | 'EUR'
  valor_neto: number
  impuestos?: number
  valor_total: number
  vigencia?: string
  condiciones?: string
  estado: QuoteStatus
  ejecutivo_id?: string
  comentarios_internos?: string
  fecha_envio?: string
  created_at: string
  updated_at: string
  // joins
  lead?: Lead
  ejecutivo?: Profile
}

export interface Activity {
  id: string
  lead_id?: string
  contact_id?: string
  usuario_id: string
  tipo: ActivityType
  titulo: string
  descripcion?: string
  fecha: string
  fecha_vencimiento?: string
  completado: boolean
  created_at: string
  // joins
  usuario?: Profile
}

export interface Operation {
  id: string
  lead_id?: string
  cliente?: string
  numero_operacion?: string
  servicio?: string
  origen?: string
  destino?: string
  estado: string
  fecha_embarque?: string
  fecha_eta?: string
  fecha_salida_estimada?: string
  fecha_llegada_estimada?: string
  nombre_carga?: string
  peso?: number
  volumen?: number
  bultos?: number
  naviera?: string
  naviera_aerolinea?: string
  bl_numero?: string
  contenedor?: string
  tracking?: string
  responsable_id?: string
  notas?: string
  observaciones?: string
  created_at: string
  updated_at: string
  // joins
  lead?: Lead | { nombre?: string; empresa?: string }
  ejecutivo?: Profile | { nombre?: string; apellido?: string }
  responsable?: Profile
}

export interface Document {
  id: string
  nombre: string
  tipo: string
  url: string
  lead_id?: string
  quote_id?: string
  operation_id?: string
  subido_por: string
  created_at: string
}

export interface Negocio {
  id: string
  nombre: string
  empresa: string | null
  valor: number | null
  moneda: 'USD' | 'CLP' | 'EUR' | null
  etapa: string | null
  probabilidad: number | null
  fecha_cierre_estimada: string | null
  ejecutivo_id: string | null
  servicio: string | null
  tipo_servicio: string | null
  origen: string | null
  contacto_nombre: string | null
  pipeline: string | null
  notas: string | null
  created_at: string
  updated_at?: string
  // join
  profiles?: { nombre: string; apellido: string | null } | null
}

// ─── Secuencias ──────────────────────────────────────────────────────────────

export type TipoPaso = 'correo' | 'tarea' | 'llamada'
export type EstadoSecuencia = 'borrador' | 'activa' | 'pausada'
export type TipoTrigger = 'manual' | 'estado_lead'

export interface PasoSecuencia {
  id: string
  tipo: TipoPaso
  nombre: string
  delay_dias: number
  delay_tipo: 'inmediato' | 'dias'
  template_id?: string
  template_nombre?: string
  asunto?: string
  tarea_titulo?: string
  tarea_descripcion?: string
  llamada_notas?: string
}

export interface SecuenciaRecord {
  id: string
  nombre: string
  descripcion: string | null
  estado: EstadoSecuencia
  tipo_trigger: TipoTrigger
  trigger_estado: string | null
  pasos: PasoSecuencia[]
  total_inscritos: number
  created_at: string
  updated_at: string
}

export interface EmailTemplateRecord {
  id: string
  nombre: string
  asunto: string
  cuerpo_html: string
  variables: string[]
  created_at: string
  updated_at: string
}

export interface SecuenciaInscrito {
  id: string
  secuencia_id: string
  lead_id: string | null
  contact_id: string | null
  paso_actual: number
  estado: 'activo' | 'completado' | 'cancelado'
  fecha_inicio: string
  created_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_leads: number
  leads_nuevos: number
  cotizaciones_enviadas: number
  negocios_ganados: number
  negocios_perdidos: number
  tasa_conversion: number
  valor_oportunidades: number
  leads_por_canal: { canal: string; count: number }[]
  leads_por_servicio: { servicio: string; count: number }[]
  evolucion_mensual: { mes: string; leads: number; ganados: number }[]
  rendimiento_ejecutivos: { nombre: string; leads: number; ganados: number; valor: number }[]
}
