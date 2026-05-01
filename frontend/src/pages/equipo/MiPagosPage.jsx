import { useOutletContext } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

function Badge({ ok }) {
  if (ok) return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#22C55E' }}>
      <CheckCircle2 size={13} /> Pagado
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-destructive)' }}>
      <XCircle size={13} /> Pendiente
    </span>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden glow-card" style={{ background: 'var(--color-primary)' }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>{title}</p>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, total, pagado, pendiente }) {
  const isPaid = pendiente === 0
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm" style={{ color: 'var(--color-fg)' }}>{label}</p>
      <div className="flex items-center gap-3">
        <p className="text-sm tabular-nums" style={{ color: 'var(--color-fg-muted)' }}>
          ${pagado} / ${total}
        </p>
        <Badge ok={isPaid} />
      </div>
    </div>
  )
}

export default function MiPagosPage() {
  const { cobros, liga } = useOutletContext()

  if (!cobros) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl mb-4" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
          PAGOS
        </h1>
        <div className="rounded-2xl p-8 text-center" style={{ border: '2px dashed var(--color-border)' }}>
          <Clock size={40} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
          <p style={{ color: 'var(--color-fg-muted)' }}>No hay información de pagos disponible.</p>
        </div>
      </div>
    )
  }

  const { inscripcion, fijo, arbitrajes, total_deuda } = cobros

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
          PAGOS
        </h1>
        {liga && <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{liga.nombre}</p>}
      </div>

      {/* Resumen total */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{
          background: total_deuda > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
          border: `1px solid ${total_deuda > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          {total_deuda > 0 ? (
            <AlertTriangle size={24} style={{ color: 'var(--color-destructive)' }} />
          ) : (
            <CheckCircle2 size={24} style={{ color: '#22C55E' }} />
          )}
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>
              {total_deuda > 0 ? 'Tienes pagos pendientes' : '¡Al corriente!'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
              {total_deuda > 0 ? 'Contacta a tu organizador para realizar el pago' : 'No tienes deuda pendiente'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl" style={{
            color: total_deuda > 0 ? 'var(--color-destructive)' : '#22C55E',
            fontFamily: 'var(--font-display)',
          }}>
            ${total_deuda}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>total pendiente</p>
        </div>
      </div>

      {/* Inscripción */}
      <Section title="Inscripción">
        <Row
          label="Cuota de inscripción"
          total={inscripcion.total}
          pagado={inscripcion.pagado}
          pendiente={inscripcion.pendiente}
        />
      </Section>

      {/* Pago fijo (solo si aplica) */}
      {fijo.aplica && (
        <Section title="Pago fijo de temporada">
          <Row
            label="Tarifa fija"
            total={fijo.total}
            pagado={fijo.pagado}
            pendiente={fijo.pendiente}
          />
        </Section>
      )}

      {/* Arbitrajes */}
      <Section title={`Arbitrajes (${arbitrajes.detalle.length} partidos)`}>
        {arbitrajes.detalle.length === 0 ? (
          <p className="text-sm text-center py-2" style={{ color: 'var(--color-fg-muted)' }}>
            Sin partidos registrados aún
          </p>
        ) : (
          <>
            {arbitrajes.detalle.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-fg)' }}>
                    vs {d.rival_nombre || 'Desconocido'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                    Cancha {d.cancha} · {d.hora}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm tabular-nums font-medium" style={{ color: 'var(--color-fg)' }}>
                    ${d.monto}
                  </p>
                  <Badge ok={d.pagado} />
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>Total arbitrajes</p>
              <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-fg)' }}>
                ${arbitrajes.pagado} / ${arbitrajes.total}
              </p>
            </div>
          </>
        )}
      </Section>
    </div>
  )
}
