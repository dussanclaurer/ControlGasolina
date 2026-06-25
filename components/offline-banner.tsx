'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      syncPendingVentas()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    checkPending()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function checkPending() {
    try {
      const { obtenerVentasPendientes } = await import('@/lib/indexeddb')
      const pending = await obtenerVentasPendientes()
      setPendingCount(pending.length)
    } catch {}
  }

  async function syncPendingVentas() {
    setSyncing(true)
    try {
      const { obtenerVentasPendientes } = await import('@/lib/indexeddb')
      const pending = await obtenerVentasPendientes()
      if (pending.length === 0) { setSyncing(false); return }

      const { syncVentas } = await import('@/lib/sync-offline')
      await syncVentas(pending)
      await checkPending()
      setJustSynced(true)
      setTimeout(() => setJustSynced(false), 3000)
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  if (!mounted) return null
  if (isOnline && pendingCount === 0 && !justSynced) return null

  return (
    <div className={`px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-all ${
      !isOnline
        ? 'bg-red-500/15 border-b border-red-500/30 text-red-300'
        : justSynced
        ? 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300'
        : 'bg-amber-500/15 border-b border-amber-500/30 text-amber-300'
    }`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-xs">
            Sin conexión · {pendingCount > 0 ? `${pendingCount} venta(s) pendiente(s) de sincronizar` : 'Las ventas se guardarán localmente'}
          </span>
        </>
      ) : justSynced ? (
        <>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs">Sincronización completada</span>
        </>
      ) : (
        <>
          <RefreshCw className={`w-4 h-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
          <span className="flex-1 text-xs">{pendingCount} venta(s) pendiente(s) de sincronizar</span>
          <button
            onClick={syncPendingVentas}
            disabled={syncing}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs transition-all disabled:opacity-50"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </>
      )}
    </div>
  )
}
