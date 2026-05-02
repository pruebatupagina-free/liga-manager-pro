import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MessageCircle, Send, Loader2, Shield, ShoppingBag } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function ConvAvatar({ conv, isVendedor }) {
  const obj = isVendedor ? conv.equipo_id : conv.vendedor_id
  if (!obj) return null
  const name = isVendedor ? (obj.nombre || '?') : (obj.negocio?.nombre || obj.nombre || '?')
  const logo = isVendedor ? obj.logo : obj.negocio?.logo
  if (logo) return <img src={logo} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
  const Icon = isVendedor ? Shield : ShoppingBag
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: isVendedor ? (obj.color_principal || 'var(--color-accent)') : 'var(--color-accent)', opacity: 0.9 }}>
      <Icon size={18} style={{ color: '#fff' }} />
    </div>
  )
}

export default function MensajesPage() {
  const { user } = useAuth()
  const context = useOutletContext() || {}
  const qc = useQueryClient()
  const isVendedor = user?.rol === 'vendedor'
  const [activeConv, setActiveConv] = useState(null)
  const [texto, setTexto] = useState('')
  const bottomRef = useRef()

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => client.get('/mensajes/conversaciones').then(r => r.data),
    refetchInterval: 15000,
  })
  const conversaciones = convData?.conversaciones || []

  const { data: mensajesData, isLoading: msgLoading } = useQuery({
    queryKey: ['mensajes', activeConv?._id],
    queryFn: () => client.get(`/mensajes/${activeConv._id}`).then(r => r.data),
    enabled: !!activeConv,
    refetchInterval: 8000,
  })
  const mensajes = mensajesData?.mensajes || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes.length])

  const send = useMutation({
    mutationFn: () => client.post('/mensajes', {
      conversacion_id: activeConv._id,
      texto: texto.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['mensajes', activeConv._id])
      qc.invalidateQueries(['conversaciones'])
      setTexto('')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al enviar'),
  })

  function handleSend(e) {
    e.preventDefault()
    if (!texto.trim() || !activeConv) return
    send.mutate()
  }

  function getConvName(conv) {
    if (isVendedor) return conv.equipo_id?.nombre || 'Equipo'
    return conv.vendedor_id?.negocio?.nombre || conv.vendedor_id?.nombre || 'Vendedor'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle size={22} style={{ color: 'var(--color-accent)' }} />
        <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
          MENSAJES
        </h1>
      </div>

      <div className="flex gap-4 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', minHeight: 500 }}>
        {/* Conversations list */}
        <div className="w-72 flex-shrink-0 border-r" style={{ borderColor: 'var(--color-border)', background: 'var(--color-primary)' }}>
          {convLoading ? (
            <div className="p-4 text-center" style={{ color: 'var(--color-fg-muted)' }}>
              <Loader2 size={20} className="animate-spin mx-auto" />
            </div>
          ) : conversaciones.length === 0 ? (
            <div className="p-6 text-center" style={{ color: 'var(--color-fg-muted)' }}>
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin conversaciones</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {conversaciones.map(conv => {
                const unread = isVendedor ? conv.no_leidos_vendedor : conv.no_leidos_equipo
                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-all ${
                      activeConv?._id === conv._id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <ConvAvatar conv={conv} isVendedor={isVendedor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-fg)' }}>
                          {getConvName(conv)}
                        </p>
                        {unread > 0 && (
                          <span className="ml-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--color-accent)', color: '#020617' }}>
                            {unread}
                          </span>
                        )}
                      </div>
                      {conv.ultimo_mensaje && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                          {conv.ultimo_mensaje}
                        </p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-fg-muted)', opacity: 0.6 }}>
                        {timeAgo(conv.fecha_ultimo)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col" style={{ background: 'var(--color-bg)' }}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-fg-muted)' }}>
              <div className="text-center">
                <MessageCircle size={44} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Selecciona una conversación</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b flex items-center gap-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-primary)' }}>
                <ConvAvatar conv={activeConv} isVendedor={isVendedor} />
                <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>
                  {getConvName(activeConv)}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="text-center py-8" style={{ color: 'var(--color-fg-muted)' }}>
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  </div>
                ) : mensajes.map(m => {
                  const isOwn = (isVendedor && m.autor_tipo === 'vendedor') || (!isVendedor && m.autor_tipo === 'equipo')
                  return (
                    <div key={m._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-xs rounded-2xl px-4 py-2.5 text-sm"
                        style={{
                          background: isOwn ? 'var(--color-accent)' : 'var(--color-primary)',
                          color: isOwn ? '#020617' : 'var(--color-fg)',
                        }}
                      >
                        <p className="leading-relaxed">{m.texto}</p>
                        <p className="text-xs mt-1 opacity-60 text-right">{timeAgo(m.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t flex gap-3"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-primary)' }}>
                <input
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  maxLength={1000}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                />
                <button
                  type="submit"
                  disabled={!texto.trim() || send.isPending}
                  className="px-4 py-2.5 rounded-xl cursor-pointer disabled:opacity-40 flex items-center gap-2"
                  style={{ background: 'var(--color-accent)', color: '#020617' }}
                >
                  {send.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
