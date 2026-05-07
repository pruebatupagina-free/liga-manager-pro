import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Store, Package, MessageCircle, LogOut, Menu, X, ShoppingBag, Newspaper } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import ThemeToggle from '../ui/ThemeToggle'
import NotificationBanner from '../ui/NotificationBanner'

const NAV = [
  { to: '/mi-negocio', label: 'Feed', icon: Newspaper, end: true },
  { to: '/mi-negocio/productos', label: 'Mis Productos', icon: Package },
  { to: '/mi-negocio/mensajes', label: 'Mensajes', icon: MessageCircle },
]

export default function VendedorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

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
      <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-accent)' }}>
            <ShoppingBag size={18} style={{ color: '#020617' }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-fg)' }}>
              {user?.nombre || 'Mi Negocio'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>Vendedor</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

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
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0"
        style={{ background: 'var(--color-primary)', borderRight: '1px solid var(--color-border)' }}
      >
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}
          style={{ background: 'rgba(0,0,0,0.5)' }} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 z-50 flex flex-col md:hidden transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--color-primary)', borderRight: '1px solid var(--color-border)' }}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'var(--color-primary)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg cursor-pointer"
            style={{ color: 'var(--color-fg-muted)' }}>
            <Menu size={22} />
          </button>
          <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>
            {user?.nombre || 'Mi Negocio'}
          </p>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <NotificationBanner />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
