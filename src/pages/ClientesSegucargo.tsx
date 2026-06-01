import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Users2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Contact {
  id: string
  nombre: string
  apellido: string | null
  empresa: string | null
  email: string | null
  telefono: string | null
  pais: string | null
  created_at: string
}

export default function ClientesSegucargo() {
  const [items, setItems] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .not('empresa', 'is', null)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  const filtered = items.filter(i => {
    const fullName = `${i.nombre} ${i.apellido || ''}`.toLowerCase()
    const q = search.toLowerCase()
    return (
      fullName.includes(q) ||
      (i.empresa || '').toLowerCase().includes(q) ||
      (i.email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users2 className="text-[#001E5D]" size={28} />
          <h1 className="text-2xl font-bold text-[#001E5D]">Clientes</h1>
          <span className="badge bg-blue-100 text-blue-800">{items.length} contactos con empresa</span>
        </div>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="input pl-10 w-full max-w-sm"
            placeholder="Buscar por nombre, empresa o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001E5D]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">País</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">No hay clientes con empresa registrada</td>
                  </tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#001E5D]">
                      {item.nombre} {item.apellido || ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.empresa}</td>
                    <td className="px-4 py-3 text-gray-600">{item.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.telefono || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.pais || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        className="flex items-center gap-1 text-[#2AD4AE] hover:underline text-sm"
                        onClick={() => navigate(`/contacts/${item.id}`)}
                      >
                        <ExternalLink size={14} /> Ver contacto
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
