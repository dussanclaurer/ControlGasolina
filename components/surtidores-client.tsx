'use client'

import { useState, useEffect } from 'react'
import { obtenerSurtidores, crearSurtidor, actualizarSurtidor, eliminarSurtidor } from '@/actions/surtidores'
import { Plus, Edit2, Trash2, MapPin, Check, X, Fuel } from 'lucide-react'

type Surtidor = {
  id: string; nombre: string; direccion?: string | null
  latitud: number; longitud: number; activo: boolean
}

const emptyForm = { nombre: '', direccion: '', latitud: '', longitud: '' }

export default function SurtidoresClient() {
  const [surtidores, setSurtidores] = useState<Surtidor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const data = await obtenerSurtidores()
    setSurtidores(data)
    setLoading(false)
  }

  function startEdit(s: Surtidor) {
    setEditId(s.id)
    setForm({ nombre: s.nombre, direccion: s.direccion ?? '', latitud: String(s.latitud), longitud: String(s.longitud) })
    setShowForm(true)
    setError('')
  }

  function cancelForm() {
    setShowForm(false); setEditId(null); setForm(emptyForm); setError('')
  }

  async function handleGetGPS() {
    if (!navigator.geolocation) { setError('GPS no disponible'); return }
    navigator.geolocation.getCurrentPosition(
      pos => setForm(p => ({ ...p, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) })),
      () => setError('No se pudo obtener la ubicación GPS')
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const data = {
      nombre: form.nombre, direccion: form.direccion || undefined,
      latitud: parseFloat(form.latitud), longitud: parseFloat(form.longitud), activo: true,
    }
    const result = editId ? await actualizarSurtidor(editId, data) : await crearSurtidor(data)
    if (result.success) { cancelForm(); fetchData() }
    else setError(result.error ?? 'Error al guardar')
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Fuel className="w-6 h-6 text-amber-400" />
          Gestión de Surtidores
        </h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/20">
          <Plus className="w-4 h-4" />Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">{editId ? 'Editar Surtidor' : 'Nuevo Surtidor'}</h2>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-300 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Surtidor Central" required
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Dirección</label>
                <input value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
                  placeholder="Ej: Av. Principal 123"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Latitud *</label>
                <input value={form.latitud} onChange={e => setForm(p => ({ ...p, latitud: e.target.value }))}
                  type="number" step="any" placeholder="-16.489700" required
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Longitud *</label>
                <input value={form.longitud} onChange={e => setForm(p => ({ ...p, longitud: e.target.value }))}
                  type="number" step="any" placeholder="-68.119300" required
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              </div>
            </div>
            <button type="button" onClick={handleGetGPS}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
              <MapPin className="w-4 h-4" />Usar mi ubicación actual
            </button>
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
          {surtidores.map(s => (
            <div key={s.id} className={`bg-slate-800/50 border rounded-2xl p-5 flex items-center gap-4 ${s.activo ? 'border-slate-700/50' : 'border-slate-700/20 opacity-50'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.activo ? 'bg-amber-500/15' : 'bg-slate-700/30'}`}>
                <Fuel className={`w-6 h-6 ${s.activo ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{s.nombre}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {s.direccion && <p className="text-sm text-slate-400 truncate mt-0.5">{s.direccion}</p>}
                <p className="text-xs text-slate-500 font-mono mt-1">{s.latitud.toFixed(6)}, {s.longitud.toFixed(6)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(s)}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                {s.activo && (
                  <button onClick={async () => { if (confirm('¿Desactivar este surtidor?')) { await eliminarSurtidor(s.id); fetchData() } }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
