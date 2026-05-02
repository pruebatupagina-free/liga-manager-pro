import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Shield, Monitor, Smartphone, Circle, UserPlus, Pencil, Trash2, ShoppingBag, Users } from 'lucide-react'
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

const PLANES = ['basico', 'pro', 'elite']

export default function AdminPanel() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('clientes')
  const [licModal, setLicModal] = useState(null)
  const [licForm, setLicForm] = useState({})
  const [search, setSearch] = useState('')
  const [crearModal, setCrearModal] = useState(false)
  const [crearForm, setCrearForm] = useState({ nombre: '', email: '', username: '', password: '', telefono: '', plan: 'basico', fecha_vencimiento: '' })
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-usuarios', search],
    queryFn: () => client.get('/admin/usuarios', { params: { search, limit: 50 } }).then(r => r.data),
    refetchInterval: 30000,
  })

  const crearUsuario = useMutation({
    mutationFn: data => client.post('/auth/register', data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-usuarios'])
      setCrearModal(false)
      setCrearForm({ nombre: '', email: '', username: '', password: '', telefono: '', plan: 'basico', fecha_vencimiento: '' })
      toast.success('Usuario creado')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al crear usuario'),
  })

  const editarUsuario = useMutation({
    mutationFn: ({ id, data }) => client.put(`/admin/usuarios/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-usuarios']); setEditModal(null); toast.success('Usuario actualizado') },
    onError: err => toast.error(err.response?.data?.error || 'Error al actualizar'),
  })

  const eliminarUsuario = useMutation({
    mutationFn: id => client.delete(`/admin/usuarios/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-usuarios']); setDeleteConfirm(null); toast.success('Usuario eliminado') },
    onError: err => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  const editarLicencia = useMutation({
    mutationFn: ({ id, data }) => client.put(`/admin/usuarios/${id}/licencia`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-usuarios']); setLicModal(null); toast.success('Licencia actualizada') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  // Vendedores state
  const [vendedorModal, setVendedorModal] = useState(null)
  const [vendedorForm, setVendedorForm] = useState({ nombre: '', email: '', password: '', negocio_nombre: '', negocio_categoria: '', negocio_descripcion: '', negocio_whatsapp: '' })
  const [ligasModal, setLigasModal] = useState(null)

  const { data: vendedoresData } = useQuery({
    queryKey: ['admin-vendedores'],
    queryFn: () => client.get('/admin/vendedores').then(r => r.data),
    enabled: activeTab === 'vendedores',
  })
  const vendedores = vendedoresData?.vendedores || []

  const { data: ligasData } = useQuery({
    queryKey: ['admin-ligas'],
    queryFn: () => client.get('/admin/ligas').then(r => r.data),
  })
  const todasLigas = Array.isArray(ligasData) ? ligasData : []

  const crearVendedor = useMutation({
    mutationFn: d => client.post('/admin/vendedores', d),
    onSuccess: () => { qc.invalidateQueries(['admin-vendedores']); setVendedorModal(null); toast.success('Vendedor creado') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const editarVendedor = useMutation({
    mutationFn: ({ id, data }) => client.put(`/admin/vendedores/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-vendedores']); setVendedorModal(null); toast.success('Vendedor actualizado') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const asignarLigas = useMutation({
    mutationFn: ({ id, ligas_asignadas }) => client.put(`/admin/vendedores/${id}/ligas`, { ligas_asignadas }),
    onSuccess: () => { qc.invalidateQueries(['admin-vendedores']); setLigasModal(null); toast.success('Ligas actualizadas') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const [selectedLigas, setSelectedLigas] = useState([])

  function openCrearVendedor() {
    setVendedorForm({ nombre: '', email: '', password: '', negocio_nombre: '', negocio_categoria: '', negocio_descripcion: '', negocio_whatsapp: '' })
    setVendedorModal('crear')
  }

  function openEditVendedor(v) {
    setVendedorForm({
      nombre: v.nombre || '',
      email: v.email || '',
      password: '',
      negocio_nombre: v.negocio?.nombre || '',
      negocio_categoria: v.negocio?.categoria || '',
      negocio_descripcion: v.negocio?.descripcion || '',
      negocio_whatsapp: v.negocio?.whatsapp || '',
    })
    setVendedorModal(v)
  }

  function openLigas(v) {
    setSelectedLigas(v.ligas_asignadas?.map(l => (l._id || l)) || [])
    setLigasModal(v)
  }

  function toggleLiga(id) {
    setSelectedLigas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function submitVendedor() {
    const payload = {
      nombre: vendedorForm.nombre,
      email: vendedorForm.email,
      negocio: {
        nombre: vendedorForm.negocio_nombre,
        categoria: vendedorForm.negocio_categoria,
        descripcion: vendedorForm.negocio_descripcion,
        whatsapp: vendedorForm.negocio_whatsapp,
      },
    }
    if (vendedorForm.password) payload.password = vendedorForm.password
    if (vendedorModal === 'crear') {
      crearVendedor.mutate(payload)
    } else {
      editarVendedor.mutate({ id: vendedorModal._id, data: payload })
    }
  }

  function openEdit(user) {
    setEditModal(user)
    setEditForm({ nombre: user.nombre || '', email: user.email || '', username: user.username || '', telefono: user.telefono || '' })
  }

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
      <div className="flex items-center justify-between mb-6">
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'clientes', label: 'Clientes', icon: Users },
          { key: 'vendedores', label: 'Vendedores', icon: ShoppingBag },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all"
            style={{
              background: activeTab === key ? 'var(--color-accent)' : 'var(--color-primary)',
              color: activeTab === key ? '#020617' : 'var(--color-fg-muted)',
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'clientes' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por email o username..."
              className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
            <button
              onClick={() => setCrearModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ml-3"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              <UserPlus size={16} />
              Nuevo Cliente
            </button>
          </div>

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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openLic(u)}
                          className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
                          style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}
                        >
                          Licencia
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg cursor-pointer"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}
                          title="Editar usuario"
                        >
                          <Pencil size={13} />
                        </button>
                        {u.rol !== 'superadmin' && (
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="p-1.5 rounded-lg cursor-pointer"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

        </>
      )}

      {/* Vendedores tab */}
      {activeTab === 'vendedores' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={openCrearVendedor}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              <UserPlus size={16} />
              Nuevo Vendedor
            </button>
          </div>

          {vendedores.length === 0 ? (
            <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
              <ShoppingBag size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
              <p className="font-medium" style={{ color: 'var(--color-fg-muted)' }}>Sin vendedores</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-border)' }}>
              <table className="w-full text-sm" style={{ background: 'var(--color-primary)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Negocio', 'Email', 'Categoría', 'Ligas asignadas', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--color-fg-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map(v => (
                    <tr key={v._id} className="hover:bg-white/5 transition-all" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-fg)' }}>{v.negocio?.nombre || v.nombre}</p>
                          <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{v.nombre}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-fg-muted)' }}>{v.email}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-fg-muted)' }}>{v.negocio?.categoria || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                          {v.ligas_asignadas?.length || 0} ligas
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openLigas(v)}
                            className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}
                          >
                            Ligas
                          </button>
                          <button
                            onClick={() => openEditVendedor(v)}
                            className="p-1.5 rounded-lg cursor-pointer"
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}
                            title="Editar vendedor"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Crear/Editar vendedor modal */}
      <Modal
        open={!!vendedorModal}
        onClose={() => setVendedorModal(null)}
        title={vendedorModal === 'crear' ? 'NUEVO VENDEDOR' : 'EDITAR VENDEDOR'}
        size="sm"
      >
        <div className="space-y-4">
          {[
            { key: 'nombre', label: 'Nombre completo *', placeholder: 'Juan Pérez', type: 'text' },
            { key: 'email', label: 'Email *', placeholder: 'correo@ejemplo.com', type: 'email' },
            { key: 'password', label: vendedorModal === 'crear' ? 'Contraseña *' : 'Nueva contraseña (opcional)', placeholder: '••••••••', type: 'password' },
            { key: 'negocio_nombre', label: 'Nombre del negocio', placeholder: 'Ej: Uniformes Deportivos XYZ', type: 'text' },
            { key: 'negocio_categoria', label: 'Categoría', placeholder: 'Ej: Uniformes', type: 'text' },
            { key: 'negocio_descripcion', label: 'Descripción', placeholder: 'Breve descripción del negocio', type: 'text' },
            { key: 'negocio_whatsapp', label: 'WhatsApp', placeholder: 'Ej: 8121234567', type: 'text' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
              <input
                type={type}
                value={vendedorForm[key]}
                onChange={e => setVendedorForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setVendedorModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitVendedor}
              disabled={crearVendedor.isPending || editarVendedor.isPending || !vendedorForm.nombre || !vendedorForm.email || (vendedorModal === 'crear' && !vendedorForm.password)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {crearVendedor.isPending || editarVendedor.isPending ? 'Guardando...' : vendedorModal === 'crear' ? 'Crear Vendedor' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Asignar ligas modal */}
      <Modal open={!!ligasModal} onClose={() => setLigasModal(null)} title="LIGAS ASIGNADAS" size="sm">
        {ligasModal && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
              Selecciona las ligas donde aparecerá <strong>{ligasModal.negocio?.nombre || ligasModal.nombre}</strong>:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todasLigas.map(liga => (
                <label key={liga._id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selectedLigas.includes(liga._id)}
                    onChange={() => toggleLiga(liga._id)}
                    className="rounded"
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{liga.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{liga.admin_id?.username || '—'}</p>
                  </div>
                </label>
              ))}
              {todasLigas.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-fg-muted)' }}>No hay ligas disponibles</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setLigasModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => asignarLigas.mutate({ id: ligasModal._id, ligas_asignadas: selectedLigas })}
                disabled={asignarLigas.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: 'var(--color-accent)', color: '#020617' }}
              >
                {asignarLigas.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Crear usuario modal */}
      <Modal open={crearModal} onClose={() => setCrearModal(false)} title="NUEVO CLIENTE" size="sm">
        <div className="space-y-4">
          {[
            { key: 'nombre', label: 'Nombre completo', type: 'text', placeholder: 'Ej: Juan Pérez' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'correo@ejemplo.com' },
            { key: 'username', label: 'Username', type: 'text', placeholder: 'juanperez' },
            { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres' },
            { key: 'telefono', label: 'Teléfono (opcional)', type: 'text', placeholder: 'Ej: 8121234567' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
              <input
                type={type}
                value={crearForm[key]}
                onChange={e => setCrearForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Plan de licencia</label>
            <select
              value={crearForm.plan}
              onChange={e => setCrearForm(f => ({ ...f, plan: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            >
              {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Fecha vencimiento (opcional)</label>
            <input
              type="date"
              value={crearForm.fecha_vencimiento}
              onChange={e => setCrearForm(f => ({ ...f, fecha_vencimiento: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setCrearModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button
              type="button"
              onClick={() => crearUsuario.mutate(crearForm)}
              disabled={crearUsuario.isPending || !crearForm.nombre || !crearForm.email || !crearForm.username || !crearForm.password}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {crearUsuario.isPending ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Editar usuario modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="EDITAR USUARIO" size="sm">
        {editModal && (
          <div className="space-y-4">
            {[
              { key: 'nombre', label: 'Nombre completo', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'username', label: 'Username', type: 'text' },
              { key: 'telefono', label: 'Teléfono (opcional)', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
                <input
                  type={type}
                  value={editForm[key]}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
              <button
                type="button"
                onClick={() => editarUsuario.mutate({ id: editModal._id, data: editForm })}
                disabled={editarUsuario.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: '#3B82F6', color: '#fff' }}
              >
                {editarUsuario.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmar eliminación */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="ELIMINAR USUARIO" size="sm">
        {deleteConfirm && (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: 'var(--color-fg)' }}>
              ¿Eliminar a <strong>{deleteConfirm.username}</strong> ({deleteConfirm.email})?
              <br />
              <span style={{ color: 'var(--color-fg-muted)' }}>Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
              <button
                type="button"
                onClick={() => eliminarUsuario.mutate(deleteConfirm._id)}
                disabled={eliminarUsuario.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: '#EF4444', color: '#fff' }}
              >
                {eliminarUsuario.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

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
