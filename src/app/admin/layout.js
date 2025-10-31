// src/app/admin/layout.js - Real Notifications Version (Fixed)

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  ChevronLeft,  // 🆕 Collapse icon
  ChevronRight, // 🆕 Expand icon
  User,
  HelpCircle,
  BarChart3,  // 🆕 EKLE
  Activity,
  Clock,
  MessageSquare,  // 🆕 EKLE
  CheckCircle
} from 'lucide-react'

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { href: '/admin/categories', icon: FileText, label: 'Kategoriler', badge: null },
  { href: '/admin/ingredients', icon: ChefHat, label: 'Malzemeler', badge: null },
  { href: '/admin/menu', icon: MenuIcon, label: 'Menü', badge: null },
  { href: '/admin/tables', icon: Users, label: 'Masalar', badge: null },
  { href: '/admin/reports', icon: BarChart3, label: 'Raporlar', badge: null }, // 🆕 EKLE
  { href: '/admin/orders', icon: ShoppingCart, label: 'Siparişler', badge: 'hot' },
  { href: '/admin/sessions', icon: Wifi, label: 'Oturumlar', badge: null },
  { href: '/admin/feedback', icon: MessageSquare, label: 'Geri Bildirimler', badge: null }, // 🆕 EKLE
  { href: '/admin/qr', icon: QrCode, label: 'QR Kodlar', badge: null },
  { href: '/admin/users', icon: UserCog, label: 'Kullanıcılar', badge: null },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // 🆕 Collapsible state
  const [isMobile, setIsMobile] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  
  // 🆕 REAL NOTIFICATIONS STATE
  const [notifications, setNotifications] = useState(0)
  const [notificationsList, setNotificationsList] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const previousOrderCountRef = useRef(0)

  // Debug: notifications değişikliklerini logla
  useEffect(() => {
    console.log('🔔 [LAYOUT] Notifications state changed:', notifications)
  }, [notifications])
  
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

  // 🆕 LOAD/SAVE COLLAPSED STATE
  useEffect(() => {
    // localStorage'dan collapsed durumu yükle
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])

  useEffect(() => {
    // Collapsed durumu localStorage'a kaydet
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString())
  }, [sidebarCollapsed])

  // 🆕 LOAD REAL NOTIFICATIONS
  const loadNotifications = useCallback(async () => {
    try {
      console.log('🔍 [LAYOUT] Loading notifications...')
      
      // Aktif (tamamlanmamış) siparişleri çek
      const params = new URLSearchParams({
        groupByTable: 'true',  // ✅ BU ÖNEMLİ! originalOrders için gerekli
        excludeCompleted: 'true',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: '10'
      })

      const res = await fetch(apiPath(`/api/orders?${params}`))
      const data = await res.json()

      console.log('📦 [LAYOUT] API Response:', {
        success: data.success,
        ordersCount: data.originalOrders?.length,
        orders: data.originalOrders
      })

      if (data.success) {
        // ✅ FALLBACK: originalOrders yoksa orders kullan
        const orders = data.originalOrders || data.orders || []
        setRecentOrders(orders)

        console.log('📋 [LAYOUT] Orders data:', {
          hasOriginalOrders: !!data.originalOrders,
          hasOrders: !!data.orders,
          finalCount: orders.length,
          sampleOrder: orders[0]
        })

        // Yeni sipariş kontrolü
        const currentCount = orders.length
        const previousCount = previousOrderCountRef.current

        console.log('🔔 [LAYOUT] Count Check:', {
          currentCount,
          previousCount,
          isFirstLoad: previousCount === 0,
          hasNewOrders: currentCount > previousCount
        })

        // İlk yükleme değilse ve artış varsa
        if (previousCount > 0 && currentCount > previousCount) {
          const newOrdersCount = currentCount - previousCount
          console.log('✅ [LAYOUT] NEW ORDERS DETECTED!', newOrdersCount)
          
          setNotifications(prev => {
            const newVal = prev + newOrdersCount
            console.log('🔔 [LAYOUT] Notification badge:', prev, '->', newVal)
            return newVal
          })
          
          // Yeni siparişleri bildirim listesine ekle
          const newOrders = orders.slice(0, newOrdersCount)
          const newNotifications = newOrders.map(order => ({
            id: order._id,
            title: '🆕 Yeni Sipariş',
            message: `Masa ${order.tableNumber} - ${order.items?.length || 0} ürün`,
            time: getTimeAgo(order.createdAt),
            timestamp: order.createdAt,
            unread: true,
            type: 'order',
            orderId: order._id,
            tableNumber: order.tableNumber
          }))

          console.log('📋 [LAYOUT] Adding notifications:', newNotifications)
          setNotificationsList(prev => [...newNotifications, ...prev].slice(0, 20))
        } else {
          console.log('ℹ️ [LAYOUT] No new orders (first load or no increase)')
        }

        // Güncel sayıyı kaydet
        console.log('💾 [LAYOUT] Saving count to ref:', currentCount)
        previousOrderCountRef.current = currentCount
        
        // localStorage'a kaydet
        try {
          localStorage.setItem('adminLastOrderCount', currentCount.toString())
          console.log('💾 [LAYOUT] Saved to localStorage:', currentCount)
        } catch (e) {
          console.error('localStorage save error:', e)
        }
      }
    } catch (error) {
      console.error('❌ [LAYOUT] Load notifications error:', error)
    }
  }, [])

  // 🆕 TIME AGO HELPER
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Az önce'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} dk önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    return `${Math.floor(hours / 24)} gün önce`
  }

  // 🆕 AUTO-REFRESH NOTIFICATIONS (15 saniye)
  useEffect(() => {
    console.log('🔄 [LAYOUT] Setting up auto-refresh (15s interval)')
    loadNotifications()
    const interval = setInterval(() => {
      console.log('⏰ [LAYOUT] Auto-refresh triggered')
      loadNotifications()
    }, 15000)
    return () => {
      console.log('🛑 [LAYOUT] Cleaning up interval')
      clearInterval(interval)
    }
  }, [loadNotifications])

  // 🆕 İLK YÜKLEME - localStorage'dan son sayıyı al
  useEffect(() => {
    try {
      const savedCount = localStorage.getItem('adminLastOrderCount')
      console.log('📂 [LAYOUT] Loading from localStorage:', savedCount)
      
      if (savedCount) {
        previousOrderCountRef.current = parseInt(savedCount)
        console.log('✅ [LAYOUT] Loaded previousCount:', previousOrderCountRef.current)
      } else {
        console.log('⚠️ [LAYOUT] No saved count, starting fresh')
      }
    } catch (error) {
      console.error('❌ [LAYOUT] localStorage error:', error)
    }
  }, [])

  // 🆕 BİLDİRİM TIKLANDIĞINDA
  const handleNotificationClick = useCallback((notif) => {
    if (notif.type === 'order' && notif.orderId) {
      router.push('/admin/orders')
      setNotificationOpen(false)
      
      // Bu bildirimi okundu işaretle
      setNotificationsList(prev => 
        prev.map(n => n.id === notif.id ? { ...n, unread: false } : n)
      )
      setNotifications(prev => Math.max(0, prev - 1))
    }
  }, [router])

  // 🆕 TÜM BİLDİRİMLERİ OKUNDU İŞARETLE
  const markAllAsRead = useCallback(() => {
    setNotificationsList(prev => prev.map(n => ({ ...n, unread: false })))
    setNotifications(0)
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
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

  // 🆕 TOGGLE COLLAPSE
  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const currentPageTitle = useMemo(() => {
    return menuItems.find(item => item.href === pathname)?.label || 'Admin Panel'
  }, [pathname])

  // 🆕 STATUS ICON HELPER
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'preparing': return ChefHat
      case 'ready': return CheckCircle
      default: return ShoppingCart
    }
  }

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
            animate={{ 
              x: 0,
              width: isMobile ? 280 : (sidebarCollapsed ? 80 : 280) 
            }}
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
              inset-y-0 left-0 z-50 transition-all duration-300
              ${sidebarCollapsed && !isMobile ? 'w-20' : 'w-72'}
              bg-white border-r border-gray-200 
              flex flex-col shadow-2xl
            `}
          >
            {/* Logo Section */}
            <div className={`h-16 flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'} px-6 border-b border-gray-100`}>
              <motion.div 
                className={`flex items-center gap-3 ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                {!(sidebarCollapsed && !isMobile) && (
                  <div>
                    <h1 className="font-bold text-gray-900 text-lg">Restaurant</h1>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                )}
              </motion.div>
              
              {isMobile && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: sidebarCollapsed && !isMobile ? 0 : 4 }}
                      whileTap={{ scale: 0.98 }}
                      title={sidebarCollapsed && !isMobile ? item.label : undefined}
                      className={`
                        flex items-center gap-3 ${sidebarCollapsed && !isMobile ? 'justify-center' : ''} px-4 py-3 rounded-xl
                        transition-all duration-200 relative group
                        ${isActive 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-amber-600'}`} />
                      {!(sidebarCollapsed && !isMobile) && (
                        <>
                          <span className="font-medium flex-1">{item.label}</span>
                          
                          {item.badge === 'hot' && (
                            <motion.span 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full"
                            >
                              HOT
                            </motion.span>
                          )}
                        </>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {sidebarCollapsed && !isMobile && item.badge === 'hot' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      )}                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </nav>

            {/* User Section & Collapse Toggle */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              {/* Collapse Toggle Button - Desktop Only */}
              {!isMobile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleCollapse}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group"
                  title={sidebarCollapsed ? 'Sidebar\'ı Genişlet' : 'Sidebar\'ı Daralt'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                  ) : (
                    <>
                      <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-amber-600" />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-amber-600">Daralt</span>
                    </>
                  )}
                </motion.button>
              )}
              
              {/* User Info */}
              <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-xl ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                {!(sidebarCollapsed && !isMobile) && (
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">Admin User</p>
                    <p className="text-xs text-gray-500">admin@restaurant.com</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-30">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <MenuIcon className="w-6 h-6 text-gray-600" />
            </motion.button>

            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-gray-900">{currentPageTitle}</h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-600"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Ara...</span>
              <kbd className="px-2 py-0.5 bg-white rounded text-xs font-mono">⌘K</kbd>
            </motion.button>

            {/* Dark Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
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
                onClick={() => {
                  console.log('🔔 [LAYOUT] Bell clicked. Current notifications:', notifications)
                  setNotificationOpen(!notificationOpen)
                }}
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
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {notifications} yeni bildirim
                          </p>
                        </div>
                        {notifications > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Tümünü Okundu İşaretle
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notificationsList.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Henüz bildirim yok</p>
                        </div>
                      ) : (
                        notificationsList.map((notif) => {
                          const StatusIcon = getStatusIcon(notif.status)
                          return (
                            <motion.div
                              key={notif.id}
                              whileHover={{ backgroundColor: '#f9fafb' }}
                              onClick={() => handleNotificationClick(notif)}
                              className="p-4 border-b border-gray-50 cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                {notif.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                )}
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                    <StatusIcon className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-100">
                      <Link
                        href="/admin/orders"
                        onClick={() => setNotificationOpen(false)}
                        className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Tüm Siparişleri Gör
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu */}
            <div className="relative profile-menu">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="profile-button flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
              </motion.button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">Admin User</p>
                      <p className="text-xs text-gray-500">admin@restaurant.com</p>
                    </div>

                    <div className="py-2">
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="w-4 h-4" />
                        Ayarlar
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <HelpCircle className="w-4 h-4" />
                        Yardım
                      </button>
                    </div>

                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ara..."
                    className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">ESC</kbd>
                </div>
                <div className="p-4 text-center text-gray-500 text-sm">
                  Arama özelliği yakında eklenecek...
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}