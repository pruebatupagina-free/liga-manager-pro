import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Plus, User, Edit, Trash2, Upload } from 'lucide-react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import Modal from '../components/ui/Modal'
import client from '../api/client'

const POSICIONES = ['Portero','Defensa','Mediocampista','Delantero','Sin posición']

const DEFAULT_FORM = { nombre: '', numero_camiseta: '', posicion: 'Sin posición' }

function getCroppedBlob(imgEl, crop) {
  const canvas = document.createElement('canvas')
  const scaleX = imgEl.naturalWidth / imgEl.width
  const scaleY = imgEl.naturalHeight / imgEl.height
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    imgEl,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, 200, 200
  )
  return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85))
}

export default function JugadoresPage() {
  const { equipo_id } = useParams()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 1 })
  const [cropModal, setCropModal] = useState(false)
  const imgRef = useRef(null)
  const [croppedBlob, setCroppedBlob] = useState(null)

  const { data: equipo } = useQuery({
    queryKey: ['equipo', equipo_id],
    queryFn: () => client.get(`/equipos/${equipo_id}`).then(r => r.data),
  })

  const { data: jugadores = [], isLoading } = useQuery({
    queryKey: ['jugadores', equipo_id],
    queryFn: () => client.get('/jugadores', { params: { equipo_id } }).then(r => r.data),
  })

  const save = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.append(k, v))
      if (croppedBlob) fd.append('foto', croppedBlob, 'foto.jpg')
      return editId
        ? client.put(`/jugadores/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : client.post('/jugadores', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { qc.invalidateQueries(['jugadores', equipo_id]); setModal(false); toast.success(editId ? 'Jugador actualizado' : 'Jugador agregado') },
    onError: err => toast.error(err.response?.data?.error || 'Error al guardar'),
  })

  const del = useMutation({
    mutationFn: id => client.delete(`/jugadores/${id}`),
    onSuccess: () => { qc.invalidateQueries(['jugadores', equipo_id]); toast.success('Jugador eliminado') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  function openCreate() {
    setEditId(null)
    setForm(DEFAULT_FORM)
    setImgSrc('')
    setCroppedBlob(null)
    setModal(true)
  }

  function openEdit(j) {
    setEditId(j._id)
    setForm({ nombre: j.nombre, numero_camiseta: j.numero_camiseta || '', posicion: j.posicion || 'Sin posición' })
    setImgSrc('')
    setCroppedBlob(null)
    setModal(true)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setImgSrc(reader.result); setCropModal(true) }
    reader.readAsDataURL(file)
  }

  async function handleCropConfirm() {
    if (!imgRef.current) return
    const blob = await getCroppedBlob(imgRef.current, crop)
    setCroppedBlob(blob)
    setCropModal(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const num = parseInt(form.numero_camiseta)
    if (form.numero_camiseta && (isNaN(num) || num < 1 || num > 99)) {
      return toast.error('Número entre 1 y 99')
    }
    save.mutate({ ...form, equipo_id })
  }

  const count = jugadores.length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            JUGADORES
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{equipo?.nombre}</p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: count >= 30 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                color: count >= 30 ? '#EF4444' : '#22C55E',
              }}
            >
              {count}/30 jugadores
            </span>
          </div>
        </div>
        <button
          onClick={openCreate}
          disabled={count >= 30}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : jugadores.length === 0 ? (
        <div className="text-center py-20">
          <User size={48} className="mx-auto mb-4" style={{ color: 'var(--color-fg-muted)' }} />
          <p style={{ color: 'var(--color-fg-muted)' }}>Sin jugadores. Agrega el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {jugadores.map(j => (
            <div
              key={j._id}
              className="rounded-2xl p-4 text-center glow-card group relative"
              style={{ background: 'var(--color-primary)' }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden"
                style={{ background: 'var(--color-secondary)', border: '2px solid var(--color-border)' }}
              >
                {j.foto ? (
                  <img src={j.foto} alt={j.nombre} className="w-full h-full object-cover" />
                ) : (
                  <User size={28} style={{ color: 'var(--color-fg-muted)' }} />
                )}
              </div>
              {j.numero_camiseta && (
                <div
                  className="absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--color-accent)', color: '#020617' }}
                >
                  {j.numero_camiseta}
                </div>
              )}
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-fg)' }}>{j.nombre}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>{j.posicion}</p>
              <div className="flex justify-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer" style={{ color: 'var(--color-fg-muted)' }} aria-label="Editar"><Edit size={14} /></button>
                <button
                  onClick={() => { if (confirm(`¿Eliminar a ${j.nombre}?`)) del.mutate(j._id) }}
                  className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                  style={{ color: 'var(--color-destructive)' }}
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'EDITAR JUGADOR' : 'NUEVO JUGADOR'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Nombre *</label>
            <input
              required
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Número camiseta</label>
              <input
                type="number" min="1" max="99"
                value={form.numero_camiseta}
                onChange={e => setForm(f => ({ ...f, numero_camiseta: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Posición</label>
              <select
                value={form.posicion}
                onChange={e => setForm(f => ({ ...f, posicion: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>
              <Upload size={12} className="inline mr-1" />Foto (circular)
            </label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm cursor-pointer" style={{ color: 'var(--color-fg-muted)' }} />
            {croppedBlob && <p className="text-xs mt-1" style={{ color: 'var(--color-accent)' }}>Foto recortada lista</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button type="submit" disabled={save.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60" style={{ background: 'var(--color-accent)', color: '#020617' }}>
              {save.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Crop modal */}
      <Modal open={cropModal} onClose={() => setCropModal(false)} title="RECORTAR FOTO" size="sm">
        <div className="space-y-4">
          {imgSrc && (
            <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1} circularCrop>
              <img ref={imgRef} src={imgSrc} alt="Crop" style={{ maxHeight: '300px', width: '100%', objectFit: 'contain' }} />
            </ReactCrop>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setCropModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button type="button" onClick={handleCropConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'var(--color-accent)', color: '#020617' }}>Confirmar recorte</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
