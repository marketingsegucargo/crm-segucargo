import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Filter, RefreshCw, MoreHorizontal, Trash2, Eye, ArrowRightLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/ui/Modal'
import LeadForm from '../components/leads/LeadForm'
import LeadSlidePanel from '../components/leads/LeadSlidePanel'
import ConvertLeadModal from '../components/leads/ConvertLeadModal'
import { leadsService } from '../services/leads'
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, SERVICE_LABELS, ORIGIN_LABELS } from '../lib/constants'
import type { Lead } from '../types'
import ModuleFilters from '../components/common/ModuleFilters'

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showForm, setShowForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 50
  const menuRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await leadsService.getAll({
        search: search || undefined,
      })
      setLeads(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

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
    if (!confirm('¿Eliminar este lead?')) return
    await leadsService.delete(id)
    load()
  }

  const filtered = leads.filter(l => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const record = l as unknown as Record<string, unknown>
      if (String(record[key] ?? '') !== value) return false
    }
    return true
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  function formatDate(d: string) {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Posibles clientes</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded-lg transition-colors" style={{ backgroundColor: '#001E5D' }}>
            <Plus className="w-4 h-4" /> Nuevo lead
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar nombre, empresa, email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <ModuleFilters
          modulo="leads"
          filters={filters}
          onChange={f => { setFilters(f); setPage(1) }}
          onClear={() => { setFilters({}); setPage(1) }}
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron leads</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Nombre de Posible cliente
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Correo electrónico
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Estado de Posible cliente
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Hora de creación
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Teléfono
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Propietario
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Fuente de Posible cliente
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Empresa
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  Servicio
                </th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(lead => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group">
                  {/* Nombre clickeable */}
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left max-w-[200px] truncate block"
                    >
                      {lead.nombre || '—'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[180px]">
                    <span className="truncate block">{lead.email || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {lead.estado ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[lead.estado]}`}>
                        {LEAD_STATUS_LABELS[lead.estado]}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                    {lead.telefono || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {lead.ejecutivo ? `${lead.ejecutivo.nombre} ${lead.ejecutivo.apellido}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                    {lead.origen ? ORIGIN_LABELS[lead.origen] : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[150px]">
                    <span className="truncate block">{lead.empresa || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                    {lead.servicio ? SERVICE_LABELS[lead.servicio] : '—'}
                  </td>
                  {/* Acciones */}
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1">
                      {/* Botón Convertir visible en hover */}
                      <button
                        onClick={() => setConvertLead(lead)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
                        title="Convertir a Contacto"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Convertir
                      </button>
                      <div className="relative" ref={openMenuId === lead.id ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === lead.id ? null : lead.id)}
                          className="p-1 text-gray-300 hover:text-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenuId === lead.id && (
                          <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                            <button
                              onClick={() => { setSelectedLead(lead); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" /> Editar
                            </button>
                            <button
                              onClick={() => { navigate(`/leads/${lead.id}`); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver detalle
                            </button>
                            <button
                              onClick={() => { setConvertLead(lead); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" /> Convertir
                            </button>
                            <button
                              onClick={() => { handleDelete(lead.id); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
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

      {/* Modal Crear */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo Lead" size="xl">
        <LeadForm
          onSubmit={async (data) => {
            await leadsService.create(data as Parameters<typeof leadsService.create>[0])
            setShowForm(false)
            load()
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Panel lateral edición */}
      <LeadSlidePanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onSaved={() => { setSelectedLead(null); load() }}
      />

      {/* Modal Convertir Lead */}
      <ConvertLeadModal
        lead={convertLead}
        onClose={() => setConvertLead(null)}
        onConverted={() => { setConvertLead(null); load() }}
      />
    </div>
  )
}
