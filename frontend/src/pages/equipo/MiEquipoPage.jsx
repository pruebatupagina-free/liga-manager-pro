import { useState, useRef } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Shield, Edit2, Camera, ExternalLink, Users, CreditCard, Trophy } from 'lucide-react'
import client from '../../api/client'

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl p-4 text-center glow-card" style={{ background: 'var(--color-primary)' }}>
      <p className="font-display text-3xl" style={{ color: color || 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
        {value ?? '—'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-fg-muted)' }}>{label}</p>
    </div>
  )
}

export default function MiEquipoPage() {
  const { equipo, liga, cobros } = useOutletContext()
  const qc = useQueryClient()
  const fileRef = useRef()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  function startEdit() {
    setForm({
      nombre: equipo.nombre,
      color_principal: equipo.color_principal || '#22C55E',
      whatsapp: equipo.whatsapp || '',
    })
    setEditing(true)
  }

  const save = useMutation({
    mutationFn: data => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v) })
      return client.put(`/equipos/${equipo._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries(['mi-equipo'])
      toast.success('Equipo actualizado')
      setEditing(false)
      setForm(null)
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al guardar'),
  })

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    save.mutate({ logo: file })
  }

  function handleSave(e) {
    e.preventDefault()
    save.mutate(form)
  }

  if (!equipo) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p style={{ color: 'var(--color-fg-muted)' }}>Cargando...</p>
      </div>
    )
  }

  const publicUrl = liga
    ? `${window.location.origin}/liga-manager-pro/${liga.admin_username}/${liga.slug}/equipo/${equipo.slug}`
    : null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
          MI EQUIPO
        </h1>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
            style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)', border: '1px solid var(--color-border)' }}
          >
            <Edit2 size={15} /> Editar
          </button>
        )}
      </div>

      {/* Equipo card */}
      <div className="rounded-2xl p-6 glow-card" style={{ background: 'var(--color-primary)' }}>
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ background: equipo.color_principal || 'var(--color-accent)', border: '2px solid var(--color-border)' }}
            >
              {equipo.logo ? (
                <img src={equipo.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Shield size={32} style={{ color: '#fff' }} />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
              title="Cambiar logo"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          {/* Info / Edit form */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-3">
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                  placeholder="Nombre del equipo"
                />
                <div className="flex gap-2">
                  <input
                    value={form.whatsapp}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                    placeholder="WhatsApp (ej: 8111234567)"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Color</span>
                    <input
                      type="color"
                      value={form.color_principal}
                      onChange={e => setForm(f => ({ ...f, color_principal: e.target.value }))}
                      className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditing(false); setForm(null) }}
                    className="flex-1 py-2 rounded-xl text-sm cursor-pointer"
                    style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={save.isPending}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                    style={{ background: 'var(--color-accent)', color: '#020617' }}>
                    {save.isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="font-display text-2xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
                  {equipo.nombre}
                </h2>
                {liga && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                    <Trophy size={13} className="inline mr-1" />{liga.nombre}
                  </p>
                )}
                {equipo.whatsapp && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                    WhatsApp: {equipo.whatsapp}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full border" style={{ background: equipo.color_principal || '#22C55E', borderColor: 'var(--color-border)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{equipo.color_principal || '#22C55E'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Página pública */}
        {publicUrl && !editing && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 text-sm transition-all hover:opacity-80"
            style={{ color: 'var(--color-accent)' }}>
            <ExternalLink size={14} /> Ver página pública del equipo
          </a>
        )}
      </div>

      {/* Stats */}
      {cobros !== null && (
        <div>
          <h2 className="font-display text-xl mb-3" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            RESUMEN DE PAGOS
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total adeudado" value={cobros ? `$${cobros.total_deuda}` : '—'} color="var(--color-destructive)" />
            <StatCard label="Arbitrajes pend." value={cobros ? `$${cobros.arbitrajes.pendiente}` : '—'} color="var(--color-warning)" />
            <StatCard label="Inscripción pend." value={cobros ? `$${cobros.inscripcion.pendiente}` : '—'} />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/mi-equipo/jugadores"
          className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer glow-card"
          style={{ background: 'var(--color-primary)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <Users size={20} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>Jugadores</p>
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Gestionar plantilla</p>
          </div>
        </Link>
        <Link to="/mi-equipo/pagos"
          className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer glow-card"
          style={{ background: 'var(--color-primary)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <CreditCard size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>Pagos</p>
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Ver estado de cuenta</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
