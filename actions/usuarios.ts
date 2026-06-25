'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'Nombre requerido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres').optional(),
  role: z.enum(['OPERARIO', 'SUPERVISOR']),
  surtidorId: z.string().nullable().optional(),
})

export async function obtenerUsuarios() {
  const session = await auth()
  if (session?.user?.role !== 'SUPERVISOR') return []

  return prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true, surtidorId: true,
      surtidor: { select: { nombre: true } }, createdAt: true,
    },
    orderBy: { name: 'asc' },
  })
}

export async function crearUsuario(data: z.infer<typeof usuarioSchema>) {
  const session = await auth()
  if (session?.user?.role !== 'SUPERVISOR') return { success: false, error: 'Sin permisos' }

  const parsed = usuarioSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { email, name, password, role, surtidorId } = parsed.data
  if (!password) return { success: false, error: 'Contraseña requerida' }

  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) return { success: false, error: 'El email ya está registrado' }

  const hashedPassword = await bcrypt.hash(password, 12)
  const usuario = await prisma.user.create({
    data: { email, name, password: hashedPassword, role, surtidorId: surtidorId || null },
  })
  revalidatePath('/admin/usuarios')
  return { success: true, usuario: { id: usuario.id, email: usuario.email, name: usuario.name } }
}

export async function actualizarUsuario(id: string, data: z.infer<typeof usuarioSchema>) {
  const session = await auth()
  if (session?.user?.role !== 'SUPERVISOR') return { success: false, error: 'Sin permisos' }

  const parsed = usuarioSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { email, name, password, role, surtidorId } = parsed.data
  const updateData: any = { email, name, role, surtidorId: surtidorId || null }
  if (password) updateData.password = await bcrypt.hash(password, 12)

  const usuario = await prisma.user.update({ where: { id }, data: updateData })
  revalidatePath('/admin/usuarios')
  return { success: true, usuario }
}

export async function eliminarUsuario(id: string) {
  const session = await auth()
  if (session?.user?.role !== 'SUPERVISOR') return { success: false, error: 'Sin permisos' }
  if (session.user.id === id) return { success: false, error: 'No puedes eliminarte a ti mismo' }

  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/usuarios')
  return { success: true }
}
