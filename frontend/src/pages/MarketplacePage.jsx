import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ShoppingBag, Package, MessageCircle, Loader2, X, Send } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'

function VendedorCard({ vendedor, onContact }) {
  const n = vendedor.negocio || {}
  return (
    <div className="rounded-2xl p-4 glow-card" style={{ background: 'var(--color-primary)' }}>
      <div className="flex items-center gap-3 mb-3">
        {n.logo ? (
          <img src={n.logo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-accent)' }}>
            <ShoppingBag size={20} style={{ color: '#020617' }} />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>
            {n.nombre || vendedor.nombre}
          </p>
          {n.categoria && (
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{n.categoria}</p>
          )}
        </div>
      </div>
      {n.descripcion && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-fg-muted)' }}>{n.descripcion}</p>
      )}
      <button
        onClick={() => onContact(vendedor)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold cursor-pointer"
        style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-accent)' }}
      >
        <MessageCircle size={14} /> Contactar
      </button>
    </div>
  )
}

function ProductoCard({ producto, onContact }) {
  return (
    <div className="rounded-2xl overflow-hidden glow-card" style={{ background: 'var(--color-primary)' }}>
      {producto.imagen ? (
        <img src={producto.imagen} alt={producto.nombre} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 flex items-center justify-center"
          style={{ background: 'var(--color-secondary)' }}>
          <Package size={32} style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
        </div>
      )}
      <div className="p-4">
        <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-fg)' }}>{producto.nombre}</p>
        {producto.categoria && (
          <p className="text-xs mb-1" style={{ color: 'var(--color-fg-muted)' }}>{producto.categoria}</p>
        )}
        <p className="font-bold text-base mb-2" style={{ color: 'var(--color-accent)' }}>
          ${Number(producto.precio).toLocaleString('es-MX')}
        </p>
        {producto.descripcion && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-fg-muted)' }}>{producto.descripcion}</p>
        )}
        <p className="text-xs mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.7 }}>
          Vendedor: {producto.vendedor?.negocio?.nombre || producto.vendedor?.nombre || '—'}
        </p>
        <button
          onClick={() => onContact(producto.vendedor)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-accent)' }}
        >
          <MessageCircle size={14} /> Preguntar
        </button>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const params = useParams()
  const context = useOutletContext() || {}
  const { user } = useAuth()
  const qc = useQueryClient()

  const ligaId = params.liga_id || context?.equipo?.liga_id
  const [tab, setTab] = useState('productos')
  const [contactModal, setContactModal] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', ligaId],
    queryFn: () => client.get(`/productos/marketplace?liga_id=${ligaId}`).then(r => r.data),
    enabled: !!ligaId,
  })

  const productos = data?.productos || []
  const vendedores = data?.vendedores || []

  const sendMsg = useMutation({
    mutationFn: () => client.post('/mensajes', {
      liga_id: ligaId,
      vendedor_id: contactModal._id,
      texto: mensaje.trim(),
    }),
    onSuccess: ({ data: d }) => {
      toast.success('Mensaje enviado')
      setContactModal(null)
      setMensaje('')
      qc.invalidateQueries(['conversaciones'])
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al enviar'),
  })

  if (!ligaId) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--color-fg-muted)' }}>
        Selecciona una liga para ver el marketplace.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <ShoppingBag size={22} style={{ color: 'var(--color-accent)' }} />
        <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
          MARKETPLACE
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'productos', label: 'Productos' },
          { key: 'vendedores', label: 'Vendedores' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all"
            style={{
              background: tab === t.key ? 'var(--color-accent)' : 'var(--color-primary)',
              color: tab === t.key ? '#020617' : 'var(--color-fg-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center" style={{ color: 'var(--color-fg-muted)' }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-2" />
          Cargando marketplace...
        </div>
      ) : tab === 'productos' ? (
        productos.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
            <Package size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
            <p className="font-medium" style={{ color: 'var(--color-fg-muted)' }}>Sin productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map(p => (
              <ProductoCard key={p._id} producto={p} onContact={setContactModal} />
            ))}
          </div>
        )
      ) : (
        vendedores.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
            <ShoppingBag size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
            <p className="font-medium" style={{ color: 'var(--color-fg-muted)' }}>Sin vendedores en esta liga</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendedores.map(v => (
              <VendedorCard key={v._id} vendedor={v} onContact={setContactModal} />
            ))}
          </div>
        )
      )}

      {/* Contact modal */}
      <Modal open={!!contactModal} onClose={() => { setContactModal(null); setMensaje('') }} title="ENVIAR MENSAJE" size="sm">
        {contactModal && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-fg)' }}>
              Contactando a <strong>{contactModal.negocio?.nombre || contactModal.nombre}</strong>
            </p>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Escribe tu pregunta o mensaje..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setContactModal(null); setMensaje('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => sendMsg.mutate()}
                disabled={!mensaje.trim() || sendMsg.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'var(--color-accent)', color: '#020617' }}
              >
                {sendMsg.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
