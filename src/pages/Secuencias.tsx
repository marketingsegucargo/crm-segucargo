import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, GitBranch, Edit2, Trash2, Play, Pause, Users, ChevronRight, Mail, Eye, EyeOff } from 'lucide-react'
import SecuenciaBuilder from '../components/secuencias/SecuenciaBuilder'
import EmailTemplateModal from '../components/secuencias/EmailTemplateModal'

export interface Paso {
  id: string
  tipo: 'correo' | 'tarea' | 'llamada'
  nombre: string
  delay_dias: number
  delay_tipo: 'inmediato' | 'dias'
  template_id?: string
  template_nombre?: string
  asunto?: string
  tarea_titulo?: string
  tarea_descripcion?: string
  llamada_notas?: string
}

export interface Secuencia {
  id: string
  nombre: string
  descripcion: string | null
  estado: string
  tipo_trigger: string
  trigger_estado: string | null
  pasos: Paso[]
  total_inscritos: number
  created_at: string
  updated_at: string
}

export interface EmailTemplate {
  id: string
  nombre: string
  asunto: string
  cuerpo_html: string
  variables: string[]
  created_at: string
  updated_at: string
}

const estadoBadge: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  activa: 'bg-green-100 text-green-800',
  pausada: 'bg-yellow-100 text-yellow-800',
}

const estadoLabel: Record<string, string> = {
  borrador: 'Borrador',
  activa: 'Activa',
  pausada: 'Pausada',
}

const tipoPasoIcon: Record<string, string> = {
  correo: '📧',
  tarea: '✅',
  llamada: '📞',
}

// ─── Variables disponibles ────────────────────────────────────────────────────
const VARIABLES = ['{{nombre}}', '{{apellido}}', '{{empresa}}', '{{email}}', '{{telefono}}']

// ─── Inline Template Editor ───────────────────────────────────────────────────

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: EmailTemplate | null
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(template?.nombre || '')
  const [asunto, setAsunto] = useState(template?.asunto || '')
  const [cuerpoHtml, setCuerpoHtml] = useState(template?.cuerpo_html || '')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')

  function insertVariable(variable: string) {
    const textarea = document.getElementById('tpl-body') as HTMLTextAreaElement | null
    if (!textarea) {
      setCuerpoHtml(prev => prev + variable)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newVal = cuerpoHtml.substring(0, start) + variable + cuerpoHtml.substring(end)
    setCuerpoHtml(newVal)
    setTimeout(() => {
      textarea.selectionStart = start + variable.length
      textarea.selectionEnd = start + variable.length
      textarea.focus()
    }, 0)
  }

  function getPreviewHtml() {
    return cuerpoHtml
      .replace(/{{nombre}}/g, 'María')
      .replace(/{{apellido}}/g, 'González')
      .replace(/{{empresa}}/g, 'Importadora Example SpA')
      .replace(/{{email}}/g, 'maria@example.com')
      .replace(/{{telefono}}/g, '+56 9 1234 5678')
      .replace(/{{folio}}/g, 'COT-2026-001')
  }

  async function handleSave() {
    if (!nombre.trim() || !asunto.trim() || !cuerpoHtml.trim()) {
      setError('Nombre, asunto y cuerpo son requeridos')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      nombre: nombre.trim(),
      asunto: asunto.trim(),
      cuerpo_html: cuerpoHtml,
      variables: VARIABLES,
      updated_at: new Date().toISOString(),
      ...(template?.id ? { id: template.id } : {}),
    }
    const { error: err } = await supabase.from('email_templates').upsert(payload, { onConflict: 'id' })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Editor header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#001E5D]">
        <h3 className="text-white font-semibold text-sm">
          {template ? `Editando: ${template.nombre}` : 'Nueva plantilla de correo'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {preview ? 'Editar' : 'Vista previa'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#2AD4AE] hover:bg-[#22c49e] text-[#001E5D] rounded-lg disabled:opacity-60 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar plantilla'}
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors ml-1">
            ✕
          </button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div className="p-5 space-y-4">
        {/* Nombre + Asunto */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la plantilla</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Bienvenida - Nuevo Lead"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Asunto del correo</label>
            <input
              type="text"
              value={asunto}
              onChange={e => setAsunto(e.target.value)}
              placeholder="Ej: Bienvenido/a a Segucargo, {{nombre}}"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D]"
            />
          </div>
        </div>

        {/* Variables */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Insertar variable</label>
          <div className="flex flex-wrap gap-1.5">
            {[...VARIABLES, '{{folio}}'].map(v => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                className="px-2.5 py-1 text-xs font-mono bg-blue-50 hover:bg-[#001E5D] hover:text-white text-[#001E5D] border border-blue-200 hover:border-[#001E5D] rounded-md transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Body editor / preview */}
        {preview ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vista previa (con datos de ejemplo)</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 360 }}>
              <iframe
                srcDoc={getPreviewHtml()}
                className="w-full h-full"
                sandbox="allow-same-origin"
                title="preview"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cuerpo HTML</label>
            <textarea
              id="tpl-body"
              value={cuerpoHtml}
              onChange={e => setCuerpoHtml(e.target.value)}
              placeholder="<p>Estimado/a {{nombre}},</p>..."
              className="w-full text-xs font-mono border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#001E5D]/30 focus:border-[#001E5D] resize-none bg-gray-950 text-green-400"
              style={{ height: 360 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Plantillas Tab ───────────────────────────────────────────────────────────

function PlantillasTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EmailTemplate | null | 'new'>('new' as never)
  const [showEditor, setShowEditor] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    setLoading(true)
    const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false })
    setTemplates((data || []) as EmailTemplate[])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return
    await supabase.from('email_templates').delete().eq('id', id)
    fetchTemplates()
  }

  function handleEditorSaved() {
    setShowEditor(false)
    setEditing(null)
    fetchTemplates()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{templates.length} plantilla{templates.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setEditing(null); setShowEditor(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white rounded-lg text-sm font-medium hover:bg-[#002b85] transition-colors"
        >
          <Plus size={16} /> Nueva plantilla
        </button>
      </div>

      {/* Editor inline */}
      {showEditor && (
        <TemplateEditor
          template={editing && editing !== 'new' ? editing as EmailTemplate : null}
          onClose={() => { setShowEditor(false); setEditing(null) }}
          onSaved={handleEditorSaved}
        />
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#001E5D]" />
        </div>
      ) : templates.length === 0 && !showEditor ? (
        <div className="text-center py-16 text-gray-400">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Sin plantillas de correo</p>
          <p className="text-xs mt-1">Crea una plantilla para usarla en tus secuencias</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="bg-[#001E5D]/5 border-b border-gray-100 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[#001E5D] text-sm truncate">{t.nombre}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{t.asunto}</p>
                  </div>
                  <Mail className="w-4 h-4 text-[#001E5D]/40 shrink-0 mt-0.5" />
                </div>
              </div>

              {/* Preview del HTML */}
              <div
                className="px-4 py-3 cursor-pointer"
                onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
              >
                {previewId === t.id ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 200 }}>
                    <iframe
                      srcDoc={t.cuerpo_html}
                      className="w-full h-full scale-75 origin-top-left"
                      style={{ width: '133%', height: '267px' }}
                      sandbox="allow-same-origin"
                      title="preview"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 line-clamp-3">
                    {t.cuerpo_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150)}...
                  </p>
                )}
                <p className="text-xs text-[#001E5D] mt-1 hover:underline">
                  {previewId === t.id ? 'Ocultar vista previa' : 'Ver vista previa'}
                </p>
              </div>

              {/* Variables */}
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-1">
                  {(t.variables || []).slice(0, 4).map((v: string) => (
                    <span key={v} className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">{v}</span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => { setEditing(t); setShowEditor(true) }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:border-[#001E5D] hover:text-[#001E5D] transition-colors"
                >
                  <Edit2 size={11} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={11} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Secuencias() {
  const [secuencias, setSecuencias] = useState<Secuencia[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'secuencias' | 'plantillas'>('secuencias')
  const [view, setView] = useState<'lista' | 'builder'>('lista')
  const [editingSecuencia, setEditingSecuencia] = useState<Secuencia | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate] = useState<EmailTemplate | null>(null)

  useEffect(() => { fetchSecuencias() }, [])

  async function fetchSecuencias() {
    setLoading(true)
    const { data } = await supabase.from('secuencias').select('*').order('created_at', { ascending: false })
    setSecuencias((data || []) as Secuencia[])
    setLoading(false)
  }

  function handleNuevaSecuencia() {
    setEditingSecuencia(null)
    setView('builder')
  }

  function handleEditarSecuencia(s: Secuencia) {
    setEditingSecuencia(s)
    setView('builder')
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta secuencia?')) return
    await supabase.from('secuencias').delete().eq('id', id)
    fetchSecuencias()
  }

  async function handleToggleEstado(s: Secuencia) {
    const nuevoEstado = s.estado === 'activa' ? 'pausada' : 'activa'
    await supabase.from('secuencias').update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq('id', s.id)
    fetchSecuencias()
  }

  function handleBuilderSaved() {
    setView('lista')
    fetchSecuencias()
  }

  if (view === 'builder') {
    return (
      <SecuenciaBuilder
        secuencia={editingSecuencia}
        onSaved={handleBuilderSaved}
        onCancel={() => setView('lista')}
      />
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <GitBranch className="text-[#001E5D]" size={26} />
          <div>
            <h1 className="text-xl font-bold text-[#001E5D]">Secuencias</h1>
            <p className="text-xs text-gray-500">Automatización de comunicaciones</p>
          </div>
        </div>
        {tab === 'secuencias' && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#001E5D] text-white rounded-lg text-sm font-medium hover:bg-[#002b85] transition-colors"
            onClick={handleNuevaSecuencia}
          >
            <Plus size={15} /> Nueva secuencia
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('secuencias')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'secuencias' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <GitBranch size={14} /> Secuencias
        </button>
        <button
          onClick={() => setTab('plantillas')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'plantillas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail size={14} /> Plantillas de correo
        </button>
      </div>

      {/* ── TAB: Secuencias ─────────────────────────────────────────────────── */}
      {tab === 'secuencias' && (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001E5D]" />
            </div>
          ) : secuencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <GitBranch size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-1">Sin secuencias aún</h3>
              <p className="text-sm text-gray-400 mb-6">Crea tu primera secuencia para automatizar el seguimiento de leads.</p>
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-[#001E5D] text-white rounded-lg text-sm font-medium hover:bg-[#002b85] transition-colors"
                onClick={handleNuevaSecuencia}
              >
                <Plus size={16} /> Nueva secuencia
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {secuencias.map(s => (
                <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#001E5D] truncate">{s.nombre}</h3>
                      {s.descripcion && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.descripcion}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${estadoBadge[s.estado] || estadoBadge.borrador}`}>
                      {estadoLabel[s.estado] || s.estado}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight size={14} className="text-gray-400" />
                      <span>{Array.isArray(s.pasos) ? s.pasos.length : 0} paso{Array.isArray(s.pasos) && s.pasos.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-gray-400" />
                      <span>{s.total_inscritos} inscrito{s.total_inscritos !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {Array.isArray(s.pasos) && s.pasos.length > 0 && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {s.pasos.slice(0, 5).map((paso, idx) => (
                        <div key={idx} className="flex items-center gap-1 shrink-0">
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs">
                            <span>{tipoPasoIcon[paso.tipo] || '📧'}</span>
                            <span className="text-gray-600 max-w-[80px] truncate">{paso.nombre}</span>
                          </div>
                          {idx < Math.min(s.pasos.length - 1, 4) && (
                            <ChevronRight size={12} className="text-gray-300 shrink-0" />
                          )}
                        </div>
                      ))}
                      {s.pasos.length > 5 && (
                        <span className="text-xs text-gray-400 shrink-0 ml-1">+{s.pasos.length - 5} más</span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Trigger: {s.tipo_trigger === 'manual' ? 'Manual' : `Estado lead: ${s.trigger_estado || '—'}`}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <button
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:border-[#001E5D] hover:text-[#001E5D] transition-colors"
                      onClick={() => handleEditarSecuencia(s)}
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                    <button
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${
                        s.estado === 'activa'
                          ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'
                          : 'border-green-200 text-green-700 hover:bg-green-50'
                      }`}
                      onClick={() => handleToggleEstado(s)}
                    >
                      {s.estado === 'activa' ? <><Pause size={12} /> Pausar</> : <><Play size={12} /> Activar</>}
                    </button>
                    <button
                      className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => handleEliminar(s.id)}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Plantillas ─────────────────────────────────────────────────── */}
      {tab === 'plantillas' && <PlantillasTab />}

      {showTemplateModal && (
        <EmailTemplateModal
          template={editingTemplate}
          onClose={() => setShowTemplateModal(false)}
          onSaved={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  )
}
