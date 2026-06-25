import { auth } from '@/lib/auth'
import { obtenerEstadisticasHoy, obtenerVentasHoy } from '@/actions/ventas'
import { obtenerSurtidoresActivos } from '@/actions/surtidores'
import { BarChart3, Fuel, DollarSign, Droplets, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reportes | Control Social de Combustible',
}

export const dynamic = 'force-dynamic'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any, label: string, value: string, sub?: string, color: string
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default async function ReportesPage() {
  const [stats, ventasHoy, surtidores] = await Promise.all([
    obtenerEstadisticasHoy(),
    obtenerVentasHoy(),
    obtenerSurtidoresActivos(),
  ])

  const now = new Date()
  const horaActual = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
  const fechaActual = now.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Panel de Control</h1>
          <p className="text-slate-400 text-sm capitalize">{fechaActual}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">{horaActual}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Fuel}
          label="Ventas hoy"
          value={String(stats?.totalVentas ?? 0)}
          sub="transacciones aprobadas"
          color="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={DollarSign}
          label="Total recaudado"
          value={`Bs ${(stats?.totalBs ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`}
          color="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          icon={Droplets}
          label="Litros despachados"
          value={`${(stats?.totalLitros ?? 0).toFixed(1)} lt`}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Surtidores activos"
          value={String(surtidores.length)}
          sub={`${stats?.ventasPorSurtidor?.length ?? 0} con actividad hoy`}
          color="bg-purple-500/15 text-purple-400"
        />
      </div>

      {/* Por Surtidor */}
      {stats && (stats.ventasPorSurtidor?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Actividad por Surtidor
          </h2>
          <div className="grid gap-3">
            {stats.ventasPorSurtidor.map((item) => (
              <div key={item.surtidorId} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Fuel className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{item.surtidor?.nombre ?? item.surtidorId}</p>
                  <p className="text-sm text-slate-400">{item._count.id} ventas · {(item._sum.litros ?? 0).toFixed(1)} litros</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-emerald-400">Bs {(item._sum.montoBs ?? 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas ventas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Últimas Transacciones
          </h2>
          <Link href="/reportes/historial" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            Ver historial completo →
          </Link>
        </div>

        {ventasHoy.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-8 text-center">
            <Fuel className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay transacciones registradas hoy</p>
          </div>
        ) : (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3">Hora</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3">CI</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Cliente</th>
                    <th className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Surtidor</th>
                    <th className="text-right text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3">Monto</th>
                    <th className="text-right text-xs text-slate-500 font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Litros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {ventasHoy.slice(0, 20).map((venta) => (
                    <tr key={venta.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(venta.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{venta.ci}</td>
                      <td className="px-4 py-3 text-slate-300 hidden sm:table-cell max-w-32 truncate">{venta.nombreCliente}</td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell text-xs">{venta.surtidor.nombre}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400 whitespace-nowrap">Bs {venta.montoBs.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell whitespace-nowrap">{venta.litros.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
