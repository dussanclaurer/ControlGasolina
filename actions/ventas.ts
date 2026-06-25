'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { validarGeolocalizacion } from '@/lib/geolocation'
import { z } from 'zod'

const PRECIO_POR_LITRO = 6.96

const ventaSchema = z.object({
  ci: z.string().min(5, 'CI debe tener al menos 5 caracteres').max(20),
  nombreCliente: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  numeroChasis: z.string().min(5, 'Número de chasis inválido'),
  montoBs: z.number().positive('El monto debe ser mayor a 0'),
  latitudDispositivo: z.number().optional(),
  longitudDispositivo: z.number().optional(),
  offlineId: z.string().optional(),
})

type VentaInput = z.infer<typeof ventaSchema>

export async function registrarVenta(data: VentaInput) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'No autenticado' }

  const parsed = ventaSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { ci, nombreCliente, numeroChasis, montoBs, latitudDispositivo, longitudDispositivo, offlineId } = parsed.data

  const operario = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { surtidor: true },
  })

  if (!operario?.surtidorId || !operario.surtidor) {
    return { success: false, error: 'El operario no tiene un surtidor asignado. Contacte al supervisor.' }
  }

  // Validar geolocalización
  if (latitudDispositivo && longitudDispositivo) {
    const geoResult = validarGeolocalizacion(
      latitudDispositivo, longitudDispositivo,
      operario.surtidor.latitud, operario.surtidor.longitud
    )
    if (!geoResult.valido) {
      return {
        success: false,
        error: `Ubicación fuera del rango permitido. Distancia al surtidor: ${geoResult.distancia}m (máximo 100m)`,
        distancia: geoResult.distancia,
      }
    }
  }

  // Bloqueo diario: 1 vez por CI + chasis en el mismo surtidor
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  const ventaExistente = await prisma.venta.findFirst({
    where: {
      ci: ci.toUpperCase(),
      numeroChasis: numeroChasis.toUpperCase(),
      surtidorId: operario.surtidorId,
      fecha: { gte: hoy, lt: manana },
      estado: 'APROBADA',
    },
  })

  if (ventaExistente) {
    return {
      success: false,
      bloqueado: true,
      error: `El vehículo (CI: ${ci}, Chasis: ${numeroChasis}) ya fue atendido hoy en este surtidor a las ${new Date(ventaExistente.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`,
    }
  }

  // Verificar offlineId duplicado
  if (offlineId) {
    const ventaDuplicada = await prisma.venta.findUnique({ where: { offlineId } })
    if (ventaDuplicada) {
      return { success: true, message: 'Venta ya registrada (sync duplicado)', venta: ventaDuplicada }
    }
  }

  const litros = montoBs / PRECIO_POR_LITRO

  const venta = await prisma.venta.create({
    data: {
      ci: ci.toUpperCase(),
      nombreCliente,
      numeroChasis: numeroChasis.toUpperCase(),
      montoBs,
      litros,
      precioPorLitro: PRECIO_POR_LITRO,
      surtidorId: operario.surtidorId,
      operarioId: operario.id,
      latitudDispositivo,
      longitudDispositivo,
      estado: 'APROBADA',
      offlineId: offlineId ?? undefined,
    },
    include: {
      surtidor: { select: { nombre: true } },
      operario: { select: { name: true } },
    },
  })

  revalidatePath('/reportes')
  return { success: true, venta, message: 'Venta registrada exitosamente' }
}

export async function obtenerVentasHoy(surtidorId?: string) {
  const session = await auth()
  if (!session?.user) return []

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  const where: any = { fecha: { gte: hoy, lt: manana }, estado: 'APROBADA' }
  if (surtidorId) where.surtidorId = surtidorId

  return prisma.venta.findMany({
    where,
    include: {
      surtidor: { select: { nombre: true } },
      operario: { select: { name: true } },
    },
    orderBy: { fecha: 'desc' },
  })
}

export async function obtenerEstadisticasHoy() {
  const session = await auth()
  if (!session?.user) return null

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  const whereHoy = { fecha: { gte: hoy, lt: manana }, estado: 'APROBADA' as const }

  const [totalVentas, totales, ventasPorSurtidor] = await Promise.all([
    prisma.venta.count({ where: whereHoy }),
    prisma.venta.aggregate({ where: whereHoy, _sum: { montoBs: true, litros: true } }),
    prisma.venta.groupBy({
      by: ['surtidorId'],
      where: whereHoy,
      _count: { id: true },
      _sum: { montoBs: true, litros: true },
    }),
  ])

  const surtidores = await prisma.surtidor.findMany({
    where: { id: { in: ventasPorSurtidor.map((v) => v.surtidorId) } },
    select: { id: true, nombre: true },
  })

  return {
    totalVentas,
    totalBs: totales._sum.montoBs ?? 0,
    totalLitros: totales._sum.litros ?? 0,
    ventasPorSurtidor: ventasPorSurtidor.map((v) => ({
      ...v,
      surtidor: surtidores.find((s) => s.id === v.surtidorId),
    })),
  }
}

export async function obtenerHistorial(params: {
  page?: number
  pageSize?: number
  ci?: string
  surtidorId?: string
  fechaDesde?: string
  fechaHasta?: string
}) {
  const session = await auth()
  if (!session?.user) return { ventas: [], total: 0 }

  const { page = 1, pageSize = 20, ci, surtidorId, fechaDesde, fechaHasta } = params
  const where: any = { estado: 'APROBADA' }

  if (ci) where.ci = { contains: ci.toUpperCase(), mode: 'insensitive' }
  if (surtidorId) where.surtidorId = surtidorId
  if (fechaDesde || fechaHasta) {
    where.fecha = {}
    if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      where.fecha.lte = hasta
    }
  }

  const [ventas, total] = await Promise.all([
    prisma.venta.findMany({
      where,
      include: {
        surtidor: { select: { nombre: true } },
        operario: { select: { name: true } },
      },
      orderBy: { fecha: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.venta.count({ where }),
  ])

  return { ventas, total }
}
