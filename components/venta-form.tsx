'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Fuel, User, Car, DollarSign, MapPin,
  CheckCircle, XCircle, AlertTriangle, Loader2, Send, RotateCcw, Wifi, WifiOff
} from 'lucide-react'
import { registrarVenta } from '@/actions/ventas'
import { obtenerGeolocalizacion } from '@/lib/geolocation'
import { guardarVentaOffline, generarOfflineId } from '@/lib/indexeddb'

const PRECIO_LITRO = 6.96

interface FormState {
  ci: string
  nombreCliente: string
  numeroChasis: string
  montoBs: string
}

interface ResultState {
  type: 'success' | 'error' | 'blocked' | null
  message: string
  details?: string
}

export default function VentaForm() {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [isOnline, setIsOnline] = useState(true)

  const [form, setForm] = useState<FormState>({ ci: '', nombreCliente: '', numeroChasis: '', montoBs: '' })
  const [result, setResult] = useState<ResultState>({ type: null, message: '' })
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'warning'>('idle')
  const [geoData, setGeoData] = useState<{ lat: number; lon: number } | null>(null)

  const litros = form.montoBs ? (parseFloat(form.montoBs) / PRECIO_LITRO).toFixed(2) : '0.00'

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    obtenerGPS()
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  async function obtenerGPS() {
    setGeoStatus('loading')
    const geo = await obtenerGeolocalizacion()
    if (!geo.success) { setGeoStatus('warning'); return }
    setGeoData({ lat: geo.latitud, lon: geo.longitud })
    setGeoStatus('ok')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (result.type) setResult({ type: null, message: '' })
  }

  function resetForm() {
    setForm({ ci: '', nombreCliente: '', numeroChasis: '', montoBs: '' })
    setResult({ type: null, message: '' })
    obtenerGPS()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const monto = parseFloat(form.montoBs)
    if (isNaN(monto) || monto <= 0) {
      setResult({ type: 'error', message: 'Ingrese un monto válido en Bolivianos' })
      return
    }

    const ventaData = {
      ci: form.ci.trim().toUpperCase(),
      nombreCliente: form.nombreCliente.trim(),
      numeroChasis: form.numeroChasis.trim().toUpperCase(),
      montoBs: monto,
      latitudDispositivo: geoData?.lat,
      longitudDispositivo: geoData?.lon,
    }

    if (!isOnline) {
      const offlineId = generarOfflineId()
      await guardarVentaOffline({
        offlineId,
        ...ventaData,
        litros: monto / PRECIO_LITRO,
        surtidorId: session?.user?.surtidorId ?? '',
        operarioId: session?.user?.id ?? '',
        fecha: new Date().toISOString(),
        syncStatus: 'PENDING',
      })
      setResult({
        type: 'success',
        message: '✓ Venta guardada offline',
        details: `Se sincronizará al recuperar la conexión. ID: ${offlineId.slice(-8)}`,
      })
      setForm({ ci: '', nombreCliente: '', numeroChasis: '', montoBs: '' })
      return
    }

    startTransition(async () => {
      const res = await registrarVenta(ventaData)
      if (res.success) {
        const venta = res.venta as any
        setResult({
          type: 'success',
          message: '✓ Venta registrada exitosamente',
          details: `${venta?.litros?.toFixed(2)} litros · Bs ${monto.toFixed(2)} · ${new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`,
        })
        resetForm()
      } else {
        setResult({
          type: (res as any).bloqueado ? 'blocked' : 'error',
          message: res.error ?? 'Error desconocido',
        })
      }
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Nueva Venta</h1>
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium ${
            isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        {session?.user?.surtidorNombre && (
          <p className="text-slate-400 text-sm flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5" />
            {session.user.surtidorNombre}
          </p>
        )}
      </div>

      {/* Result Banner */}
      {result.type && (
        <div className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 ${
          result.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
          result.type === 'blocked' ? 'bg-amber-500/10 border-amber-500/30' :
          'bg-red-500/10 border-red-500/30'
        }`}>
          {result.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {result.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
          {result.type === 'blocked' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
          <div>
            <p className={`font-semibold text-sm ${
              result.type === 'success' ? 'text-emerald-300' :
              result.type === 'blocked' ? 'text-amber-300' : 'text-red-300'
            }`}>
              {result.message}
            </p>
            {result.details && <p className="text-xs text-slate-400 mt-1">{result.details}</p>}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* GPS Status */}
        <div className={`flex items-center gap-2.5 p-3 rounded-xl text-sm border ${
          geoStatus === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          geoStatus === 'loading' ? 'bg-slate-800 border-slate-700 text-slate-400' :
          geoStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
          'bg-slate-800/50 border-slate-700/50 text-slate-500'
        }`}>
          {geoStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 shrink-0" />}
          <span className="flex-1 text-xs">
            {geoStatus === 'ok' && 'Ubicación GPS verificada'}
            {geoStatus === 'loading' && 'Obteniendo ubicación GPS...'}
            {geoStatus === 'warning' && 'Sin GPS · Se registrará sin verificación de ubicación'}
            {geoStatus === 'idle' && 'GPS no iniciado'}
          </span>
          {geoStatus !== 'loading' && (
            <button type="button" onClick={obtenerGPS} className="p-1 hover:opacity-75 transition-opacity">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CI */}
        <div>
          <label htmlFor="ci" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Carnet de Identidad
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input id="ci" name="ci" type="text" value={form.ci} onChange={handleChange}
              placeholder="Ej: 5432198" required
              className="w-full pl-10 pr-4 py-3.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all text-sm" />
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="nombreCliente" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Nombre Completo del Conductor
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input id="nombreCliente" name="nombreCliente" type="text" value={form.nombreCliente} onChange={handleChange}
              placeholder="Ej: Juan Carlos Quispe" required
              className="w-full pl-10 pr-4 py-3.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all text-sm" />
          </div>
        </div>

        {/* Chasis */}
        <div>
          <label htmlFor="numeroChasis" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Número de Chasis
          </label>
          <div className="relative">
            <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input id="numeroChasis" name="numeroChasis" type="text" value={form.numeroChasis} onChange={handleChange}
              placeholder="Ej: 9BWZZZ377VT004251" required
              className="w-full pl-10 pr-4 py-3.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all text-sm font-mono" />
          </div>
        </div>

        {/* Monto */}
        <div>
          <label htmlFor="montoBs" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Monto en Bolivianos (Bs.)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input id="montoBs" name="montoBs" type="number" min="6.96" step="0.01"
              value={form.montoBs} onChange={handleChange} placeholder="Ej: 139.20" required
              className="w-full pl-10 pr-4 py-3.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all text-sm" />
          </div>
          {/* Litros preview */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <div className="flex-1 bg-slate-800/60 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-slate-400">Volumen equivalente:</span>
              <span className="font-bold text-amber-400">{litros} litros</span>
            </div>
            <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-slate-500 whitespace-nowrap">
              Bs {PRECIO_LITRO}/lt
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-base"
        >
          {isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Registrando...</>
          ) : (
            <><Send className="w-5 h-5" />{isOnline ? 'Registrar Venta' : 'Guardar Offline'}</>
          )}
        </button>
      </form>
    </div>
  )
}
