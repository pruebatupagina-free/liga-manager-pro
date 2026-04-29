import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Plus, Users, Edit, UserX, Upload, Phone } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import client from '../api/client'

const DEFAULT_FORM = {
  nombre: '', color: '#22C55E', dia_juego: '',
  tiene_hora_fija: false, hora_fija: '',
  telefono_contacto: '', whatsapp: '',
}

const BAJA_MOTIVOS = ['Retiro voluntario', 'Falta de pago', 'Conducta', 'Otro']

function timeSlots(horaInicio, horaFin, duracion) {
  const slots = []
  const [h0, m0] = (horaInicio || '09:00').split(':').map(Number)
  const [h1, m1] = (horaFin || '22:00').split(':').map(Number)
  let mins = h0 * 60 + m0
  const end = h1 * 60 + m1
  while (mins + duracion <= end) {
    const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    slots.push({ value: fmt(mins), label: `${fmt(mins)} — ${fmt(mins + duracion)}` })
    mins += duracion
  }
  return slots
}

export default function EquiposPage() {
  const { liga_id } = useParams()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [bajaModal, setBajaModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [bajaForm, setBajaForm] = useState({ motivo: 'Retiro voluntario', motivo_otro: '', conservar_partidos: true })
  const [logoFile, setLogoFile] = useState(null)

  const { data: liga } = useQuery({
    queryKey: ['liga', liga_id],
    queryFn: () => client.get(`/ligas/${liga_id}`).then(r => r.data),
  })

  const { data: equipos = [], isLoading } = useQuery({
    queryKey: ['equipos', liga_id],
    queryFn: () => client.get('/equipos', { params: { liga_id } }).then(r => r.data),
  })

  const save = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.append(k, typeof v === 'object' ? JSON.stringify(v) : v))
      if (logoFile) fd.append('logo', logoFile)
      return editId
        ? client.put(`/equipos/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : client.post('/equipos', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { qc.invalidateQueries(['equipos', liga_id]); setModal(false); toast.success(editId ? 'Equipo actualizado' : 'Equipo creado') },
    onError: err => toast.error(err.response?.data?.error || 'Error al guardar'),
  })

  const darBaja = useMutation({
    mutationFn: ({ id, data }) => client.put(`/equipos/${id}/baja`, data),
    onSuccess: () => { qc.invalidateQueries(['equipos', liga_id]); setBajaModal(null); toast.success('Equipo dado de baja') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const cfg = liga?.configuracion
  const slots = cfg ? timeSlots(cfg.hora_inicio, cfg.hora_fin, cfg.duracion_partido || 60) : []

  function openCreate() {
    setEditId(null)
    setForm({ ...DEFAULT_FORM, dia_juego: cfg?.dias_juego?.[0] || '' })
    setLogoFile(null)
    setModal(true)
  }

  function openEdit(eq) {
    setEditId(eq._id)
    setForm({
      nombre: eq.nombre || '',
      color: eq.color || '#22C55E',
      dia_juego: eq.dia_juego || '',
      tiene_hora_fija: eq.tiene_hora_fija || false,
      hora_fija: eq.hora_fija || '',
      telefono_contacto: eq.telefono_contacto || '',
      whatsapp: eq.whatsapp || '',
    })
    setLogoFile(null)
    setModal(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    save.mutate({ ...form, liga_id })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8" data-tour="equipos">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            EQUIPOS
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            {equipos.length} equipo(s) · {liga?.nombre}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          <Plus size={16} /> Agregar equipo
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : equipos.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto mb-4" style={{ color: 'var(--color-fg-muted)' }} />
          <p style={{ color: 'var(--color-fg-muted)' }}>Sin equipos. ¡Agrega el primero!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {equipos.map(eq => (
            <div
              key={eq._id}
              className="rounded-2xl px-5 py-4 glow-card flex items-center gap-4"
              style={{
                background: 'var(--color-primary)',
                opacity: eq.baja?.activa ? 0.6 : 1,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: eq.color + '33', color: eq.color, border: `2px solid ${eq.color}` }}
              >
                {eq.logo ? (
                  <img src={eq.logo} alt={eq.nombre} className="w-8 h-8 rounded-lg object-cover" />
                ) : eq.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>{eq.nombre}</span>
                  {eq.baja?.activa && <Badge label="Baja" variant="red" />}
                  {eq.tiene_hora_fija && <Badge label={`Fija ${eq.hora_fija}`} variant="blue" />}
                </div>
                <span className="text-xs capitalize" style={{ color: 'var(--color-fg-muted)' }}>
                  {eq.dia_juego} {eq.whatsapp && `· ${eq.whatsapp}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(eq)}
                  className="p-2 rounded-xl hover:bg-white/5 cursor-pointer"
                  style={{ color: 'var(--color-fg-muted)' }}
                  aria-label="Editar"
                >
                  <Edit size={16} />
                </button>
                {!eq.baja?.activa && (
                  <button
                    onClick={() => setBajaModal(eq)}
                    className="p-2 rounded-xl hover:bg-white/5 cursor-pointer"
                    style={{ color: 'var(--color-destructive)' }}
                    aria-label="Dar de baja"
                  >
                    <UserX size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'EDITAR EQUIPO' : 'NUEVO EQUIPO'}>
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Color del equipo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-12 h-10 rounded-xl cursor-pointer border-0 p-0"
                  style={{ background: 'none' }}
                />
                <span className="text-sm font-mono" style={{ color: 'var(--color-fg-muted)' }}>{form.color}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Día de juego</label>
              <select
                value={form.dia_juego}
                onChange={e => setForm(f => ({ ...f, dia_juego: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                <option value="">Sin día fijo</option>
                {(cfg?.dias_juego || []).map(d => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hora fija */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>Hora fija de juego</p>
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Se asigna siempre al mismo slot</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, tiene_hora_fija: !f.tiene_hora_fija }))}
              className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${form.tiene_hora_fija ? 'bg-green-500' : 'bg-slate-600'}`}
              role="switch"
              aria-checked={form.tiene_hora_fija}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${form.tiene_hora_fija ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ background: '#fff' }} />
            </button>
          </div>

          {form.tiene_hora_fija && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>
                Slot de hora
                {cfg?.num_canchas > 1 && (
                  <span className="ml-2 font-normal" style={{ color: 'var(--color-accent)' }}>
                    · {cfg.num_canchas} canchas disponibles
                  </span>
                )}
              </label>
              {slots.length === 0 ? (
                <p className="text-xs px-4 py-2.5 rounded-xl" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg-muted)' }}>
                  Configura hora_inicio, hora_fin y duración en la liga para ver slots
                </p>
              ) : (
                <select
                  value={form.hora_fija}
                  onChange={e => setForm(f => ({ ...f, hora_fija: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                >
                  <option value="">Seleccionar slot</option>
                  {slots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>
                <Phone size={12} className="inline mr-1" />Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono_contacto}
                onChange={e => setForm(f => ({ ...f, telefono_contacto: e.target.value }))}
                placeholder="5512345678"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="5512345678"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>
              <Upload size={12} className="inline mr-1" />Logo (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setLogoFile(e.target.files[0])}
              className="w-full text-sm cursor-pointer"
              style={{ color: 'var(--color-fg-muted)' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button type="submit" disabled={save.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60" style={{ background: 'var(--color-accent)', color: '#020617' }}>
              {save.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Baja modal */}
      <Modal open={!!bajaModal} onClose={() => setBajaModal(null)} title="DAR DE BAJA" size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            ¿Dar de baja a <strong style={{ color: 'var(--color-fg)' }}>{bajaModal?.nombre}</strong>?
          </p>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Motivo</label>
            <select
              value={bajaForm.motivo}
              onChange={e => setBajaForm(f => ({ ...f, motivo: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            >
              {BAJA_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {bajaForm.motivo === 'Otro' && (
            <input
              placeholder="Especifica el motivo..."
              value={bajaForm.motivo_otro}
              onChange={e => setBajaForm(f => ({ ...f, motivo_otro: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
          )}
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
            <span className="text-sm" style={{ color: 'var(--color-fg)' }}>Conservar partidos jugados</span>
            <button
              type="button"
              onClick={() => setBajaForm(f => ({ ...f, conservar_partidos: !f.conservar_partidos }))}
              className={`w-12 h-6 rounded-full relative cursor-pointer ${bajaForm.conservar_partidos ? 'bg-green-500' : 'bg-slate-600'}`}
              role="switch"
              aria-checked={bajaForm.conservar_partidos}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${bajaForm.conservar_partidos ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ background: '#fff' }} />
            </button>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setBajaModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button
              type="button"
              onClick={() => darBaja.mutate({ id: bajaModal._id, data: { motivo: bajaForm.motivo === 'Otro' ? bajaForm.motivo_otro : bajaForm.motivo, conservar_partidos: bajaForm.conservar_partidos } })}
              disabled={darBaja.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-destructive)', color: '#fff' }}
            >
              {darBaja.isPending ? 'Procesando...' : 'Dar de baja'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
