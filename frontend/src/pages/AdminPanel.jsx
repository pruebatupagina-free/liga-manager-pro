import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Shield, Monitor, Smartphone, Circle } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { estadoBadge } from '../components/ui/Badge'
import client from '../api/client'

function tiempoRelativo(fecha) {
  if (!fecha) return 'Nunca'
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `hace ${mins}m`
  const hs = Math.floor(mins / 60)
  if (hs < 24) return `hace ${hs}h`
  return `hace ${Math.floor(hs / 24)}d`
}

const PLANES = ['basico', 'profesional', 'ilimitado']

export default function AdminPanel() {
  const qc = useQueryClient()
  const [licModal, setLicModal] = useState(null)
  const [licForm, setLicForm] = useState({})
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-usuarios', search],
    queryFn: () => client.get('/admin/usuarios', { params: { search, limit: 50 } }).then(r => r.data),
    refetchInterval: 30000,
  })

  const editarLicencia = useMutation({
    mutationFn: ({ id, data }) => client.put(`/admin/usuarios/${id}/licencia`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-usuarios']); setLicModal(null); toast.success('Licencia actualizada') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  function openLic(user) {
    setLicModal(user)
    setLicForm({
      estado: user.licencia?.estado || 'activa',
      plan: user.licencia?.plan || 'basico',
      fecha_vencimiento: user.licencia?.fecha_vencimiento ? new Date(user.licencia.fecha_vencimiento).toISOString().split('T')[0] : '',
    })
  }

  const usuarios = data?.usuarios || []
  const enLinea = usuarios.filter(u => {
    if (!u.ultimo_ping) return false
    return Date.now() - new Date(u.ultimo_ping).getTime() < 90000
  }).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            PANEL ADMIN
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            {data?.total || 0} usuarios · <span style={{ color: '#22C55E' }}>{enLinea} en línea</span>
          </p>
        </div>
        <Shield size={28} style={{ color: '#F59E0B' }} />
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por email o username..."
        className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm outline-none mb-6"
        style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
      />

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-border)' }}>
          <table className="w-full text-sm" style={{ background: 'var(--color-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Usuario', 'Email', 'Rol', 'Plan', 'Licencia', 'Días', 'Presencia', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--color-fg-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const enLinea = u.ultimo_ping && Date.now() - new Date(u.ultimo_ping).getTime() < 90000
                const diasRestantes = u.licencia?.fecha_vencimiento
                  ? Math.ceil((new Date(u.licencia.fecha_vencimiento) - Date.now()) / 86400000)
                  : null

                return (
                  <tr key={u._id} className="hover:bg-white/5 transition-all" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-fg)' }}>{u.username}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-fg-muted)' }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: u.rol === 'superadmin' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                          color: u.rol === 'superadmin' ? '#F59E0B' : '#3B82F6',
                        }}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-fg-muted)' }}>{u.licencia?.plan || '—'}</td>
                    <td className="px-4 py-3">{estadoBadge(u.licencia?.estado || 'vencida')}</td>
                    <td className="px-4 py-3">
                      <span style={{
                        color: diasRestantes === null ? 'var(--color-fg-muted)'
                          : diasRestantes <= 7 ? '#EF4444'
                          : diasRestantes <= 15 ? '#F59E0B'
                          : '#22C55E',
                      }}>
                        {diasRestantes !== null ? `${diasRestantes}d` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Circle
                          size={8}
                          fill={enLinea ? '#22C55E' : '#334155'}
                          style={{ color: enLinea ? '#22C55E' : '#334155' }}
                        />
                        <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                          {tiempoRelativo(u.ultimo_ping)}
                        </span>
                        {u.dispositivo === 'mobile' ? (
                          <Smartphone size={12} style={{ color: 'var(--color-fg-muted)' }} />
                        ) : (
                          <Monitor size={12} style={{ color: 'var(--color-fg-muted)' }} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openLic(u)}
                        className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
                        style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}
                      >
                        Licencia
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Editar licencia modal */}
      <Modal open={!!licModal} onClose={() => setLicModal(null)} title="EDITAR LICENCIA" size="sm">
        {licModal && (
          <div className="space-y-4">
            <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{licModal.username} · {licModal.email}</p>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Estado</label>
              <select
                value={licForm.estado}
                onChange={e => setLicForm(f => ({ ...f, estado: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                {['activa', 'por_vencer', 'vencida', 'suspendida'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Plan</label>
              <select
                value={licForm.plan}
                onChange={e => setLicForm(f => ({ ...f, plan: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Fecha vencimiento</label>
              <input
                type="date"
                value={licForm.fecha_vencimiento}
                onChange={e => setLicForm(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setLicModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
              <button
                type="button"
                onClick={() => editarLicencia.mutate({ id: licModal._id, data: licForm })}
                disabled={editarLicencia.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: 'var(--color-accent)', color: '#020617' }}
              >
                {editarLicencia.isPending ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
