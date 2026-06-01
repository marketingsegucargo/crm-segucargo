import { useEffect, useState } from 'react'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { usersService } from '../services/users'
import { formatDate } from '../lib/utils'
import type { Profile, UserRole } from '../types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { useAuth } from '../hooks/useAuth'

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  gerencia: 'bg-purple-100 text-purple-700',
  ejecutivo: 'bg-blue-100 text-blue-700',
  operaciones: 'bg-green-100 text-green-700',
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gerencia: 'Gerencia',
  ejecutivo: 'Ejecutivo',
  operaciones: 'Operaciones',
}

export default function Users() {
  const { profile: me } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', rol: 'ejecutivo' as UserRole, telefono: '', activo: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { usersService.getAll().then(setUsers).catch(() => {}).finally(() => setLoading(false)) }, [])

  function openEdit(user: Profile) {
    setEditUser(user)
    setEditForm({ nombre: user.nombre, apellido: user.apellido, rol: user.rol, telefono: user.telefono || '', activo: user.activo })
  }

  async function saveEdit() {
    if (!editUser) return
    setSaving(true)
    try {
      const updated = await usersService.update(editUser.id, editForm)
      setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u))
      setEditUser(null)
    } finally { setSaving(false) }
  }

  async function toggleActive(user: Profile) {
    const updated = await usersService.update(user.id, { activo: !user.activo })
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u))
  }

  if (me?.rol !== 'admin' && me?.rol !== 'gerencia') {
    return <div className="text-center py-16 text-gray-400">No tienes permisos para ver esta sección</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} usuarios registrados</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center h-48 items-center">
            <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {user.nombre.charAt(0)}{user.apellido.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.nombre} {user.apellido}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={ROLE_LABELS[user.rol]} className={ROLE_COLORS[user.rol]} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={user.activo ? 'Activo' : 'Inactivo'} className={user.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {me?.rol === 'admin' && (
                        <>
                          <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar">
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => toggleActive(user)} className={`p-1.5 rounded-lg transition-colors ${user.activo ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={user.activo ? 'Desactivar' : 'Activar'}>
                            {user.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar Usuario" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Apellido</label>
              <input value={editForm.apellido} onChange={e => setEditForm(f => ({ ...f, apellido: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Rol</label>
            <select value={editForm.rol} onChange={e => setEditForm(f => ({ ...f, rol: e.target.value as UserRole }))} className="input">
              <option value="ejecutivo">Ejecutivo</option>
              <option value="operaciones">Operaciones</option>
              <option value="gerencia">Gerencia</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} className="input" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="activo" checked={editForm.activo} onChange={e => setEditForm(f => ({ ...f, activo: e.target.checked }))} className="rounded" />
            <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditUser(null)} className="btn-secondary">Cancelar</button>
            <button onClick={saveEdit} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
