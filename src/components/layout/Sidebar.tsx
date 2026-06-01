import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, UserCheck, BarChart2, Settings, LogOut, ChevronLeft,
  ChevronDown, TrendingUp, Megaphone, Building2, Truck, Users2, Briefcase,
  CheckSquare, Calendar, Phone, FileCode, GitBranch, FileText, Package,
  Zap, PanelLeft, ClipboardList, Mail
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

interface SubItem { to: string; label: string; icon?: React.ElementType }
interface NavSection {
  label: string
  icon: React.ElementType
  items: SubItem[]
  adminOnly?: boolean
}
interface NavFlat { to: string; icon: React.ElementType; label: string; single: true }
type NavEntry = NavSection | NavFlat

const navEntries: NavEntry[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', single: true },
  {
    label: 'CRM',
    icon: UserCheck,
    items: [
      { to: '/leads', label: 'Posibles clientes', icon: Users2 },
      { to: '/contactos', label: 'Contactos', icon: UserCheck },
      { to: '/clientes', label: 'Clientes Segucargo', icon: Building2 },
      { to: '/negocios', label: 'Negocios', icon: Briefcase },
      { to: '/proveedores', label: 'Proveedores', icon: Truck },
      { to: '/empresas', label: 'Empresas', icon: Building2 },
    ],
  },
  {
    label: 'Comunicaciones',
    icon: Megaphone,
    items: [
      { to: '/reuniones', label: 'Reuniones', icon: Calendar },
      { to: '/secuencias', label: 'Secuencias', icon: GitBranch },
      { to: '/tareas', label: 'Tareas', icon: CheckSquare },
      { to: '/llamadas', label: 'Llamadas', icon: Phone },
      { to: '/fragmentos', label: 'Fragmentos', icon: FileCode },
      { to: '/correo', label: 'Correo', icon: Mail },
      { to: '/formularios', label: 'Formularios', icon: ClipboardList },
    ],
  },
  {
    label: 'Ventas',
    icon: TrendingUp,
    items: [
      { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
      { to: '/operaciones', label: 'Operaciones', icon: Package },
    ],
  },
  {
    label: 'Automatización',
    icon: Zap,
    items: [
      { to: '/workflows', label: 'Workflows', icon: Zap },
    ],
  },
  {
    label: 'Reportes',
    icon: BarChart2,
    items: [
      { to: '/reportes/paneles', label: 'Paneles', icon: PanelLeft },
      { to: '/reportes/informes', label: 'Informes', icon: BarChart2 },
    ],
  },
  {
    label: 'Administración',
    icon: Settings,
    adminOnly: true,
    items: [
      { to: '/administracion/usuarios', label: 'Usuarios', icon: Users2 },
      { to: '/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
]

interface Props { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['CRM'])
  )

  function toggleSection(label: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  function sectionHasActive(items: SubItem[]) {
    return items.some(i => location.pathname === i.to || location.pathname.startsWith(i.to + '/'))
  }

  const isAdmin = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ background: 'linear-gradient(180deg, #000a26 0%, #001E5D 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center border-b border-white/10 py-4 px-3 gap-3">
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <img src="/logo.png" alt="Segucargo" className="w-9 h-9 object-contain" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold leading-tight text-white tracking-wide">SEGUCARGO</p>
            <p className="text-xs font-medium" style={{ color: '#2AD4AE' }}>CRM Comercial</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto transition-colors flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2AD4AE')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navEntries.map(entry => {
          if ('single' in entry) {
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive ? 'font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                style={({ isActive }) => isActive ? { background: '#2AD4AE', color: '#001E5D' } : {}}
              >
                <entry.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{entry.label}</span>}
              </NavLink>
            )
          }

          if (entry.adminOnly && !isAdmin) return null

          const isOpen = openSections.has(entry.label)
          const hasActive = sectionHasActive(entry.items)

          if (collapsed) {
            return (
              <div key={entry.label}
                className={cn('flex items-center justify-center w-10 h-10 rounded-lg mx-auto cursor-pointer transition-all', hasActive ? 'bg-white/20' : 'hover:bg-white/10')}
              >
                <entry.icon className="w-5 h-5 text-white/70" />
              </div>
            )
          }

          return (
            <div key={entry.label}>
              <button
                onClick={() => toggleSection(entry.label)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  hasActive ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <entry.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left text-xs uppercase tracking-wider font-semibold">{entry.label}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="ml-3 mt-0.5 pl-3 border-l border-white/10 space-y-0.5 mb-1">
                  {entry.items.map(sub => {
                    const SubIcon = sub.icon
                    return (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={({ isActive }) => cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                          isActive ? 'font-semibold' : 'text-white/50 hover:text-white hover:bg-white/10'
                        )}
                        style={({ isActive }) => isActive ? { background: '#2AD4AE', color: '#001E5D' } : {}}
                      >
                        {SubIcon && <SubIcon className="w-4 h-4 flex-shrink-0" />}
                        <span>{sub.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: '#2AD4AE', color: '#001E5D' }}
          >
            {profile?.nombre?.charAt(0)}{profile?.apellido?.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{profile?.nombre} {profile?.apellido}</p>
              <p className="text-xs capitalize" style={{ color: '#2AD4AE' }}>{profile?.rol}</p>
            </div>
          )}
          <button onClick={signOut} className="transition-colors flex-shrink-0 text-white/40 hover:text-red-400" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
