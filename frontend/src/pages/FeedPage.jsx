import { useState, useRef, useCallback } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { Heart, Trash2, Image, Send, Shield, Trophy, X, Loader2, Newspaper } from 'lucide-react'
import client from '../api/client'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function Avatar({ nombre, logo, tipo, color }) {
  if (logo) return <img src={logo} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
  const Icon = tipo === 'admin_liga' ? Trophy : Shield
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: color || 'var(--color-accent)', opacity: 0.9 }}>
      <Icon size={18} style={{ color: '#fff' }} />
    </div>
  )
}

function PostCard({ post, userId, onDelete, onLike }) {
  const liked = post.likes?.includes(userId)
  return (
    <div className="rounded-2xl p-4 glow-card animate-fade-in" style={{ background: 'var(--color-primary)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar nombre={post.autor_nombre} logo={post.autor_logo} tipo={post.autor_tipo} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>{post.autor_nombre}</p>
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {(post.autor_id === userId || post.autor_tipo === 'admin_liga') && (
          <button onClick={() => onDelete(post._id)}
            className="p-1.5 rounded-lg cursor-pointer hover:bg-red-500/10 transition-all"
            style={{ color: 'var(--color-fg-muted)' }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Texto */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3" style={{ color: 'var(--color-fg)' }}>
        {post.texto}
      </p>

      {/* Imagen */}
      {post.imagen && (
        <div className="rounded-xl overflow-hidden mb-3" style={{ maxHeight: 400 }}>
          <img src={post.imagen} alt="" className="w-full object-cover" style={{ maxHeight: 400 }} />
        </div>
      )}

      {/* Like */}
      <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => onLike(post._id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all cursor-pointer hover:bg-white/5"
          style={{ color: liked ? '#EF4444' : 'var(--color-fg-muted)' }}
        >
          <Heart size={16} fill={liked ? '#EF4444' : 'none'} />
          <span className="text-xs font-medium">{post.likes?.length || 0}</span>
        </button>
      </div>
    </div>
  )
}

export default function FeedPage({ overrideLigaId } = {}) {
  const params = useParams()
  const context = useOutletContext()
  const { user } = useAuth()
  const qc = useQueryClient()
  const fileRef = useRef()

  const ligaId = overrideLigaId || params.liga_id || context?.equipo?.liga_id
  const ligaNombre = context?.liga?.nombre

  const [texto, setTexto] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)

  const queryKey = ['posts', ligaId]

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ liga_id: ligaId })
      if (pageParam) params.set('cursor', pageParam)
      return client.get(`/posts?${params}`).then(r => r.data)
    },
    getNextPageParam: (last) => last.hasMore ? last.posts[last.posts.length - 1]?._id : undefined,
    enabled: !!ligaId,
  })

  const posts = data?.pages.flatMap(p => p.posts) ?? []

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('liga_id', ligaId)
      fd.append('texto', texto.trim())
      if (imgFile) fd.append('imagen', imgFile)
      return client.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries(queryKey)
      setTexto('')
      setImgFile(null)
      setImgPreview(null)
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al publicar'),
  })

  const remove = useMutation({
    mutationFn: id => client.delete(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries(queryKey),
    onError: err => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  const like = useMutation({
    mutationFn: id => client.put(`/posts/${id}/like`),
    onMutate: async (id) => {
      await qc.cancelQueries(queryKey)
      const prev = qc.getQueryData(queryKey)
      qc.setQueryData(queryKey, old => ({
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          posts: page.posts.map(p => {
            if (p._id !== id) return p
            const liked = p.likes?.includes(user.id)
            return { ...p, likes: liked ? p.likes.filter(l => l !== user.id) : [...(p.likes || []), user.id] }
          }),
        })),
      }))
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(queryKey, ctx.prev),
    onSettled: () => qc.invalidateQueries(queryKey),
  })

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!texto.trim()) return
    create.mutate()
  }

  if (!ligaId) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--color-fg-muted)' }}>
        Selecciona una liga para ver el feed.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Newspaper size={22} style={{ color: 'var(--color-accent)' }} />
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            FEED
          </h1>
          {ligaNombre && <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{ligaNombre}</p>}
        </div>
      </div>

      {/* Crear post */}
      <form onSubmit={handleSubmit} className="rounded-2xl p-4 glow-card space-y-3"
        style={{ background: 'var(--color-primary)' }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="¿Qué quieres compartir con tu liga?"
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
        />

        {imgPreview && (
          <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 240 }}>
            <img src={imgPreview} alt="" className="w-full object-cover" style={{ maxHeight: 240 }} />
            <button type="button" onClick={() => { setImgFile(null); setImgPreview(null) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm cursor-pointer transition-all hover:bg-white/5"
              style={{ color: 'var(--color-fg-muted)' }}>
              <Image size={16} /> Foto
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
            <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{texto.length}/1000</span>
          </div>
          <button
            type="submit"
            disabled={!texto.trim() || create.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40 transition-all"
            style={{ background: 'var(--color-accent)', color: '#020617' }}
          >
            {create.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Publicar
          </button>
        </div>
      </form>

      {/* Posts */}
      {isLoading ? (
        <div className="py-16 text-center" style={{ color: 'var(--color-fg-muted)' }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-2" />
          Cargando feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
          <Newspaper size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
          <p className="font-medium" style={{ color: 'var(--color-fg-muted)' }}>Aún no hay publicaciones</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)', opacity: 0.7 }}>
            ¡Sé el primero en publicar algo!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              userId={user?.id}
              onDelete={id => remove.mutate(id)}
              onLike={id => like.mutate(id)}
            />
          ))}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-3 rounded-2xl text-sm font-medium cursor-pointer transition-all"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg-muted)', border: '1px solid var(--color-border)' }}
            >
              {isFetchingNextPage ? 'Cargando...' : 'Ver más publicaciones'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
