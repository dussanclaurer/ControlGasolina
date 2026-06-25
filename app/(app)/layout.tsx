import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppNavbar from '@/components/app-navbar'
import OfflineBanner from '@/components/offline-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <AppNavbar user={session.user} />
      <OfflineBanner />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
