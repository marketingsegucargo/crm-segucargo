import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { sendEmailViaMicrosoft, iniciarOAuthMicrosoft } from '../../lib/microsoft'
import {
  X,
  Send,
  Save,
  FileText,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface Template {
  id: string
  nombre: string
  asunto: string
  cuerpo_html: string
}

interface ComposeModalProps {
  onClose: () => void
  onSaved: () => void
  /** Si se pasa, pre-rellena el campo Para */
  defaultPara?: string
  /** ID del ejecutivo autenticado */
  ejecutivoId?: string
  /** Token de Microsoft del perfil actual */
  microsoftToken?: string | null
  /** Email de Microsoft conectado */
  microsoftEmail?: string | null
}

const VARIABLES = ['{{nombre}}', '{{empresa}}', '{{cargo}}', '{{email}}', '{{telefono}}']

export default function ComposeModal({
  onClose,
  onSaved,
  defaultPara = '',
  ejecutivoId,
  microsoftToken,
  microsoftEmail,
}: ComposeModalProps) {
  const [para, setPara] = useState(defaultPara)
  const [cc, setCc] = useState('')
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const { data } = await supabase
      .from('email_templates')
      .select('id, nombre, asunto, cuerpo_html')
      .order('nombre')
    if (data) setTemplates(data)
  }

  function insertarVariable(variable: string) {
    const ta = bodyRef.current
    if (!ta) {
      setCuerpo(c => c + variable)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newVal = cuerpo.slice(0, start) + variable + cuerpo.slice(end)
    setCuerpo(newVal)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + variable.length
      ta.focus()
    })
    setShowVariables(false)
  }

  function aplicarPlantilla(t: Template) {
    setAsunto(t.asunto)
    // Convertir HTML a texto plano para el textarea
    const temp = document.createElement('div')
    temp.innerHTML = t.cuerpo_html
    setCuerpo(temp.innerText || t.cuerpo_html)
    setShowTemplates(false)
  }

  function applyFormat(tag: string) {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = cuerpo.slice(start, end)
    const wrapped = `<${tag}>${selected}</${tag}>`
    const newVal = cuerpo.slice(0, start) + wrapped + cuerpo.slice(end)
    setCuerpo(newVal)
  }

  async function guardarBorrador() {
    if (!asunto || !para) return
    setSaving(true)
    await supabase.from('emails_enviados').insert({
      para,
      cc: cc || null,
      asunto,
      cuerpo_html: `<p>${cuerpo.replace(/\n/g, '<br>')}</p>`,
      cuerpo_texto: cuerpo,
      estado: 'borrador',
      ejecutivo_id: ejecutivoId || null,
    })
    setSaving(false)
    onSaved()
  }

  async function handleEnviar() {
    if (!para || !asunto) {
      setToast({ type: 'error', msg: 'Los campos Para y Asunto son obligatorios.' })
      return
    }

    if (!microsoftToken) {
      // Sin token: mostrar prompt de conexión Microsoft
      setToast({ type: 'error', msg: 'Debes conectar tu cuenta de Microsoft para enviar correos.' })
      return
    }

    setSending(true)
    const htmlBody = `<p>${cuerpo.replace(/\n/g, '<br>')}</p>`

    const result = await sendEmailViaMicrosoft({
      to: para,
      cc: cc || undefined,
      subject: asunto,
      body: htmlBody,
      accessToken: microsoftToken,
    })

    if (result.ok) {
      // Guardar registro enviado
      await supabase.from('emails_enviados').insert({
        para,
        cc: cc || null,
        asunto,
        cuerpo_html: htmlBody,
        cuerpo_texto: cuerpo,
        estado: 'enviado',
        provider: 'microsoft',
        ejecutivo_id: ejecutivoId || null,
        enviado_at: new Date().toISOString(),
      })
      setSending(false)
      setToast({ type: 'ok', msg: 'Correo enviado correctamente.' })
      setTimeout(() => onSaved(), 1200)
    } else {
      await supabase.from('emails_enviados').insert({
        para,
        cc: cc || null,
        asunto,
        cuerpo_html: htmlBody,
        cuerpo_texto: cuerpo,
        estado: 'error',
        provider: 'microsoft',
        ejecutivo_id: ejecutivoId || null,
        error_msg: result.error,
      })
      setSending(false)
      setToast({ type: 'error', msg: `Error al enviar: ${result.error ?? 'desconocido'}` })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-[#001E5D] rounded-t-xl flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Redactar correo</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-3">
            {/* Para */}
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="text-xs font-medium text-gray-500 w-10">Para</span>
              <input
                type="text"
                value={para}
                onChange={e => setPara(e.target.value)}
                placeholder="destinatario@email.com"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>

            {/* CC */}
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="text-xs font-medium text-gray-500 w-10">CC</span>
              <input
                type="text"
                value={cc}
                onChange={e => setCc(e.target.value)}
                placeholder="cc@email.com, otro@email.com"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>

            {/* Asunto */}
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="text-xs font-medium text-gray-500 w-10">Asunto</span>
              <input
                type="text"
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                placeholder="Asunto del correo"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>

            {/* Barra de formato */}
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => applyFormat('b')} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Negrita">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('i')} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Cursiva">
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('u')} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Subrayado">
                <Underline className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('li')} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Lista">
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('p')} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Párrafo">
                <AlignLeft className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-gray-200 mx-1" />

              {/* Plantillas */}
              <div className="relative">
                <button
                  onClick={() => { setShowTemplates(s => !s); setShowVariables(false) }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Insertar plantilla
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showTemplates && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                    {templates.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400">No hay plantillas disponibles</p>
                    ) : templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => aplicarPlantilla(t)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-800">{t.nombre}</div>
                        <div className="text-gray-400 truncate">{t.asunto}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Variables */}
              <div className="relative">
                <button
                  onClick={() => { setShowVariables(s => !s); setShowTemplates(false) }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
                >
                  {'{ }'}
                  Variables
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showVariables && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    {VARIABLES.map(v => (
                      <button
                        key={v}
                        onClick={() => insertarVariable(v)}
                        className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-gray-50 text-[#001E5D]"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cuerpo */}
            <textarea
              ref={bodyRef}
              value={cuerpo}
              onChange={e => setCuerpo(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 resize-none font-mono"
            />

            {/* Alerta Microsoft no conectado */}
            {!microsoftToken && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-amber-700">
                  <p className="font-medium mb-1">Microsoft no conectado</p>
                  <p className="mb-2">Conecta tu cuenta de Microsoft 365 para enviar correos desde el CRM.</p>
                  <button
                    onClick={iniciarOAuthMicrosoft}
                    className="px-3 py-1.5 bg-[#0078D4] text-white rounded text-xs font-medium hover:bg-[#006cbf]"
                  >
                    Conectar con Microsoft
                  </button>
                </div>
              </div>
            )}

            {microsoftEmail && (
              <p className="text-xs text-gray-500">
                Enviando como: <span className="font-medium text-gray-700">{microsoftEmail}</span>
              </p>
            )}

            {/* Toast */}
            {toast && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                toast.type === 'ok'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {toast.type === 'ok'
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <AlertCircle className="w-4 h-4" />}
                {toast.msg}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            <button
              onClick={guardarBorrador}
              disabled={saving || !asunto || !para}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button
              onClick={handleEnviar}
              disabled={sending || !asunto || !para}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-[#001E5D] text-white rounded-lg hover:bg-[#002a7a] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
