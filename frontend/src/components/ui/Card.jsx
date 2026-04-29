export function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-2xl p-5 glow-card ${className}`}
      style={{ background: 'var(--color-primary)', ...style }}
    >
      {children}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-fg-muted)' }}>
            {label}
          </p>
          <p
            className="font-display text-3xl"
            style={{ color: accent ? 'var(--color-accent)' : 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
          >
            {value}
          </p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-fg-muted)' }}>{sub}</p>}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: accent ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)' }}
          >
            <Icon size={20} style={{ color: accent ? 'var(--color-accent)' : 'var(--color-fg-muted)' }} />
          </div>
        )}
      </div>
    </Card>
  )
}
