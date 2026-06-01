import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Circle } from 'lucide-react'
import { activitiesService } from '../services/activities'
import { ACTIVITY_TYPE_LABELS } from '../lib/constants'
import { formatDate, formatRelativeTime } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import type { Activity } from '../types'

const typeColors: Record<string, string> = {
  llamada: 'bg-blue-100 text-blue-700',
  email: 'bg-purple-100 text-purple-700',
  whatsapp: 'bg-green-100 text-green-700',
  reunion: 'bg-orange-100 text-orange-700',
  nota: 'bg-gray-100 text-gray-700',
  tarea: 'bg-red-100 text-red-700',
  cambio_estado: 'bg-yellow-100 text-yellow-700',
  cotizacion_enviada: 'bg-cyan-100 text-cyan-700',
}

export default function Activities() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<(Activity & { lead?: { id: string; nombre: string; empresa: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    if (!profile) return
    activitiesService.getPendingTasks(profile.id).then(data => {
      setTasks((data || []) as typeof tasks)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [profile])

  async function markComplete(id: string) {
    await activitiesService.markComplete(id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completado: true } : t))
  }

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completado
    if (filter === 'completed') return t.completado
    return true
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Actividades</h1>
        <p className="text-gray-500 text-sm mt-0.5">Tareas y seguimientos pendientes</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-brand-700 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Completadas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-48 items-center">
          <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin actividades {filter === 'pending' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(act => (
            <div key={act.id} className={`card p-4 flex items-start gap-4 ${act.completado ? 'opacity-60' : ''}`}>
              <button
                onClick={() => !act.completado && markComplete(act.id)}
                className="mt-0.5 flex-shrink-0"
                disabled={act.completado}
              >
                {act.completado
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300 hover:text-brand-500 transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`badge text-xs ${typeColors[act.tipo] || 'bg-gray-100 text-gray-700'}`}>
                      {ACTIVITY_TYPE_LABELS[act.tipo]}
                    </span>
                    <p className={`text-sm font-medium text-gray-900 mt-1 ${act.completado ? 'line-through' : ''}`}>{act.titulo}</p>
                    {act.descripcion && <p className="text-xs text-gray-500 mt-0.5">{act.descripcion}</p>}
                    {act.lead && (
                      <p className="text-xs text-brand-600 mt-1">
                        Lead: {act.lead.nombre} {act.lead.empresa ? `— ${act.lead.empresa}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(act.fecha)}
                    </div>
                    {act.fecha_vencimiento && (
                      <p className={`text-xs mt-1 ${new Date(act.fecha_vencimiento) < new Date() ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        Vence: {formatDate(act.fecha_vencimiento)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
