import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Calendar, List, Plus, Edit2, Trash2, Video, ExternalLink,
  ChevronLeft, ChevronRight, Link2, ToggleLeft, ToggleRight, Copy, Check,
} from 'lucide-react'
import ReuniónForm from '../components/reuniones/ReuniónForm'
import MeetingTypeModal from '../components/reuniones/MeetingTypeModal'
import MeetingPageForm from '../components/reuniones/MeetingPageForm'

interface Reunion {
  id: string
  titulo: string
  descripcion: string | null
  fecha_inicio: string
  duracion_minutos: number | null
  participantes: string[] | null
  ejecutivo_id: string | null
  estado: string | null
  teams_link: string | null
  created_at: string
  ejecutivo?: { nombre: string; apellido: string } | null
}

interface MeetingPage {
  id: string
  nombre_interno: string
  organizador_id: string | null
  titulo_evento: string | null
  ubicacion: string | null
  video_link: string | null
  descripcion: string | null
  tipo: 'personalizada' | 'grupo' | 'rotacion'
  duraciones: number[]
  slug: string
  activo: boolean
  cancelar_reprogramar: boolean
  created_at: string
  organizador?: { nombre: string; apellido: string } | null
}

const ESTADO_BADGE: Record<string, string> = {
  programada: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
}
const ESTADO_LABEL: Record<string, string> = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada: 'Cancelada',
}
const TIPO_LABEL: Record<string, string> = {
  personalizada: 'Personalizado',
  grupo: 'Grupo',
  rotacion: 'Rotación',
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)
const DIAS_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}

const CRM_URL = window.location.origin

export default function Reuniones() {
  const [mainTab, setMainTab] = useState<'reuniones' | 'paginas'>('paginas')

  const [items, setItems] = useState<Reunion[]>([])
  const [loadingR, setLoadingR] = useState(true)
  const [vista, setVista] = useState<'calendario' | 'lista'>('lista')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Reunion | null>(null)
  const [semanaBase, setSemanaBase] = useState(() => startOfWeek(new Date()))

  const [pages, setPages] = useState<MeetingPage[]>([])
  const [loadingP, setLoadingP] = useState(true)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<'personalizada' | 'grupo' | 'rotacion' | null>(null)
  const [editingPage, setEditingPage] = useState<MeetingPage | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { fetchReuniones(); fetchPages() }, [])

  async function fetchReuniones() {
    setLoadingR(true)
    const { data } = await supabase
      .from('reuniones')
      .select('*, ejecutivo:profiles!ejecutivo_id(nombre, apellido)')
      .order('fecha_inicio', { ascending: true })
    if (data) setItems(data as Reunion[])
    setLoadingR(false)
  }

  async function fetchPages() {
    setLoadingP(true)
    const { data } = await supabase
      .from('meeting_pages')
      .select('*, organizador:profiles!organizador_id(nombre, apellido)')
      .order('created_at', { ascending: false })
    if (data) setPages(data as MeetingPage[])
    setLoadingP(false)
  }

  async function handleDeleteReunion(id: string) {
    if (!confirm('¿Eliminar esta reunión?')) return
    await supabase.from('reuniones').delete().eq('id', id)
    fetchReuniones()
  }

  async function handleDeletePage(id: string) {
    if (!confirm('¿Eliminar esta página de programación?')) return
    await supabase.from('meeting_pages').delete().eq('id', id)
    fetchPages()
  }

  async function togglePageActivo(page: MeetingPage) {
    await supabase.from('meeting_pages').update({ activo: !page.activo, updated_at: new Date().toISOString() }).eq('id', page.id)
    fetchPages()
  }

  function copyLink(page: MeetingPage) {
    navigator.clipboard.writeText(`${CRM_URL}/booking/${page.slug}`)
    setCopiedId(page.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i))
  const HOY = new Date()

  function reunionesEnCelda(dia: Date, hora: number) {
    return items.filter(r => {
      const d = new Date(r.fecha_inicio)
      return d.getFullYear() === dia.getFullYear() && d.getMonth() === dia.getMonth() &&
        d.getDate() === dia.getDate() && d.getHours() === hora
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#001E5D]" />
          <h1 className="text-xl font-bold text-gray-900">Reuniones</h1>
        </div>
        {mainTab === 'reuniones' ? (
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setVista('calendario')} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${vista === 'calendario' ? 'bg-[#001E5D] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <Calendar className="w-4 h-4" /> Calendario
              </button>
              <button onClick={() => setVista('lista')} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${vista === 'lista' ? 'bg-[#001E5D] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <List className="w-4 h-4" /> Lista
              </button>
            </div>
            <button onClick={() => { setEditing(null); setShowModal(true) }} className="flex items-center gap-1.5 px-3 py-2 bg-[#001E5D] text-white rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" /> Nueva reunión
            </button>
          </div>
        ) : (
          <button onClick={() => setShowTypeModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#001E5D] text-white rounded-lg text-sm font-semibold">
            <Plus className="w-4 h-4" /> Crear página de programación
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 bg-white px-6">
        <button onClick={() => setMainTab('paginas')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${mainTab === 'paginas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Páginas de programación
        </button>
        <button onClick={() => setMainTab('reuniones')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${mainTab === 'reuniones' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Reuniones programadas
          <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded-full">{items.length}</span>
        </button>
      </div>

      {mainTab === 'paginas' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Video className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Integración con Microsoft Teams:</strong> Agrega el enlace de reunión de Teams al crear una página.
              Los contactos verán el enlace al confirmar su reserva.
            </p>
          </div>

          {loadingP ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-600 mb-1">No hay páginas de programación</h3>
              <p className="text-sm text-gray-400 mb-4">Crea una página para que tus contactos puedan agendar reuniones contigo.</p>
              <button onClick={() => setShowTypeModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001E5D] text-white rounded-lg text-sm font-semibold">
                <Plus className="w-4 h-4" /> Crear primera página
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50 text-sm text-gray-600">
                <span>Responsable: <span className="text-[#001E5D] font-medium">Todos ▼</span></span>
                <span>Tipo de reunión: <span className="text-[#001E5D] font-medium">Todos los tipos de reuniones ▼</span></span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre de la reunión</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Organizador</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duración</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="w-28 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pages.map(page => (
                    <tr key={page.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{page.nombre_interno}</p>
                        <a href={`/booking/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                          <Link2 className="w-3 h-3" />{page.slug} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{page.organizador ? `${page.organizador.nombre} ${page.organizador.apellido}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{TIPO_LABEL[page.tipo] ?? page.tipo}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{page.duraciones?.length > 0 ? page.duraciones.map(d => `${d} min`).join(', ') : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => togglePageActivo(page)} className={`inline-flex items-center gap-1.5 text-xs font-medium ${page.activo ? 'text-green-600' : 'text-gray-400'}`}>
                          {page.activo ? <><ToggleRight className="w-4 h-4" /> Activo</> : <><ToggleLeft className="w-4 h-4" /> Inactivo</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => copyLink(page)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded" title="Copiar enlace">
                            {copiedId === page.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { setEditingPage(page); setSelectedTipo(page.tipo) }} className="p-1.5 text-gray-400 hover:text-[#001E5D] rounded" title="Editar">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeletePage(page.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {mainTab === 'reuniones' && (
        <div className="flex-1 overflow-auto">
          {vista === 'calendario' && (
            <div className="p-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <button onClick={() => setSemanaBase(d => addDays(d, -7))} className="p-1.5 rounded hover:bg-gray-200"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm font-semibold text-gray-700">
                    Semana del {semanaBase.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setSemanaBase(d => addDays(d, 7))} className="p-1.5 rounded hover:bg-gray-200"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="w-16 border-b border-r border-gray-200 p-2 text-gray-400 font-normal bg-gray-50">Hora</th>
                        {diasSemana.map((dia, i) => {
                          const esHoy = dia.getDate() === HOY.getDate() && dia.getMonth() === HOY.getMonth() && dia.getFullYear() === HOY.getFullYear()
                          return (
                            <th key={i} className={`border-b border-r border-gray-200 p-2 font-medium text-center ${esHoy ? 'bg-[#001E5D]/10 text-[#001E5D]' : 'bg-gray-50 text-gray-600'}`}>
                              <div>{DIAS_LABEL[i]}</div>
                              <div className={`text-lg font-bold ${esHoy ? 'text-[#001E5D]' : 'text-gray-800'}`}>{dia.getDate()}</div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map(hora => (
                        <tr key={hora} className="border-b border-gray-100">
                          <td className="border-r border-gray-200 p-2 text-gray-400 text-center align-top bg-gray-50 font-mono">
                            {hora.toString().padStart(2, '0')}:00
                          </td>
                          {diasSemana.map((dia, i) => {
                            const celdaReuniones = reunionesEnCelda(dia, hora)
                            return (
                              <td key={i} className="border-r border-gray-100 p-1 align-top h-12">
                                {celdaReuniones.map(r => (
                                  <div key={r.id} onClick={() => { setEditing(r); setShowModal(true) }}
                                    className="rounded px-1.5 py-1 mb-0.5 bg-[#001E5D] text-white cursor-pointer hover:bg-[#002a7a] truncate" title={r.titulo}>
                                    {r.titulo}
                                  </div>
                                ))}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {vista === 'lista' && (
            <div className="p-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loadingR ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No hay reuniones registradas</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Título</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Duración</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Ejecutivo</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Link</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(r => (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-3 font-medium text-gray-900">{r.titulo}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                            {new Date(r.fecha_inicio).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                            {new Date(r.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{r.duracion_minutos ? `${r.duracion_minutos} min` : '—'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{r.ejecutivo ? `${r.ejecutivo.nombre} ${r.ejecutivo.apellido}` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[r.estado ?? ''] ?? 'bg-gray-100 text-gray-700'}`}>
                              {ESTADO_LABEL[r.estado ?? ''] ?? r.estado ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.teams_link
                              ? <a href={r.teams_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#6264A7] hover:underline text-xs"><Video className="w-3.5 h-3.5" /> Unirse <ExternalLink className="w-3 h-3" /></a>
                              : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={() => { setEditing(r); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-[#001E5D] rounded"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteReunion(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ReuniónForm
          editing={editing as Record<string, unknown> | null}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchReuniones() }}
        />
      )}

      {showTypeModal && (
        <MeetingTypeModal
          onSelect={(tipo) => { setSelectedTipo(tipo); setShowTypeModal(false); setEditingPage(null) }}
          onClose={() => setShowTypeModal(false)}
        />
      )}

      {selectedTipo && !showTypeModal && (
        <MeetingPageForm
          tipo={selectedTipo}
          editing={editingPage}
          onClose={() => { setSelectedTipo(null); setEditingPage(null) }}
          onSaved={() => { setSelectedTipo(null); setEditingPage(null); fetchPages() }}
        />
      )}
    </div>
  )
}
