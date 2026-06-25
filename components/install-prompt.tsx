'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed/running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true)
      return
    }

    // iOS Detection (iOS doesn't support beforeinstallprompt event yet)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    if (isIosDevice) {
      const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt')
      if (!hasSeenPrompt) {
        // Delay slighty so it doesn't pop up aggressively immediately
        setTimeout(() => setShowPrompt(true), 2000)
      }
    }

    // Android/Chrome install prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt')
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 2000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('hasSeenInstallPrompt', 'true')
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl z-[100] flex items-start gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
        <Download className="w-6 h-6 text-amber-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white text-sm">Instalar Control Gasolina</h3>
        <p className="text-slate-400 text-xs mt-1 mb-3 leading-relaxed">
          {isIos 
            ? 'Para instalar: toca el ícono "Compartir" en la barra inferior de tu navegador y selecciona "Añadir a la pantalla de inicio".'
            : 'Instala la aplicación en tu dispositivo para acceder rápidamente y asegurar el funcionamiento sin conexión.'}
        </p>
        
        {!isIos ? (
          <div className="flex gap-2">
            <button 
              onClick={handleInstall}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-lg shadow-amber-500/20"
            >
              Instalar App
            </button>
            <button 
              onClick={handleDismiss}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Ahora no
            </button>
          </div>
        ) : (
          <button 
            onClick={handleDismiss}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Entendido
          </button>
        )}
      </div>
      
      <button 
        onClick={handleDismiss} 
        className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
