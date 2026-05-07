import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function NotificationBanner() {
  const { permission, subscribed, subscribe, loading, supported } = usePushNotifications()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('push-banner-dismissed') === '1'
  )

  if (!supported || subscribed || permission === 'denied' || dismissed) return null

  function dismiss() {
    localStorage.setItem('push-banner-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 20px',
      background: 'var(--color-accent)',
      color: '#020617',
    }}>
      <Bell size={16} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
        Activa las notificaciones para recibir alertas de mensajes y resultados en tiempo real
      </span>
      <button
        onClick={subscribe}
        disabled={loading}
        style={{
          padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: '#020617', color: '#fff', border: 'none', cursor: 'pointer',
          opacity: loading ? 0.6 : 1, flexShrink: 0,
        }}
      >
        {loading ? 'Activando...' : 'Activar'}
      </button>
      <button
        onClick={dismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
      >
        <X size={16} style={{ color: '#020617' }} />
      </button>
    </div>
  )
}
