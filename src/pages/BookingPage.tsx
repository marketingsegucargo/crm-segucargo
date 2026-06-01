import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, Video } from 'lucide-react'

interface MeetingPage {
  id: string
  nombre_interno: string
  organizador_id: string | null
  titulo_evento: string | null
  ubicacion: string | null
  video_link: string | null
  descripcion: string | null
  tipo: string
  duraciones: number[]
  slug: string
  cancelar_reprogramar: boolean
  organizador?: { nombre: string; apellido: string; email: string } | null
}

function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}

function formatDate(d: Date) {
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

const SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<MeetingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [selectedDuracion, setSelectedDuracion] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
    return d
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [step, setStep] = useState<'pick' | 'form' | 'confirmed'>('pick')
  const [form, setForm] = useState({ nombre: '', email: '', notas: '' })
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('meeting_pages')
      .select('*, organizador:profiles!organizador_id(nombre, apellido, email)')
      .eq('slug', slug)
      .eq('activo', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else {
          setPage(data as MeetingPage)
          setSelectedDuracion((data as MeetingPage).duraciones?.[0] ?? 30)
        }
        setLoading(false)
      })
  }, [slug])

  async function handleSubmit() {
    if (!page || !selectedDate || !selectedSlot || !selectedDuracion) return
    if (!form.nombre.trim() || !form.email.trim()) return
    setSubmitting(true)
    const [h, m] = selectedSlot.split(':').map(Number)
    const dt = new Date(`${selectedDate}T${selectedSlot}:00`)
    const { data, error } = await supabase.from('meeting_bookings').insert({
      page_id: page.id,
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      fecha_inicio: dt.toISOString(),
      duracion_minutos: selectedDuracion,
      notas: form.notas.trim() || null,
      estado: 'confirmada',
      teams_link: page.video_link || null,
    }).select().single()
    setSubmitting(false)
    if (!error && data) {
      setBookingId(data.id)
      setStep('confirmed')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-700">Página no encontrada</h1>
        <p className="text-gray-400 mt-1">Esta página de reserva no existe o no está activa.</p>
      </div>
    </div>
  )

  if (!page) return null

  const organizadorNombre = page.organizador
    ? `${page.organizador.nombre} ${page.organizador.apellido}`
    : 'Equipo Segucargo'

  const dias = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hoy = isoDate(new Date())

  if (step === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">¡Reunión confirmada!</h1>
          <p className="text-gray-500 mb-4">
            Hemos registrado tu reserva para el{' '}
            <strong>{selectedDate && formatDate(new Date(selectedDate + 'T12:00:00'))}</strong> a las <strong>{selectedSlot}</strong> ({selectedDuracion} min).
          </p>
          {page.video_link && (
            <a
              href={page.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#6264A7] text-white rounded-lg text-sm font-medium hover:bg-[#4f5192] transition-colors"
            >
              <Video className="w-4 h-4" /> Unirse a Teams
            </a>
          )}
          <p className="text-xs text-gray-400 mt-4">Recibirás una confirmación en {form.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-4xl">
        <div className="flex flex-col md:flex-row">
          {/* Panel izquierdo: info */}
          <div className="md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-[#001E5D] flex items-center justify-center text-white font-bold text-lg">
              {organizadorNombre[0]}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Segucargo</p>
              <h1 className="text-base font-bold text-gray-900 mt-1 leading-snug">
                {page.titulo_evento || page.nombre_interno}
              </h1>
            </div>
            {selectedDuracion && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" /> {selectedDuracion} min
              </div>
            )}
            {(page.ubicacion || page.video_link) && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Video className="w-4 h-4 text-gray-400" />
                {page.video_link ? 'Videollamada (Teams)' : page.ubicacion}
              </div>
            )}
            {page.descripcion && (
              <p className="text-xs text-gray-400 leading-relaxed">{page.descripcion}</p>
            )}

            {/* Selector de duración */}
            {page.duraciones.length > 1 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Duración</p>
                <div className="flex flex-wrap gap-1.5">
                  {page.duraciones.map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDuracion(d)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedDuracion === d
                          ? 'bg-[#001E5D] text-white border-[#001E5D]'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho */}
          {step === 'pick' && (
            <div className="flex-1 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Selecciona una fecha y hora</h2>

              {/* Semana nav */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setWeekStart(d => addDays(d, -7))}
                  disabled={isoDate(weekStart) <= hoy}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 font-medium flex-1 text-center">
                  {weekStart.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setWeekStart(d => addDays(d, 7))}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-400 font-medium pb-1">{d}</div>
                ))}
                {dias.map(dia => {
                  const ds = isoDate(dia)
                  const isPast = ds < hoy
                  const isSelected = ds === selectedDate
                  return (
                    <button
                      key={ds}
                      disabled={isPast}
                      onClick={() => { setSelectedDate(ds); setSelectedSlot(null) }}
                      className={`aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#001E5D] text-white'
                          : isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {dia.getDate()}
                    </button>
                  )
                })}
              </div>

              {/* Horarios */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {formatDate(new Date(selectedDate + 'T12:00:00'))}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                          selectedSlot === slot
                            ? 'bg-[#001E5D] text-white border-[#001E5D]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#001E5D] hover:text-[#001E5D]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <button
                      onClick={() => setStep('form')}
                      className="mt-4 w-full py-2.5 bg-[#001E5D] text-white rounded-lg font-semibold text-sm hover:bg-[#002a7a] transition-colors"
                    >
                      Continuar →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'form' && (
            <div className="flex-1 p-6">
              <button onClick={() => setStep('pick')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Ingresa tus datos</h2>
              <p className="text-sm text-gray-500 mb-5">
                {selectedDate && formatDate(new Date(selectedDate + 'T12:00:00'))} · {selectedSlot} · {selectedDuracion} min
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                  <textarea
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    placeholder="¿Hay algo que debamos saber antes de la reunión?"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.nombre.trim() || !form.email.trim()}
                  className="w-full py-2.5 bg-[#001E5D] text-white rounded-lg font-semibold text-sm hover:bg-[#002a7a] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar reunión'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
