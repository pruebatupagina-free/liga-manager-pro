import { useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Plus, Edit2, Trash2, UserCircle, Camera, X } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import client from '../../api/client'

const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero']

const DEFAULT_FORM = { nombre: '', numero_camiseta: '', posicion: 'Delantero' }

function Avatar({ jugador }) {
  if (jugador.foto) return <img src={jugador.foto} alt="" className="w-10 h-10 rounded-xl object-cover" />
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
      <UserCircle size={22} style={{ color: 'var(--color-fg-muted)' }} />
    </div>
  )
}

export default function MiJugadoresPage() {
  const { equipo } = useOutletContext()
  const qc = useQueryClient()
  const fileRef = useRef()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const equipoId = equipo?._id

  const { data: jugadores = [], isLoading } = useQuery({
    queryKey: ['mi-jugadores', equipoId],
    queryFn: () => client.get(`/jugadores?equipo_id=${equipoId}`).then(r => r.data),
    enabled: !!equipoId,
  })

  const save = useMutation({
    mutationFn: data => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v) })
      if (fotoFile) fd.append('foto', fotoFile)
      return editId
        ? client.put(`/jugadores/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : client.post('/jugadores', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries(['mi-jugadores', equipoId])
      toast.success(editId ? 'Jugador actualizado' : 'Jugador agregado')
      closeModal()
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al guardar'),
  })

  const remove = useMutation({
    mutationFn: id => client.delete(`/jugadores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['mi-jugadores', equipoId])
      toast.success('Jugador eliminado')
      setDeleteConfirm(null)
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  function openCreate() {
    setEditId(null)
    setForm(DEFAULT_FORM)
    setFotoFile(null)
    setFotoPreview(null)
    setModalOpen(true)
  }

  function openEdit(j) {
    setEditId(j._id)
    setForm({ nombre: j.nombre, numero_camiseta: j.numero_camiseta ?? '', posicion: j.posicion || 'Delantero' })
    setFotoFile(null)
    setFotoPreview(j.foto || null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditId(null)
    setForm(DEFAULT_FORM)
    setFotoFile(null)
    setFotoPreview(null)
  }

  function handleFotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e) {
    e.preventDefault()
    save.mutate({ ...form, equipo_id: equipoId })
  }

  const activos = jugadores.filter(j => j.activo !== false)
  const inactivos = jugadores.filter(j => j.activo === false)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            JUGADORES
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            {activos.length}/30 activos
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={activos.length >= 30}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : jugadores.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
          <UserCircle size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
          <p style={{ color: 'var(--color-fg-muted)' }}>No hay jugadores. ¡Agrega el primero!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activos.map(j => (
            <div key={j._id} className="rounded-2xl p-4 flex items-center gap-3 glow-card"
              style={{ background: 'var(--color-primary)' }}>
              <Avatar jugador={j} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>{j.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                  {j.numero_camiseta ? `#${j.numero_camiseta} · ` : ''}{j.posicion || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(j)}
                  className="p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-all"
                  style={{ color: 'var(--color-fg-muted)' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirm(j)}
                  className="p-2 rounded-xl cursor-pointer hover:bg-red-500/10 transition-all"
                  style={{ color: 'var(--color-destructive)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {inactivos.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium mb-2 px-1" style={{ color: 'var(--color-fg-muted)' }}>INACTIVOS</p>
              {inactivos.map(j => (
                <div key={j._id} className="rounded-2xl p-4 flex items-center gap-3 mb-2"
                  style={{ background: 'var(--color-primary)', opacity: 0.5, border: '1px solid var(--color-border)' }}>
                  <Avatar jugador={j} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through" style={{ color: 'var(--color-fg)' }}>{j.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      {j.numero_camiseta ? `#${j.numero_camiseta} · ` : ''}{j.posicion || '—'}
                    </p>
                  </div>
                  <button onClick={() => openEdit(j)}
                    className="p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-all"
                    style={{ color: 'var(--color-fg-muted)' }}>
                    <Edit2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editId ? 'EDITAR JUGADOR' : 'NUEVO JUGADOR'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                {fotoPreview ? (
                  <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={36} style={{ color: 'var(--color-fg-muted)' }} />
                )}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'var(--color-accent)', color: '#020617' }}>
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Nombre *</label>
            <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}># Camiseta</label>
              <input type="number" min="1" max="99" value={form.numero_camiseta}
                onChange={e => setForm(f => ({ ...f, numero_camiseta: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Posición</label>
              <select value={form.posicion} onChange={e => setForm(f => ({ ...f, posicion: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}>
                {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {editId && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-fg)' }}>Jugador activo</p>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, activo: f.activo === false ? true : false }))}
                className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${form.activo === false ? 'bg-slate-600' : 'bg-green-500'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.activo === false ? 'translate-x-0.5' : 'translate-x-6'}`} />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={save.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}>
              {save.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="ELIMINAR JUGADOR" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
              ¿Eliminar a <span className="font-semibold" style={{ color: 'var(--color-fg)' }}>{deleteConfirm.nombre}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
                Cancelar
              </button>
              <button onClick={() => remove.mutate(deleteConfirm._id)} disabled={remove.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: 'var(--color-destructive)', color: '#fff' }}>
                {remove.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
