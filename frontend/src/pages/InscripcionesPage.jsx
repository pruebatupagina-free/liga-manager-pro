import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Link2, Users, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import client from '../api/client'

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#F59E0B', bg: '#F59E0B18', icon: Clock },
  aprobada: { label: 'Aprobada', color: '#22C55E', bg: '#22C55E18', icon: CheckCircle2 },
  rechazada: { label: 'Rechazada', color: '#EF4444', bg: '#EF444418', icon: XCircle },
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={11} /> {cfg.label}
    </span>
  )
}

export default function InscripcionesPage() {
  const { liga_id } = useParams()
  const qc = useQueryClient()
  const [expandido, setExpandido] = useState(null)
  const [motivoRechazar, setMotivoRechazar] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['inscripciones', liga_id],
    queryFn: () => client.get('/inscripciones', { params: { liga_id } }).then(r => r.data),
  })

  const { data: liga } = useQuery({
    queryKey: ['liga', liga_id],
    queryFn: () => client.get(`/ligas/${liga_id}`).then(r => r.data),
  })

  const abrirInscripciones = useMutation({
    mutationFn: () => client.post(`/ligas/${liga_id}/inscripciones/token`),
    onSuccess: () => { qc.invalidateQueries(['inscripciones', liga_id]); toast.success('Link de inscripción generado') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const cerrarInscripciones = useMutation({
    mutationFn: () => client.put(`/ligas/${liga_id}/inscripciones/cerrar`),
    onSuccess: () => { qc.invalidateQueries(['inscripciones', liga_id]); qc.invalidateQueries(['liga', liga_id]); toast.success('Inscripciones cerradas') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const aprobar = useMutation({
    mutationFn: id => client.put(`/inscripciones/${id}/aprobar`),
    onSuccess: (_, id) => { qc.invalidateQueries(['inscripciones', liga_id]); toast.success('Equipo creado y aprobado') },
    onError: err => toast.error(err.response?.data?.error || 'Error al aprobar'),
  })

  const rechazar = useMutation({
    mutationFn: ({ id, motivo }) => client.put(`/inscripciones/${id}/rechazar`, { motivo }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(['inscripciones', liga_id])
      setMotivoRechazar(m => { const n = { ...m }; delete n[id]; return n })
      toast.success('Inscripción rechazada')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al rechazar'),
  })

  async function copyLink() {
    if (!data?.token) return
    const url = `${window.location.origin}${BASE_URL}/inscripcion/${data.token}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copiado')
  }

  const inscripciones = data?.inscripciones || []
  const pendientes = inscripciones.filter(i => i.estado === 'pendiente').length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            INSCRIPCIONES
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            {liga?.nombre} · {inscripciones.length} solicitud(es)
            {pendientes > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F59E0B22', color: '#F59E0B' }}>{pendientes} pendiente(s)</span>}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {data?.inscripciones_abiertas ? (
            <>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--color-accent)', color: '#020617' }}
              >
                <Link2 size={15} /> Copiar link
              </button>
              <button
                onClick={() => cerrarInscripciones.mutate()}
                disabled={cerrarInscripciones.isPending}
                className="text-xs cursor-pointer"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Cerrar inscripciones
              </button>
            </>
          ) : (
            <button
              onClick={() => abrirInscripciones.mutate()}
              disabled={abrirInscripciones.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)', border: '1px solid var(--color-border)' }}
            >
              <Users size={15} /> Abrir inscripciones
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : inscripciones.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto mb-4" style={{ color: 'var(--color-fg-muted)' }} />
          <p style={{ color: 'var(--color-fg-muted)' }}>
            {data?.inscripciones_abiertas
              ? 'Aún no hay solicitudes. Comparte el link con los equipos.'
              : 'Abre las inscripciones para recibir solicitudes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inscripciones.map(insc => {
            const isOpen = expandido === insc._id
            const cfg = ESTADO_CONFIG[insc.estado]
            return (
              <div key={insc._id} className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--color-primary)', border: `1px solid ${insc.estado === 'pendiente' ? cfg.color + '33' : 'var(--color-border)'}` }}>

                {/* Row header */}
                <button
                  onClick={() => setExpandido(isOpen ? null : insc._id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer hover:bg-white/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: insc.color + '22', color: insc.color, border: `2px solid ${insc.color}44` }}>
                    {insc.nombre_equipo.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-fg)' }}>{insc.nombre_equipo}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>
                      {insc.nombre_capitan} · {insc.whatsapp}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <EstadoBadge estado={insc.estado} />
                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--color-fg-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-fg-muted)' }} />}
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="pt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-secondary)' }}>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--color-fg-muted)' }}>Capitán</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{insc.nombre_capitan}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-secondary)' }}>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--color-fg-muted)' }}>WhatsApp</p>
                        <a href={`https://wa.me/${insc.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="text-sm font-medium" style={{ color: '#25D366' }}>{insc.whatsapp}</a>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-secondary)' }}>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--color-fg-muted)' }}>Jugadores</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{insc.jugadores?.length || 0} registrados</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--color-secondary)' }}>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--color-fg-muted)' }}>Fecha</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>
                          {new Date(insc.createdAt).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>

                    {insc.jugadores?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-fg-muted)' }}>Plantilla</p>
                        <div className="space-y-1">
                          {insc.jugadores.map((j, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--color-secondary)' }}>
                              {j.numero_camiseta && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: insc.color + '22', color: insc.color }}>#{j.numero_camiseta}</span>
                              )}
                              <span className="text-sm flex-1" style={{ color: 'var(--color-fg)' }}>{j.nombre}</span>
                              {j.posicion && <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{j.posicion}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {insc.estado === 'pendiente' && (
                      <div className="space-y-2">
                        <div className="flex gap-3">
                          <button
                            onClick={() => aprobar.mutate(insc._id)}
                            disabled={aprobar.isPending}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                            style={{ background: '#22C55E22', color: '#22C55E', border: '1px solid #22C55E44' }}
                          >
                            {aprobar.isPending ? 'Creando equipo...' : '✓ Aprobar — crear equipo'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Motivo de rechazo (opcional)"
                            value={motivoRechazar[insc._id] || ''}
                            onChange={e => setMotivoRechazar(m => ({ ...m, [insc._id]: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                            style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                          />
                          <button
                            onClick={() => rechazar.mutate({ id: insc._id, motivo: motivoRechazar[insc._id] })}
                            disabled={rechazar.isPending}
                            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                            style={{ background: '#EF444422', color: '#EF4444', border: '1px solid #EF444444' }}
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    )}

                    {insc.estado === 'rechazada' && insc.notas_admin && (
                      <div className="rounded-xl p-3" style={{ background: '#EF444411', border: '1px solid #EF444433' }}>
                        <p className="text-xs" style={{ color: '#EF4444' }}>Motivo: {insc.notas_admin}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
