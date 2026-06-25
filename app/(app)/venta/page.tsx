import VentaForm from '@/components/venta-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nueva Venta | Control Social de Combustible',
}

export default function VentaPage() {
  return <VentaForm />
}
