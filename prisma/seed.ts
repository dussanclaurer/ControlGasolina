import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Surtidores de ejemplo (coordenadas de La Paz, Bolivia)
  const surtidores = await Promise.all([
    prisma.surtidor.upsert({
      where: { id: 'surtidor-001' },
      update: {},
      create: {
        id: 'surtidor-001',
        nombre: 'Surtidor Central - Villa Fátima',
        direccion: 'Av. Landaeta, Villa Fátima, La Paz',
        latitud: -16.4897,
        longitud: -68.1193,
        activo: true,
      },
    }),
    prisma.surtidor.upsert({
      where: { id: 'surtidor-002' },
      update: {},
      create: {
        id: 'surtidor-002',
        nombre: 'Surtidor Norte - Miraflores',
        direccion: 'Av. Busch, Miraflores, La Paz',
        latitud: -16.4792,
        longitud: -68.1121,
        activo: true,
      },
    }),
    prisma.surtidor.upsert({
      where: { id: 'surtidor-003' },
      update: {},
      create: {
        id: 'surtidor-003',
        nombre: 'Surtidor Sur - Calacoto',
        direccion: 'Calle 21 de Calacoto, La Paz',
        latitud: -16.5322,
        longitud: -68.0751,
        activo: true,
      },
    }),
  ])
  console.log(`✅ ${surtidores.length} surtidores creados`)

  // Supervisor
  const supervisorPassword = await bcrypt.hash('supervisor123', 12)
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@control.bo' },
    update: {},
    create: {
      email: 'supervisor@control.bo',
      name: 'Carlos Mendoza',
      password: supervisorPassword,
      role: 'SUPERVISOR',
    },
  })
  console.log(`✅ Supervisor creado: ${supervisor.email}`)

  // Operarios
  const operarioPassword = await bcrypt.hash('operario123', 12)
  const operarios = await Promise.all([
    prisma.user.upsert({
      where: { email: 'operario1@control.bo' },
      update: {},
      create: {
        email: 'operario1@control.bo',
        name: 'Juan Quispe',
        password: operarioPassword,
        role: 'OPERARIO',
        surtidorId: 'surtidor-001',
      },
    }),
    prisma.user.upsert({
      where: { email: 'operario2@control.bo' },
      update: {},
      create: {
        email: 'operario2@control.bo',
        name: 'Maria Mamani',
        password: operarioPassword,
        role: 'OPERARIO',
        surtidorId: 'surtidor-002',
      },
    }),
    prisma.user.upsert({
      where: { email: 'operario3@control.bo' },
      update: {},
      create: {
        email: 'operario3@control.bo',
        name: 'Pedro Flores',
        password: operarioPassword,
        role: 'OPERARIO',
        surtidorId: 'surtidor-003',
      },
    }),
  ])
  console.log(`✅ ${operarios.length} operarios creados`)

  console.log('\n📋 Credenciales de acceso:')
  console.log('  Supervisor : supervisor@control.bo / supervisor123')
  console.log('  Operario 1 : operario1@control.bo / operario123 → Surtidor Central')
  console.log('  Operario 2 : operario2@control.bo / operario123 → Surtidor Norte')
  console.log('  Operario 3 : operario3@control.bo / operario123 → Surtidor Sur')
  console.log('\n✅ Seed completado exitosamente!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
