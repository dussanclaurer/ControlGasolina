import UsuariosClient from '@/components/usuarios-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Usuarios | Control Social de Combustible',
}

export default function UsuariosPage() {
  return <UsuariosClient />
}
