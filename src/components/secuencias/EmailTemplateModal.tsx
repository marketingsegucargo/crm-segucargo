import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Eye, EyeOff, Plus } from 'lucide-react'
import type { EmailTemplate } from '../../pages/Secuencias'

interface Props {
  template: EmailTemplate | null
  onClose: () => void
  onSaved: () => void
}

const VARIABLES = ['{{nombre}}', '{{apellido}}', '{{empresa}}', '{{email}}', '{{telefono}}']

export default function EmailTemplateModal({ template, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(template?.nombre || '')
  const [asunto, setAsunto] = useState(template?.asunto || '')
  const [cuerpoHtml, setCuerpoHtml] = useState(template?.cuerpo_html || '')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (template) {
      setNombre(template.nombre)
      setAsunto(template.asunto)
      setCuerpoHtml(template.cuerpo_html)
    }
  }, [template])

  function insertVariable(variable: string) {
    const textarea = document.getElementById('tpl-body') as HTMLTextAreaElement | null
    if (!textarea) {
      setCuerpoHtml(prev => prev + variable)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = cuerpoHtml.slice(0, start) + variable + cuerpoHtml.slice(end)
    setCuerpoHtml(newValue)
    setTimeout(() => {
      textarea.selectionStart = start + variable.length
      textarea.selectionEnd = start + variable.length
      textarea.focus()
    }, 0)
  }

  async function handleSave() {
    if (!nombre.trim() || !asunto.trim() || !cuerpoHtml.trim()) {
      alert('Todos los campos son obligatorios.')
      return
    }
    setSaving(true)
    const payload = {
      nombre: nombre.trim(),
      asunto: asunto.trim(),
      cuerpo_html: cuerpoHtml.trim(),
      variables: VARIABLES,
      updated_at: new Date().toISOString(),
    }
    if (template) {
      await supabase.from('email_templates').update(payload).eq('id', template.id)
    } else {
      await supabase.from('email_templates').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  // Simple preview: replace variables with placeholders
  function getPreviewHtml() {
    return cuerpoHtml
      .replace(/\{\{nombre\}\}/g, 'Juan')
      .replace(/\{\{apellido\}\}/g, 'Pérez')
      .replace(/\{\{empresa\}\}/g, 'Importadora XYZ')
      .replace(/\{\{email\}\}/g, 'juan@empresa.cl')
      .replace(/\{\{telefono\}\}/g, '+56 9 1234 5678')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#001E5D]">
            {template ? 'Editar plantilla' : 'Nueva plantilla de correo'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Nombre de la plantilla *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Bienvenida a nuevo lead"
            />
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Asunto *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30"
              value={asunto}
              onChange={e => setAsunto(e.target.value)}
              placeholder="Ej: Bienvenido/a a Segucargo, {{nombre}}"
            />
          </div>

          {/* Variables */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Variables disponibles</label>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map(v => (
                <button
                  key={v}
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-mono hover:bg-blue-100 transition-colors"
                  onClick={() => insertVariable(v)}
                  title="Click para insertar en el cuerpo"
                >
                  <Plus size={10} /> {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Haz click en una variable para insertarla en el cuerpo del correo.</p>
          </div>

          {/* Preview toggle */}
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Cuerpo HTML *
            </label>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-[#001E5D] hover:underline"
              onClick={() => setPreview(p => !p)}
            >
              {preview ? <><EyeOff size={13} /> Editar</> : <><Eye size={13} /> Vista previa</>}
            </button>
          </div>

          {preview ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                <Eye size={12} /> Vista previa (variables reemplazadas con datos de ejemplo)
              </div>
              <iframe
                title="preview"
                srcDoc={getPreviewHtml()}
                className="w-full h-80 bg-white"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="relative">
              <textarea
                id="tpl-body"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 resize-none bg-gray-950 text-green-400 leading-relaxed"
                rows={14}
                value={cuerpoHtml}
                onChange={e => setCuerpoHtml(e.target.value)}
                placeholder="<html>&#10;  <body>&#10;    <p>Hola {{nombre}},</p>&#10;  </body>&#10;</html>"
                spellCheck={false}
              />
              <div className="absolute bottom-2 right-3 text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                HTML
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2 bg-[#001E5D] text-white text-sm font-medium rounded-lg hover:bg-[#002b85] transition-colors disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : template ? 'Guardar cambios' : 'Crear plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}
