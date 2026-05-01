import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Plus, Trophy, Share2, Edit, ExternalLink, GripVertical, Copy, Image, X, Upload, Trash2 } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Modal from '../components/ui/Modal'
import { estadoBadge } from '../components/ui/Badge'
import client from '../api/client'

const DIAS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']
const CRITERIOS_OPCIONES = ['diferencia_goles','goles_favor','menos_goles_contra','enfrentamiento_directo','tarjetas']
const CRITERIOS_LABELS = {
  diferencia_goles: 'Diferencia de goles',
  goles_favor: 'Goles a favor',
  menos_goles_contra: 'Menos goles en contra',
  enfrentamiento_directo: 'Enfrentamiento directo',
  tarjetas: 'Menos tarjetas',
}

function SortableItem({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-2 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: 'var(--color-secondary)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-fg)',
      }}
    >
      <GripVertical size={16} style={{ color: 'var(--color-fg-muted)' }} />
      <span className="text-sm">{label}</span>
    </div>
  )
}

const DEFAULT_FORM = {
  nombre: '', estado: 'activa', descripcion: '',
  dias_juego: [], hora_inicio: '09:00', hora_fin: '22:00', duracion_partido: 60,
  num_canchas: 1, num_jornadas: 10, max_equipos_fijos: 0,
  cuota_inscripcion: 0, costo_arbitraje: 0, pago_fijo: 0,
  tiene_liguilla: false,
  criterios_desempate: ['diferencia_goles','goles_favor','menos_goles_contra'],
  reglamento: '',
}

async function compressImage(file, maxDim = 900, quality = 0.82) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function LigasPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [shareModal, setShareModal] = useState(null)
  const [galeriaModal, setGaleriaModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [galeriaFotos, setGaleriaFotos] = useState([])
  const [galeriaLoading, setGaleriaLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  const { data: ligas = [], isLoading } = useQuery({
    queryKey: ['ligas'],
    queryFn: () => client.get('/ligas').then(r => r.data),
  })

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')

  const clonar = useMutation({
    mutationFn: id => client.post(`/ligas/${id}/clonar`),
    onSuccess: () => { qc.invalidateQueries(['ligas']); toast.success('Liga clonada') },
    onError: err => toast.error(err.response?.data?.error || 'Error al clonar'),
  })

  const eliminar = useMutation({
    mutationFn: ({ id, password }) => client.delete(`/ligas/${id}`, { data: { password } }),
    onSuccess: () => {
      qc.invalidateQueries(['ligas'])
      toast.success('Liga eliminada')
      setDeleteConfirm(null)
      setDeletePassword('')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  async function openGaleria(liga) {
    setGaleriaModal(liga)
    setGaleriaLoading(true)
    try {
      const { data } = await client.get(`/ligas/${liga._id}/galeria`)
      setGaleriaFotos(data.galeria || [])
    } catch { setGaleriaFotos([]) }
    setGaleriaLoading(false)
  }

  async function handleUploadFotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      try {
        const imagen = await compressImage(file)
        await client.post(`/ligas/${galeriaModal._id}/galeria`, { imagen })
        setGaleriaFotos(prev => [...prev, imagen])
      } catch (err) {
        toast.error(err.response?.data?.error || 'Error subiendo foto')
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDeleteFoto(idx) {
    try {
      await client.delete(`/ligas/${galeriaModal._id}/galeria/${idx}`)
      setGaleriaFotos(prev => prev.filter((_, i) => i !== idx))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar')
    }
  }

  const save = useMutation({
    mutationFn: data => editId
      ? client.put(`/ligas/${editId}`, data)
      : client.post('/ligas', data),
    onSuccess: () => {
      qc.invalidateQueries(['ligas'])
      setModalOpen(false)
      toast.success(editId ? 'Liga actualizada' : 'Liga creada')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al guardar'),
  })

  function openCreate() {
    setEditId(null)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  function openEdit(liga) {
    setEditId(liga._id)
    setForm({
      nombre: liga.nombre || '',
      estado: liga.estado || 'activa',
      descripcion: liga.descripcion || '',
      dias_juego: liga.configuracion?.dias_juego || [],
      hora_inicio: liga.configuracion?.hora_inicio || '09:00',
      hora_fin: liga.configuracion?.hora_fin || '22:00',
      duracion_partido: liga.configuracion?.duracion_partido || 60,
      num_canchas: liga.configuracion?.num_canchas || 1,
      num_jornadas: liga.configuracion?.num_jornadas || 10,
      max_equipos_fijos: liga.configuracion?.max_equipos_fijos || 0,
      cuota_inscripcion: liga.configuracion?.cuota_inscripcion || 0,
      costo_arbitraje: liga.configuracion?.costo_arbitraje || 0,
      pago_fijo: liga.configuracion?.pago_fijo_temporada || 0,
      tiene_liguilla: liga.configuracion?.liguilla?.activa || false,
      criterios_desempate: liga.configuracion?.criterios_desempate || DEFAULT_FORM.criterios_desempate,
      reglamento: liga.reglamento || '',
    })
    setModalOpen(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    save.mutate({
      nombre: form.nombre,
      estado: form.estado,
      descripcion: form.descripcion,
      configuracion: {
        dias_juego: form.dias_juego,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        duracion_partido: Number(form.duracion_partido),
        num_canchas: Number(form.num_canchas),
        num_jornadas: Number(form.num_jornadas),
        max_equipos_fijos: Number(form.max_equipos_fijos),
        cuota_inscripcion: Number(form.cuota_inscripcion),
        costo_arbitraje: Number(form.costo_arbitraje),
        pago_fijo_temporada: Number(form.pago_fijo),
        liguilla: { activa: form.tiene_liguilla },
        criterios_desempate: form.criterios_desempate,
      },
      reglamento: form.reglamento,
    })
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = form.criterios_desempate.indexOf(active.id)
      const newIndex = form.criterios_desempate.indexOf(over.id)
      setForm(f => ({ ...f, criterios_desempate: arrayMove(f.criterios_desempate, oldIndex, newIndex) }))
    }
  }

  function getShareUrl(liga) {
    const base = window.location.origin + '/liga-manager-pro'
    return `${base}/${liga.admin_username}/${liga.slug}`
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            MIS LIGAS
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>{ligas.length} liga(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
          data-tour="ligas"
        >
          <Plus size={16} /> Nueva liga
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : ligas.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={48} className="mx-auto mb-4" style={{ color: 'var(--color-fg-muted)' }} />
          <p style={{ color: 'var(--color-fg-muted)' }}>No tienes ligas. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ligas.map(liga => (
            <div
              key={liga._id}
              className="rounded-2xl p-5 glow-card flex items-center gap-4"
              style={{ background: 'var(--color-primary)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.1)' }}
              >
                {liga.logo ? (
                  <img src={liga.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <Trophy size={22} style={{ color: 'var(--color-accent)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold truncate" style={{ color: 'var(--color-fg)' }}>{liga.nombre}</p>
                  {estadoBadge(liga.estado)}
                </div>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>/{liga.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareModal(liga)}
                  className="p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                  style={{ color: 'var(--color-fg-muted)' }}
                  aria-label="Compartir liga"
                >
                  <Share2 size={18} />
                </button>
                <button
                  onClick={() => openGaleria(liga)}
                  className="p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                  style={{ color: 'var(--color-fg-muted)' }}
                  aria-label="Galería de fotos"
                >
                  <Image size={18} />
                </button>
                <button
                  onClick={() => clonar.mutate(liga._id)}
                  disabled={clonar.isPending}
                  className="p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
                  style={{ color: 'var(--color-fg-muted)' }}
                  aria-label="Clonar liga"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => openEdit(liga)}
                  className="p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                  style={{ color: 'var(--color-fg-muted)' }}
                  aria-label="Editar liga"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(liga)}
                  className="p-2 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer"
                  style={{ color: 'var(--color-destructive)' }}
                  aria-label="Eliminar liga"
                >
                  <Trash2 size={18} />
                </button>
                <Link
                  to={`/dashboard/equipos/${liga._id}`}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                  style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}
                >
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'EDITAR LIGA' : 'NUEVA LIGA'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Nombre *</label>
              <input
                required
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                {['activa','pausada','finalizada','archivada'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Jornadas</label>
              <input
                type="number" min="1"
                value={form.num_jornadas}
                onChange={e => setForm(f => ({ ...f, num_jornadas: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Hora inicio</label>
              <input
                type="time"
                value={form.hora_inicio}
                onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Hora fin</label>
              <input
                type="time"
                value={form.hora_fin}
                onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Duración partido (min)</label>
              <input
                type="number" min="15"
                value={form.duracion_partido}
                onChange={e => setForm(f => ({ ...f, duracion_partido: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Canchas</label>
              <input
                type="number" min="1"
                value={form.num_canchas}
                onChange={e => setForm(f => ({ ...f, num_canchas: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
          </div>

          {/* Días de juego */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-fg-muted)' }}>Días de juego</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(dia => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    dias_juego: f.dias_juego.includes(dia) ? f.dias_juego.filter(d => d !== dia) : [...f.dias_juego, dia]
                  }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize"
                  style={{
                    background: form.dias_juego.includes(dia) ? 'var(--color-accent)' : 'var(--color-secondary)',
                    color: form.dias_juego.includes(dia) ? '#020617' : 'var(--color-fg-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          {/* Cuotas */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'cuota_inscripcion', label: 'Inscripción ($)' },
              { key: 'costo_arbitraje', label: 'Arbitraje ($)' },
              { key: 'pago_fijo', label: 'Pago fijo ($)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
                <input
                  type="number" min="0"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                />
              </div>
            ))}
          </div>

          {/* Liguilla toggle */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>Fase de liguilla</p>
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Playoffs al finalizar la fase regular</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, tiene_liguilla: !f.tiene_liguilla }))}
              className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${form.tiene_liguilla ? 'bg-green-500' : 'bg-slate-600'}`}
              aria-checked={form.tiene_liguilla}
              role="switch"
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${form.tiene_liguilla ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ background: '#fff' }} />
            </button>
          </div>

          {/* Criterios desempate drag */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-fg-muted)' }}>
              Criterios de desempate (arrastra para reordenar)
            </label>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={form.criterios_desempate} strategy={verticalListSortingStrategy}>
                {form.criterios_desempate.map(id => (
                  <SortableItem key={id} id={id} label={CRITERIOS_LABELS[id] || id} />
                ))}
              </SortableContext>
            </DndContext>
            <div className="flex flex-wrap gap-2 mt-2">
              {CRITERIOS_OPCIONES.filter(c => !form.criterios_desempate.includes(c)).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, criterios_desempate: [...f.criterios_desempate, c] }))}
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  style={{ background: 'var(--color-muted)', color: 'var(--color-fg-muted)', border: '1px dashed var(--color-border)' }}
                >
                  + {CRITERIOS_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Reglamento */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>
              Reglamento de la liga <span style={{ color: 'var(--color-fg-muted)', fontWeight: 400 }}>(visible en la página pública)</span>
            </label>
            <textarea
              rows={5}
              value={form.reglamento}
              onChange={e => setForm(f => ({ ...f, reglamento: e.target.value }))}
              placeholder="Escribe las reglas, sanciones y normas del torneo..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-y"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)', minHeight: 80 }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {save.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear liga'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Galería modal */}
      <Modal open={!!galeriaModal} onClose={() => setGaleriaModal(null)} title="GALERÍA DE FOTOS" size="lg">
        {galeriaModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
                {galeriaFotos.length}/20 fotos · Visible en la página pública cuando haya al menos 1 foto
              </p>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                style={{ background: 'var(--color-accent)', color: '#020617' }}>
                <Upload size={14} />
                {uploading ? 'Subiendo...' : 'Subir fotos'}
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadFotos} disabled={uploading} />
              </label>
            </div>

            {galeriaLoading ? (
              <div className="py-12 text-center text-sm" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
            ) : galeriaFotos.length === 0 ? (
              <div className="py-12 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
                <Image size={36} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
                <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Sin fotos aún. Sube la primera foto.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {galeriaFotos.map((src, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteFoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      style={{ background: '#EF4444', color: '#fff' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => { setDeleteConfirm(null); setDeletePassword('') }}
        title="ELIMINAR LIGA"
        size="sm"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
              ¿Eliminar <span className="font-semibold" style={{ color: 'var(--color-fg)' }}>{deleteConfirm.nombre}</span>?
              Esta acción no se puede deshacer y eliminará todos los equipos, jornadas y cobros asociados.
            </p>
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-destructive)' }}>
                Confirma con tu contraseña para continuar
              </p>
              <input
                type="password"
                placeholder="Tu contraseña"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirm(null); setDeletePassword('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminar.mutate({ id: deleteConfirm._id, password: deletePassword })}
                disabled={eliminar.isPending || !deletePassword}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--color-destructive)', color: '#fff' }}
              >
                {eliminar.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Share modal */}
      <Modal open={!!shareModal} onClose={() => setShareModal(null)} title="COMPARTIR LIGA" size="sm">
        {shareModal && (
          <div className="space-y-4">
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'var(--color-secondary)' }}>
              <ExternalLink size={16} style={{ color: 'var(--color-fg-muted)' }} />
              <span className="text-sm flex-1 truncate" style={{ color: 'var(--color-fg)' }}>
                {getShareUrl(shareModal)}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getShareUrl(shareModal))
                  toast.success('Link copiado')
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
                style={{ background: 'var(--color-accent)', color: '#020617' }}
              >
                Copiar
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(getShareUrl(shareModal))}`, color: '#25D366' },
                { label: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl(shareModal))}`, color: '#1877F2' },
                { label: 'Instagram', url: '#', color: '#E1306C' },
              ].map(({ label, url, color }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 rounded-xl text-sm font-medium text-center cursor-pointer"
                  style={{ background: color + '22', color }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
