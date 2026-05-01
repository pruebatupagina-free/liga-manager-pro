import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function PrivateRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.rol)) {
    if (user.rol === 'dueno_equipo') return <Navigate to="/mi-equipo" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}
