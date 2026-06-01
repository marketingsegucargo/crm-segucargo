import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Plus, Code2, Pencil, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FormBuilder, { type CampoFormulario } from '../components/formularios/FormBuilder'
import EmbedCodeModal from '../components/formularios/EmbedCodeModal'

interface Formulario {
  id: string
  nombre: string
  slug: string
  campos: CampoFormulario[]
  config: Record<string, unknown>
  origen_lead: string
  activo: boolean
  total_respuestas: number
  created_at: string
}

export default function Formularios() {
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [loading, setLoading] = useState(true)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<Formulario | null>(null)
  const [embedForm, setEmbedForm] = useState<Formulario | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadFormularios = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setFormularios(data as Formulario[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadFormularios()
  }, [loadFormularios])

  const handleToggleActivo = async (form: Formulario) => {
    const { error } = await supabase
      .from('formularios')
      .update({ activo: !form.activo })
      .eq('id', form.id)
    if (!error) {
      setFormularios(prev => prev.map(f => f.id === form.id ? { ...f, activo: !f.activo } : f))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este formulario? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    await supabase.from('formularios').delete().eq('id', id)
    setFormularios(prev => prev.filter(f => f.id !== id))
    setDeletingId(null)
  }

  const handleNewForm = () => {
    setEditingForm(null)
    setBuilderOpen(true)
  }

  const handleEditForm = (form: Formulario) => {
    setEditingForm(form)
    setBuilderOpen(true)
  }

  const handleBuilderSaved = () => {
    setBuilderOpen(false)
    setEditingForm(null)
    loadFormularios()
  }

  const handleBuilderClose = () => {
    setBuilderOpen(false)
    setEditingForm(null)
  }

  if (builderOpen) {
    return (
      <FormBuilder
        formulario={editingForm}
        onClose={handleBuilderClose}
        onSaved={handleBuilderSaved}
      />
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-[#001E5D]" />
          <h1 className="text-2xl font-bold text-gray-900">Formularios</h1>
          <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {formularios.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFormularios}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleNewForm}
            className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo formulario
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 opacity-30 animate-spin" />
          <p className="text-sm">Cargando formularios...</p>
        </div>
      ) : formularios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">No hay formularios aún</p>
          <p className="text-sm text-gray-400 mb-4">
            Crea tu primer formulario para incrustar en tu sitio web
          </p>
          <button
            onClick={handleNewForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear formulario
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Slug / URL</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Campos</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Respuestas</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Fecha</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {formularios.map(form => (
                <tr key={form.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">{form.nombre}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      origen: <span className="text-gray-600">{form.origen_lead}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                      /{form.slug || '—'}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-[#001E5D] text-xs font-bold">
                      {Array.isArray(form.campos) ? form.campos.length : 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {form.total_respuestas ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActivo(form)}
                      className={`flex items-center gap-1.5 mx-auto text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        form.activo
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {form.activo ? (
                        <><ToggleRight className="w-3.5 h-3.5" /> Activo</>
                      ) : (
                        <><ToggleLeft className="w-3.5 h-3.5" /> Inactivo</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {form.created_at
                        ? new Date(form.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditForm(form)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-[#001E5D] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEmbedForm(form)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                        title="Ver código"
                      >
                        <Code2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(form.id)}
                        disabled={deletingId === form.id}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Embed Code Modal */}
      {embedForm && (
        <EmbedCodeModal
          formulario={embedForm}
          onClose={() => setEmbedForm(null)}
        />
      )}
    </div>
  )
}
