'use client'

import { useState, useEffect } from 'react'
import { obtenerHistorial } from '@/actions/ventas'
import { obtenerSurtidoresActivos } from '@/actions/surtidores'
import { Search, Filter, Download, ChevronLeft, ChevronRight, MapPin, History } from 'lucide-react'

type Venta = {
  id: string; ci: string; nombreCliente: string; numeroChasis: string
  montoBs: number; litros: number; fecha: Date; estado: string
  surtidor: { nombre: string }; operario: { name: string }
  latitudDispositivo?: number | null; longitudDispositivo?: number | null
}

const PAGE_SIZE = 20

export default function HistorialClient() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [surtidores, setSurtidores] = useState<{ id: string; nombre: string }[]>([])
  const [filters, setFilters] = useState({ ci: '', surtidorId: '', fechaDesde: '', fechaHasta: '' })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => { obtenerSurtidoresActivos().then(setSurtidores) }, [])
  useEffect(() => { fetchData() }, [page, filters])

  async function fetchData() {
    setLoading(true)
    try {
      const result = await obtenerHistorial({ page, pageSize: PAGE_SIZE, ...filters })
      setVentas(result.ventas as any)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setPage(1)
  }

  function exportCSV() {
    const rows = [
      ['Fecha', 'Hora', 'CI', 'Cliente', 'Chasis', 'Monto (Bs)', 'Litros', 'Surtidor', 'Operario'],
      ...ventas.map(v => [
        new Date(v.fecha).toLocaleDateString('es-BO'),
        new Date(v.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        v.ci, v.nombreCliente, v.numeroChasis,
        v.montoBs.toFixed(2), v.litros.toFixed(2),
        v.surtidor.nombre, v.operario.name,
      ])
    ]
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="w-6 h-6 text-amber-400" />
          Historial de Ventas
        </h1>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-all">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm font-medium">
          <Filter className="w-4 h-4" />Filtros
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input name="ci" placeholder="Buscar por CI" value={filters.ci} onChange={handleFilterChange}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
          </div>
          <select name="surtidorId" value={filters.surtidorId} onChange={handleFilterChange}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40">
            <option value="">Todos los surtidores</option>
            {surtidores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <input name="fechaDesde" type="date" value={filters.fechaDesde} onChange={handleFilterChange}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
          <input name="fechaHasta" type="date" value={filters.fechaHasta} onChange={handleFilterChange}
            className="px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
          </div>
        ) : ventas.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No se encontraron resultados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3">Fecha/Hora</th>
                  <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3">CI</th>
                  <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Cliente</th>
                  <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Chasis</th>
                  <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Surtidor</th>
                  <th className="text-right text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3">Monto</th>
                  <th className="text-right text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Litros</th>
                  <th className="text-center text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-300 text-xs">{new Date(venta.fecha).toLocaleDateString('es-BO')}</span>
                      <span className="text-slate-500 text-xs block">{new Date(venta.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{venta.ci}</td>
                    <td className="px-4 py-3 text-slate-300 hidden sm:table-cell max-w-32 truncate text-xs">{venta.nombreCliente}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs hidden lg:table-cell max-w-32 truncate">{venta.numeroChasis}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell text-xs whitespace-nowrap">{venta.surtidor.nombre}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400 whitespace-nowrap text-xs">Bs {venta.montoBs.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell text-xs whitespace-nowrap">{venta.litros.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {venta.latitudDispositivo
                        ? <MapPin className="w-3.5 h-3.5 text-emerald-400 mx-auto" title={`${venta.latitudDispositivo?.toFixed(4)}, ${venta.longitudDispositivo?.toFixed(4)}`} />
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">
            {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} registros
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 px-2">Pág {page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
