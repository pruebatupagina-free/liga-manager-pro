import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trophy, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

const PERKS = [
  '1 liga activa gratis para siempre',
  'Jornadas automáticas Round Robin',
  'Control de cobros e inscripciones',
  'Página pública de tu liga',
  'Live scoring en tiempo real',
]

export default function RegisterPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { nombre, email, password, confirm } = form
    if (!nombre.trim() || !email || !password) return toast.error('Completa todos los campos')
    if (password.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres')
    if (password !== confirm) return toast.error('Las contraseñas no coinciden')

    setLoading(true)
    try {
      const { data } = await client.post('/auth/register-public', { nombre: nombre.trim(), email, password })
      login(data.token, data.user)
      toast.success('¡Cuenta creada! Bienvenido 🏆')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--color-secondary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-fg)',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 60% 20%, #0F2A1A 0%, var(--color-bg) 60%)' }}
    >
      <div className="w-full max-w-4xl animate-fade-in flex flex-col lg:flex-row gap-10 items-center">

        {/* Left — perks */}
        <div className="flex-1 text-center lg:text-left">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto lg:mx-0"
            style={{ background: 'var(--color-accent)', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}
          >
            <Trophy size={28} style={{ color: '#020617' }} />
          </div>
          <h1
            className="font-display text-4xl glow-green mb-2"
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            LigaManager Pro
          </h1>
          <p className="text-lg font-semibold mb-6" style={{ color: 'var(--color-fg)' }}>
            Empieza gratis. Sin tarjeta.
          </p>
          <ul className="space-y-3">
            {PERKS.map(p => (
              <li key={p} className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-fg-muted)' }}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.15)' }}
                >
                  <Check size={12} style={{ color: 'var(--color-accent)' }} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="w-full max-w-sm">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-6 space-y-4 glow-card"
            style={{ background: 'var(--color-primary)' }}
          >
            <h2
              className="font-display text-2xl mb-1"
              style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
            >
              CREAR CUENTA
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-fg-muted)' }}>
              Plan Gratis — sin límite de tiempo
            </p>

            {[
              { id: 'nombre', label: 'Tu nombre', placeholder: 'Carlos Mendoza', type: 'text', field: 'nombre' },
              { id: 'email', label: 'Email', placeholder: 'carlos@liga.com', type: 'email', field: 'email' },
            ].map(({ id, label, placeholder, type, field }) => (
              <div key={id} className="space-y-1">
                <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  autoComplete={id}
                  value={form[field]}
                  onChange={set(field)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
            ))}

            {[
              { id: 'password', label: 'Contraseña', field: 'password' },
              { id: 'confirm', label: 'Confirmar contraseña', field: 'confirm' },
            ].map(({ id, label, field }) => (
              <div key={id} className="space-y-1">
                <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>
                  {label}
                </label>
                <div className="relative">
                  <input
                    id={id}
                    type={showPwd ? 'text' : 'password'}
                    autoComplete={id === 'password' ? 'new-password' : 'new-password'}
                    value={form[field]}
                    onChange={set(field)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                  {id === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: 'var(--color-fg-muted)' }}
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
            </button>

            <p className="text-center text-xs pt-1" style={{ color: 'var(--color-fg-muted)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: 'var(--color-accent)' }}>
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}
