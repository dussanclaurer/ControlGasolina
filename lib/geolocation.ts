/**
 * Calculates distance between two GPS coordinates using Haversine formula.
 * Returns distance in meters.
 */
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export const RADIO_TOLERANCIA_METROS = 100

export function validarGeolocalizacion(
  latDispositivo: number,
  lonDispositivo: number,
  latSurtidor: number,
  lonSurtidor: number
): { valido: boolean; distancia: number } {
  const distancia = calcularDistancia(latDispositivo, lonDispositivo, latSurtidor, lonSurtidor)
  return { valido: distancia <= RADIO_TOLERANCIA_METROS, distancia: Math.round(distancia) }
}

export type GeolocationResult =
  | { success: true; latitud: number; longitud: number }
  | { success: false; error: string }

export async function obtenerGeolocalizacion(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ success: false, error: 'Geolocalización no soportada en este dispositivo' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        success: true,
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
      }),
      (error) => {
        const messages: Record<number, string> = {
          1: 'Permiso de ubicación denegado',
          2: 'Ubicación no disponible',
          3: 'Tiempo de espera agotado',
        }
        resolve({ success: false, error: messages[error.code] || 'Error al obtener ubicación' })
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 30000 }
    )
  })
}
