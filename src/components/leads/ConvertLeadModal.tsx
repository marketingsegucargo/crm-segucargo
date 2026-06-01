import { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { contactsService } from '../../services/contacts'
import { negociosService } from '../../services/negocios'
import { leadsService } from '../../services/leads'
import { usersService } from '../../services/users'
import type { Lead, Profile } from '../../types'

interface Props {
  lead: Lead | null
  onClose: () => void
  onConverted: () => void
}

export default function ConvertLeadModal({ lead, onClose, onConverted }: Props) {
  const [crearNegocio, setCrearNegocio] = useState(false)
  const [notificar, setNotificar] = useState(true)
  const [ejecutivos, setEjecutivos] = useState<Profile[]>([])
  const [ejecutivoId, setEjecutivoId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    usersService.getAll().then(users => {
      setEjecutivos(users)
      if (lead?.ejecutivo_id) setEjecutivoId(lead.ejecutivo_id)
      else if (users.length > 0) setEjecutivoId(users[0].id)
    })
  }, [lead])

  if (!lead) return null

  const nombreCompleto = lead.nombre || 'Sin nombre'

  async function handleConvertir() {
    if (!lead) return
    setLoading(true)
    setError(null)
    try {
      // Separar nombre en nombre + apellido
      const partes = nombreCompleto.trim().split(' ')
      const nombre = partes[0] || nombreCompleto
      const apellido = partes.slice(1).join(' ') || ''

      // Crear contacto
      const contact = await contactsService.create({
        nombre,
        apellido,
        empresa: lead.empresa || '',
        email: lead.email || '',
        telefono: lead.telefono || '',
        origen: lead.origen || 'web',
        cargo: '',
        pais: '',
        ciudad: '',
        observaciones: lead.observaciones || '',
      })

      // Crear negocio si se indicó
      if (crearNegocio) {
        await negociosService.create({
          nombre: `Negocio - ${nombreCompleto}`,
          empresa: lead.empresa || null,
          valor: lead.valor_estimado || null,
          moneda: 'USD',
          etapa: 'prospecto',
          probabilidad: lead.probabilidad || null,
          fecha_cierre_estimada: null,
          ejecutivo_id: ejecutivoId || null,
          servicio: lead.servicio || null,
          tipo_servicio: null,
          origen: lead.origen || null,
          contacto_nombre: nombreCompleto,
          pipeline: null,
          notas: lead.observaciones || null,
        })
      }

      // Actualizar lead: marcar como convertido y vincular contacto
      await leadsService.update(lead.id, {
        estado: '4° Negocio Ganado',
        contact_id: contact.id,
      })

      onConverted()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al convertir')
    } finally {
      setLoading(false)
    }
  }

  const ejecutivoSeleccionado = ejecutivos.find(e => e.id === ejecutivoId)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">
              Convertir Posible cliente{' '}
              <span className="text-blue-600 font-normal">({nombreCompleto})</span>
            </h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Crear contacto (siempre) */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">Crear nuevo Contacto</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-800">
                <User className="w-3.5 h-3.5 text-gray-500" />
                {nombreCompleto}
              </span>
              <span className="text-xs text-gray-400 italic">( Diseño: Estándar Contacto Creado )</span>
            </div>

            {/* Crear negocio */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={crearNegocio}
                onChange={e => setCrearNegocio(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Cree una nueva Negocio para este Contacto.</span>
            </label>

            {/* Propietario */}
            <div>
              <p className="text-sm text-gray-700 mb-2">Propietario de los nuevos registros</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <select
                    value={ejecutivoId}
                    onChange={e => setEjecutivoId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none bg-white"
                  >
                    {ejecutivos.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {ejecutivoSeleccionado ? ejecutivoSeleccionado.nombre[0].toUpperCase() : '?'}
                </div>
              </div>
            </div>

            {/* Notificar */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificar}
                onChange={e => setNotificar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Notifique al propietario del registro.</span>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleConvertir}
              disabled={loading}
              className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#001E5D' }}
            >
              {loading ? 'Convirtiendo...' : 'Convertir'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
