import type { VentaOffline } from './indexeddb'
import { eliminarVentaOffline } from './indexeddb'
import { registrarVenta } from '@/actions/ventas'

export async function syncVentas(ventas: VentaOffline[]): Promise<void> {
  for (const venta of ventas) {
    try {
      const result = await registrarVenta({
        ci: venta.ci,
        nombreCliente: venta.nombreCliente,
        numeroChasis: venta.numeroChasis,
        montoBs: venta.montoBs,
        latitudDispositivo: venta.latitudDispositivo,
        longitudDispositivo: venta.longitudDispositivo,
        offlineId: venta.offlineId,
      })
      if (result.success) {
        await eliminarVentaOffline(venta.offlineId)
      }
    } catch (err) {
      console.error(`Error syncing offline venta ${venta.offlineId}:`, err)
    }
  }
}
