import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Plus, Mail, CheckSquare, Phone, X, Save, Settings, Clock } from 'lucide-react'
import type { Secuencia, Paso, EmailTemplate } from '../../pages/Secuencias'

interface Props {
  secuencia: Secuencia | null
  onSaved: () => void
  onCancel: () => void
}

type TipoPaso = 'correo' | 'tarea' | 'llamada'

const tipoConfig: Record<TipoPaso, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  correo: {
    label: 'Correo',
    icon: <Mail size={16} />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  tarea: {
    label: 'Tarea',
    icon: <CheckSquare size={16} />,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  llamada: {
    label: 'Llamada',
    icon: <Phone size={16} />,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
}

function newPaso(tipo: TipoPaso, index: number): Paso {
  return {
    id: crypto.randomUUID(),
    tipo,
    nombre: tipo === 'correo' ? 'Enviar correo' : tipo === 'tarea' ? 'Nueva tarea' : 'Llamada',
    delay_dias: index === 0 ? 0 : 1,
    delay_tipo: index === 0 ? 'inmediato' : 'dias',
  }
}

export default function SecuenciaBuilder({ secuencia, onSaved, onCancel }: Props) {
  const [nombre, setNombre] = useState(secuencia?.nombre || '')
  const [descripcion, setDescripcion] = useState(secuencia?.descripcion || '')
  const [estado, setEstado] = useState(secuencia?.estado || 'borrador')
  const [tipoTrigger, setTipoTrigger] = useState(secuencia?.tipo_trigger || 'manual')
  const [triggerEstado, setTriggerEstado] = useState(secuencia?.trigger_estado || '')
  const [pasos, setPasos] = useState<Paso[]>(secuencia?.pasos || [])
  const [selectedPasoId, setSelectedPasoId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [saving, setSaving] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null) // insert after index

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    const { data } = await supabase.from('email_templates').select('*').order('nombre')
    setTemplates((data || []) as EmailTemplate[])
  }

  const selectedPaso = pasos.find(p => p.id === selectedPasoId) || null

  function updatePaso(id: string, updates: Partial<Paso>) {
    setPasos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  function addPaso(tipo: TipoPaso, afterIndex: number) {
    const newStep = newPaso(tipo, pasos.length)
    const updated = [...pasos]
    updated.splice(afterIndex + 1, 0, newStep)
    setPasos(updated)
    setSelectedPasoId(newStep.id)
    setShowAddMenu(null)
  }

  function removePaso(id: string) {
    setPasos(prev => prev.filter(p => p.id !== id))
    if (selectedPasoId === id) setSelectedPasoId(null)
  }

  async function handleSave() {
    if (!nombre.trim()) return alert('El nombre de la secuencia es obligatorio.')
    setSaving(true)
    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      estado,
      tipo_trigger: tipoTrigger,
      trigger_estado: triggerEstado.trim() || null,
      pasos,
      updated_at: new Date().toISOString(),
    }
    if (secuencia) {
      await supabase.from('secuencias').update(payload).eq('id', secuencia.id)
    } else {
      await supabase.from('secuencias').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#001E5D]">
              {secuencia ? 'Editar secuencia' : 'Nueva secuencia'}
            </h1>
            <p className="text-xs text-gray-400">Constructor visual de secuencias</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white"
            value={estado}
            onChange={e => setEstado(e.target.value)}
          >
            <option value="borrador">Borrador</option>
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
          </select>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white rounded-lg text-sm font-medium hover:bg-[#002b85] transition-colors disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={15} />
            {saving ? 'Guardando...' : 'Guardar secuencia'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: config + flow */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Nombre y descripción */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Settings size={14} /> Configuración general
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Seguimiento post-cotización"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Descripción breve de la secuencia"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de activación</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={tipoTrigger}
                  onChange={e => setTipoTrigger(e.target.value)}
                >
                  <option value="manual">Manual</option>
                  <option value="estado_lead">Por estado de lead</option>
                </select>
              </div>
              {tipoTrigger === 'estado_lead' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado del lead que activa</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={triggerEstado}
                    onChange={e => setTriggerEstado(e.target.value)}
                    placeholder="Ej: nuevo, cotizando, seguimiento..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Flow */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2">
              Flujo de pasos
              <span className="ml-1 text-xs font-normal text-gray-400">({pasos.length} paso{pasos.length !== 1 ? 's' : ''})</span>
            </h2>

            {/* Horizontal scrollable flow */}
            <div className="flex items-center gap-0 overflow-x-auto pb-4">
              {/* Add first step button if empty */}
              {pasos.length === 0 && (
                <AddStepButton onClick={() => setShowAddMenu(-1)} />
              )}

              {pasos.map((paso, idx) => {
                const cfg = tipoConfig[paso.tipo]
                const isSelected = selectedPasoId === paso.id
                return (
                  <div key={paso.id} className="flex items-center gap-0 shrink-0">
                    <div
                      className={`relative w-44 border-2 rounded-xl p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#001E5D] shadow-md'
                          : `${cfg.border} hover:border-gray-400`
                      } bg-white`}
                      onClick={() => setSelectedPasoId(isSelected ? null : paso.id)}
                    >
                      {/* Remove btn */}
                      <button
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-gray-500 transition-colors z-10"
                        onClick={e => { e.stopPropagation(); removePaso(paso.id) }}
                      >
                        <X size={10} />
                      </button>

                      {/* Step number */}
                      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#001E5D] text-white flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>

                      {/* Type badge */}
                      <div className={`flex items-center gap-1.5 ${cfg.bg} ${cfg.color} rounded-md px-2 py-1 text-xs font-medium w-fit mb-2`}>
                        {cfg.icon}
                        {cfg.label}
                      </div>

                      <p className="text-xs font-semibold text-gray-800 truncate">{paso.nombre}</p>

                      {/* Timing */}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                        <Clock size={10} />
                        {idx === 0 || paso.delay_tipo === 'inmediato'
                          ? 'Inmediatamente'
                          : `+${paso.delay_dias} día${paso.delay_dias !== 1 ? 's' : ''}`}
                      </div>
                    </div>

                    {/* Connector + add button */}
                    <div className="flex items-center gap-0 shrink-0">
                      <div className="w-4 h-0.5 bg-gray-300" />
                      <div className="relative">
                        <button
                          className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 hover:border-[#001E5D] hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-[#001E5D] transition-colors"
                          onClick={e => { e.stopPropagation(); setShowAddMenu(showAddMenu === idx ? null : idx) }}
                        >
                          <Plus size={12} />
                        </button>
                        {showAddMenu === idx && (
                          <AddMenuDropdown onSelect={tipo => addPaso(tipo, idx)} onClose={() => setShowAddMenu(null)} />
                        )}
                      </div>
                      <div className="w-4 h-0.5 bg-gray-300" />
                    </div>
                  </div>
                )
              })}

              {/* Add at end */}
              {pasos.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 hover:border-[#001E5D] hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-[#001E5D] transition-colors"
                    onClick={() => setShowAddMenu(showAddMenu === pasos.length - 1 + 1000 ? null : pasos.length - 1 + 1000)}
                  >
                    <Plus size={18} />
                  </button>
                  {showAddMenu === pasos.length - 1 + 1000 && (
                    <AddMenuDropdown onSelect={tipo => addPaso(tipo, pasos.length - 1)} onClose={() => setShowAddMenu(null)} />
                  )}
                </div>
              )}
            </div>

            {pasos.length === 0 && showAddMenu === -1 && (
              <div className="mt-3">
                <AddMenuDropdown onSelect={tipo => addPaso(tipo, -1)} onClose={() => setShowAddMenu(null)} />
              </div>
            )}
          </div>
        </div>

        {/* Right panel: paso config */}
        {selectedPaso && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <PasoConfigPanel
              paso={selectedPaso}
              templates={templates}
              onChange={(updates) => updatePaso(selectedPaso.id, updates)}
              onClose={() => setSelectedPasoId(null)}
              isFirst={pasos.indexOf(selectedPaso) === 0}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AddStepButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex flex-col items-center justify-center w-44 h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#001E5D] hover:bg-blue-50 text-gray-400 hover:text-[#001E5D] transition-colors"
      onClick={onClick}
    >
      <Plus size={20} />
      <span className="text-xs mt-1">Agregar paso</span>
    </button>
  )
}

function AddMenuDropdown({ onSelect, onClose }: { onSelect: (tipo: TipoPaso) => void; onClose: () => void }) {
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-40">
      <p className="text-[10px] font-semibold text-gray-400 px-2 pb-1 uppercase tracking-wide">Tipo de paso</p>
      {(Object.entries(tipoConfig) as [TipoPaso, typeof tipoConfig[TipoPaso]][]).map(([tipo, cfg]) => (
        <button
          key={tipo}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${cfg.color} hover:${cfg.bg} transition-colors`}
          onClick={() => onSelect(tipo)}
        >
          {cfg.icon} {cfg.label}
        </button>
      ))}
      <button className="w-full text-xs text-gray-400 mt-1 hover:text-gray-600 pt-1 border-t border-gray-100" onClick={onClose}>
        Cancelar
      </button>
    </div>
  )
}

interface PasoConfigProps {
  paso: Paso
  templates: EmailTemplate[]
  onChange: (updates: Partial<Paso>) => void
  onClose: () => void
  isFirst: boolean
}

function PasoConfigPanel({ paso, templates, onChange, onClose, isFirst }: PasoConfigProps) {
  const cfg = tipoConfig[paso.tipo]

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className={`flex items-center gap-2 text-sm font-semibold ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-400">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Nombre del paso */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del paso</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30"
            value={paso.nombre}
            onChange={e => onChange({ nombre: e.target.value })}
          />
        </div>

        {/* Timing */}
        {!isFirst && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Timing</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none mb-2"
              value={paso.delay_tipo}
              onChange={e => onChange({ delay_tipo: e.target.value as 'inmediato' | 'dias' })}
            >
              <option value="inmediato">Inmediatamente</option>
              <option value="dias">X días después del anterior</option>
            </select>
            {paso.delay_tipo === 'dias' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={paso.delay_dias}
                  onChange={e => onChange({ delay_dias: parseInt(e.target.value) || 1 })}
                />
                <span className="text-sm text-gray-500">días después</span>
              </div>
            )}
          </div>
        )}

        {/* Correo */}
        {paso.tipo === 'correo' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plantilla de correo</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={paso.template_id || ''}
                onChange={e => {
                  const tpl = templates.find(t => t.id === e.target.value)
                  onChange({
                    template_id: e.target.value || undefined,
                    template_nombre: tpl?.nombre,
                    asunto: tpl?.asunto || paso.asunto,
                  })
                }}
              >
                <option value="">— Sin plantilla (personalizado) —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Asunto del correo</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30"
                value={paso.asunto || ''}
                onChange={e => onChange({ asunto: e.target.value })}
                placeholder="Asunto del correo"
              />
            </div>
          </>
        )}

        {/* Tarea */}
        {paso.tipo === 'tarea' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título de la tarea</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30"
                value={paso.tarea_titulo || ''}
                onChange={e => onChange({ tarea_titulo: e.target.value })}
                placeholder="Título de la tarea"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 resize-none h-24"
                value={paso.tarea_descripcion || ''}
                onChange={e => onChange({ tarea_descripcion: e.target.value })}
                placeholder="Descripción de la tarea..."
              />
            </div>
          </>
        )}

        {/* Llamada */}
        {paso.tipo === 'llamada' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas para la llamada</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 resize-none h-28"
              value={paso.llamada_notas || ''}
              onChange={e => onChange({ llamada_notas: e.target.value })}
              placeholder="Guión o notas para la llamada..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
