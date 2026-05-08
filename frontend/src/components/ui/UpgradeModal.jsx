import { X, Check, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const WA = '528139863634'

const PLANES = [
  {
    nombre: 'Pro',
    precio: '$499',
    periodo: '/mes',
    accent: false,
    features: [
      'Hasta 5 ligas activas',
      'Equipos y jugadores ilimitados',
      'Asistente IA con contexto de tu liga',
      'Marketplace de vendedores',
      'Mensajería equipo ↔ vendedor',
      'Clonar ligas',
      'Galería de fotos (20 imágenes)',
    ],
  },
  {
    nombre: 'Club',
    precio: '$699',
    periodo: '/mes',
    accent: true,
    badge: 'Más popular',
    features: [
      'Hasta 15 ligas activas',
      'Equipos y jugadores ilimitados',
      'Asistente IA con contexto de tu liga',
      'Marketplace de vendedores',
      'Clonar ligas',
      'Galería de fotos (50 imágenes)',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Elite',
    precio: '$999',
    periodo: '/mes',
    accent: false,
    features: [
      'Ligas ilimitadas',
      'Todo lo del plan Club',
      'Multi-admin por liga',
      'Galería ilimitada',
      'Onboarding dedicado',
      'SLA garantizado',
    ],
  },
]

export default function UpgradeModal({ open, onClose }) {
  const { user } = useAuth()

  if (!open) return null

  function waUrl(plan) {
    const msg = encodeURIComponent(
      `Hola, quiero actualizar mi cuenta de LigaManager Pro al plan ${plan}.\nMi usuario es: ${user?.username || ''}`
    )
    return `https://wa.me/${WA}?text=${msg}`
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--color-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 24, padding: '32px',
        width: '100%', maxWidth: 820,
        maxHeight: '90vh', overflowY: 'auto',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-fg-muted)',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 100, marginBottom: 12,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          }}>
            <Zap size={13} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>Mejora tu plan</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            color: 'var(--color-fg)', letterSpacing: '0.02em', marginBottom: 6,
          }}>
            ELIGE TU PLAN
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-fg-muted)' }}>
            Escríbenos por WhatsApp y te activamos en minutos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PLANES.map(plan => (
            <div
              key={plan.nombre}
              style={{
                borderRadius: 16, padding: '24px 20px',
                border: plan.accent ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: plan.accent ? 'rgba(34,197,94,0.05)' : 'var(--color-secondary)',
                display: 'flex', flexDirection: 'column', position: 'relative',
              }}
            >
              {plan.badge && (
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--color-accent)', color: '#020617',
                  fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100,
                  whiteSpace: 'nowrap',
                }}>{plan.badge}</span>
              )}

              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg-muted)', marginBottom: 6 }}>
                {plan.nombre}
              </p>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-fg)' }}>{plan.precio}</span>
                <span style={{ fontSize: 13, color: 'var(--color-fg-muted)' }}>{plan.periodo}</span>
              </div>

              <ul style={{ listStyle: 'none', flex: 1, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--color-fg)' }}>
                    <Check size={13} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={waUrl(plan.nombre)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', padding: '11px',
                  borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  background: plan.accent ? 'var(--color-accent)' : 'var(--color-border)',
                  color: plan.accent ? '#020617' : 'var(--color-fg)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Quiero el plan {plan.nombre}
              </a>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-fg-muted)', marginTop: 20 }}>
          Te contactaremos para confirmar el pago y activar tu plan en minutos.
        </p>
      </div>
    </div>
  )
}
