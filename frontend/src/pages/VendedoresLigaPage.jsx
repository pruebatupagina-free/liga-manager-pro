import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ShoppingBag, UserPlus, Pencil, Trash2, Loader2, Lock, Zap } from 'lucide-react'
import Modal from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { usePlan } from '../hooks/usePlan'
import client from '../api/client'

const emptyForm = {
  nombre: '', email: '', password: '',
  negocio_nombre: '', negocio_categoria: '', negocio_descripcion: '', negocio_whatsapp: '',
}

export default function VendedoresLigaPage() {
  const { liga_id } = useParams()
  const { user } = useAuth()
  const { esBasico } = usePlan()
  const qc = useQueryClient()
  const isSuperadmin = user?.rol === 'superadmin'

  const [modal, setModal] = useState(null) // null | 'crear' | vendedor object
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [ligasModal, setLigasModal] = useState(null)
  const [selectedLigas, setSelectedLigas] = useState([])

  const { data, isLoading } = useQuery({
    queryKey: ['vendedores-liga', liga_id],
    queryFn: () => client.get(`/vendedores?liga_id=${liga_id}`).then(r => r.data),
  })
  const vendedores = data?.vendedores || []

  const { data: ligasData } = useQuery({
    queryKey: ['admin-ligas'],
    queryFn: () => client.get('/admin/ligas').then(r => r.data),
    enabled: isSuperadmin,
  })
  const todasLigas = Array.isArray(ligasData) ? ligasData : []

  function buildPayload() {
    return {
      nombre: form.nombre,
      email: form.email,
      ...(form.password ? { password: form.password } : {}),
      negocio: {
        nombre: form.negocio_nombre,
        categoria: form.negocio_categoria,
        descripcion: form.negocio_descripcion,
        whatsapp: form.negocio_whatsapp,
      },
      ligas_asignadas: [liga_id],
    }
  }

  const crear = useMutation({
    mutationFn: () => client.post('/vendedores', buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries(['vendedores-liga', liga_id])
      setModal(null)
      toast.success('Vendedor creado')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al crear'),
  })

  const editar = useMutation({
    mutationFn: () => client.put(`/vendedores/${modal._id}`, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries(['vendedores-liga', liga_id])
      setModal(null)
      toast.success('Vendedor actualizado')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al actualizar'),
  })

  const eliminar = useMutation({
    mutationFn: id => client.delete(`/vendedores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['vendedores-liga', liga_id])
      setDeleteConfirm(null)
      toast.success('Vendedor eliminado')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al eliminar'),
  })

  const asignarLigas = useMutation({
    mutationFn: () => client.put(`/vendedores/${ligasModal._id}/ligas`, { ligas_asignadas: selectedLigas }),
    onSuccess: () => {
      qc.invalidateQueries(['vendedores-liga', liga_id])
      setLigasModal(null)
      toast.success('Ligas actualizadas')
    },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  function openCrear() {
    setForm(emptyForm)
    setModal('crear')
  }

  function openEditar(v) {
    setForm({
      nombre: v.nombre || '',
      email: v.email || '',
      password: '',
      negocio_nombre: v.negocio?.nombre || '',
      negocio_categoria: v.negocio?.categoria || '',
      negocio_descripcion: v.negocio?.descripcion || '',
      negocio_whatsapp: v.negocio?.whatsapp || '',
    })
    setModal(v)
  }

  function openLigas(v) {
    setSelectedLigas(v.ligas_asignadas?.map(l => l._id || l) || [])
    setLigasModal(v)
  }

  const isEditing = modal && modal !== 'crear'
  const isPending = crear.isPending || editar.isPending

  const fields = [
    { key: 'nombre', label: 'Nombre completo *', type: 'text', placeholder: 'Juan Pérez' },
    { key: 'email', label: 'Email *', type: 'email', placeholder: 'correo@ejemplo.com' },
    { key: 'password', label: isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña *', type: 'password', placeholder: '••••••••' },
    { key: 'negocio_nombre', label: 'Nombre del negocio', type: 'text', placeholder: 'Ej: Uniformes XYZ' },
    { key: 'negocio_categoria', label: 'Categoría', type: 'text', placeholder: 'Ej: Uniformes, Balones...' },
    { key: 'negocio_descripcion', label: 'Descripción breve', type: 'text', placeholder: 'Qué vende el negocio' },
    { key: 'negocio_whatsapp', label: 'WhatsApp', type: 'text', placeholder: '8121234567' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {esBasico && (
        <div
          className="rounded-2xl px-5 py-4 mb-5 flex items-start gap-4"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <Zap size={18} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#FBBF24' }}>Marketplace disponible en Plan Pro</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
              Con el plan Pro puedes agregar vendedores de uniformes, balones y equipamiento que venden directamente a tus equipos. Actualiza para activar el marketplace.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag size={22} style={{ color: 'var(--color-accent)' }} />
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            VENDEDORES
          </h1>
        </div>
        {esBasico ? (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24', cursor: 'default' }}
            title="Disponible en plan Pro"
          >
            <Lock size={14} /> Marketplace — Plan Pro
          </div>
        ) : (
          <button
            onClick={openCrear}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--color-accent)', color: '#020617' }}
          >
            <UserPlus size={16} />
            Nuevo Vendedor
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center" style={{ color: 'var(--color-fg-muted)' }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-2" />
        </div>
      ) : vendedores.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
          <ShoppingBag size={44} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }} />
          <p className="font-medium" style={{ color: 'var(--color-fg-muted)' }}>Sin vendedores en esta liga</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)', opacity: 0.7 }}>
            Crea una cuenta para un proveedor de uniformes, balones u otros productos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendedores.map(v => (
            <div key={v._id} className="rounded-2xl p-4 glow-card flex items-center gap-4"
              style={{ background: 'var(--color-primary)' }}>
              {v.negocio?.logo ? (
                <img src={v.negocio.logo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-accent)' }}>
                  <ShoppingBag size={20} style={{ color: '#020617' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>
                  {v.negocio?.nombre || v.nombre}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                  {v.negocio?.categoria && <span className="mr-2">{v.negocio.categoria}</span>}
                  {v.email}
                </p>
                {v.negocio?.whatsapp && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-fg-muted)', opacity: 0.7 }}>
                    WA: {v.negocio.whatsapp}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isSuperadmin && (
                  <button
                    onClick={() => openLigas(v)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}
                  >
                    {v.ligas_asignadas?.length || 0} ligas
                  </button>
                )}
                <button
                  onClick={() => openEditar(v)}
                  className="p-2 rounded-xl cursor-pointer"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                {isSuperadmin && (
                  <button
                    onClick={() => setDeleteConfirm(v)}
                    className="p-2 rounded-xl cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crear / Editar modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={isEditing ? 'EDITAR VENDEDOR' : 'NUEVO VENDEDOR'}
        size="sm"
      >
        <div className="space-y-4">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => isEditing ? editar.mutate() : crear.mutate()}
              disabled={isPending || !form.nombre || !form.email || (!isEditing && !form.password)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? 'Guardar cambios' : 'Crear Vendedor'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Asignar ligas modal (superadmin only) */}
      <Modal open={!!ligasModal} onClose={() => setLigasModal(null)} title="LIGAS ASIGNADAS" size="sm">
        {ligasModal && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
              Ligas donde aparece <strong>{ligasModal.negocio?.nombre || ligasModal.nombre}</strong>:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todasLigas.map(liga => (
                <label key={liga._id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selectedLigas.includes(liga._id)}
                    onChange={() => setSelectedLigas(prev =>
                      prev.includes(liga._id) ? prev.filter(x => x !== liga._id) : [...prev, liga._id]
                    )}
                  />
                  <p className="text-sm" style={{ color: 'var(--color-fg)' }}>{liga.nombre}</p>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setLigasModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => asignarLigas.mutate()}
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

      {/* Eliminar confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="ELIMINAR VENDEDOR" size="sm">
        {deleteConfirm && (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: 'var(--color-fg)' }}>
              ¿Eliminar a <strong>{deleteConfirm.negocio?.nombre || deleteConfirm.nombre}</strong>?
              <br />
              <span style={{ color: 'var(--color-fg-muted)' }}>Esta acción no se puede deshacer.</span>
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
