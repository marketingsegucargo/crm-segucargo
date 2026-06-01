import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import {
  Users, TrendingUp, FileText, CheckCircle, XCircle, Target, DollarSign, Activity
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import { leadsService } from '../services/leads'
import { LEAD_STATUS_LABELS, SERVICE_LABELS, ORIGIN_LABELS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'
import type { LeadStatus, ServiceType, LeadOrigin } from '../types'

const COLORS = ['#1d4ed8','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#db2777','#65a30d']

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, nuevos: 0, cotizaciones: 0, ganados: 0, perdidos: 0,
    tasa: 0, valor: 0,
    porCanal: [] as { name: string; value: number }[],
    porServicio: [] as { name: string; value: number }[],
    evolucion: [] as { mes: string; leads: number; ganados: number }[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leadsService.getStats().then(data => {
      if (!data) return
      const total = data.length
      const nuevos = data.filter(l => l.estado === 'nuevo').length
      const cotizaciones = data.filter(l => l.estado === 'cotizacion_enviada').length
      const ganados = data.filter(l => l.estado === 'ganado').length
      const perdidos = data.filter(l => l.estado === 'perdido').length
      const tasa = total > 0 ? Math.round((ganados / total) * 100) : 0
      const valor = data.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)

      // Por canal
      const canalMap: Record<string, number> = {}
      data.forEach(l => {
        const k = ORIGIN_LABELS[l.origen as LeadOrigin] || l.origen
        canalMap[k] = (canalMap[k] || 0) + 1
      })
      const porCanal = Object.entries(canalMap).map(([name, value]) => ({ name, value }))

      // Por servicio
      const svcMap: Record<string, number> = {}
      data.forEach(l => {
        const k = SERVICE_LABELS[l.servicio as ServiceType] || l.servicio
        svcMap[k] = (svcMap[k] || 0) + 1
      })
      const porServicio = Object.entries(svcMap).map(([name, value]) => ({ name, value }))

      // Evolución mensual (últimos 6 meses)
      const now = new Date()
      const evolucion = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const mes = d.toLocaleString('es-CL', { month: 'short', year: '2-digit' })
        const monthData = data.filter(l => {
          const ld = new Date(l.created_at)
          return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear()
        })
        return {
          mes,
          leads: monthData.length,
          ganados: monthData.filter(l => l.estado === 'ganado').length,
        }
      })

      setStats({ total, nuevos, cotizaciones, ganados, perdidos, tasa, valor, porCanal, porServicio, evolucion })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen comercial de Segucargo</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Leads Nuevos" value={stats.nuevos} icon={Activity} color="purple" />
        <StatCard title="Cotizaciones Enviadas" value={stats.cotizaciones} icon={FileText} color="yellow" />
        <StatCard title="Negocios Ganados" value={stats.ganados} icon={CheckCircle} color="green" />
        <StatCard title="Negocios Perdidos" value={stats.perdidos} icon={XCircle} color="red" />
        <StatCard title="Tasa de Conversión" value={`${stats.tasa}%`} icon={Target} color="blue" />
        <StatCard
          title="Valor Oportunidades"
          value={formatCurrency(stats.valor)}
          icon={DollarSign}
          color="green"
          subtitle="Valor estimado total"
        />
        <StatCard title="En Pipeline" value={stats.total - stats.ganados - stats.perdidos} icon={TrendingUp} color="purple" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución mensual */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolución mensual</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.evolucion} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="leads" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Leads" />
              <Line type="monotone" dataKey="ganados" stroke="#059669" strokeWidth={2} dot={false} name="Ganados" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leads por servicio */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por servicio</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.porServicio} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1d4ed8" radius={[4,4,0,0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por canal */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por canal de origen</h3>
          {stats.porCanal.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.porCanal} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: PieLabelRenderProps) => `${name ?? ''} ${Math.round(((percent as number) ?? 0) * 100)}%`} labelLine={false} fontSize={10}>
                  {stats.porCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estados actuales */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribución por estado</h3>
          <div className="space-y-3">
            {(['nuevo','contactado','en_levantamiento','cotizacion_enviada','seguimiento','negociacion'] as LeadStatus[]).map(estado => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const count = (stats as any)[estado] || 0
              return (
                <div key={estado} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-36 flex-shrink-0">{LEAD_STATUS_LABELS[estado]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all"
                      style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
