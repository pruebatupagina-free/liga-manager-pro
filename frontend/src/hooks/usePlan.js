import { useAuth } from './useAuth'

const PLANES = {
  basico: {
    max_ligas: 1,
    max_equipos: 10,
    max_jugadores: 15,
    max_galeria: 5,
    puede_clonar: false,
    puede_marketplace: false,
    puede_chatbot: false,
    label: 'Básico',
  },
  pro: {
    max_ligas: 5,
    max_equipos: Infinity,
    max_jugadores: Infinity,
    max_galeria: 20,
    puede_clonar: true,
    puede_marketplace: true,
    puede_chatbot: true,
    label: 'Pro',
  },
  elite: {
    max_ligas: Infinity,
    max_equipos: Infinity,
    max_jugadores: Infinity,
    max_galeria: 20,
    puede_clonar: true,
    puede_marketplace: true,
    puede_chatbot: true,
    label: 'Elite',
  },
}

export function usePlan() {
  const { userFull, user } = useAuth()
  const planNombre = userFull?.licencia?.plan || 'basico'
  const plan = PLANES[planNombre] || PLANES.basico
  const esAdmin = user?.rol === 'admin_liga'
  const esSuperadmin = user?.rol === 'superadmin'

  return {
    plan,
    planNombre,
    esBasico: planNombre === 'basico' && esAdmin,
    esSuperadmin,
    esAdmin,
    PLANES,
  }
}
