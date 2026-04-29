import { Link } from 'react-router-dom'
import { Trophy, Calendar, DollarSign, BarChart2, MessageSquare, Users, Check, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Trophy, title: 'Ligas completas', desc: 'Configura días, canchas, horarios y cuotas en minutos.' },
  { icon: Calendar, title: 'Jornadas automáticas', desc: 'Round Robin inteligente con respeto a horas fijas.' },
  { icon: DollarSign, title: 'Control de cobros', desc: 'Inscripciones, arbitrajes y pago fijo por equipo.' },
  { icon: BarChart2, title: 'Estadísticas', desc: 'Tabla, goleadores, rendimiento y comparativas.' },
  { icon: MessageSquare, title: 'Asistente IA', desc: 'Pregunta sobre tu liga con Claude AI. 30 msg/día.' },
  { icon: Users, title: 'Página pública', desc: 'URL pública para que los participantes vean todo.' },
]

const PLANES = [
  {
    nombre: 'Básico',
    precio: '$299',
    periodo: '/mes',
    features: ['1 liga activa', 'Hasta 16 equipos', 'Estadísticas básicas', 'Página pública', 'Soporte por email'],
    accent: false,
  },
  {
    nombre: 'Profesional',
    precio: '$599',
    periodo: '/mes',
    features: ['Ligas ilimitadas', 'Equipos ilimitados', 'Asistente IA', 'Export PDF & Excel', 'WhatsApp automático', 'Liguilla/Playoffs', 'Soporte prioritario'],
    accent: true,
  },
  {
    nombre: 'Ilimitado',
    precio: '$999',
    periodo: '/mes',
    features: ['Todo lo anterior', 'Multi-admin', 'API acceso', 'Onboarding dedicado', 'SLA 99.9%'],
    accent: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-primary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <Trophy size={16} style={{ color: '#020617' }} />
          </div>
          <span className="font-display text-xl" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>LigaManager Pro</span>
        </div>
        <Link
          to="/login"
          className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0F2A1A 0%, var(--color-bg) 60%)', minHeight: 'calc(100vh - 72px)' }}>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <Zap size={12} /> Gestión profesional de ligas amateur
        </div>
        <h1
          className="font-display text-6xl md:text-8xl mb-6 glow-green"
          style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)', lineHeight: 1 }}
        >
          TU LIGA,<br /><span style={{ color: 'var(--color-accent)' }}>SIN CAOS</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: 'var(--color-fg-muted)' }}>
          Administra jornadas, cobros, estadísticas y comunicación de tu liga de fútbol desde un solo lugar.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/login"
            className="px-6 py-3 rounded-2xl font-semibold cursor-pointer text-base"
            style={{ background: 'var(--color-accent)', color: '#020617' }}
          >
            Empezar gratis
          </Link>
          <a href="#features" className="px-6 py-3 rounded-2xl font-semibold cursor-pointer text-base" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
            Ver funciones
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 0 120px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 32px' }}>
          <h2 className="font-display text-4xl text-center mb-14" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            TODO LO QUE NECESITAS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '24px' }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl glow-card hover:scale-[1.02] transition-all"
                style={{ background: 'var(--color-primary)', padding: '32px' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  <Icon size={22} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-fg)' }}>{title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section style={{ paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 32px' }}>
          <h2 className="font-display text-4xl text-center mb-14" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            PLANES Y PRECIOS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '24px' }}>
            {PLANES.map(plan => (
              <div
                key={plan.nombre}
                className="rounded-2xl flex flex-col"
                style={{
                  background: plan.accent ? 'linear-gradient(135deg, #0F2A1A 0%, #0F172A 100%)' : 'var(--color-primary)',
                  border: plan.accent ? '1px solid #22C55E' : '1px solid var(--color-border)',
                  boxShadow: plan.accent ? '0 0 30px rgba(34,197,94,0.15)' : undefined,
                  padding: '32px',
                }}
              >
                {plan.accent && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full mb-4 self-start" style={{ background: 'var(--color-accent)', color: '#020617' }}>
                    Más popular
                  </span>
                )}
                <h3 className="font-display text-2xl mb-1" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{plan.nombre}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl" style={{ color: plan.accent ? 'var(--color-accent)' : 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{plan.precio}</span>
                  <span className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{plan.periodo}</span>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-fg)' }}>
                      <Check size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className="block text-center py-3 rounded-xl font-semibold cursor-pointer text-sm"
                  style={{
                    background: plan.accent ? 'var(--color-accent)' : 'var(--color-secondary)',
                    color: plan.accent ? '#020617' : 'var(--color-fg)',
                  }}
                >
                  Comenzar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center px-4 py-10 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-fg-muted)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <Trophy size={14} style={{ color: '#020617' }} />
          </div>
          <span className="font-display text-lg" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>LigaManager Pro</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} LigaManager Pro. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
