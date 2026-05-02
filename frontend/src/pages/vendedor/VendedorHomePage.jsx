import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ShoppingBag, Package, MessageCircle, Newspaper } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import FeedPage from '../FeedPage'
import client from '../../api/client'

export default function VendedorHomePage() {
  const { user } = useAuth()
  const [selectedLiga, setSelectedLiga] = useState(null)

  const { data } = useQuery({
    queryKey: ['vendedor-me'],
    queryFn: () => client.get('/auth/me').then(r => r.data),
    staleTime: 60_000,
  })

  const ligas = data?.ligas_asignadas || []

  if (ligas.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag size={22} style={{ color: 'var(--color-accent)' }} />
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            BIENVENIDO
          </h1>
        </div>
        <div className="rounded-2xl p-6 text-center glow-card" style={{ background: 'var(--color-primary)' }}>
          <Newspaper size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
          <p className="font-medium mb-1" style={{ color: 'var(--color-fg)' }}>
            Aún no tienes ligas asignadas
          </p>
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            El administrador te asignará las ligas donde aparecerá tu negocio.
          </p>
        </div>
      </div>
    )
  }

  if (!selectedLiga) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Newspaper size={22} style={{ color: 'var(--color-accent)' }} />
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            FEED
          </h1>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-fg-muted)' }}>Selecciona una liga para ver el feed:</p>
        <div className="space-y-2">
          {ligas.map(liga => (
            <button
              key={liga._id || liga}
              onClick={() => setSelectedLiga(liga._id || liga)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            >
              <Newspaper size={16} style={{ color: 'var(--color-accent)' }} />
              {liga.nombre || liga._id || liga}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="px-6 pt-4">
        <button
          onClick={() => setSelectedLiga(null)}
          className="text-xs cursor-pointer hover:underline"
          style={{ color: 'var(--color-fg-muted)' }}
        >
          ← Cambiar liga
        </button>
      </div>
      <FeedPageWithLiga ligaId={selectedLiga} />
    </div>
  )
}

function FeedPageWithLiga({ ligaId }) {
  return <FeedPage overrideLigaId={ligaId} />
}
