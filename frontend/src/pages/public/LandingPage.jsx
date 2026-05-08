import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy, Calendar, DollarSign, BarChart2, MessageSquare,
  Check, Zap, ChevronRight, Star, ArrowRight,
  Users, Award, ShoppingBag, Newspaper, ClipboardList, Globe,
  ChevronDown, Shield, UserCircle, Store,
} from 'lucide-react'

const WA_URL = 'https://wa.me/528139863634?text=Hola%2C%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre%20LigaManager%20Pro%20%F0%9F%8F%86'

// ─── FadeIn on scroll ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {}, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(28px)'
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])
  return <div ref={ref} style={style} className={className}>{children}</div>
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const fired = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true
          const steps = 50
          let i = 0
          const id = setInterval(() => {
            i++
            setVal(Math.round((to / steps) * i))
            if (i >= steps) { setVal(to); clearInterval(id) }
          }, 1600 / steps)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString('es-MX')}{suffix}</span>
}

// ─── Browser mockup ──────────────────────────────────────────────────────────
function BrowserMockup({ src, alt = 'LigaManager Pro' }) {
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.13), 0 0 0 1px var(--color-border)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 14px',
        background: 'var(--color-secondary)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57', flexShrink: 0 }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FFBD2E', flexShrink: 0 }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28CA41', flexShrink: 0 }} />
        <span style={{
          flex: 1, marginLeft: 8, padding: '2px 10px', borderRadius: 6,
          fontSize: 11, fontFamily: 'monospace',
          background: 'var(--color-bg)', color: 'var(--color-fg-muted)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>app.ligamanager.pro</span>
      </div>
      <img src={src} alt={alt} style={{ width: '100%', display: 'block' }} />
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS = [
  { to: 500,    suffix: '+', label: 'Organizadores'   },
  { to: 5000,   suffix: '+', label: 'Equipos'          },
  { to: 25000,  suffix: '+', label: 'Jugadores'        },
  { to: 100000, suffix: '+', label: 'Partidos jugados' },
]

const FEATURES = [
  {
    tag: 'Jornadas y Live Scoring',
    title: 'Calendarios y partidos',
    bold: 'en tiempo real.',
    desc: 'Genera el calendario completo en segundos y deja que los árbitros marquen goles desde su celular mientras el torneo avanza.',
    bullets: [
      'Round Robin automático con canchas y horarios',
      'Árbitros marcan goles y tarjetas en vivo',
      'Score visible al público sin necesidad de login',
      'Badge EN VIVO pulsante en la página pública',
    ],
    img: '/liga-manager-pro/landing/ss-jornadas.png',
    flip: false,
  },
  {
    tag: 'Finanzas',
    title: 'Cobros sin',
    bold: 'perseguir a nadie.',
    desc: 'Registra inscripciones, arbitrajes y pagos. Ve al instante quién debe y cuánto sin andar mandando mensajes.',
    bullets: [
      'Inscripciones por equipo o jugador',
      'Arbitraje por jornada con estado de pago',
      'Semáforo de deuda por equipo al instante',
      'Exporta reportes en PDF y Excel',
    ],
    img: '/liga-manager-pro/landing/ss-cobros.png',
    flip: true,
  },
  {
    tag: 'Estadísticas',
    title: 'Tabla y goleadores',
    bold: 'siempre actualizados.',
    desc: 'Posiciones, goleadores y tarjetas se calculan solos al registrar cada resultado.',
    bullets: [
      'Tabla de posiciones automática',
      'Ranking de goleadores con fotos',
      'Tarjetas amarillas y rojas acumuladas',
      'Comparativa de rendimiento entre equipos',
    ],
    img: '/liga-manager-pro/landing/ss-estadisticas.png',
    flip: false,
  },
  {
    tag: 'Equipos y Jugadores',
    title: 'Plantillas completas',
    bold: 'bajo control.',
    desc: 'Administra todos los equipos y sus plantillas. Cada equipo tiene su propio acceso para ver su información.',
    bullets: [
      'Alta y edición de equipos con logo',
      'Registro de jugadores con foto y número',
      'Cuenta propia para cada dueño de equipo',
      'Vista de mi equipo para capitanes',
    ],
    img: '/liga-manager-pro/landing/ss-equipos.png',
    flip: true,
  },
  {
    tag: 'Página Pública',
    title: 'Tu liga, visible',
    bold: 'para todos.',
    desc: 'Cada liga tiene su propia URL pública. Jugadores, familiares y aficionados ven resultados sin necesidad de cuenta.',
    bullets: [
      'URL única por liga compartible en WhatsApp',
      'Tabla, jornadas y goleadores en tiempo real',
      'Partidos en vivo con score actualizado',
      'Liguilla / playoffs visible al público',
    ],
    img: '/liga-manager-pro/landing/ss-publica.png',
    flip: false,
  },
  {
    tag: 'Marketplace',
    title: 'Proveedores directos',
    bold: 'en tu liga.',
    desc: 'Conecta a equipos con vendedores de uniformes, balones y equipamiento. Mensajería directa incluida.',
    bullets: [
      'Vendedores asignados por liga',
      'Catálogo de productos con precios',
      'Mensajería equipo ↔ vendedor integrada',
      'Pedidos y cotizaciones sin salir de la app',
    ],
    img: '/liga-manager-pro/landing/ss-marketplace.png',
    flip: true,
  },
]

const CARDS = [
  { icon: Calendar,      title: 'Jornadas automáticas',  desc: 'Round Robin con canchas, días y horarios personalizables en segundos.',         img: '/liga-manager-pro/landing/ss-jornadas.png'      },
  { icon: DollarSign,    title: 'Control de cobros',      desc: 'Inscripciones, arbitrajes y pagos organizados por equipo sin complicaciones.',   img: '/liga-manager-pro/landing/ss-cobros.png'        },
  { icon: BarChart2,     title: 'Estadísticas',           desc: 'Tabla, goleadores y tarjetas actualizados automáticamente con cada resultado.',  img: '/liga-manager-pro/landing/ss-estadisticas.png'  },
  { icon: MessageSquare, title: 'Asistente IA',           desc: 'Pregúntale a la IA sobre tu liga. Quién lidera, quién debe, quién puede ganar.', img: '/liga-manager-pro/landing/ss-chatbot.png'       },
  { icon: Users,         title: 'Equipos y Jugadores',    desc: 'Plantillas completas con foto, número y cuenta propia por equipo.',              img: '/liga-manager-pro/landing/ss-equipos.png'       },
  { icon: Award,         title: 'Liguilla / Playoffs',    desc: 'Genera el bracket de eliminación directa al terminar la fase regular.',          img: '/liga-manager-pro/landing/ss-liguilla.png'      },
  { icon: Globe,         title: 'Página Pública',         desc: 'URL única por liga. Resultados y standings visibles sin crear cuenta.',          img: '/liga-manager-pro/landing/ss-publica.png'       },
  { icon: Newspaper,     title: 'Feed de Noticias',       desc: 'Publica anuncios, resultados destacados y noticias de la liga para todos.',      img: '/liga-manager-pro/landing/ss-feed.png'          },
  { icon: ClipboardList, title: 'Inscripciones',          desc: 'Gestiona solicitudes de registro de equipos y jugadores con control total.',     img: '/liga-manager-pro/landing/ss-inscripciones.png' },
  { icon: ShoppingBag,   title: 'Marketplace',            desc: 'Proveedores de uniformes y equipamiento conectados directamente con tu liga.',   img: '/liga-manager-pro/landing/ss-marketplace.png'   },
]

const TESTIMONIALS = [
  { initial: 'C', name: 'Carlos Mendoza',    liga: 'Liga AMC Dominical',    text: 'Antes perdía horas armando el calendario a mano. Ahora lo tengo listo en 2 minutos. Increíble.' },
  { initial: 'R', name: 'Roberto Garza',     liga: 'Liga Sabatina MTY',     text: 'El control de cobros es lo que más me gustó. Sé exactamente quién debe y cuánto sin andar persiguiendo a nadie.' },
  { initial: 'M', name: 'Miguel Torres',     liga: 'Torneo Regio 2026',     text: 'Los árbitros ya no me llaman para preguntar marcadores. Todo lo ven directo en la app en tiempo real.' },
  { initial: 'J', name: 'Javier Luna',       liga: 'Copa Noreste FC',       text: 'Mis jugadores están encantados con la página pública. Ya ven resultados solos, sin preguntarme nada.' },
  { initial: 'A', name: 'Alejandro Soto',    liga: 'Liga Dominical Sur',    text: 'La IA me dice quién puede ganar el torneo con solo preguntarle. Eso sí que impresiona a los capitanes.' },
  { initial: 'F', name: 'Fernando Vázquez',  liga: 'Torneo Intercolegial',  text: 'Administro 3 ligas al mismo tiempo y no me pierdo. Antes era completamente imposible sin esta herramienta.' },
]

const PLANES = [
  {
    nombre: 'Gratis', precio: '$0', periodo: ' para siempre', accent: false, badge: null,
    desc: 'Para empezar sin riesgo',
    features: [
      '1 liga activa',
      'Hasta 10 equipos por liga',
      'Hasta 15 jugadores por equipo',
      'Live scoring en tiempo real',
      'Árbitros y liguilla incluidos',
      'Página pública de la liga',
      'Estadísticas y tabla de posiciones',
    ],
    cta: 'Empezar gratis',
  },
  {
    nombre: 'Pro', precio: '$499', periodo: '/mes', accent: false, badge: null,
    desc: 'Para ligas serias',
    features: [
      'Hasta 5 ligas activas',
      'Equipos y jugadores ilimitados',
      'Asistente IA con contexto de tu liga',
      'Marketplace de vendedores',
      'Mensajería equipo ↔ vendedor',
      'Clonar ligas',
      'Galería de fotos (20 imágenes)',
    ],
    cta: 'Comenzar Pro',
  },
  {
    nombre: 'Club', precio: '$699', periodo: '/mes', accent: true, badge: 'Más popular',
    desc: 'Para organizadores con múltiples ligas',
    features: [
      'Hasta 15 ligas activas',
      'Equipos y jugadores ilimitados',
      'Asistente IA con contexto de tu liga',
      'Marketplace de vendedores',
      'Clonar ligas',
      'Galería de fotos (50 imágenes)',
      'Soporte prioritario',
    ],
    cta: 'Comenzar Club',
  },
  {
    nombre: 'Elite', precio: '$999', periodo: '/mes', accent: false, badge: null,
    desc: 'Para organizadores de alto volumen',
    features: [
      'Ligas ilimitadas',
      'Todo lo del plan Club',
      'Multi-admin por liga',
      'Galería ilimitada',
      'Onboarding dedicado',
      'SLA garantizado',
    ],
    cta: 'Contactar',
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Responsive helpers ──────────────────────────────────────────── */}
      <style>{`
        .lp-hero   { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .lp-feat   { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .lp-cards  { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
        .lp-testi  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .lp-planes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .lp-stats  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
        .lp-footer-cols { display: flex; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
        .lp-footer-links { display: flex; gap: 64px; flex-wrap: wrap; }
        @media (max-width: 1024px) {
          .lp-hero  { grid-template-columns: 1fr; }
          .lp-feat  { grid-template-columns: 1fr; gap: 40px; }
          .lp-feat-img-flip { order: -1 !important; }
          .lp-cards  { grid-template-columns: repeat(2, 1fr); }
          .lp-planes{ grid-template-columns: repeat(2, 1fr); max-width: 900px; margin: 0 auto; }
          .lp-testi { grid-template-columns: repeat(2, 1fr); }
          .lp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .lp-cards  { grid-template-columns: 1fr; }
          .lp-testi  { grid-template-columns: 1fr; }
          .lp-stats  { grid-template-columns: repeat(2, 1fr); }
          .lp-planes { grid-template-columns: 1fr; max-width: 440px; }
          .lp-footer-links { gap: 32px; }
        }
        @media (max-width: 768px) {
          .lp-nav-links { display: none !important; }
          .lp-nav { padding: 0 20px !important; }
          .lp-nav-logo-text { font-size: 17px !important; }
        }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="lp-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 68,
        background: 'var(--color-primary)',
        borderBottom: '1px solid ' + (scrolled ? 'var(--color-border)' : 'transparent'),
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        transition: 'box-shadow 0.25s, border-color 0.25s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-accent)' }}>
            <Trophy size={17} style={{ color: '#020617' }} />
          </div>
          <span className="lp-nav-logo-text" style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-fg)', letterSpacing: '0.05em' }}>
            LigaManager Pro
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

            {/* ── Plataforma dropdown ── */}
            <div style={{ position: 'relative' }}
              onMouseEnter={() => setActiveMenu('plataforma')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                color: activeMenu === 'plataforma' ? 'var(--color-fg)' : 'var(--color-fg-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Plataforma <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: activeMenu === 'plataforma' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {activeMenu === 'plataforma' && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                  width: 520, background: 'var(--color-primary)',
                  border: '1px solid var(--color-border)', borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 16, zIndex: 200,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4 }}>Módulos</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {CARDS.map(({ icon: Icon, title, desc }) => (
                      <a key={title} href="#features" onClick={() => setActiveMenu(null)} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.12)', marginTop: 1 }}>
                          <Icon size={14} style={{ color: 'var(--color-accent)' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg)', marginBottom: 2 }}>{title}</p>
                          <p style={{ fontSize: 12, color: 'var(--color-fg-muted)', lineHeight: 1.4 }}>{desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Precios dropdown ── */}
            <div style={{ position: 'relative' }}
              onMouseEnter={() => setActiveMenu('precios')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                color: activeMenu === 'precios' ? 'var(--color-fg)' : 'var(--color-fg-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Precios <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: activeMenu === 'precios' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {activeMenu === 'precios' && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                  width: 240, background: 'var(--color-primary)',
                  border: '1px solid var(--color-border)', borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 10, zIndex: 200,
                }}>
                  {[
                    { nombre: 'Gratis', precio: '$0', badge: null },
                    { nombre: 'Pro', precio: '$499/mes', badge: null },
                    { nombre: 'Club', precio: '$699/mes', badge: 'Popular' },
                    { nombre: 'Elite', precio: '$999/mes', badge: null },
                  ].map(p => (
                    <a key={p.nombre} href="#precios" onClick={() => setActiveMenu(null)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-fg)' }}>{p.nombre}</span>
                        {p.badge && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(34,197,94,0.15)', color: 'var(--color-accent)' }}>{p.badge}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-fg-muted)' }}>{p.precio}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Iniciar sesión dropdown ── */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setActiveMenu('login')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              color: activeMenu === 'login' ? 'var(--color-fg)' : 'var(--color-fg-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Iniciar sesión <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: activeMenu === 'login' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {activeMenu === 'login' && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 220, background: 'var(--color-primary)',
                border: '1px solid var(--color-border)', borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: 10, zIndex: 200,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 14px 8px' }}>Acceder como</p>
                {[
                  { icon: Trophy,      label: 'Admin de Liga',     desc: 'Gestiona tu torneo' },
                  { icon: UserCircle,  label: 'Dueño de Equipo',   desc: 'Ve tu plantilla' },
                  { icon: Store,       label: 'Vendedor',           desc: 'Administra tu negocio' },
                  { icon: Shield,      label: 'Árbitro',            desc: 'Tus partidos asignados' },
                ].map(({ icon: Icon, label, desc }) => (
                  <Link key={label} to="/login" onClick={() => setActiveMenu(null)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', borderRadius: 10, textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-secondary)' }}>
                      <Icon size={14} style={{ color: 'var(--color-fg-muted)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg)', marginBottom: 1 }}>{label}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-fg-muted)' }}>{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
            padding: '9px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            background: 'var(--color-fg)', color: 'var(--color-bg)', textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Comenzar gratis</a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 60px' }}>
        <div className="lp-hero">
          <FadeIn>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 100, marginBottom: 24,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              fontSize: 13, color: 'var(--color-accent)', fontWeight: 500,
            }}>
              <Zap size={12} /> Gestión profesional de ligas amateur
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,6vw,78px)',
              lineHeight: 1.0, color: 'var(--color-fg)', marginBottom: 22,
              letterSpacing: '0.02em',
            }}>
              ADMINISTRA<br />TU LIGA<br />
              <span style={{ color: 'var(--color-accent)' }}>SIN CAOS</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--color-fg-muted)', lineHeight: 1.65, maxWidth: 420, marginBottom: 36 }}>
              Jornadas automáticas, cobros, estadísticas y asistente IA. Todo lo que necesitas para organizar tu liga desde un solo lugar.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '13px 26px', borderRadius: 14, fontSize: 15, fontWeight: 600,
                background: 'var(--color-accent)', color: '#020617', textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Comenzar gratis <ChevronRight size={16} />
              </a>
              <a href="#features" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '13px 26px', borderRadius: 14, fontSize: 15, fontWeight: 500,
                background: 'var(--color-secondary)', color: 'var(--color-fg)', textDecoration: 'none',
              }}>Ver funciones</a>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', borderRadius: 100,
              background: 'var(--color-secondary)', border: '1px solid var(--color-border)',
              fontSize: 13, color: 'var(--color-fg-muted)',
            }}>
              <div style={{ display: 'flex' }}>
                {['🏆','⚽','🥅'].map((e, i) => (
                  <span key={i} style={{
                    width: 26, height: 26, borderRadius: '50%', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-accent)', marginLeft: i > 0 ? -7 : 0,
                    border: '2px solid var(--color-secondary)', zIndex: 3 - i, position: 'relative',
                  }}>{e}</span>
                ))}
              </div>
              <span><strong style={{ color: 'var(--color-fg)' }}>+500</strong> organizadores confían en nosotros</span>
            </div>
          </FadeIn>
          <FadeIn delay={160}>
            <BrowserMockup src="/liga-manager-pro/landing/ss-dashboard.png" alt="Dashboard LigaManager Pro" />
          </FadeIn>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--color-primary)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '52px 40px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 36 }}>
            Una comunidad que está creciendo
          </p>
          <div className="lp-stats" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {STATS.map(({ to, suffix, label }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1, color: 'var(--color-accent)', letterSpacing: '0.02em' }}>
                  <Counter to={to} suffix={suffix} />
                </div>
                <p style={{ fontSize: 14, color: 'var(--color-fg-muted)', marginTop: 6, fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature sections ──────────────────────────────────────────────── */}
      <div id="features">
        {FEATURES.map(({ tag, title, bold, desc, bullets, img, flip }) => (
          <section key={tag} style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px' }}>
            <div className="lp-feat">
              <FadeIn style={{ order: flip ? 1 : 0 }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--color-accent)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12,
                }}>{tag}</span>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,52px)',
                  lineHeight: 1.05, color: 'var(--color-fg)', marginBottom: 16,
                }}>
                  {title}<br /><strong>{bold}</strong>
                </h2>
                <p style={{ fontSize: 16, color: 'var(--color-fg-muted)', lineHeight: 1.65, marginBottom: 28 }}>{desc}</p>
                <ul style={{ listStyle: 'none', marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bullets.map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--color-fg)' }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                        background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={11} style={{ color: 'var(--color-accent)' }} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '11px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  background: 'var(--color-accent)', color: '#020617', textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Conoce más <ArrowRight size={14} />
                </a>
              </FadeIn>
              <FadeIn delay={120} className={flip ? 'lp-feat-img-flip' : ''} style={{ order: flip ? 0 : 1 }}>
                <BrowserMockup src={img} />
              </FadeIn>
            </div>
          </section>
        ))}
      </div>

      {/* ── Green CTA banner ──────────────────────────────────────────────── */}
      <section style={{ padding: '0 40px 96px' }}>
        <FadeIn>
          <div style={{
            maxWidth: 1200, margin: '0 auto', borderRadius: 24, padding: '52px 60px',
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, color: '#020617', marginBottom: 8, letterSpacing: '0.02em' }}>
                EMPIEZA A ORGANIZAR SIN COSTO
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(2,6,23,0.72)' }}>Prueba gratis. Sin tarjeta de crédito. Cancela cuando quieras.</p>
            </div>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700,
              background: '#020617', color: '#fff', textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Comenzar gratis <ChevronRight size={16} />
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ── Feature cards grid ────────────────────────────────────────────── */}
      <section style={{ padding: '0 40px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Nuestras características
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, color: 'var(--color-fg)', marginBottom: 14, letterSpacing: '0.02em' }}>
              AUTOMATIZA TUS ACTIVIDADES
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-fg-muted)', maxWidth: 560, marginBottom: 48, lineHeight: 1.6 }}>
              Administra cada aspecto de tu liga desde un solo lugar. Ahorra horas de trabajo manual cada semana.
            </p>
          </FadeIn>
          <div className="lp-cards">
            {CARDS.map(({ icon: Icon, title, desc, img }, i) => (
              <FadeIn key={title} delay={i * 60}>
                <div style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-primary)',
                  transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                  display: 'flex', flexDirection: 'column',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ height: 160, overflow: 'hidden', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <img src={img} alt={title} style={{ width: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  </div>
                  <div style={{ padding: '16px 18px 20px', flex: 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, marginBottom: 10,
                      background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-fg)', marginBottom: 5 }}>{title}</h3>
                    <p style={{ fontSize: 12, color: 'var(--color-fg-muted)', lineHeight: 1.55 }}>{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--color-primary)',
        borderTop: '1px solid var(--color-border)',
        padding: '96px 40px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 8 }}>
              Reseñas
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, color: 'var(--color-fg)', textAlign: 'center', marginBottom: 10, letterSpacing: '0.02em' }}>
              QUÉ DICEN NUESTROS CLIENTES
            </h2>
            <p style={{ fontSize: 15, color: 'var(--color-fg-muted)', textAlign: 'center', marginBottom: 56 }}>
              +500 organizadores usan nuestra plataforma
            </p>
          </FadeIn>
          <div className="lp-testi">
            {TESTIMONIALS.map(({ initial, name, liga, text }, i) => (
              <FadeIn key={name} delay={i * 65}>
                <div style={{
                  padding: '24px', borderRadius: 16,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  height: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 20, color: '#020617',
                    }}>{initial}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-fg)' }}>{name}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 500 }}>{liga}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="var(--color-accent)" style={{ color: 'var(--color-accent)' }} />)}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--color-fg-muted)', lineHeight: 1.65 }}>{text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precios ───────────────────────────────────────────────────────── */}
      <section id="precios" style={{ padding: '96px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 8 }}>
              Precios
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, color: 'var(--color-fg)', textAlign: 'center', marginBottom: 10, letterSpacing: '0.02em' }}>
              PLANES Y PRECIOS
            </h2>
            <p style={{ fontSize: 15, color: 'var(--color-fg-muted)', textAlign: 'center', marginBottom: 56 }}>
              Sin contratos. Sin sorpresas. Cancela cuando quieras.
            </p>
          </FadeIn>
          <div className="lp-planes">
            {PLANES.map((plan, i) => (
              <FadeIn key={plan.nombre} delay={i * 80}>
                <div style={{
                  borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column',
                  position: 'relative', height: '100%',
                  border: plan.accent ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: plan.accent ? 'var(--gradient-featured)' : 'var(--color-primary)',
                  boxShadow: plan.accent ? '0 0 48px rgba(34,197,94,0.14)' : undefined,
                }}>
                  {plan.badge && (
                    <span style={{
                      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--color-accent)', color: '#020617',
                      fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap',
                    }}>{plan.badge}</span>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--color-fg)', marginBottom: 2 }}>{plan.nombre}</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-fg-muted)', marginBottom: 16 }}>{plan.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 50, color: 'var(--color-fg)' }}>{plan.precio}</span>
                    <span style={{ fontSize: 14, color: 'var(--color-fg-muted)' }}>{plan.periodo}</span>
                  </div>
                  <ul style={{ listStyle: 'none', flex: 1, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--color-fg)' }}>
                        <Check size={14} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    background: plan.accent ? 'var(--color-accent)' : 'var(--color-secondary)',
                    color: plan.accent ? '#020617' : 'var(--color-fg)',
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >{plan.cta}</a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 40px 96px' }}>
        <FadeIn>
          <div style={{
            maxWidth: 1200, margin: '0 auto', borderRadius: 24, padding: '52px 60px',
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#020617', marginBottom: 8 }}>
                ¿LISTO PARA ORGANIZAR TU LIGA?
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(2,6,23,0.7)' }}>Únete a +500 organizadores. Empieza hoy mismo, sin costo.</p>
            </div>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700,
              background: '#020617', color: '#fff', textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Comenzar gratis <ChevronRight size={16} />
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0D1117', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '64px 40px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="lp-footer-cols" style={{ marginBottom: 52 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={15} style={{ color: '#020617' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-accent)' }}>LigaManager Pro</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', maxWidth: 240, lineHeight: 1.65 }}>
                Gestión profesional de ligas amateur. Simple y rápido.
              </p>
            </div>
            <div className="lp-footer-links">
              {[
                { title: 'Plataforma', links: ['Dashboard', 'Ligas', 'Jornadas', 'Cobros', 'Estadísticas'] },
                { title: 'Recursos',   links: ['Precios', 'Soporte', 'Página pública', 'Asistente IA'] },
                { title: 'Empresa',    links: ['Términos', 'Privacidad', 'Contacto'] },
              ].map(col => (
                <div key={col.title}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                    {col.title}
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {col.links.map(l => (
                      <li key={l}>
                        <Link to="/login" style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', textDecoration: 'none', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.88)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.42)'}
                        >{l}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
              © {new Date().getFullYear()} LigaManager Pro. Todos los derechos reservados. Hecho en México 🇲🇽
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
