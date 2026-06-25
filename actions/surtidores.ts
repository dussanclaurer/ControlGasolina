'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const surtidorSchema = z.object({
  nombre: z.string().min(3, 'Nombre requerido'),
  direccion: z.string().optional(),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  activo: z.boolean().default(true),
})

export async function obtenerSurtidores() {
  return prisma.surtidor.findMany({ orderBy: { nombre: 'asc' } })
}

export async function obtenerSurtidoresActivos() {
  return prisma.surtidor.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } })
}

export async function crearSurtidor(data: z.infer<typeof surtidorSchema>) {
  const session = await auth()
  if (session?.user?.role !== 'SUPERVISOR') return { success: false, error: 'Sin permisos' }

  const parsed = surtidorSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const surtidor = await prisma.surtidor.create({ data: parsed.data })
  revalidatePath('/admin/surtidores')
  return { success: true, surtidor }
}

export async function actualizarSurtidor(id: string, data: z.infer<typeof surtidorSchema>) {
  const session = await auth()
  if (session?.user?.role !== 'SUPERVISOR') return { success: false, error: 'Sin permisos' }

  const parsed = surtidorSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const surtidor = await prisma.surtidor.update({ where: { id }, data: parsed.data })
  revalidatePath('/admin/surtidores')
  return { success: true, surtidor }
}

export async function eliminarSurtidor(id: string) {
  const session = await auth()
  if (session?.user?.role !== 'SUPERVISOR') return { success: false, error: 'Sin permisos' }

  await prisma.surtidor.update({ where: { id }, data: { activo: false } })
  revalidatePath('/admin/surtidores')
  return { success: true }
}
