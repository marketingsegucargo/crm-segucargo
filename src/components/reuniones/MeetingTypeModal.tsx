import { X } from 'lucide-react'

interface Props {
  onSelect: (tipo: 'personalizada' | 'grupo' | 'rotacion') => void
  onClose: () => void
}

const TIPOS = [
  {
    tipo: 'personalizada' as const,
    titulo: 'Personalizada',
    descripcion: 'Los contactos pueden programar una reunión con una sola persona de tu equipo.',
    img: (
      <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white text-xl font-bold">
            P
          </div>
        </div>
      </div>
    ),
    showVerEjemplos: false,
  },
  {
    tipo: 'grupo' as const,
    titulo: 'Grupo',
    descripcion: 'Los contactos pueden programar una reunión con varias personas de tu equipo.',
    img: (
      <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center relative">
        <div className="w-10 h-10 rounded-full bg-amber-400 absolute left-2 top-4 flex items-center justify-center text-white font-bold text-sm">G</div>
        <div className="w-10 h-10 rounded-full bg-gray-300 absolute right-2 top-0 flex items-center justify-center text-gray-600 font-bold text-sm">G</div>
        <div className="w-10 h-10 rounded-full bg-teal-400 absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center justify-center text-white font-bold text-sm">G</div>
      </div>
    ),
    showVerEjemplos: true,
  },
  {
    tipo: 'rotacion' as const,
    titulo: 'Rotación',
    descripcion: 'Las reuniones se asignan automáticamente a una persona de tu equipo según criterios que estableces.',
    img: (
      <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center relative">
        <div className="w-10 h-10 rounded-full bg-teal-400 absolute top-0 right-4 flex items-center justify-center text-white font-bold text-sm">R</div>
        <div className="w-8 h-8 rounded-full bg-gray-200 absolute bottom-2 left-2 flex items-center justify-center text-gray-500 text-xs">💬</div>
        <div className="w-8 h-8 rounded-full bg-gray-200 absolute bottom-2 right-2 flex items-center justify-center text-gray-500 text-xs">💬</div>
      </div>
    ),
    showVerEjemplos: true,
  },
]

export default function MeetingTypeModal({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl pointer-events-auto">
          {/* Header con gradiente teal */}
          <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}>
            <h2 className="text-lg font-bold text-white">Elige un tipo de página de programación</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-6 p-8">
            {TIPOS.map(t => (
              <div
                key={t.tipo}
                onClick={() => onSelect(t.tipo)}
                className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
              >
                {t.img}
                <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-teal-700">{t.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{t.descripcion}</p>
                {t.showVerEjemplos && (
                  <button className="mt-4 text-sm text-teal-600 font-medium hover:underline" onClick={e => e.stopPropagation()}>
                    Ver ejemplos de uso
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
