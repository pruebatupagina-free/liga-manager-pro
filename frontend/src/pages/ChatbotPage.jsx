import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send, MessageSquare, Loader2, Zap, Lock } from 'lucide-react'
import client from '../api/client'
import { usePlan } from '../hooks/usePlan'

const QUICK_PROMPTS = [
  '¿Cómo va mi liga?',
  '¿Quién me debe más?',
  '¿Quién puede ganar?',
  '¿Algún equipo en riesgo?',
  '¿Cómo están los horarios?',
]

export default function ChatbotPage() {
  const { esBasico, plan } = usePlan()
  const [ligaId, setLigaId] = useState('')
  const [input, setInput] = useState('')
  const [historial, setHistorial] = useState([])
  const [mensajeshoy, setMensajeshoy] = useState(0)
  const endRef = useRef(null)

  const { data: ligas = [] } = useQuery({
    queryKey: ['ligas'],
    queryFn: () => client.get('/ligas').then(r => r.data),
  })

  useEffect(() => {
    if (!ligaId && ligas.length > 0) setLigaId(ligas[0]._id)
  }, [ligas, ligaId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historial])

  const send = useMutation({
    mutationFn: (mensaje) => client.post('/chatbot/mensaje', { liga_id: ligaId, mensaje, historial }),
    onSuccess: (res, mensaje) => {
      const { respuesta, mensajes_hoy } = res.data
      setHistorial(h => [
        ...h,
        { role: 'user', content: mensaje },
        { role: 'assistant', content: respuesta },
      ])
      setMensajeshoy(mensajes_hoy)
      setInput('')
    },
    onError: err => {
      const msg = err.response?.data?.error || 'Error al enviar mensaje'
      setHistorial(h => [...h, { role: 'assistant', content: `Error: ${msg}`, error: true }])
    },
  })

  function handleSend(msg) {
    const texto = msg || input.trim()
    if (!texto || !ligaId || mensajeshoy >= 30) return
    send.mutate(texto)
  }

  const agotado = mensajeshoy >= 30

  if (esBasico) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center" data-tour="chatbot">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}
        >
          <Lock size={28} style={{ color: '#FBBF24' }} />
        </div>
        <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--color-fg)' }}>Asistente IA</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--color-fg-muted)' }}>
          El Asistente IA con contexto de tu liga no está disponible en el plan básico.
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--color-fg-muted)', opacity: 0.7 }}>
          Actualiza al plan Pro para hacer preguntas sobre resultados, deudas, standings y más.
        </p>
        <div
          className="rounded-2xl p-5 max-w-xs w-full text-left"
          style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} style={{ color: '#FBBF24' }} />
            <span className="text-xs font-semibold" style={{ color: '#FBBF24' }}>Plan Pro — disponible</span>
          </div>
          <ul className="space-y-2">
            {['Asistente IA con contexto de tu liga', 'Hasta 5 ligas activas', 'Equipos ilimitados', 'Clonar ligas', 'Marketplace de vendedores'].map(f => (
              <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                <span style={{ color: 'var(--color-accent)', marginTop: 1 }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen" data-tour="chatbot">
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>ASISTENTE IA</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>Powered by Claude · {mensajeshoy}/30 mensajes hoy</p>
          </div>
          <select
            value={ligaId}
            onChange={e => setLigaId(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
            style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
          >
            {ligas.map(l => <option key={l._id} value={l._id}>{l.nombre}</option>)}
          </select>
        </div>

        {/* Contador */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-secondary)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(mensajeshoy / 30) * 100}%`,
              background: mensajeshoy >= 25 ? '#EF4444' : mensajeshoy >= 20 ? '#F59E0B' : '#22C55E',
            }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {historial.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <MessageSquare size={28} style={{ color: 'var(--color-accent)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--color-fg)' }}>¡Hola! Soy tu asistente de liga.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>Pregúntame cualquier cosa sobre tu torneo.</p>
          </div>
        )}
        {historial.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3 text-sm"
              style={{
                background: m.role === 'user' ? 'var(--color-accent)' : m.error ? 'rgba(239,68,68,0.15)' : 'var(--color-primary)',
                color: m.role === 'user' ? '#020617' : m.error ? '#EF4444' : 'var(--color-fg)',
                border: m.role !== 'user' ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Pensando...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {!agotado && (
        <div className="px-6 pb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={send.isPending}
              className="px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-50"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg-muted)', border: '1px solid var(--color-border)' }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {agotado ? (
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-destructive)' }}>
            <p className="text-sm font-medium" style={{ color: '#EF4444' }}>Límite diario alcanzado. Vuelve mañana.</p>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              disabled={send.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || send.isPending || !ligaId}
              className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
              style={{ background: 'var(--color-accent)' }}
              aria-label="Enviar"
            >
              {send.isPending ? <Loader2 size={18} className="animate-spin" style={{ color: '#020617' }} /> : <Send size={18} style={{ color: '#020617' }} />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
