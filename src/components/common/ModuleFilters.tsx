import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ModuleProperty {
  id: string
  nombre: string
  etiqueta: string
  tipo: string
  opciones: string[] | null
  orden: number
}

interface ModuleFiltersProps {
  modulo: string
  filters: Record<string, string>
  onChange: (filters: Record<string, string>) => void
  onClear: () => void
}

export default function ModuleFilters({ modulo, filters, onChange, onClear }: ModuleFiltersProps) {
  const [properties, setProperties] = useState<ModuleProperty[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase
      .from('module_properties')
      .select('id, nombre, etiqueta, tipo, opciones, orden')
      .eq('modulo', modulo)
      .eq('activo', true)
      .in('tipo', ['seleccion', 'booleano'])
      .order('orden', { ascending: true })
      .then(({ data }) => setProperties((data as ModuleProperty[]) || []))
  }, [modulo])

  const activeCount = Object.values(filters).filter(v => v !== '').length

  function handleChange(nombre: string, value: string) {
    onChange({ ...filters, [nombre]: value })
  }

  if (properties.length === 0) return null

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
      >
        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700 font-medium">Filtros</span>
        {activeCount > 0 && (
          <span
            className="flex items-center justify-center w-5 h-5 text-xs text-white font-bold rounded-full"
            style={{ backgroundColor: '#001E5D' }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[480px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Filtros dinámicos</span>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  onClick={() => { onClear(); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpiar filtros
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {properties.map(prop => (
              <div key={prop.id}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{prop.etiqueta}</label>
                {prop.tipo === 'seleccion' ? (
                  <select
                    value={filters[prop.nombre] || ''}
                    onChange={e => handleChange(prop.nombre, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    <option value="">Todos</option>
                    {(prop.opciones || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={filters[prop.nombre] || ''}
                    onChange={e => handleChange(prop.nombre, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    <option value="">Todos</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
