'use client'

import { useState, useEffect } from 'react'
import { obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '@/actions/usuarios'
import { obtenerSurtidoresActivos } from '@/actions/surtidores'
import { Plus, Edit2, Trash2, User, Shield, Check, X, Users } from 'lucide-react'

type Usuario = {
  id: string; email: string; name: string; role: string
  surtidorId?: string | null; surtidor?: { nombre: string } | null; createdAt: Date
}

const emptyForm = { email: '', name: '', password: '', role: 'OPERARIO' as 'OPERARIO' | 'SUPERVISOR', surtidorId: '' }

export default function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [surtidores, setSurtidores] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchUsers(), obtenerSurtidoresActivos().then(setSurtidores)])
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const data = await obtenerUsuarios()
    setUsuarios(data as any)
    setLoading(false)
  }

  function startEdit(u: Usuario) {
    setEditId(u.id)
    setForm({ email: u.email, name: u.name, password: '', role: u.role as any, surtidorId: u.surtidorId ?? '' })
    setShowForm(true); setError('')
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(emptyForm); setError('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const data = { ...form, surtidorId: form.surtidorId || null, password: form.password || undefined }
    const result = editId ? await actualizarUsuario(editId, data as any) : await crearUsuario(data as any)
    if (result.success) { cancelForm(); fetchUsers() }
    else setError(result.error ?? 'Error')
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-400" />
          Gestión de Usuarios
        </h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/20">
          <Plus className="w-4 h-4" />Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre del usuario" required
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="usuario@control.bo" required
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Contraseña {editId && <span className="normal-case text-slate-500">(vacío = sin cambio)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder={editId ? '••••••• (opcional)' : 'Mínimo 6 caracteres'} {...(!editId && { required: true })}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Rol *</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                  <option value="OPERARIO">Operario</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>
              {form.role === 'OPERARIO' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Surtidor Asignado</label>
                  <select value={form.surtidorId} onChange={e => setForm(p => ({ ...p, surtidorId: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                    <option value="">Sin asignación</option>
                    {surtidores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                <Check className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={cancelForm}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition-all">
                <X className="w-4 h-4" />Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {usuarios.map(u => (
            <div key={u.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${u.role === 'SUPERVISOR' ? 'bg-purple-500/15' : 'bg-blue-500/15'}`}>
                {u.role === 'SUPERVISOR' ? <Shield className="w-6 h-6 text-purple-400" /> : <User className="w-6 h-6 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'SUPERVISOR' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {u.role === 'SUPERVISOR' ? 'Supervisor' : 'Operario'}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{u.email}</p>
                {u.surtidor && <p className="text-xs text-slate-500 mt-0.5">📍 {u.surtidor.nombre}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(u)}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={async () => { if (confirm('¿Eliminar este usuario?')) { await eliminarUsuario(u.id); fetchUsers() } }}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
