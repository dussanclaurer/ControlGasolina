'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Fuel, BarChart3, Settings, Users, LogOut, History, ChevronDown } from 'lucide-react'
import { useState } from 'react'

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface AppNavbarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
    surtidorNombre?: string
  }
}

export default function AppNavbar({ user }: AppNavbarProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const isSupervisor = user.role === 'SUPERVISOR'

  const navLinks = isSupervisor
    ? [
        { href: '/reportes', label: 'Reportes', icon: BarChart3 },
        { href: '/reportes/historial', label: 'Historial', icon: History },
        { href: '/admin/surtidores', label: 'Surtidores', icon: Fuel },
        { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
      ]
    : [{ href: '/venta', label: 'Nueva Venta', icon: Fuel }]

  const isActive = (href: string) => pathname === href || (href !== '/venta' && pathname.startsWith(href + '/'))

  return (
    <>
      {/* Desktop top navbar */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 items-center px-6 gap-6">
        <div className="flex items-center gap-2.5 mr-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Fuel className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Control Social</span>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive(href)
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white leading-none">{user.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isSupervisor ? 'Supervisor' : (user.surtidorNombre ?? 'Operario')}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Fuel className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Control Social</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 text-sm text-slate-300 py-1.5 px-2 rounded-lg hover:bg-slate-800 transition-all"
          >
            <span className="max-w-24 truncate">{user.name?.split(' ')[0]}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-3 py-2.5 border-b border-slate-700">
                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isSupervisor ? 'Supervisor' : (user.surtidorNombre ?? 'Operario')}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ul className="flex justify-around items-center h-14">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href} className="flex-1 h-full">
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center h-full w-full gap-0.5 text-xs font-medium transition-all ${
                    active ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`} />
                  <span className="text-[10px] truncate max-w-full px-1 leading-tight">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
