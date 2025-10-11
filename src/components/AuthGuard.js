'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { apiPath } from '@/lib/api'

export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      const response = await fetch(apiPath('/api/auth/verify'))
      const data = await response.json()

      if (data.success && data.user) {
        setIsAuthenticated(true)
        setUser(data.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
        // Admin sayfalarından login'e yönlendir
        if (pathname.startsWith('/admin')) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      setUser(null)
      if (pathname.startsWith('/admin')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Kimlik doğrulanıyor...</p>
        </div>
      </div>
    )
  }

  // Admin sayfalarında auth kontrolü
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-md">
              <p className="text-red-600 font-medium mb-4">Erişim Reddedildi</p>
              <p className="text-red-500 text-sm mb-4">Bu sayfaya erişmek için giriş yapmalısınız.</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Giriş Sayfasına Git
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  return children
}