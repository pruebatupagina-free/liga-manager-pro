import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Trophy, Users, User, Calendar,
  DollarSign, BarChart2, Award, MessageSquare, Shield,
  LogOut, HelpCircle, ChevronLeft, ChevronRight, Globe
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/dashboard/ligas', icon: Trophy, label: 'Ligas' },
  { to: '/dashboard/chatbot', icon: MessageSquare, label: 'Asistente IA', roles: ['admin_liga', 'superadmin'] },
]

const adminItems = [
  { to: '/admin', icon: Shield, label: 'Panel Admin', roles: ['superadmin'] },
]

export default function Sidebar({ collapsed, onToggle, onTourStart, liga_id }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const contextItems = liga_id ? [
    { to: `/dashboard/equipos/${liga_id}`, icon: Users, label: 'Equipos' },
    { to: `/dashboard/jugadores/${liga_id}`, icon: User, label: 'Jugadores', note: 'Por equipo' },
    { to: `/dashboard/jornadas/${liga_id}`, icon: Calendar, label: 'Jornadas' },
    { to: `/dashboard/cobros/${liga_id}`, icon: DollarSign, label: 'Cobros' },
    { to: `/dashboard/estadisticas/${liga_id}`, icon: BarChart2, label: 'Estadísticas' },
    { to: `/dashboard/liguilla/${liga_id}`, icon: Award, label: 'Liguilla' },
  ] : []

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 transition-all duration-300 border-r ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      style={{ background: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-accent)' }}
        >
          <Trophy size={16} style={{ color: '#020617' }} />
        </div>
        {!collapsed && (
          <span className="font-display text-xl tracking-wide" style={{ color: 'var(--color-accent)', lineHeight: 1 }}>
            LigaManager
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded cursor-pointer"
          style={{ color: 'var(--color-fg-muted)' }}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-2">
        {navItems.filter(i => !i.roles || i.roles.includes(user?.rol)).map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'var(--color-accent)', color: '#020617' } : { color: 'var(--color-fg-muted)' }}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {contextItems.length > 0 && (
          <>
            {!collapsed && (
              <div className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-fg-muted)' }}>
                Liga actual
              </div>
            )}
            {contextItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive ? 'text-white' : 'hover:bg-white/5'
                  }`
                }
                style={({ isActive }) => isActive ? { background: 'rgba(34,197,94,0.2)', color: 'var(--color-accent)' } : { color: 'var(--color-fg-muted)' }}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}

        {user?.rol === 'superadmin' && adminItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive ? 'text-white' : 'hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(245,158,11,0.2)', color: '#F59E0B' } : { color: 'var(--color-fg-muted)' }}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 pb-4 space-y-1 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>
              {user?.username}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{user?.rol}</div>
          </div>
        )}
        <button
          onClick={onTourStart}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-all cursor-pointer"
          style={{ color: 'var(--color-fg-muted)' }}
        >
          <HelpCircle size={18} className="flex-shrink-0" />
          {!collapsed && <span>Ver tour</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-all cursor-pointer"
          style={{ color: 'var(--color-destructive)' }}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
