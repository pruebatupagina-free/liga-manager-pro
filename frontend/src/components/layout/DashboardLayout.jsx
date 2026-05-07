import { useState, useCallback } from 'react'
import { Outlet, useLocation, matchPath } from 'react-router-dom'
import Sidebar from './Sidebar'
import NotificationBanner from '../ui/NotificationBanner'
import { startTour } from '../../utils/tour'

const LIGA_PATTERNS = [
  '/dashboard/equipos/:liga_id',
  '/dashboard/jornadas/:liga_id',
  '/dashboard/cobros/:liga_id',
  '/dashboard/estadisticas/:liga_id',
  '/dashboard/liguilla/:liga_id',
]

function getLigaId(pathname) {
  for (const pattern of LIGA_PATTERNS) {
    const m = matchPath(pattern, pathname)
    if (m?.params?.liga_id) return m.params.liga_id
  }
  return null
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const liga_id = getLigaId(pathname)

  const handleTourStart = useCallback(() => {
    startTour()
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onTourStart={handleTourStart}
        liga_id={liga_id}
      />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--color-bg)' }}>
        <NotificationBanner />
        <Outlet />
      </main>
    </div>
  )
}
