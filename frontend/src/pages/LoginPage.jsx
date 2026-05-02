import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trophy, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Completa todos los campos')
    setLoading(true)
    try {
      const { data } = await client.post('/auth/login', { email, password })
      login(data.token)
      const from = location.state?.from?.pathname
      if (data.rol === 'superadmin') navigate('/admin', { replace: true })
      else if (data.rol === 'dueno_equipo') navigate('/mi-equipo', { replace: true })
      else if (data.rol === 'vendedor') navigate('/mi-negocio', { replace: true })
      else navigate(from || '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 60% 20%, #0F2A1A 0%, var(--color-bg) 60%)' }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-accent)', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}
          >
            <Trophy size={28} style={{ color: '#020617' }} />
          </div>
          <h1 className="font-display text-4xl glow-green" style={{ color: 'var(--color-accent)' }}>
            LigaManager Pro
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            Gestión de ligas amateur
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4 glow-card"
          style={{ background: 'var(--color-primary)' }}
        >
          <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            INICIAR SESIÓN
          </h2>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@liga.com"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--color-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-fg)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--color-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-fg)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: 'var(--color-fg-muted)' }}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'var(--color-accent)', color: '#020617' }}
            onMouseEnter={e => !loading && (e.target.style.background = 'var(--color-accent-hover)')}
            onMouseLeave={e => e.target.style.background = 'var(--color-accent)'}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Entrar
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-fg-muted)' }}>
          LigaManager Pro — Gestión profesional de ligas
        </p>
      </div>
    </div>
  )
}
