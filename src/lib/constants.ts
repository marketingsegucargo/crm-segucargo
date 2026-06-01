import type { ServiceType, LeadOrigin, QuoteStatus, ActivityType, OperationStatus } from '../types'

// Estados de Zoho con sus colores
export const LEAD_STATUS_COLORS: Record<string, string> = {
  // Estados Zoho Segucargo
  'Nuevo Lead': 'bg-blue-100 text-blue-800',
  '0° Lead No Califica': 'bg-red-100 text-red-800',
  '1° Intento de contacto': 'bg-purple-100 text-purple-800',
  '2° Sin Detalle de Carga STD': 'bg-yellow-100 text-yellow-800',
  'Sin detalle de Carga MDZ': 'bg-yellow-100 text-yellow-800',
  'Sin detalle de Carga Automovil': 'bg-yellow-100 text-yellow-800',
  'Inventario Enviado': 'bg-indigo-100 text-indigo-800',
  '3° Negocio Abierto': 'bg-pink-100 text-pink-800',
  '4° Negocio Ganado': 'bg-green-100 text-green-800',
  '5° Contacto Manual': 'bg-purple-100 text-purple-800',
  'No le interesa': 'bg-red-100 text-red-800',
  'Proveedor': 'bg-gray-100 text-gray-700',
  // Estados legacy (por si hay leads nuevos con estos valores)
  'nuevo': 'bg-blue-100 text-blue-800',
  'contactado': 'bg-purple-100 text-purple-800',
  'en_levantamiento': 'bg-yellow-100 text-yellow-800',
  'cotizacion_solicitada': 'bg-orange-100 text-orange-800',
  'cotizacion_enviada': 'bg-cyan-100 text-cyan-800',
  'seguimiento': 'bg-indigo-100 text-indigo-800',
  'negociacion': 'bg-pink-100 text-pink-800',
  'ganado': 'bg-green-100 text-green-800',
  'perdido': 'bg-red-100 text-red-800',
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  'Nuevo Lead': 'Nuevo Lead',
  '0° Lead No Califica': '0° Lead No Califica',
  '1° Intento de contacto': '1° Intento de contacto',
  '2° Sin Detalle de Carga STD': '2° Sin Detalle de Carga STD',
  'Sin detalle de Carga MDZ': 'Sin detalle de Carga MDZ',
  'Sin detalle de Carga Automovil': 'Sin detalle de Carga Automovil',
  'Inventario Enviado': 'Inventario Enviado',
  '3° Negocio Abierto': '3° Negocio Abierto',
  '4° Negocio Ganado': '4° Negocio Ganado',
  '5° Contacto Manual': '5° Contacto Manual',
  'No le interesa': 'No le interesa',
  'Proveedor': 'Proveedor',
  // Legacy
  'nuevo': 'Nuevo',
  'contactado': 'Contactado',
  'en_levantamiento': 'En levantamiento',
  'cotizacion_solicitada': 'Cotización solicitada',
  'cotizacion_enviada': 'Cotización enviada',
  'seguimiento': 'Seguimiento',
  'negociacion': 'Negociación',
  'ganado': 'Ganado',
  'perdido': 'Perdido',
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  maritimo: 'Transporte Marítimo',
  aereo: 'Transporte Aéreo',
  terrestre: 'Transporte Terrestre Internacional',
  importacion_china: 'Importación desde China',
  mudanza: 'Mudanza Internacional',
  freight_forwarder: 'Freight Forwarder',
  carga_proyecto: 'Carga Proyecto',
  otro: 'Otro',
}

export const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  web: 'Web',
  referido: 'Referido',
  email: 'Email',
  organico: 'Orgánico',
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
  vencida: 'bg-yellow-100 text-yellow-800',
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  llamada: 'Llamada',
  email: 'Email',
  whatsapp: 'WhatsApp',
  reunion: 'Reunión',
  nota: 'Nota interna',
  tarea: 'Tarea',
  cambio_estado: 'Cambio de estado',
  cotizacion_enviada: 'Cotización enviada',
}

export const OPERATION_STATUS_LABELS: Record<OperationStatus, string> = {
  pendiente_documentacion: 'Pendiente documentación',
  en_coordinacion: 'En coordinación',
  reservado: 'Reservado',
  en_transito: 'En tránsito',
  en_destino: 'En destino',
  entregado: 'Entregado',
  finalizado: 'Finalizado',
}

export const PIPELINE_STAGES: { key: string; label: string; color: string }[] = [
  { key: 'nuevo', label: 'Nuevo lead', color: 'bg-blue-50 border-blue-200' },
  { key: 'contactado', label: 'Contactado', color: 'bg-purple-50 border-purple-200' },
  { key: 'en_levantamiento', label: 'En levantamiento', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'cotizacion_enviada', label: 'Cotización enviada', color: 'bg-cyan-50 border-cyan-200' },
  { key: 'seguimiento', label: 'Seguimiento', color: 'bg-indigo-50 border-indigo-200' },
  { key: 'negociacion', label: 'Negociación', color: 'bg-pink-50 border-pink-200' },
  { key: 'ganado', label: 'Cerrado ganado', color: 'bg-green-50 border-green-200' },
  { key: 'perdido', label: 'Cerrado perdido', color: 'bg-red-50 border-red-200' },
]

export const LOST_REASONS = [
  { value: 'precio', label: 'Precio' },
  { value: 'no_responde', label: 'No responde' },
  { value: 'otro_proveedor', label: 'Eligió otro proveedor' },
  { value: 'servicio_no_disponible', label: 'Servicio no disponible' },
  { value: 'sin_presupuesto', label: 'Sin presupuesto' },
  { value: 'otro', label: 'Otro' },
]
