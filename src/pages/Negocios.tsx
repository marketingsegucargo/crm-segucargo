import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, RefreshCw, MoreHorizontal, Trash2, Eye,
  LayoutGrid, List, Briefcase,
} from 'lucide-react'
import ModuleFilters from '../components/common/ModuleFilters'
import { negociosService } from '../services/negocios'
import type { Negocio } from '../services/negocios'
import NegocioSlidePanel, { ZOHO_ETAPAS, ETAPA_COLORS } from '../components/negocios/NegocioSlidePanel'
import { supabase } from '../lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  maritimo: 'Marítimo',
  aereo: 'Aéreo',
  terrestre: 'Terrestre',
  importacion_china: 'China',
  mudanza: 'Mudanza',
  freight_forwarder: 'FF',
  carga_proyecto: 'Proyecto',
  otro: 'Otro',
}

const KANBAN_COLUMN_COLORS: Record<string, { header: string; card: string; dot: string }> = {
  'PASADO A PRICING':                          { header: 'bg-sky-50 border-sky-200',        card: 'border-sky-100',     dot: 'bg-sky-400' },
  '1 SIN DETALLE DE CARGA':                    { header: 'bg-yellow-50 border-yellow-200',  card: 'border-yellow-100',  dot: 'bg-yellow-400' },
  '2 COSTO A PROVEEDOR':                       { header: 'bg-orange-50 border-orange-200',  card: 'border-orange-100',  dot: 'bg-orange-400' },
  '3 GENERAR PROPUESTA COMERCIAL':             { header: 'bg-amber-50 border-amber-200',    card: 'border-amber-100',   dot: 'bg-amber-400' },
  '5 PROPUESTA ENVIADA':                       { header: 'bg-purple-50 border-purple-200',  card: 'border-purple-100',  dot: 'bg-purple-400' },
  '6 RECOTIZACIÓN ACTUAL':                     { header: 'bg-indigo-50 border-indigo-200',  card: 'border-indigo-100',  dot: 'bg-indigo-400' },
  '7 RECOTIZACIÓN FUTURO':                     { header: 'bg-blue-50 border-blue-200',      card: 'border-blue-100',    dot: 'bg-blue-400' },
  '8.1 SEGUIMIENTO DE SOLICITUD A LA REUNIÓN': { header: 'bg-pink-50 border-pink-200',      card: 'border-pink-100',    dot: 'bg-pink-400' },
  '8.2 SEGUIMIENTO DE SOLICITUD A LA REUNIÓN': { header: 'bg-pink-50 border-pink-200',      card: 'border-pink-100',    dot: 'bg-pink-300' },
  '9.1 NEGOCIO GANADO SIN INSTRUIR':           { header: 'bg-emerald-50 border-emerald-200',card: 'border-emerald-100', dot: 'bg-emerald-300' },
  '9.2 ENVIO DE FICHA DE CLIENTE':             { header: 'bg-emerald-50 border-emerald-200',card: 'border-emerald-100', dot: 'bg-emerald-400' },
  '9.3 NEGOCIO GANADO':                        { header: 'bg-green-50 border-green-200',    card: 'border-green-100',   dot: 'bg-green-500' },
  '10 NEGOCIO PERDIDO':                        { header: 'bg-red-50 border-red-200',        card: 'border-red-100',     dot: 'bg-red-400' },
  'NEGOCIO CANCELADO':                         { header: 'bg-gray-50 border-gray-200',      card: 'border-gray-100',    dot: 'bg-gray-400' },
  'TRASPASO':                                  { header: 'bg-slate-50 border-slate-200',    card: 'border-slate-100',   dot: 'bg-slate-400' },
  'CN Propuesta Enviada':                      { header: 'bg-purple-50 border-purple-200',  card: 'border-purple-100',  dot: 'bg-purple-400' },
  'CN Negocio Ganado':                         { header: 'bg-green-50 border-green-200',    card: 'border-green-100',   dot: 'bg-green-500' },
  'CN Negocio Perdido':                        { header: 'bg-red-50 border-red-200',        card: 'border-red-100',     dot: 'bg-red-400' },
  'CN Negocio Cancelado':                      { header: 'bg-gray-50 border-gray-200',      card: 'border-gray-100',    dot: 'bg-gray-400' },
  'LNE Propuesta Enviada':                     { header: 'bg-purple-50 border-purple-200',  card: 'border-purple-100',  dot: 'bg-purple-400' },
  'LNE Negocio Ganado':                        { header: 'bg-green-50 border-green-200',    card: 'border-green-100',   dot: 'bg-green-500' },
  'LNE Negocio Perdido':                       { header: 'bg-red-50 border-red-200',        card: 'border-red-100',     dot: 'bg-red-400' },
  'LNE Negocio Cancelado':                     { header: 'bg-gray-50 border-gray-200',      card: 'border-gray-100',    dot: 'bg-gray-400' },
  'LNI Propuesta enviada':                     { header: 'bg-purple-50 border-purple-200',  card: 'border-purple-100',  dot: 'bg-purple-300' },
  'LNI Negocio Ganado':                        { header: 'bg-green-50 border-green-200',    card: 'border-green-100',   dot: 'bg-green-500' },
  'M Propuesta Enviada':                       { header: 'bg-purple-50 border-purple-200',  card: 'border-purple-100',  dot: 'bg-purple-300' },
  'M Negocio Ganado':                          { header: 'bg-green-50 border-green-200',    card: 'border-green-100',   dot: 'bg-green-500' },
  'M Negocio Ganado Futuros':                  { header: 'bg-teal-50 border-teal-200',      card: 'border-teal-100',    dot: 'bg-teal-400' },
  'M Negocio Perdido':                         { header: 'bg-red-50 border-red-200',        card: 'border-red-100',     dot: 'bg-red-400' },
  'M Negocio Cancelado':                       { header: 'bg-gray-50 border-gray-200',      card: 'border-gray-100',    dot: 'bg-gray-400' },
  'NEGOCIO GANADO FUTURO':                     { header: 'bg-teal-50 border-teal-200',      card: 'border-teal-100',    dot: 'bg-teal-400' },
}

function formatCurrency(valor: number | null, moneda: string | null) {
  if (!valor) return null
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda || 'USD',
    maximumFractionDigits: 0,
  }).format(valor)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── NuevoNegocioModal ────────────────────────────────────────────────────────

function NuevoNegocioModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    nombre: '', empresa: '', valor: '', moneda: 'USD' as 'USD' | 'CLP' | 'EUR',
    etapa: ZOHO_ETAPAS[0], ejecutivo_id: '', servicio: '', notas: '',
  })
  const [profiles, setProfiles] = useState<{ id: string; nombre: string; apellido: string | null }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('id,nombre,apellido').eq('activo', true).then(({ data }) => setProfiles(data || []))
  }, [])

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      await negociosService.create({
        nombre: form.nombre,
        empresa: form.empresa || null,
        valor: form.valor ? Number(form.valor) : null,
        moneda: form.moneda,
        etapa: form.etapa,
        ejecutivo_id: form.ejecutivo_id || null,
        servicio: form.servicio || null,
        notas: form.notas || null,
        probabilidad: null,
        fecha_cierre_estimada: null,
        origen: null,
        tipo_servicio: null,
        contacto_nombre: null,
        pipeline: null,
      })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#001E5D' }}>Nuevo Negocio</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nombre *</label>
            <input className="input w-full" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del negocio" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Empresa / Cliente</label>
            <input className="input w-full" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Nombre empresa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Valor</label>
              <input className="input w-full" type="number" min={0} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Moneda</label>
              <select className="input w-full" value={form.moneda} onChange={e => setForm(f => ({ ...f, moneda: e.target.value as 'USD' | 'CLP' | 'EUR' }))}>
                <option value="USD">USD</option>
                <option value="CLP">CLP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Etapa</label>
            <select className="input w-full" value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))}>
              {ZOHO_ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Propietario</label>
            <select className="input w-full" value={form.ejecutivo_id} onChange={e => setForm(f => ({ ...f, ejecutivo_id: e.target.value }))}>
              <option value="">Sin asignar</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 text-sm text-white font-semibold rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#001E5D' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────

function KanbanCard({ negocio, onClick }: { negocio: Negocio; onClick: () => void }) {
  const colors = KANBAN_COLUMN_COLORS[negocio.etapa || ''] || { card: 'border-gray-100', dot: 'bg-gray-300' }
  const propietario = negocio.profiles
    ? `${negocio.profiles.nombre} ${negocio.profiles.apellido || ''}`.trim()
    : null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-lg border ${colors.card} shadow-sm hover:shadow-md transition-shadow p-3 group`}
    >
      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
        {negocio.nombre}
      </p>
      {negocio.empresa && (
        <p className="text-xs text-gray-500 mt-0.5 truncate">{negocio.empresa}</p>
      )}
      {negocio.valor && (
        <p className="text-xs font-medium text-gray-700 mt-2">
          {formatCurrency(negocio.valor, negocio.moneda)}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        {propietario ? (
          <span className="text-xs text-gray-400 truncate">{propietario}</span>
        ) : <span />}
        {negocio.fecha_cierre_estimada && (
          <span className="text-xs text-gray-400 whitespace-nowrap ml-1">
            {formatDate(negocio.fecha_cierre_estimada)}
          </span>
        )}
      </div>
      {negocio.servicio && (
        <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
          {SERVICE_LABELS[negocio.servicio] || negocio.servicio}
        </span>
      )}
    </button>
  )
}

// ─── KanbanView ───────────────────────────────────────────────────────────────

function KanbanView({ negocios, onSelect }: { negocios: Negocio[]; onSelect: (n: Negocio) => void }) {
  const grouped = Object.fromEntries(ZOHO_ETAPAS.map(e => [e, negocios.filter(n => n.etapa === e)]))
  // Also collect negocios with etapas not in ZOHO_ETAPAS
  const others = negocios.filter(n => !n.etapa || !ZOHO_ETAPAS.includes(n.etapa))

  return (
    <div className="flex gap-4 overflow-x-auto px-6 py-4 pb-6 flex-1 min-h-0">
      {ZOHO_ETAPAS.map(etapa => {
        const items = grouped[etapa] || []
        const colors = KANBAN_COLUMN_COLORS[etapa] || { header: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' }
        const totalValor = items.reduce((s, n) => s + (n.valor || 0), 0)
        return (
          <div key={etapa} className="flex-shrink-0 w-64 flex flex-col">
            {/* Column header */}
            <div className={`rounded-t-lg border-t border-l border-r px-3 py-2.5 ${colors.header}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                <span className="text-xs font-semibold text-gray-700 leading-tight">{etapa}</span>
                <span className="ml-auto text-xs text-gray-500 font-medium bg-white/70 px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              {totalValor > 0 && (
                <p className="text-xs text-gray-500 mt-0.5 pl-4">
                  {formatCurrency(totalValor, 'USD')}
                </p>
              )}
            </div>
            {/* Cards */}
            <div className="flex-1 overflow-y-auto bg-gray-50/80 border border-gray-200 rounded-b-lg p-2 space-y-2 min-h-[200px]">
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-300 text-xs">Sin negocios</div>
              ) : (
                items.map(n => (
                  <KanbanCard key={n.id} negocio={n} onClick={() => onSelect(n)} />
                ))
              )}
            </div>
          </div>
        )
      })}
      {/* Column for other/uncategorized etapas */}
      {others.length > 0 && (
        <div className="flex-shrink-0 w-64 flex flex-col">
          <div className="rounded-t-lg border-t border-l border-r px-3 py-2.5 bg-gray-50 border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs font-semibold text-gray-700">Sin etapa / Otras</span>
              <span className="ml-auto text-xs text-gray-500 font-medium bg-white/70 px-1.5 py-0.5 rounded-full">
                {others.length}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50/80 border border-gray-200 rounded-b-lg p-2 space-y-2 min-h-[200px]">
            {others.map(n => (
              <KanbanCard key={n.id} negocio={n} onClick={() => onSelect(n)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PER_PAGE = 50

export default function Negocios() {
  const navigate = useNavigate()
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [view, setView] = useState<'kanban' | 'tabla'>('kanban')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Negocio | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const menuRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await negociosService.getAll()
      setNegocios(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este negocio?')) return
    await negociosService.delete(id)
    load()
  }

  const filtered = negocios.filter(n => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      n.nombre.toLowerCase().includes(q) ||
      (n.empresa || '').toLowerCase().includes(q) ||
      (n.contacto_nombre || '').toLowerCase().includes(q)
    if (!matchSearch) return false
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const record = n as unknown as Record<string, unknown>
      if (String(record[key] ?? '') !== value) return false
    }
    return true
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5" style={{ color: '#001E5D' }} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Negocios</h1>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} registros</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={`p-2 transition-colors ${view === 'kanban' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vista Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('tabla')}
              className={`p-2 transition-colors ${view === 'tabla' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              title="Vista Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: '#001E5D' }}
          >
            <Plus className="w-4 h-4" /> Nuevo negocio
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar nombre, empresa..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <ModuleFilters
          modulo="negocios"
          filters={filters}
          onChange={f => { setFilters(f); setPage(1) }}
          onClear={() => { setFilters({}); setPage(1) }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 flex-1">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : view === 'kanban' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <KanbanView negocios={filtered} onSelect={n => navigate(`/negocios/${n.id}`)} />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="flex-1 overflow-auto">
            {paginated.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No se encontraron negocios</p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Valor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Etapa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Propietario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Fecha cierre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Servicio</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(n => (
                    <tr key={n.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group">
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => navigate(`/negocios/${n.id}`)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left max-w-[200px] truncate block"
                        >
                          {n.nombre}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 max-w-[150px]">
                        <span className="truncate block">{n.empresa || '—'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap font-medium">
                        {formatCurrency(n.valor, n.moneda) || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {n.etapa ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ETAPA_COLORS[n.etapa] || 'bg-gray-100 text-gray-700'}`}>
                            {n.etapa}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        {n.profiles ? `${n.profiles.nombre} ${n.profiles.apellido || ''}`.trim() : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(n.fecha_cierre_estimada)}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                        {n.servicio ? (SERVICE_LABELS[n.servicio] || n.servicio) : '—'}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="relative" ref={openMenuId === n.id ? menuRef : undefined}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === n.id ? null : n.id)}
                            className="p-1 text-gray-300 hover:text-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === n.id && (
                            <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px] py-1">
                              <button
                                onClick={() => { navigate(`/negocios/${n.id}`); setOpenMenuId(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver detalle
                              </button>
                              <button
                                onClick={() => { handleDelete(n.id); setOpenMenuId(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white text-sm text-gray-500">
              <span>Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3">Página {page} de {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Nuevo negocio modal */}
      {showForm && (
        <NuevoNegocioModal onClose={() => setShowForm(false)} onSaved={load} />
      )}

      {/* Slide panel edición */}
      <NegocioSlidePanel
        negocio={selected}
        onClose={() => setSelected(null)}
        onSaved={() => { setSelected(null); load() }}
      />
    </div>
  )
}
