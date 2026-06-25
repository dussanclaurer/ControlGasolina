import SurtidoresClient from '@/components/surtidores-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Surtidores | Control Social de Combustible',
}

export default function SurtidoresPage() {
  return <SurtidoresClient />
}
