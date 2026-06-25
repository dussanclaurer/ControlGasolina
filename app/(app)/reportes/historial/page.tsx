import HistorialClient from '@/components/historial-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Historial | Control Social de Combustible',
}

export default function HistorialPage() {
  return <HistorialClient />
}
