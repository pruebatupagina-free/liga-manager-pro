import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Trophy, Users, CreditCard, LogOut, Menu, X, Shield, Newspaper, ShoppingBag, MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import client from '../../api/client'
import ThemeToggle from '../ui/ThemeToggle'
import NotificationBanner from '../ui/NotificationBanner'

const NAV = [
  { to: '/mi-equipo', label: 'Mi Equipo', icon: Trophy, end: true },
  { to: '/mi-equipo/feed', label: 'Feed', icon: Newspaper },
  { to: '/mi-equipo/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { to: '/mi-equipo/mensajes', label: 'Mensajes', icon: MessageCircle },
  { to: '/mi-equipo/jugadores', label: 'Jugadores', icon: Users },
  { to: '/mi-equipo/pagos', label: 'Pagos', icon: CreditCard },
]

export default function MiEquipoLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['mi-equipo'],
    queryFn: () => client.get('/equipos/mi-equipo').then(r => r.data),
    staleTime: 60_000,
  })

  const equipo = data?.equipo
  const liga = data?.liga

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }) => [
    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
    isActive
      ? 'text-[#020617] bg-[var(--color-accent)]'
      : 'hover:bg-white/5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
  ].join(' ')

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo equipo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          {equipo?.logo ? (
            <img src={equipo.logo} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: equipo?.color_principal || 'var(--color-accent)', opacity: 0.9 }}>
              <Shield size={18} style={{ color: '#fff' }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-fg)' }}>
              {equipo?.nombre || 'Mi Equipo'}
            </p>
            {liga && (
              <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{liga.nombre}</p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer hover:bg-red-500/10"
          style={{ color: 'var(--color-destructive)' }}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar desktop */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0"
        style={{ background: 'var(--color-primary)', borderRight: '1px solid var(--color-border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}
          style={{ background: 'rgba(0,0,0,0.5)' }} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 z-50 flex flex-col md:hidden transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--color-primary)', borderRight: '1px solid var(--color-border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'var(--color-primary)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg cursor-pointer"
            style={{ color: 'var(--color-fg-muted)' }}>
            <Menu size={22} />
          </button>
          <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>
            {equipo?.nombre || 'Mi Equipo'}
          </p>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <NotificationBanner />
          <Outlet context={{ equipo, liga, cobros: data?.cobros }} />
        </main>
      </div>
    </div>
  )
}
