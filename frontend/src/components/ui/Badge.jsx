const variants = {
  green: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  red: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  yellow: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  blue: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  gray: { bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
  purple: { bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
}

export default function Badge({ label, variant = 'gray', className = '' }) {
  const style = variants[variant] || variants.gray
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  )
}

export function estadoBadge(estado) {
  const map = {
    activa: { label: 'Activa', variant: 'green' },
    finalizada: { label: 'Finalizada', variant: 'blue' },
    pausada: { label: 'Pausada', variant: 'yellow' },
    archivada: { label: 'Archivada', variant: 'gray' },
    jugado: { label: 'Jugado', variant: 'green' },
    pendiente: { label: 'Pendiente', variant: 'gray' },
    reprogramado: { label: 'Reprogramado', variant: 'blue' },
    programado: { label: 'Programado', variant: 'blue' },
    en_curso: { label: '🔴 En Vivo', variant: 'red' },
    cancelado: { label: 'Cancelado', variant: 'red' },
    wo: { label: 'W/O', variant: 'red' },
    activo_licencia: { label: 'Activa', variant: 'green' },
    por_vencer: { label: 'Por vencer', variant: 'yellow' },
    vencida: { label: 'Vencida', variant: 'red' },
    suspendida: { label: 'Suspendida', variant: 'red' },
  }
  const item = map[estado] || { label: estado, variant: 'gray' }
  return <Badge label={item.label} variant={item.variant} />
}
