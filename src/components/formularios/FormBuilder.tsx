import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface CampoFormulario {
  id: string
  tipo: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox'
  label: string
  placeholder?: string
  requerido: boolean
  opciones?: string[]
  ancho?: 'completo' | 'mitad'
}

interface FormularioData {
  id?: string
  nombre: string
  slug: string
  campos: CampoFormulario[]
  origen_lead: string
  activo: boolean
  config: Record<string, unknown>
}

interface FormBuilderProps {
  formulario?: FormularioData | null
  onClose: () => void
  onSaved: () => void
}

const TIPOS_CAMPO: { tipo: CampoFormulario['tipo']; label: string; icono: string }[] = [
  { tipo: 'text', label: 'Texto', icono: 'T' },
  { tipo: 'email', label: 'Email', icono: '@' },
  { tipo: 'tel', label: 'Teléfono', icono: '☎' },
  { tipo: 'select', label: 'Select', icono: '▾' },
  { tipo: 'textarea', label: 'Área de texto', icono: '¶' },
  { tipo: 'checkbox', label: 'Checkbox', icono: '☑' },
]

const ORIGENES = [
  { value: 'web', label: 'Sitio Web' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'cotizador', label: 'Cotizador' },
  { value: 'referido', label: 'Referido' },
  { value: 'evento', label: 'Evento' },
  { value: 'otro', label: 'Otro' },
]

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function newCampo(tipo: CampoFormulario['tipo']): CampoFormulario {
  const defaults: Record<CampoFormulario['tipo'], Partial<CampoFormulario>> = {
    text: { label: 'Nombre', placeholder: 'Ej: Juan Pérez' },
    email: { label: 'Email', placeholder: 'correo@ejemplo.com' },
    tel: { label: 'Teléfono', placeholder: '+56 9 1234 5678' },
    select: { label: 'Servicio', opciones: ['Opción 1', 'Opción 2'] },
    textarea: { label: 'Mensaje', placeholder: 'Escribe tu mensaje...' },
    checkbox: { label: 'Acepto los términos y condiciones' },
  }
  return {
    id: generateId(),
    tipo,
    label: defaults[tipo].label || tipo,
    placeholder: defaults[tipo].placeholder,
    requerido: tipo !== 'checkbox',
    opciones: defaults[tipo].opciones,
    ancho: 'completo' as const,
  }
}

export default function FormBuilder({ formulario, onClose, onSaved }: FormBuilderProps) {
  const isNew = !formulario?.id
  const [nombre, setNombre] = useState(formulario?.nombre || '')
  const [slug, setSlug] = useState(formulario?.slug || '')
  const [slugManual, setSlugManual] = useState(false)
  const [campos, setCampos] = useState<CampoFormulario[]>(formulario?.campos || [])
  const [origenLead, setOrigenLead] = useState(formulario?.origen_lead || 'web')
  const [activo, setActivo] = useState(formulario?.activo ?? true)
  const [campoSeleccionado, setCampoSeleccionado] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slugManual && nombre) {
      setSlug(toSlug(nombre))
    }
  }, [nombre, slugManual])

  const campoActivo = campos.find(c => c.id === campoSeleccionado) || null

  const addCampo = (tipo: CampoFormulario['tipo']) => {
    const campo = newCampo(tipo)
    setCampos(prev => [...prev, campo])
    setCampoSeleccionado(campo.id)
  }

  const removeCampo = (id: string) => {
    setCampos(prev => prev.filter(c => c.id !== id))
    if (campoSeleccionado === id) setCampoSeleccionado(null)
  }

  const moveCampo = (id: string, dir: 'up' | 'down') => {
    setCampos(prev => {
      const idx = prev.findIndex(c => c.id === id)
      if (idx === -1) return prev
      const next = [...prev]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const updateCampo = (id: string, updates: Partial<CampoFormulario>) => {
    setCampos(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    if (!slug.trim()) { setError('El slug es requerido'); return }
    setSaving(true)
    setError('')

    const payload = {
      nombre: nombre.trim(),
      slug: slug.trim(),
      campos,
      origen_lead: origenLead,
      activo,
      config: formulario?.config || {},
      ...(formulario?.id ? { id: formulario.id } : {}),
    }

    const { error: err } = await supabase
      .from('formularios')
      .upsert(payload, { onConflict: 'id' })

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-900">
            {isNew ? 'Nuevo formulario' : `Editando: ${nombre}`}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002f8a] disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar formulario'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: tipos de campo */}
        <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Campos disponibles</p>
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto">
            {TIPOS_CAMPO.map(({ tipo, label, icono }) => (
              <button
                key={tipo}
                onClick={() => addCampo(tipo)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-[#001E5D] hover:text-white transition-colors group"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded bg-white group-hover:bg-white/20 text-xs font-bold text-[#001E5D] group-hover:text-white border border-gray-200 group-hover:border-transparent transition-colors">
                  {icono}
                </span>
                {label}
                <Plus className="w-3.5 h-3.5 ml-auto opacity-50 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          {/* Config del formulario */}
          <div className="border-t border-gray-200 p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Configuración</p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del formulario</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#001E5D] focus:border-[#001E5D]"
                placeholder="Ej: Cotización Express"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input
                type="text"
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
                className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#001E5D] focus:border-[#001E5D] font-mono"
                placeholder="cotizacion-express"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origen del lead</label>
              <select
                value={origenLead}
                onChange={e => setOrigenLead(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#001E5D] focus:border-[#001E5D]"
              >
                {ORIGENES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Activo</label>
              <button
                onClick={() => setActivo(v => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${activo ? 'bg-[#001E5D]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${activo ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* CENTER: preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#001E5D] px-6 py-4">
                <h2 className="text-white font-semibold text-lg">{nombre || 'Nombre del formulario'}</h2>
                <p className="text-blue-200 text-xs mt-0.5 font-mono">/{slug || 'slug-del-formulario'}</p>
              </div>

              <div className="p-6">
                {campos.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm font-medium">Agrega campos desde el panel izquierdo</p>
                    <p className="text-xs mt-1">Haz click en cualquier tipo de campo para añadirlo</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                  {campos.map((campo, idx) => (
                    <div
                      key={campo.id}
                      onClick={() => setCampoSeleccionado(campo.id)}
                      className={`relative border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                        campo.ancho === 'mitad' ? 'col-span-1' : 'col-span-2'
                      } ${
                        campoSeleccionado === campo.id
                          ? 'border-[#001E5D] bg-blue-50'
                          : 'border-transparent hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-gray-800">
                          {campo.label}
                          {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => moveCampo(campo.id, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveCampo(campo.id, 'down')}
                            disabled={idx === campos.length - 1}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeCampo(campo.id)}
                            className="p-1 rounded hover:bg-red-100 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {campo.tipo === 'select' ? (
                        <select disabled className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-400">
                          <option>Seleccionar...</option>
                          {campo.opciones?.map(op => <option key={op}>{op}</option>)}
                        </select>
                      ) : campo.tipo === 'textarea' ? (
                        <textarea
                          disabled
                          placeholder={campo.placeholder}
                          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 resize-none h-16 text-gray-400 bg-white"
                        />
                      ) : campo.tipo === 'checkbox' ? (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-sm text-gray-500">{campo.label}</span>
                        </div>
                      ) : (
                        <input
                          disabled
                          type={campo.tipo}
                          placeholder={campo.placeholder}
                          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 text-gray-400 bg-white"
                        />
                      )}

                      {/* Hover actions overlay */}
                      <div className="absolute top-2 right-2 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => moveCampo(campo.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-white shadow border border-gray-200 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveCampo(campo.id, 'down')}
                          disabled={idx === campos.length - 1}
                          className="p-1 rounded bg-white shadow border border-gray-200 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeCampo(campo.id)}
                          className="p-1 rounded bg-white shadow border border-gray-200 hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}

                {campos.length > 0 && (
                  <button className="w-full mt-4 py-2.5 bg-[#001E5D] text-white text-sm font-semibold rounded-lg opacity-70 cursor-default">
                    Enviar
                  </button>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              Vista previa — haz click en un campo para editar sus propiedades
            </p>
          </div>
        </div>

        {/* RIGHT: propiedades del campo */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Propiedades</p>
          </div>

          {campoActivo ? (
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de campo</label>
                <div className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded font-medium">
                  {TIPOS_CAMPO.find(t => t.tipo === campoActivo.tipo)?.label}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Etiqueta (label)</label>
                <input
                  type="text"
                  value={campoActivo.label}
                  onChange={e => updateCampo(campoActivo.id, { label: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#001E5D]"
                />
              </div>

              {campoActivo.tipo !== 'checkbox' && campoActivo.tipo !== 'select' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={campoActivo.placeholder || ''}
                    onChange={e => updateCampo(campoActivo.id, { placeholder: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#001E5D]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">Campo requerido</label>
                <button
                  onClick={() => updateCampo(campoActivo.id, { requerido: !campoActivo.requerido })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${campoActivo.requerido ? 'bg-[#001E5D]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${campoActivo.requerido ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Ancho del campo</label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateCampo(campoActivo.id, { ancho: 'completo' })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium border transition-colors ${
                      (campoActivo.ancho ?? 'completo') === 'completo'
                        ? 'bg-[#001E5D] text-white border-[#001E5D]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-base leading-none">⬜</span>
                    Completo
                  </button>
                  <button
                    onClick={() => updateCampo(campoActivo.id, { ancho: 'mitad' })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium border transition-colors ${
                      campoActivo.ancho === 'mitad'
                        ? 'bg-[#001E5D] text-white border-[#001E5D]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-base leading-none">▪▪</span>
                    Mitad
                  </button>
                </div>
              </div>

              {campoActivo.tipo === 'select' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Opciones (una por línea)</label>
                  <textarea
                    value={(campoActivo.opciones || []).join('\n')}
                    onChange={e => updateCampo(campoActivo.id, { opciones: e.target.value.split('\n').filter(Boolean) })}
                    className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#001E5D] h-24 resize-none font-mono"
                    placeholder={'Opción 1\nOpción 2\nOpción 3'}
                  />
                </div>
              )}

              <button
                onClick={() => removeCampo(campoActivo.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar campo
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  Selecciona un campo en el formulario para editar sus propiedades
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
