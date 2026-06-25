import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { registrarVenta } from '@/actions/ventas'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { ventas } = body

  if (!Array.isArray(ventas)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const results = []
  for (const venta of ventas) {
    const result = await registrarVenta(venta)
    results.push({ offlineId: venta.offlineId, ...result })
  }

  return NextResponse.json({ results })
}
