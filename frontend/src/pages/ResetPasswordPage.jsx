import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Trophy, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import client from '../api/client'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password || !confirm) return toast.error('Completa todos los campos')
    if (password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirm) return toast.error('Las contraseñas no coinciden')
    setLoading(true)
    try {
      await client.post(`/auth/reset-password/${token}`, { password })
      toast.success('Contraseña actualizada correctamente')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Token inválido o expirado')
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
          <h2 className="font-display text-2xl mb-1" style={{ color: 'var(--color-fg)' }}>
            NUEVA CONTRASEÑA
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--color-fg-muted)' }}>
            Elige una contraseña segura para tu cuenta.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>
                Confirmar contraseña
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
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
              Guardar contraseña
            </button>
          </form>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1 text-sm mt-4"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            <ArrowLeft size={14} /> Volver al login
          </Link>
        </div>
      </div>
    </div>
  )
}
