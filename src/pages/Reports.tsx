import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { leadsService } from '../services/leads'
import { quotesService } from '../services/quotes'
import { SERVICE_LABELS, ORIGIN_LABELS, LEAD_STATUS_LABELS, LOST_REASONS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'
import type { ServiceType, LeadOrigin, LeadStatus } from '../types'

const COLORS = ['#1d4ed8','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#db2777','#65a30d']

export default function Reports() {
  const [data, setData] = useState({
    porServicio: [] as { name: string; leads: number; ganados: number }[],
    porCanal: [] as { name: string; value: number }[],
    cotizacionesPorEstado: [] as { name: string; value: number }[],
    motivosPerdida: [] as { name: string; value: number }[],
    ejecutivos: [] as { name: string; leads: number; ganados: number; valor: number }[],
    funnel: [] as { name: string; value: number }[],
    valorTotal: 0,
    ganados: 0,
    tasa: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([leadsService.getStats(), quotesService.getAll()]).then(([leads, quotes]) => {
      if (!leads) return

      // Por servicio
      const svcMap: Record<string, { leads: number; ganados: number }> = {}
      leads.forEach(l => {
        const k = SERVICE_LABELS[l.servicio as ServiceType] || l.servicio
        if (!svcMap[k]) svcMap[k] = { leads: 0, ganados: 0 }
        svcMap[k].leads++
        if (l.estado === 'ganado') svcMap[k].ganados++
      })
      const porServicio = Object.entries(svcMap).map(([name, v]) => ({ name, ...v }))

      // Por canal
      const canalMap: Record<string, number> = {}
      leads.forEach(l => {
        const k = ORIGIN_LABELS[l.origen as LeadOrigin] || l.origen
        canalMap[k] = (canalMap[k] || 0) + 1
      })
      const porCanal = Object.entries(canalMap).map(([name, value]) => ({ name, value }))

      // Cotizaciones por estado
      const cotMap: Record<string, number> = {}
      quotes.forEach(q => { cotMap[q.estado] = (cotMap[q.estado] || 0) + 1 })
      const cotizacionesPorEstado = Object.entries(cotMap).map(([name, value]) => ({ name, value }))

      // Motivos de pérdida
      const lostMap: Record<string, number> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      leads.filter((l: any) => l.estado === 'perdido' && l.motivo_perdida).forEach((l: any) => {
        const k = LOST_REASONS.find(r => r.value === l.motivo_perdida)?.label || l.motivo_perdida || 'Otro'
        lostMap[k] = (lostMap[k] || 0) + 1
      })
      const motivosPerdida = Object.entries(lostMap).map(([name, value]) => ({ name, value }))

      // Funnel
      const stages: LeadStatus[] = ['nuevo','contactado','en_levantamiento','cotizacion_enviada','negociacion','ganado']
      const funnel = stages.map(s => ({
        name: LEAD_STATUS_LABELS[s],
        value: leads.filter(l => l.estado === s).length,
      }))

      const ganados = leads.filter(l => l.estado === 'ganado').length
      const tasa = leads.length > 0 ? Math.round((ganados / leads.length) * 100) : 0
      const valorTotal = leads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)

      setData({ porServicio, porCanal, cotizacionesPorEstado, motivosPerdida, funnel, ejecutivos: [], valorTotal, ganados, tasa })
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Análisis comercial y rendimiento</p>
      </div>

      {/* KPI banners */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-brand-700">{data.tasa}%</p>
          <p className="text-sm text-gray-500 mt-1">Tasa de conversión</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{data.ganados}</p>
          <p className="text-sm text-gray-500 mt-1">Negocios ganados</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.valorTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">Valor total oportunidades</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Por servicio */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por servicio</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.porServicio} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="leads" fill="#1d4ed8" name="Leads" radius={[4,4,0,0]} />
              <Bar dataKey="ganados" fill="#059669" name="Ganados" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Embudo de ventas</h3>
          <div className="space-y-2">
            {data.funnel.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-32 flex-shrink-0 text-right">{stage.name}</span>
                <div className="flex-1 bg-gray-100 rounded h-7 relative overflow-hidden">
                  <div
                    className="h-7 rounded flex items-center justify-end pr-2"
                    style={{
                      width: data.funnel[0]?.value ? `${(stage.value / data.funnel[0].value) * 100}%` : '0%',
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  >
                    <span className="text-white text-xs font-medium">{stage.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por canal */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por canal de origen</h3>
          {data.porCanal.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.porCanal} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: PieLabelRenderProps) => `${name ?? ''} ${Math.round(((percent as number) ?? 0) * 100)}%`} labelLine={false} fontSize={10}>
                  {data.porCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Motivos de pérdida */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Motivos de pérdida</h3>
          {data.motivosPerdida.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Sin negocios perdidos registrados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.motivosPerdida} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#dc2626" radius={[0,4,4,0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
