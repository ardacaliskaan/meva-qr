// src/app/admin/layout.js - Ultra Professional Version

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { apiPath } from '@/lib/api'

import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  Users, 
  ShoppingCart, 
  QrCode, 
  FileText,
  ChefHat,
  LogOut,
  X,
  Settings,
  Wifi,
  Bell,
  UserCog,
  Search,
  Moon,
  Sun,
  ChevronDown,
  User,
  HelpCircle,
  Activity
} from 'lucide-react'

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { href: '/admin/categories', icon: FileText, label: 'Kategoriler', badge: null },
  { href: '/admin/ingredients', icon: ChefHat, label: 'Malzemeler', badge: null },
  { href: '/admin/menu', icon: MenuIcon, label: 'Menü', badge: null },
  { href: '/admin/tables', icon: Users, label: 'Masalar', badge: null },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Siparişler', badge: 'hot' },
  { href: '/admin/sessions', icon: Wifi, label: 'Oturumlar', badge: null },
  { href: '/admin/qr', icon: QrCode, label: 'QR Kodlar', badge: null },
  { href: '/admin/users', icon: UserCog, label: 'Kullanıcılar', badge: null },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(3)
  
  const router = useRouter()
  const pathname = usePathname()

  // Swipe to close gesture
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-280, 0], [0, 1])

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
    setProfileMenuOpen(false)
    setNotificationOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-menu') && !e.target.closest('.profile-button')) {
        setProfileMenuOpen(false)
      }
      if (!e.target.closest('.notification-menu') && !e.target.closest('.notification-button')) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      // Escape to close
      if (e.key === 'Escape') {
        setSidebarOpen(false)
        setSearchOpen(false)
        setProfileMenuOpen(false)
        setNotificationOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch(apiPath('/api/auth/logout'), { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [router])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  // Get current page title
  const currentPageTitle = useMemo(() => {
    return menuItems.find(item => item.href === pathname)?.label || 'Admin Panel'
  }, [pathname])

  // Mock notifications
  const notificationsList = [
    { id: 1, title: 'Yeni Sipariş', message: 'Masa 5 için yeni sipariş', time: '2 dk önce', unread: true },
    { id: 2, title: 'Stok Uyarısı', message: 'Malzeme stoğu azalıyor', time: '15 dk önce', unread: true },
    { id: 3, title: 'Sistem Güncelleme', message: 'Yeni özellikler eklendi', time: '1 saat önce', unread: false },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || sidebarOpen) && (
          <motion.aside
            initial={isMobile ? { x: -280 } : false}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: -280, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x < -100 || velocity.x < -500) {
                setSidebarOpen(false)
              }
            }}
            style={isMobile ? { x, opacity } : {}}
            className={`
              ${isMobile ? 'fixed' : 'relative'} 
              z-50 flex flex-col w-72 h-full bg-white border-r border-gray-200 shadow-2xl
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Link href="/admin" className="flex items-center space-x-3 group">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <ChefHat className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Meva Cafe
                  </h1>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Yetkili Panel
                  </p>
                </div>
              </Link>
              {isMobile && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              )}
            </div>

            {/* Search Bar in Sidebar */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700">Ara...</span>
                <kbd className="ml-auto text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group touch-manipulation
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      <span className="font-medium flex-1">{item.label}</span>
                      
                      {item.badge === 'hot' && (
                        <span className="flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                          HOT
                        </span>
                      )}
                      
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-1.5 h-1.5 bg-white rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all touch-manipulation group"
              >
                <Settings className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Ayarlar</span>
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all touch-manipulation group"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">Çıkış Yap</span>
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-200 shadow-sm z-30 touch-manipulation">
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors lg:hidden touch-manipulation"
            >
              <MenuIcon className="w-6 h-6 text-gray-600" />
            </motion.button>
            
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {currentPageTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Hoş geldiniz 👋
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Button - Desktop */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600" />
              <kbd className="hidden md:inline-block text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                ⌘K
              </kbd>
            </motion.button>

            {/* Dark Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors touch-manipulation"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>

            {/* Notifications */}
            <div className="relative notification-menu">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="notification-button relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors touch-manipulation"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {notifications}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                      <p className="text-xs text-gray-500 mt-1">{notifications} yeni bildirim</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notificationsList.map((notif) => (
                        <motion.div
                          key={notif.id}
                          whileHover={{ backgroundColor: '#f9fafb' }}
                          className="p-4 border-b border-gray-50 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            {notif.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Tümünü Gör
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Help */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="hidden md:block p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            {/* Profile Menu */}
            <div className="relative profile-menu">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="profile-button flex items-center space-x-2 sm:space-x-3 pl-3 sm:pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-r-xl transition-colors pr-2 py-1 touch-manipulation"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Yönetici</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">A</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Admin User</p>
                          <p className="text-xs text-gray-500">admin@mevacafe.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Profil</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Ayarlar</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Yardım</span>
                      </button>
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Çıkış Yap</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Search Modal */}
        <AnimatePresence>
          {searchOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Menü, sipariş, masa ara..."
                      autoFocus
                      className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                    />
                    <kbd className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      ESC
                    </kbd>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500 text-center py-8">
                      Arama yapmak için yazın...
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}