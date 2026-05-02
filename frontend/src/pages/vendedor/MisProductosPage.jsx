import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Package, Plus, Pencil, Trash2, X, Loader2, Image } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import client from '../../api/client'

const emptyForm = { nombre: '', descripcion: '', precio: '', categoria: '', activo: true }

export default function MisProductosPage() {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [modal, setModal] = useState(null) // null | 'crear' | producto
  const [form, setForm] = useState(emptyForm)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['mis-productos'],
    queryFn: () => client.get('/productos/mis-productos').then(r => r.data),
  })

  const productos = data?.productos || []

  function openCrear() {
    setForm(emptyForm)
    setImgFile(null)
    setImgPreview(null)
    setModal('crear')
  }

  function openEditar(p) {
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: String(p.precio),
      categoria: p.categoria || '',
      activo: p.activo,
    })
    setImgFile(null)
    setImgPreview(p.imagen || null)
    setModal(p)
  }

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const crear = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imgFile) fd.append('imagen', imgFile)
      return client.post('/productos', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries(['mis-productos'])
      setModal(null)
      toast.success('Producto creado')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al crear'),
  })

  const editar = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imgFile) fd.append('imagen', imgFile)
      return client.put(`/productos/${modal._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries(['mis-productos'])
      setModal(null)
      toast.success('Producto actualizado')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al actualizar'),
  })

  const eliminar = useMutation({
    mutationFn: id => client.delete(`/productos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['mis-productos'])
      setDeleteConfirm(null)
      toast.success('Producto eliminado')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  const isEditing = modal && modal !== 'crear'
  const isPending = crear.isPending || editar.isPending

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package size={22} style={{ color: 'var(--color-accent)' }} />
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            MIS PRODUCTOS
          </h1>
        </div>
        <button
          onClick={openCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center" style={{ color: 'var(--color-fg-muted)' }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-2" />
          Cargando...
        </div>
      ) : productos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
          <Package size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
          <p className="font-medium" style={{ color: 'var(--color-fg-muted)' }}>Sin productos</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)', opacity: 0.7 }}>
            Agrega tu primer producto para que los equipos lo vean.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map(p => (
            <div key={p._id} className="rounded-2xl overflow-hidden glow-card" style={{ background: 'var(--color-primary)' }}>
              {p.imagen ? (
                <img src={p.imagen} alt={p.nombre} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 flex items-center justify-center"
                  style={{ background: 'var(--color-secondary)' }}>
                  <Package size={36} style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--color-fg)' }}>{p.nombre}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: p.activo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: p.activo ? '#22C55E' : '#EF4444',
                    }}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {p.categoria && (
                  <p className="text-xs mb-2" style={{ color: 'var(--color-fg-muted)' }}>{p.categoria}</p>
                )}
                <p className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
                  ${Number(p.precio).toLocaleString('es-MX')}
                </p>
                {p.descripcion && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-fg-muted)' }}>{p.descripcion}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEditar(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => setDeleteConfirm(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={isEditing ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
        size="sm"
      >
        <div className="space-y-4">
          {/* Image */}
          <div>
            {imgPreview ? (
              <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 200 }}>
                <img src={imgPreview} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} />
                {imgFile && (
                  <button type="button" onClick={() => { setImgFile(null); setImgPreview(isEditing ? (modal.imagen || null) : null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-28 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer"
                style={{ border: '2px dashed var(--color-border)', color: 'var(--color-fg-muted)' }}>
                <Image size={24} />
                <span className="text-xs">Agregar imagen</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
            {!imgPreview && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs cursor-pointer"
                style={{ color: 'var(--color-accent)' }}>
                {imgPreview ? 'Cambiar imagen' : ''}
              </button>
            )}
            {imgPreview && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs cursor-pointer"
                style={{ color: 'var(--color-accent)' }}>
                Cambiar imagen
              </button>
            )}
          </div>

          {[
            { key: 'nombre', label: 'Nombre *', placeholder: 'Ej: Jersey personalizado' },
            { key: 'precio', label: 'Precio *', placeholder: 'Ej: 350', type: 'number' },
            { key: 'categoria', label: 'Categoría', placeholder: 'Ej: Uniformes' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              maxLength={500}
              placeholder="Descripción del producto..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
          </div>

          {isEditing && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--color-fg)' }}>Producto activo (visible en marketplace)</span>
            </label>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => isEditing ? editar.mutate() : crear.mutate()}
              disabled={isPending || !form.nombre || !form.precio}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? 'Guardar' : 'Crear Producto'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="ELIMINAR PRODUCTO" size="sm">
        {deleteConfirm && (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: 'var(--color-fg)' }}>
              ¿Eliminar <strong>{deleteConfirm.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminar.mutate(deleteConfirm._id)}
                disabled={eliminar.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: '#EF4444', color: '#fff' }}
              >
                {eliminar.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
