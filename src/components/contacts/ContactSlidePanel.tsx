import { useState, useEffect } from 'react'
import { X, Save, User, Tag, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ORIGIN_LABELS } from '../../lib/constants'
import type { Contact } from '../../types'

interface Props {
  contact: Contact | null
  onClose: () => void
  onSaved: () => void
}

const ORIGIN_OPTIONS = [
  'google_ads','meta_ads','linkedin','whatsapp','web','referido','email','organico'
] as const

export default function ContactSlidePanel({ contact, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Contact>>({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'notas'>('info')

  useEffect(() => {
    if (contact) setForm({ ...contact })
  }, [contact])

  async function handleSave() {
    if (!contact) return
    setSaving(true)
    await supabase.from('contacts').update({ ...form, updated_at: new Date().toISOString() }).eq('id', contact.id)
    setSaving(false)
    onSaved()
  }

  function set(field: keyof Contact, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  if (!contact) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <div className="flex gap-2">
              <input
                className="text-lg font-bold text-gray-900 bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 w-1/2"
                value={form.nombre || ''}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Nombre"
              />
              <input
                className="text-lg font-bold text-gray-900 bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-1 w-1/2"
                value={form.apellido || ''}
                onChange={e => set('apellido', e.target.value)}
                placeholder="Apellido"
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5 px-1">
              ID: {contact.id.slice(0, 8)}... · Creado: {new Date(contact.created_at).toLocaleDateString('es-CL')}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#001E5D' }}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['info', 'notas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' ? 'Información' : 'Notas'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {activeTab === 'info' && (
            <>
              <Section title="Datos de contacto" icon={User}>
                <Field label="Empresa">
                  <input className="input" value={form.empresa || ''} onChange={e => set('empresa', e.target.value)} placeholder="Empresa" />
                </Field>
                <Field label="Cargo">
                  <input className="input" value={form.cargo || ''} onChange={e => set('cargo', e.target.value)} placeholder="Cargo" />
                </Field>
                <Field label="Email">
                  <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" />
                </Field>
                <Field label="Teléfono">
                  <input className="input" value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 XXXX XXXX" />
                </Field>
              </Section>

              <Section title="Fuente y canal" icon={Tag}>
                <Field label="Fuente">
                  <select className="input" value={form.origen || ''} onChange={e => set('origen', e.target.value)}>
                    {ORIGIN_OPTIONS.map(o => <option key={o} value={o}>{ORIGIN_LABELS[o]}</option>)}
                  </select>
                </Field>
              </Section>

              <Section title="Ubicación" icon={MapPin}>
                <Field label="País">
                  <input className="input" value={form.pais || ''} onChange={e => set('pais', e.target.value)} placeholder="Ej: Chile" />
                </Field>
                <Field label="Ciudad">
                  <input className="input" value={form.ciudad || ''} onChange={e => set('ciudad', e.target.value)} placeholder="Ej: Santiago" />
                </Field>
              </Section>
            </>
          )}

          {activeTab === 'notas' && (
            <div>
              <label className="label">Observaciones</label>
              <textarea
                className="input resize-none"
                rows={12}
                value={form.observaciones || ''}
                onChange={e => set('observaciones', e.target.value)}
                placeholder="Notas internas sobre este contacto..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#001E5D' }}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  )
}
