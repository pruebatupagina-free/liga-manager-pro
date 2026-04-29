import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { Award, Plus, Trophy } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { estadoBadge } from '../components/ui/Badge'
import client from '../api/client'

function launchConfetti() {
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#22C55E', '#F59E0B', '#FFFFFF'] })
}

function PartidoBracket({ partido, onClick }) {
  const local = partido.equipo_local_id
  const visitante = partido.equipo_visitante_id
  const jugado = partido.estado === 'jugado'
  const ganadorId = partido.ganador_id?._id || partido.ganador_id

  return (
    <button
      onClick={() => !jugado && onClick(partido)}
      className={`rounded-xl overflow-hidden border text-left transition-all ${!jugado ? 'hover:border-green-500 cursor-pointer' : 'cursor-default'}`}
      style={{ background: 'var(--color-secondary)', borderColor: 'var(--color-border)', minWidth: '180px' }}
    >
      {[{ equipo: local, goles: partido.goles_local }, { equipo: visitante, goles: partido.goles_visitante }].map(({ equipo, goles }, i) => {
        const esGanador = jugado && equipo?._id === ganadorId
        return (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2"
            style={{
              background: esGanador ? 'rgba(34,197,94,0.1)' : 'transparent',
              borderBottom: i === 0 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {equipo?.logo ? (
                <img src={equipo.logo} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: equipo?.color + '33', color: equipo?.color }}>
                  {equipo?.nombre?.charAt(0)}
                </div>
              )}
              <span className="text-xs truncate font-medium" style={{ color: esGanador ? 'var(--color-accent)' : 'var(--color-fg)' }}>
                {equipo?.nombre || 'Por definir'}
              </span>
            </div>
            {jugado && (
              <span className="font-display text-sm ml-2 flex-shrink-0" style={{ color: esGanador ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>
                {goles ?? '–'}
              </span>
            )}
          </div>
        )
      })}
    </button>
  )
}

function BracketFase({ titulo, partidos, onPartidoClick }) {
  if (partidos.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-fg-muted)' }}>{titulo}</p>
      <div className="flex flex-wrap gap-3">
        {partidos.map(p => (
          <PartidoBracket key={p._id} partido={p} onClick={onPartidoClick} />
        ))}
      </div>
    </div>
  )
}

export default function LiguillaPage() {
  const { liga_id } = useParams()
  const qc = useQueryClient()
  const [resultadoModal, setResultadoModal] = useState(null)
  const [resForm, setResForm] = useState({ goles_local: '', goles_visitante: '', penales_local: '', penales_visitante: '' })
  const [grupoTab, setGrupoTab] = useState(0)

  const { data: liguilla, isLoading } = useQuery({
    queryKey: ['liguilla', liga_id],
    queryFn: () => client.get('/liguilla', { params: { liga_id } }).then(r => r.data),
  })

  const { data: liga } = useQuery({
    queryKey: ['liga', liga_id],
    queryFn: () => client.get(`/ligas/${liga_id}`).then(r => r.data),
  })

  const generar = useMutation({
    mutationFn: () => client.post('/liguilla/generar', { liga_id }),
    onSuccess: () => { qc.invalidateQueries(['liguilla', liga_id]); toast.success('Liguilla generada') },
    onError: err => toast.error(err.response?.data?.error || 'Error al generar'),
  })

  const guardarResultado = useMutation({
    mutationFn: ({ id, data }) => client.put(`/liguilla/partido/${id}/resultado`, data),
    onSuccess: (res) => {
      qc.invalidateQueries(['liguilla', liga_id])
      setResultadoModal(null)
      toast.success('Resultado guardado')
      if (res.data.ganador_id) launchConfetti()
    },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const grupos = liguilla?.grupos || []
  const partidos = liguilla?.partidos || []
  const currentGrupo = grupos[grupoTab]

  const partidosGrupo = partidos.filter(p => p.grupo_id === currentGrupo?._id && p.fase === 'grupos')
  const cuartos = partidos.filter(p => p.fase === 'cuartos')
  const semis = partidos.filter(p => p.fase === 'semis')
  const final = partidos.filter(p => p.fase === 'final')

  const empate = resultadoModal
    ? (Number(resForm.goles_local) === Number(resForm.goles_visitante) && resForm.goles_local !== '')
    : false
  const esGrupos = resultadoModal?.fase === 'grupos'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>LIGUILLA</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>{liga?.nombre}</p>
        </div>
        {grupos.length === 0 && liga?.configuracion?.liguilla?.activa && (
          <button
            onClick={() => generar.mutate()}
            disabled={generar.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
            style={{ background: 'var(--color-accent)', color: '#020617' }}
          >
            <Plus size={16} /> Generar liguilla
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : grupos.length === 0 ? (
        <div className="text-center py-20">
          <Award size={48} className="mx-auto mb-4" style={{ color: 'var(--color-fg-muted)' }} />
          <p className="font-semibold mb-1" style={{ color: 'var(--color-fg)' }}>Sin liguilla generada</p>
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            {liga?.configuracion?.liguilla?.activa
              ? 'La fase regular debe finalizar para generar la liguilla'
              : 'Esta liga no tiene liguilla configurada'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Grupos tabs */}
          {grupos.length > 1 && (
            <div className="flex gap-1 rounded-2xl p-1" style={{ background: 'var(--color-primary)' }}>
              {grupos.map((g, i) => (
                <button
                  key={g._id}
                  onClick={() => setGrupoTab(i)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                  style={{ background: grupoTab === i ? 'var(--color-secondary)' : 'transparent', color: grupoTab === i ? 'var(--color-fg)' : 'var(--color-fg-muted)' }}
                >
                  Grupo {g.numero_grupo}
                </button>
              ))}
            </div>
          )}

          {/* Bracket por grupo */}
          {currentGrupo && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {currentGrupo.equipos?.map(e => (
                  <span key={e._id} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: (e.color || '#22C55E') + '22', color: e.color || '#22C55E' }}>
                    {e.nombre}
                  </span>
                ))}
              </div>

              <BracketFase titulo="Fase de grupos" partidos={partidosGrupo} onPartidoClick={p => { setResultadoModal(p); setResForm({ goles_local: '', goles_visitante: '', penales_local: '', penales_visitante: '' }) }} />
              <BracketFase titulo="Cuartos de final" partidos={cuartos} onPartidoClick={p => { setResultadoModal(p); setResForm({ goles_local: '', goles_visitante: '', penales_local: '', penales_visitante: '' }) }} />
              <BracketFase titulo="Semifinales" partidos={semis} onPartidoClick={p => { setResultadoModal(p); setResForm({ goles_local: '', goles_visitante: '', penales_local: '', penales_visitante: '' }) }} />

              {final.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#F59E0B' }}>
                    <Trophy size={12} className="inline mr-1" />FINAL
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {final.map(p => (
                      <div key={p._id} className="relative">
                        <PartidoBracket partido={p} onClick={pp => { setResultadoModal(pp); setResForm({ goles_local: '', goles_visitante: '', penales_local: '', penales_visitante: '' }) }} />
                        {p.ganador_id && (
                          <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#F59E0B' }}>
                            <Trophy size={14} style={{ color: '#020617' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resultado modal */}
      <Modal open={!!resultadoModal} onClose={() => setResultadoModal(null)} title="RESULTADO LIGUILLA" size="sm">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center flex-1">
              <p className="text-xs mb-2" style={{ color: 'var(--color-fg-muted)' }}>{resultadoModal?.equipo_local_id?.nombre}</p>
              <input
                type="number" min="0"
                value={resForm.goles_local}
                onChange={e => setResForm(f => ({ ...f, goles_local: e.target.value }))}
                className="w-20 text-center rounded-xl outline-none font-display text-4xl"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
              />
            </div>
            <span className="font-display text-2xl" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>VS</span>
            <div className="text-center flex-1">
              <p className="text-xs mb-2" style={{ color: 'var(--color-fg-muted)' }}>{resultadoModal?.equipo_visitante_id?.nombre}</p>
              <input
                type="number" min="0"
                value={resForm.goles_visitante}
                onChange={e => setResForm(f => ({ ...f, goles_visitante: e.target.value }))}
                className="w-20 text-center rounded-xl outline-none font-display text-4xl"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
              />
            </div>
          </div>

          {empate && !esGrupos && (
            <div className="grid grid-cols-2 gap-4 rounded-xl p-3" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-fg-muted)' }}>Penales {resultadoModal?.equipo_local_id?.nombre}</label>
                <input type="number" min="0" value={resForm.penales_local} onChange={e => setResForm(f => ({ ...f, penales_local: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm outline-none text-center" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-fg-muted)' }}>Penales {resultadoModal?.equipo_visitante_id?.nombre}</label>
                <input type="number" min="0" value={resForm.penales_visitante} onChange={e => setResForm(f => ({ ...f, penales_visitante: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm outline-none text-center" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }} />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setResultadoModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button
              type="button"
              onClick={() => guardarResultado.mutate({
                id: resultadoModal._id,
                data: {
                  goles_local: Number(resForm.goles_local) || 0,
                  goles_visitante: Number(resForm.goles_visitante) || 0,
                  ...(empate && !esGrupos ? { penales_local: Number(resForm.penales_local), penales_visitante: Number(resForm.penales_visitante) } : {}),
                },
              })}
              disabled={guardarResultado.isPending || resForm.goles_local === '' || resForm.goles_visitante === ''}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {guardarResultado.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
