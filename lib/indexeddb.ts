/**
 * IndexedDB service for offline queue management.
 * Stores pending transactions when device is offline.
 */

const DB_NAME = 'control-gasolina-offline'
const DB_VERSION = 1
const STORE_NAME = 'ventas-pendientes'

export interface VentaOffline {
  offlineId: string
  ci: string
  nombreCliente: string
  numeroChasis: string
  montoBs: number
  litros: number
  surtidorId: string
  operarioId: string
  latitudDispositivo?: number
  longitudDispositivo?: number
  fecha: string // ISO string
  dispositivoInfo?: string
  syncStatus: 'PENDING' | 'SYNCING' | 'ERROR'
  errorMessage?: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'offlineId' })
        store.createIndex('syncStatus', 'syncStatus', { unique: false })
        store.createIndex('fecha', 'fecha', { unique: false })
      }
    }
  })
}

export async function guardarVentaOffline(venta: VentaOffline): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(venta)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

export async function obtenerVentasPendientes(): Promise<VentaOffline[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('syncStatus')
    const req = index.getAll('PENDING')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })
}

export async function eliminarVentaOffline(offlineId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(offlineId)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

export async function contarVentasPendientes(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('syncStatus')
    const req = index.count('PENDING')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })
}

export function generarOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
