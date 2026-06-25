import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      surtidorId?: string
      surtidorNombre?: string
    } & DefaultSession['user']
  }
}
