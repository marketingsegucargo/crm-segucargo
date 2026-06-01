import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Inbox, FileEdit, Send, Plus, Loader2 } from 'lucide-react'
import ComposeModal from '../components/correo/ComposeModal'

interface Email {
  id: string
  para: string
  cc: string | null
  asunto: string
  estado: string
  provider: string
  created_at: string
  enviado_at: string | null
  error_msg: string | null
}

type Carpeta = 'enviados' | 'borradores'

const ESTADO_BADGE: Record<string, string> = {
  enviado: 'bg-green-100 text-green-800',
  borrador: 'bg-gray-100 text-gray-700',
  error: 'bg-red-100 text-red-800',
}

const ESTADO_LABEL: Record<string, string> = {
  enviado: 'Enviado',
  borrador: 'Borrador',
  error: 'Error',
}

export default function Correo() {
  const [carpeta, setCarpeta] = useState<Carpeta>('enviados')
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [microsoftToken, setMicrosoftToken] = useState<string | null>(null)
  const [microsoftEmail, setMicrosoftEmail] = useState<string | null>(null)
  const [ejecutivoId, setEjecutivoId] = useState<string | undefined>()

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [carpeta])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEjecutivoId(user.id)
    const { data } = await supabase
      .from('profiles')
      .select('microsoft_access_token, microsoft_email')
      .eq('id', user.id)
      .single()
    if (data) {
      setMicrosoftToken(data.microsoft_access_token ?? null)
      setMicrosoftEmail(data.microsoft_email ?? null)
    }
  }

  async function fetchEmails() {
    setLoading(true)
    const estado = carpeta === 'enviados' ? 'enviado' : 'borrador'
    const { data } = await supabase
      .from('emails_enviados')
      .select('id, para, cc, asunto, estado, provider, created_at, enviado_at, error_msg')
      .eq('estado', estado)
      .order('created_at', { ascending: false })
    if (data) setEmails(data)
    setLoading(false)
  }

  const carpetas = [
    { id: 'enviados' as Carpeta, label: 'Enviados', icon: Send },
    { id: 'borradores' as Carpeta, label: 'Borradores', icon: FileEdit },
  ]

  return (
    <div className="flex h-full min-h-0" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Panel izquierdo */}
      <aside className="w-52 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        {/* Redactar */}
        <div className="p-3">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#001E5D] text-white rounded-lg hover:bg-[#002a7a] text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Redactar
          </button>
        </div>

        {/* Carpetas */}
        <nav className="flex-1 px-2 pb-4">
          {carpetas.map(c => {
            const Icon = c.icon
            return (
              <button
                key={c.id}
                onClick={() => setCarpeta(c.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  carpeta === c.id
                    ? 'bg-[#001E5D]/10 text-[#001E5D] font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {c.label}
              </button>
            )
          })}
        </nav>

        {/* Microsoft status */}
        {microsoftEmail && (
          <div className="px-3 pb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-700">
              <div className="font-medium">Microsoft conectado</div>
              <div className="truncate text-blue-500">{microsoftEmail}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Panel principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header panel */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          {carpeta === 'enviados' ? (
            <Send className="w-5 h-5 text-[#001E5D]" />
          ) : (
            <FileEdit className="w-5 h-5 text-[#001E5D]" />
          )}
          <h2 className="text-lg font-semibold text-gray-900">
            {carpeta === 'enviados' ? 'Enviados' : 'Borradores'}
          </h2>
          <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
            {emails.length}
          </span>
        </div>

        {/* Lista de correos */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando...
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Inbox className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No hay correos en {carpeta === 'enviados' ? 'enviados' : 'borradores'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 bg-white">
              {emails.map(email => (
                <div
                  key={email.id}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-default"
                >
                  <Mail className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {email.para}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(email.enviado_at ?? email.created_at).toLocaleDateString('es-CL', {
                          day: '2-digit', month: 'short',
                        })}{' '}
                        {new Date(email.enviado_at ?? email.created_at).toLocaleTimeString('es-CL', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate">{email.asunto}</p>
                    {email.cc && (
                      <p className="text-xs text-gray-400 truncate">CC: {email.cc}</p>
                    )}
                    {email.error_msg && (
                      <p className="text-xs text-red-500 truncate mt-0.5">{email.error_msg}</p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      ESTADO_BADGE[email.estado] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ESTADO_LABEL[email.estado] ?? email.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal redactar */}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSaved={() => { setShowCompose(false); fetchEmails() }}
          ejecutivoId={ejecutivoId}
          microsoftToken={microsoftToken}
          microsoftEmail={microsoftEmail}
        />
      )}
    </div>
  )
}
