import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trophy, Loader2, ArrowLeft } from 'lucide-react'
import client from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return toast.error('Ingresa tu email')
    setLoading(true)
    try {
      await client.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Error al enviar el email. Intenta de nuevo.')
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
        </div>

        <div className="rounded-2xl p-6 glow-card" style={{ background: 'var(--color-primary)' }}>
          {sent ? (
            <div className="text-center space-y-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(34,197,94,0.15)' }}
              >
                <Trophy size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h2 className="font-display text-xl" style={{ color: 'var(--color-fg)' }}>
                Revisa tu email
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
                Si el email existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm mt-4"
                style={{ color: 'var(--color-accent)' }}
              >
                <ArrowLeft size={16} /> Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl mb-1" style={{ color: 'var(--color-fg)' }}>
                RECUPERAR CONTRASEÑA
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--color-fg-muted)' }}>
                Ingresa tu email y te enviamos un enlace.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'var(--color-accent)', color: '#020617' }}
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Enviar enlace
                </button>
              </form>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm mt-4"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                <ArrowLeft size={14} /> Volver al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
