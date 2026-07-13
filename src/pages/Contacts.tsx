import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Filter, RefreshCw, MoreHorizontal, Trash2, Eye } from 'lucide-react'
import Modal from '../components/ui/Modal'
import ContactSlidePanel from '../components/contacts/ContactSlidePanel'
import { contactsService } from '../services/contacts'
import { ORIGIN_LABELS } from '../lib/constants'
import type { Contact } from '../types'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ModuleFilters from '../components/common/ModuleFilters'
import PhoneInput from '../components/ui/PhoneInput'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  apellido: z.string().min(1, 'Requerido'),
  empresa: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  pais: z.string().optional(),
  ciudad: z.string().optional(),
  origen: z.string().min(1),
  observaciones: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function ContactForm({ contact, onSubmit, onCancel }: { contact?: Contact; onSubmit: (d: FormData) => Promise<void>; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: contact ? { ...contact } : { origen: 'web' }
  })
  async function onSave(data: FormData) {
    setLoading(true)
    try { await onSubmit(data) } finally { setLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre *</label>
          <input {...register('nombre')} className="input" />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="label">Apellido *</label>
          <input {...register('apellido')} className="input" />
          {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Empresa</label><input {...register('empresa')} className="input" /></div>
        <div><label className="label">Cargo</label><input {...register('cargo')} className="input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className="input" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Teléfono</label>
          <Controller name="telefono" control={control} render={({ field }) => <PhoneInput value={field.value || ''} onChange={field.onChange} />} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="label">País</label><input {...register('pais')} className="input" /></div>
        <div><label className="label">Ciudad</label><input {...register('ciudad')} className="input" /></div>
        <div>
          <label className="label">Canal de origen</label>
          <select {...register('origen')} className="input">
            {Object.entries(ORIGIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Observaciones</label>
        <textarea {...register('observaciones')} className="input resize-none" rows={2} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Guardando...' : contact ? 'Actualizar' : 'Crear contacto'}</button>
      </div>
    </form>
  )
}

const PER_PAGE = 50

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showForm, setShowForm] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const menuRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await contactsService.getAll(search || undefined)
      setContacts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este contacto?')) return
    await contactsService.delete(id)
    load()
  }

  const filtered = contacts.filter(c => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue
      const record = c as unknown as Record<string, unknown>
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
          <h1 className="text-xl font-bold text-gray-900">Contactos</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded-lg transition-colors" style={{ backgroundColor: '#001E5D' }}>
            <Plus className="w-4 h-4" /> Nuevo contacto
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
            placeholder="Buscar nombre, empresa, email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <ModuleFilters
          modulo="contactos"
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
            <p className="text-sm">No se encontraron contactos</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Nombre del contacto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Correo electrónico</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Fuente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">País</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Hora de creación</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(contact => (
                <tr key={contact.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group">
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => setSelectedContact(contact)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left max-w-[200px] truncate block"
                    >
                      {contact.nombre} {contact.apellido}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[180px]">
                    <span className="truncate block">{contact.email || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{contact.telefono || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[150px]">
                    <span className="truncate block">{contact.empresa || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">{contact.cargo || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                    {contact.origen ? ORIGIN_LABELS[contact.origen] || contact.origen : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">{contact.pais || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">{formatDate(contact.created_at)}</td>
                  <td className="px-2 py-2.5">
                    <div className="relative" ref={openMenuId === contact.id ? menuRef : undefined}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === contact.id ? null : contact.id)}
                        className="p-1 text-gray-300 hover:text-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenuId === contact.id && (
                        <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px] py-1">
                          <button
                            onClick={() => { setSelectedContact(contact); setOpenMenuId(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => { handleDelete(contact.id); setOpenMenuId(null) }}
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white text-sm text-gray-500">
          <span>Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
            <span className="px-3">Página {page} de {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Siguiente</button>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo Contacto" size="lg">
        <ContactForm
          onSubmit={async (data) => {
            await contactsService.create(data as Parameters<typeof contactsService.create>[0])
            setShowForm(false)
            load()
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Panel lateral edición */}
      <ContactSlidePanel
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onSaved={() => { setSelectedContact(null); load() }}
      />
    </div>
  )
}
