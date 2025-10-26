// src/app/admin/orders/page.js - COMPLETE VERSION WITH NOTIFICATIONS
'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, Search, Filter, Eye, Trash2, X, Plus,
  Package, ChefHat, CheckCircle, AlertCircle, XCircle,
  MapPin, MessageSquare, DollarSign, RefreshCw,
  Coffee, Download, Printer, BarChart3, Activity, 
  Grid, List, Volume2, VolumeX, ShoppingCart,
  Settings, Bell, BellOff, Play,
  Maximize, Minimize, Users // 🆕 FULLSCREEN ICONS + USERS
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function AdminOrdersPage() {
  // State Management
  const [orders, setOrders] = useState([])
  const [originalOrders, setOriginalOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [selectedTable, setSelectedTable] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  
  // 🆕 MANUEL ÜRÜN EKLEME
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemNotes, setItemNotes] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [menuSearchTerm, setMenuSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // 🆕 MASA AÇMA SİSTEMİ
  const [showOpenTableModal, setShowOpenTableModal] = useState(false)
  const [availableTables, setAvailableTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [selectedTableToOpen, setSelectedTableToOpen] = useState(null)
  const [openingTable, setOpeningTable] = useState(false)
  
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [fullScreenMode, setFullScreenMode] = useState(false) // 🆕 KITCHEN DISPLAY MODE
  
  // 🔔 Notification Settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [volume, setVolume] = useState(0.7)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const audioRef = useRef(null)
  const previousOrderCountRef = useRef(0)

  const statusConfig = {
    pending: { label: 'Bekliyor', color: 'yellow', icon: Clock, gradient: 'from-yellow-400 to-orange-500' },
    confirmed: { label: 'Onaylandı', color: 'blue', icon: CheckCircle, gradient: 'from-blue-500 to-indigo-600' },
    preparing: { label: 'Hazırlanıyor', color: 'blue', icon: ChefHat, gradient: 'from-blue-500 to-indigo-600' },
    ready: { label: 'Hazır', color: 'green', icon: CheckCircle, gradient: 'from-green-500 to-emerald-600' },
    delivered: { label: 'Teslim Edildi', color: 'purple', icon: Package, gradient: 'from-purple-500 to-pink-600' },
    completed: { label: 'Tamamlandı', color: 'gray', icon: CheckCircle, gradient: 'from-gray-500 to-gray-600' },
    cancelled: { label: 'İptal', color: 'red', icon: XCircle, gradient: 'from-red-500 to-red-600' }
  }

  // 🔔 Load notification settings
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        setNotificationEnabled(true)
      }
    }
    
    try {
      const savedVolume = localStorage.getItem('orderNotificationVolume')
      const savedSound = localStorage.getItem('orderSoundEnabled')
      const savedNotif = localStorage.getItem('orderNotificationEnabled')
      const savedOrderCount = localStorage.getItem('lastOrderCount')
      
      if (savedOrderCount) {
        previousOrderCountRef.current = parseInt(savedOrderCount)
      }
      
      if (savedVolume) setVolume(parseFloat(savedVolume))
      if (savedSound !== null) setSoundEnabled(savedSound === 'true')
      if (savedNotif !== null && Notification.permission === 'granted') {
        setNotificationEnabled(savedNotif === 'true')
      }
    } catch (error) {
      console.error('LocalStorage error:', error)
    }
  }, [])

  // Save volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    try {
      localStorage.setItem('orderNotificationVolume', volume.toString())
    } catch (error) {
      console.error('LocalStorage save error:', error)
    }
  }, [volume])

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('orderSoundEnabled', soundEnabled.toString())
      localStorage.setItem('orderNotificationEnabled', notificationEnabled.toString())
    } catch (error) {
      console.error('LocalStorage save error:', error)
    }
  }, [soundEnabled, notificationEnabled])

  // Auto refresh (5 saniye)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadOrders()
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 5000) // 5 saniyede bir yenile
      return () => clearInterval(interval)
    }
  }, [filterStatus, dateFilter, autoRefresh])

  // 🚨 Detect new orders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (originalOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      const diff = originalOrders.length - previousOrderCountRef.current
      handleNewOrderNotification()
    }

    if (originalOrders.length >= 0) {
      previousOrderCountRef.current = originalOrders.length
      localStorage.setItem('lastOrderCount', originalOrders.length.toString())
    }
  }, [originalOrders.length])

  // 🆕 ESC tuşu ile fullscreen'den çık
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && fullScreenMode) {
        setFullScreenMode(false)
        toast.success('Tam ekran modundan çıkıldı', { icon: '👋' })
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [fullScreenMode])

  const playNotificationSound = () => {
    if (!soundEnabled || !audioRef.current) return
    
    try {
      // Force reload audio (cache bypass)
      audioRef.current.load()
      audioRef.current.volume = volume
      audioRef.current.currentTime = 0
      
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Audio play prevented:', error)
          // iOS Safari için user interaction gerekiyor
          if (error.name === 'NotAllowedError') {
            toast.error('Ses çalınamadı. Sayfayla etkileşime geçin.', {
              duration: 2000,
              icon: '🔇'
            })
          }
        })
      }
    } catch (error) {
      console.error('Sound play error:', error)
    }
  }

  const triggerVibration = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
    } catch (error) {
      console.error('Vibration error:', error)
    }
  }

  const showBrowserNotification = (title, body, options = {}) => {
    if (!notificationEnabled || notificationPermission !== 'granted') return

    try {
      const notification = new Notification(title, {
        body,
        tag: 'new-order',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        silent: false,
        ...options
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        
        if (orders.length > 0) {
          const newestTable = orders[0]
          setSelectedTable(newestTable)
          setShowModal(true)
        }
      }

      setTimeout(() => notification.close(), 10000)
      
    } catch (error) {
      console.error('Browser notification error:', error)
    }
  }

  const handleNewOrderNotification = () => {
    const newOrdersCount = originalOrders.length - previousOrderCountRef.current
    
    if (soundEnabled) {
      playNotificationSound()
    }
    
    triggerVibration()
    
    toast.success(
      `${newOrdersCount} yeni sipariş geldi! 🎉`,
      {
        duration: 5000,
        icon: '🔔',
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px'
        }
      }
    )
    
    if (notificationEnabled) {
      showBrowserNotification(
        '🍽️ Yeni Sipariş Geldi!',
        `${newOrdersCount} yeni sipariş aldınız. Toplam ${originalOrders.length} aktif sipariş.`
      )
    }
  }

  const testSound = () => {
    playNotificationSound()
    triggerVibration()
    toast.success('Test sesi çalındı!', { icon: '✅' })
  }

  const testNotifications = () => {
    playNotificationSound()
    triggerVibration()
    showBrowserNotification('🧪 Test Bildirimi', 'Bildirimler düzgün çalışıyor! ✅')
    toast.success('Test bildirimi gönderildi!', { icon: '✅' })
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tarayıcınız bildirimleri desteklemiyor')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      
      if (permission === 'granted') {
        setNotificationEnabled(true)
        toast.success('Bildirimler açıldı! 🔔', { duration: 3000 })
        
        setTimeout(() => {
          showBrowserNotification('✅ Bildirimler Aktif!', 'Yeni siparişler için bildirim alacaksınız.')
        }, 500)
      } else if (permission === 'denied') {
        setNotificationEnabled(false)
        toast.error('Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsiniz.')
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      toast.error('Bildirim izni alınamadı')
    }
  }

  const loadOrders = async (silent = false) => {
    try {
      if (!silent && !loading) setRefreshing(true)
      
      const params = new URLSearchParams({
        groupByTable: 'true',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        today: dateFilter === 'today' ? 'true' : 'false',
        excludeCompleted: 'true',
        includeTableInfo: 'true',
        includeMenuImages: 'true'
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(apiPath(`/api/orders?${params}`))
      const data = await res.json()

      if (data.success) {
        setOrders(data.orders || [])
        setOriginalOrders(data.originalOrders || [])
        setStats(data.statistics)
      }
    } catch (error) {
      console.error('Load error:', error)
      if (!silent) toast.error('Yükleme hatası')
    } finally {
      setLoading(false)
      if (!silent) setRefreshing(false)
    }
  }

  // 🆕 LOAD AVAILABLE TABLES (Empty tables)
  const loadAvailableTables = async () => {
    try {
      setLoadingTables(true)
      const res = await fetch(apiPath('/api/admin/tables?status=empty'))
      const data = await res.json()
      
      if (data.success) {
        setAvailableTables(data.tables || [])
      } else {
        toast.error('Masalar yüklenemedi')
      }
    } catch (error) {
      console.error('Tables load error:', error)
      toast.error('Masa yükleme hatası')
    } finally {
      setLoadingTables(false)
    }
  }

  // 🆕 OPEN TABLE (Create first order for table)
  const handleOpenTable = async () => {
    if (!selectedTableToOpen) {
      toast.error('Lütfen bir masa seçin')
      return
    }

    try {
      setOpeningTable(true)

      // Create empty order to open table
      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: selectedTableToOpen.number,
          tableId: selectedTableToOpen.number,
          items: [],
          totalAmount: 0,
          customerNotes: 'Masa açıldı - sipariş bekleniyor',
          status: 'pending'
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${selectedTableToOpen.number} numaralı masa açıldı! ✅`)
        setShowOpenTableModal(false)
        setSelectedTableToOpen(null)
        
        // Reload orders to show new table
        await loadOrders()
      } else {
        toast.error(result.error || 'Masa açılamadı')
      }
    } catch (error) {
      console.error('Open table error:', error)
      toast.error('Masa açma hatası: ' + error.message)
    } finally {
      setOpeningTable(false)
    }
  }

  // 🆕 LOAD MENU ITEMS FOR ADDING
  const loadMenuItems = async () => {
    try {
      setLoadingMenu(true)
      
      // Tüm menü itemlarını yükle (limit yok, available=true)
      const menuRes = await fetch(apiPath('/api/admin/menu?available=true&limit=1000'))
      const menuData = await menuRes.json()
      
      // Kategorileri yükle
      const catRes = await fetch(apiPath('/api/admin/categories?isActive=true'))
      const catData = await catRes.json()
      
      if (menuData.success) {
        setMenuItems(menuData.items || [])
      } else {
        toast.error('Menü yüklenemedi')
      }
      
      if (catData.success) {
        setCategories(catData.categories || [])
      }
    } catch (error) {
      console.error('Menu load error:', error)
      toast.error('Menü yükleme hatası')
    } finally {
      setLoadingMenu(false)
    }
  }

  // 🆕 MANUEL ÜRÜN EKLEME
  const handleAddItemToTable = async () => {
    if (!selectedProduct) {
      toast.error('Lütfen bir ürün seçin')
      return
    }
    
    if (!selectedTable) {
      toast.error('Masa seçili değil')
      return
    }

    try {
      setAddingItem(true)

      // ID kontrolü
      const productId = selectedProduct._id || selectedProduct.id || selectedProduct.menuItemId
      
      if (!productId) {
        console.error('❌ Product has no valid ID:', selectedProduct)
        toast.error('Ürün ID\'si bulunamadı. Lütfen menüyü yenileyin.')
        return
      }

      const newItem = {
        menuItemId: productId,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: itemQuantity,
        notes: itemNotes,
        image: selectedProduct.image
      }

      console.log('🆔 Using product ID:', productId)

      // Yeni sipariş oluştur veya mevcut siparişe ekle
      const activeOrder = selectedTable.orders?.find(o => 
        !['completed', 'cancelled'].includes(o.status)
      )

      let response
      
      if (activeOrder) {
        // Mevcut siparişe ekle
        const payload = {
          id: activeOrder._id,
          action: 'addItem',
          item: newItem
        }
        
        response = await fetch(apiPath('/api/orders'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        // Yeni sipariş oluştur
        const payload = {
          tableNumber: selectedTable.tableNumber,
          tableId: selectedTable.tableId,
          items: [newItem],
          customerNotes: 'Manuel eklenen sipariş'
        }
        
        response = await fetch(apiPath('/api/orders'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const result = await response.json()

      if (result.success) {
        toast.success(
          `${selectedProduct.name} x${itemQuantity} eklendi!`,
          {
            icon: '✅',
            duration: 2000,
            style: {
              background: '#10B981',
              color: '#fff',
            }
          }
        )
        
        // 🔄 MODAL KAPANMAZ! Sadece formu resetle
        // setShowAddItemModal(false) // ❌ KALDIRILDI
        setSelectedProduct(null)
        setItemQuantity(1)
        setItemNotes('')
        // Arama ve kategori filtrelerini KORU
        // setMenuSearchTerm('')  // ❌ KALDIRILDI
        // setSelectedCategory('all')  // ❌ KALDIRILDI
        
        // Arka planda siparişleri yeniden yükle (silent)
        loadOrders(true) // Silent refresh - toast göstermez
        
        // State güncellenmesini bekle ve masa detayını güncelle
        setTimeout(() => {
          setOrders(currentOrders => {
            const updatedTable = currentOrders.find(t => t.tableNumber === selectedTable.tableNumber)
            if (updatedTable) {
              setSelectedTable(updatedTable)
            }
            return currentOrders
          })
        }, 300)
      } else {
        toast.error(result.error || 'Ürün eklenemedi')
      }
    } catch (error) {
      console.error('Add item error:', error)
      toast.error('Ürün ekleme hatası: ' + error.message)
    } finally {
      setAddingItem(false)
    }
  }

  const updateItemStatus = async (orderId, itemIndex, newStatus) => {
    try {
      const res = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderId, 
          action: 'updateItemStatus', 
          itemIndex,
          itemStatus: newStatus 
        })
      })

      const result = await res.json()
      if (result.success) {
        toast.success(`Ürün durumu güncellendi: ${statusConfig[newStatus]?.label}`, { icon: '✅' })
        loadOrders()
        
        if (selectedTable) {
          const updatedTable = orders.find(t => t.tableNumber === selectedTable.tableNumber)
          if (updatedTable) setSelectedTable(updatedTable)
        }
      }
    } catch (error) {
      toast.error('Güncelleme hatası')
    }
  }

  const deleteOrder = async (orderId) => {
    if (!confirm('Bu siparişi silmek istediğinizden emin misiniz?')) return

    try {
      const res = await fetch(apiPath(`/api/orders?id=${orderId}`), { method: 'DELETE' })
      const result = await res.json()
      
      if (result.success) {
        toast.success('Sipariş silindi')
        loadOrders()
        if (selectedTable) {
          const updatedTable = orders.find(t => t.tableNumber === selectedTable.tableNumber)
          setSelectedTable(updatedTable || null)
          if (!updatedTable) setShowModal(false)
        }
      }
    } catch (error) {
      toast.error('Silme hatası')
    }
  }

  const closeTable = async (tableNumber) => {
    if (!tableNumber) {
      toast.error('Masa numarası bulunamadı!')
      return
    }

    if (!confirm(`Masa ${tableNumber} kapatılsın mı?\n\nMüşteri masadan kalktı ve ödeme yapıldı.\nTüm siparişler tamamlanacak.`)) return

    try {
      const res = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'closeTable', 
          tableNumber: tableNumber.toString()
        })
      })

      const result = await res.json()

      if (result.success) {
        toast.success(`✅ Masa ${tableNumber} kapatıldı!`, {
          icon: '🎉',
          duration: 3000
        })
        playNotificationSound()
        
        await loadOrders()
        setShowModal(false)
      } else {
        toast.error(result.error || 'Masa kapatılamadı')
      }
    } catch (error) {
      console.error('Close table error:', error)
      toast.error('Masa kapatma hatası')
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(originalOrders, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    toast.success('Veriler indirildi')
  }

  const filteredOrders = orders.filter(table => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        table.tableNumber?.toString().includes(search) ||
        table.tableName?.toLowerCase().includes(search) ||
        table.orders?.some(o => 
          o.orderNumber?.toLowerCase().includes(search) ||
          o.items?.some(i => i.name?.toLowerCase().includes(search))
        )
      )
    }
    return true
  })

  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000)
    if (minutes < 1) return 'Az önce'
    if (minutes < 60) return `${minutes} dk önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    return `${Math.floor(hours / 24)} gün önce`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Siparişler Yükleniyor</h3>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Audio Element - Bildirim Sesi */}
      <audio 
        ref={audioRef} 
        preload="auto"
        src="/meva/notification.mp3?v=3"
      />

      {/* Header */}
      <div className={`sticky top-0 z-30 ${
        fullScreenMode 
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
          : 'bg-white/95 backdrop-blur-md border-b border-gray-200'
      } shadow-sm`}>
        <div className="p-4 sm:p-6">
          {/* 🆕 FULLSCREEN MODE - Minimal Header */}
          {fullScreenMode ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Mutfak Ekranı</h1>
                  <p className="text-sm opacity-90">
                    {filteredOrders.length} masa • {originalOrders.length} aktif sipariş
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Auto Refresh Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">5s otomatik yenile</span>
                </div>
                
                {/* Exit Fullscreen */}
                <button
                  onClick={() => setFullScreenMode(false)}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                  title="Çıkış (ESC)"
                >
                  <Minimize className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* NORMAL MODE - Full Header */
            <>
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <ShoppingCart className="w-7 h-7 text-amber-600" />
                Sipariş Yönetimi
                {refreshing && (
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                )}
              </h1>
              <p className="text-gray-600 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {filteredOrders.length} masa • {originalOrders.length} sipariş
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* 🆕 MASA AÇ BUTONU */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowOpenTableModal(true)
                  loadAvailableTables()
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Masa Aç</span>
              </motion.button>

              {/* 🆕 Fullscreen Toggle Button */}
              <button
                onClick={() => {
                  setFullScreenMode(!fullScreenMode)
                  toast.success(fullScreenMode ? 'Normal moda dönüldü' : 'Tam ekran modu aktif', {
                    icon: fullScreenMode ? '🪟' : '🖥️'
                  })
                }}
                className={`p-2.5 rounded-xl transition-all ${
                  fullScreenMode
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } flex items-center gap-2`}
                title={fullScreenMode ? "Normal Mod (ESC)" : "Tam Ekran Modu"}
              >
                {fullScreenMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                <span className="hidden sm:inline text-sm font-medium">
                  {fullScreenMode ? 'Normal Mod' : 'Tam Ekran'}
                </span>
              </button>

              {/* Notification Button */}
              <button
                onClick={() => setShowNotificationSettings(true)}
                className={`p-2.5 rounded-xl transition-all ${
                  notificationEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}
                title="Bildirim Ayarları"
              >
                {notificationEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>

              {/* View Mode */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>

              {/* Auto Refresh */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2.5 rounded-xl transition-all ${
                  autoRefresh ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                }`}
                title="Otomatik Yenileme (5 saniye)"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Filter */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all ${
                  showFilters ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              {/* Stats */}
              <button
                onClick={() => setShowStatsModal(true)}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
              >
                <BarChart3 className="w-5 h-5" />
              </button>

              {/* Export */}
              <button
                onClick={exportData}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Refresh */}
              <button
                onClick={loadOrders}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Yenile</span>
              </button>
            </div>
          </div>

          {/* Compact Stats Bar - Smaller for Mobile */}
          {stats && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = stats[status] || 0
                const Icon = config.icon
                return (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                    className={`p-2 rounded-lg transition-all ${
                      filterStatus === status
                        ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                        : `bg-${config.color}-50 hover:bg-${config.color}-100`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 ${filterStatus === status ? 'text-white' : `text-${config.color}-600`}`} />
                      <span className={`text-lg font-bold ${filterStatus === status ? 'text-white' : `text-${config.color}-700`}`}>
                        {count}
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${filterStatus === status ? 'text-white' : `text-${config.color}-600`}`}>
                      {config.label}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Masa, ürün ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Tarihler</option>
                    <option value="today">Bugün</option>
                  </select>

                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterStatus('all')
                      setDateFilter('today')
                    }}
                    className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-medium"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </>
          )}
        </div>
      </div>

      {/* 🆕 FULLSCREEN MODE - Skip filters */}
      {fullScreenMode && (
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-amber-800">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Siparişler 5 saniyede bir otomatik yenileniyor</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <span>ESC tuşu ile çıkış</span>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid/List */}
      <div className={`${fullScreenMode ? 'p-6' : 'p-4 sm:p-6'}`}>
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl shadow-sm"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aktif Sipariş Yok</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus !== 'all' || searchTerm 
                ? 'Bu filtrelerle eşleşen sipariş yok' 
                : 'Tüm masalar boş - yeni siparişler burada görünecek'}
            </p>
          </motion.div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }>
            {filteredOrders.map((table, idx) => {
              const totalItems = table.orders?.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0) || 0
              
              return (
                <motion.div
                  key={table.tableNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-amber-300 transition-all duration-300 hover:shadow-xl overflow-hidden"
                >
                  <div className={`p-4 bg-gradient-to-r ${statusConfig[table.status]?.gradient || 'from-gray-400 to-gray-600'}`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{table.tableName || `Masa ${table.tableNumber}`}</div>
                          {table.tableLocation && (
                            <div className="text-sm opacity-90">{table.tableLocation}</div>
                          )}
                          <div className="text-sm opacity-90 flex items-center gap-2 mt-1">
                            <span>{table.orders?.length || 0} sipariş</span>
                            <span>•</span>
                            <span>{totalItems} ürün</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">₺{table.totalAmount.toFixed(2)}</div>
                        <div className="text-xs opacity-90">{getTimeAgo(table.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {table.customerNotes && (
                      <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-amber-900 line-clamp-2">{table.customerNotes}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {table.orders?.slice(0, 2).map((order) => (
                        <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">#{order.orderNumber?.slice(-6) || order.id.slice(-6)}</span>
                            <span className="text-sm font-bold text-amber-600">₺{order.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="font-medium">{item.quantity}x</span>
                                <span className="truncate">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {table.orders?.length > 2 && (
                        <div className="text-xs text-center text-gray-500 font-medium">
                          +{table.orders.length - 2} sipariş daha
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 border-t flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTable(table)
                        setShowModal(true)
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Detay
                    </button>
                    
                    <button
                      onClick={() => closeTable(table.tableNumber)}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Kapat
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notification Settings Modal */}
      <AnimatePresence>
        {showNotificationSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNotificationSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Bildirim Ayarları</h2>
                    <p className="text-sm opacity-90 mt-1">Yeni siparişler için uyarılar</p>
                  </div>
                  <button
                    onClick={() => setShowNotificationSettings(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Sound Settings */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                      <div>
                        <div className="font-semibold text-gray-900">Bildirim Sesi</div>
                        <div className="text-xs text-gray-500">Yeni sipariş geldiğinde ses çal</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        soundEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {soundEnabled && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <VolumeX className="w-4 h-4 text-gray-400" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <Volume2 className="w-4 h-4 text-gray-600" />
                      </div>
                      <button
                        onClick={testSound}
                        className="w-full px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        Sesi Test Et
                      </button>
                    </div>
                  )}
                </div>

                {/* Browser Notifications */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {notificationEnabled ? <Bell className="w-5 h-5 text-green-600" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                      <div>
                        <div className="font-semibold text-gray-900">Tarayıcı Bildirimleri</div>
                        <div className="text-xs text-gray-500">Masaüstü bildirim göster</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (notificationPermission === 'default') {
                          requestNotificationPermission()
                        } else if (notificationPermission === 'granted') {
                          setNotificationEnabled(!notificationEnabled)
                        }
                      }}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        notificationEnabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      disabled={notificationPermission === 'denied'}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        notificationEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {notificationPermission === 'denied' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        Bildirimler engellenmiş. Tarayıcı ayarlarından izin verin.
                      </p>
                    </div>
                  )}

                  {notificationPermission === 'default' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="w-full px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                    >
                      Bildirimlere İzin Ver
                    </button>
                  )}
                </div>

                {/* Test All */}
                <button
                  onClick={testNotifications}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                >
                  Tüm Bildirimleri Test Et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selectedTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{selectedTable.tableName || `Masa ${selectedTable.tableNumber}`}</h2>
                      <p className="text-sm opacity-90 mt-1">
                        {selectedTable.orders?.length || 0} sipariş • {selectedTable.orders?.reduce((sum, o) => sum + (o.items?.length || 0), 0) || 0} ürün
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 🆕 ÜRÜN EKLE BUTONU */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowAddItemModal(true)
                        setMenuSearchTerm('')
                        setSelectedCategory('all')
                        setSelectedProduct(null)
                        setItemQuantity(1)
                        setItemNotes('')
                        loadMenuItems()
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Ürün Ekle
                    </motion.button>
                    
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X className="w-7 h-7" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Package className="w-5 h-5 mb-2" />
                    <div className="text-sm opacity-80">Toplam</div>
                    <div className="text-2xl font-bold">₺{selectedTable.totalAmount?.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Clock className="w-5 h-5 mb-2" />
                    <div className="text-sm opacity-80">Süre</div>
                    <div className="text-lg font-bold">{getTimeAgo(selectedTable.createdAt)}</div>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Activity className="w-5 h-5 mb-2" />
                    <div className="text-sm opacity-80">Durum</div>
                    <div className="text-sm font-bold">{statusConfig[selectedTable.status]?.label || 'Aktif'}</div>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(selectedTable.orders || []).map((order, orderIdx) => (
                  <div key={order.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Sipariş #{order.orderNumber?.slice(-6) || order.id.slice(-6)}
                          </h3>
                          <p className="text-sm text-gray-600">{getTimeAgo(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">₺{order.totalAmount.toFixed(2)}</div>
                    </div>

                    {/* Items with Status Buttons */}
                    <div className="space-y-4">
                      {(order.items || []).map((item, itemIdx) => (
                        <div key={itemIdx} className="bg-white rounded-xl p-4 border-2 border-gray-200">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-amber-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                                <span className="text-lg font-bold text-amber-600 whitespace-nowrap">
                                  ₺{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.quantity}x ₺{item.price.toFixed(2)}
                              </p>

                              {/* 🆕 Zorunlu Seçimler (selectedOptions) */}
                              {item.selectedOptions && item.selectedOptions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Coffee className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs font-bold text-purple-600 uppercase">Seçimler</span>
                                  </div>
                                  <div className="space-y-1">
                                    {item.selectedOptions.map((sel, selIdx) => (
                                      <div key={selIdx} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
                                        <span className="text-xs text-gray-700">
                                          <span className="font-bold text-purple-700">{sel.groupLabel}:</span> {sel.selectedLabel}
                                        </span>
                                        {sel.price > 0 && (
                                          <span className="text-xs font-bold text-amber-600">+₺{sel.price.toFixed(2)}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Customizations (Özelleştirmeler) */}
                              {(item.customizations?.removed?.length > 0 || item.customizations?.extras?.length > 0) && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ChefHat className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-bold text-amber-600 uppercase">Özelleştirme</span>
                                  </div>
                                  <div className="space-y-1">
                                    {item.customizations.removed?.length > 0 && (
                                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
                                        <span className="text-xs text-red-600">
                                          <strong>Çıkarılan:</strong> {item.customizations.removed.map(r => r.name || r).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {item.customizations.extras?.length > 0 && (
                                      <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                                        <span className="text-xs text-green-600">
                                          <strong>Ekstra:</strong> {item.customizations.extras.map(e => e.name || e).join(', ')}
                                        </span>
                                        {item.customizations.extras.some(e => e.price > 0) && (
                                          <span className="text-xs font-bold text-green-700">
                                            +₺{item.customizations.extras.reduce((sum, e) => sum + (e.price || 0), 0).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Ürün Notları */}
                              {item.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="text-xs font-bold text-blue-600 block">Not:</span>
                                      <p className="text-xs text-gray-700">{item.notes}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Compact Item Status Buttons */}
                          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-200">
                            {Object.entries(statusConfig).filter(([key]) => 
                              ['pending', 'preparing', 'ready', 'delivered'].includes(key)
                            ).map(([status, config]) => {
                              const Icon = config.icon
                              const isActive = item.status === status
                              return (
                                <button
                                  key={status}
                                  onClick={() => updateItemStatus(order.id, itemIdx, status)}
                                  disabled={isActive}
                                  className={`
                                    px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                                    ${isActive 
                                      ? `${config.color === 'yellow' ? 'bg-yellow-500' : config.color === 'blue' ? 'bg-blue-500' : config.color === 'green' ? 'bg-green-500' : 'bg-purple-500'} text-white shadow-md` 
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                    disabled:opacity-100
                                  `}
                                >
                                  <Icon className="w-3 h-3" />
                                  <span className="hidden sm:inline">{config.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Notes */}
                    {order.customerNotes && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-bold text-amber-900 block mb-1">Masa Notu:</span>
                            <p className="text-sm text-amber-900">{order.customerNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delete Order */}
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Bu Siparişi Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t flex flex-wrap gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 min-w-[120px] px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-bold"
                >
                  Kapat
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 min-w-[120px] px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Yazdır
                </button>
                <button
                  onClick={() => closeTable(selectedTable.tableNumber)}
                  className="flex-1 min-w-[120px] px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Masayı Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Modal */}
      <AnimatePresence>
        {showStatsModal && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">İstatistikler</h2>
                    <p className="text-sm opacity-90 mt-1">Detaylı sipariş analizi</p>
                  </div>
                  <button
                    onClick={() => setShowStatsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const count = stats[status] || 0
                    const Icon = config.icon
                    return (
                      <div key={status} className={`p-4 rounded-xl bg-${config.color}-50 border border-${config.color}-200`}>
                        <Icon className={`w-6 h-6 text-${config.color}-600 mb-2`} />
                        <div className={`text-2xl font-bold text-${config.color}-700`}>{count}</div>
                        <div className={`text-xs text-${config.color}-600 mt-1`}>{config.label}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <DollarSign className="w-6 h-6 text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-700">₺{stats.totalRevenue?.toFixed(2)}</div>
                    <div className="text-xs text-blue-600 mt-1">Toplam Ciro</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <ShoppingCart className="w-6 h-6 text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-700">₺{stats.avgOrderValue?.toFixed(2)}</div>
                    <div className="text-xs text-green-600 mt-1">Ortalama Sipariş</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <Activity className="w-6 h-6 text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-700">{stats.totalOrders}</div>
                    <div className="text-xs text-purple-600 mt-1">Toplam Sipariş</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 🆕 MASA AÇMA MODALI */}
        {showOpenTableModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowOpenTableModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Masa Aç</h2>
                      <p className="text-sm opacity-90 mt-1">Boş masa seçip sipariş almaya başlayın</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOpenTableModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                {loadingTables ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Masalar yükleniyor...</p>
                  </div>
                ) : availableTables.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Boş masa bulunamadı</p>
                    <p className="text-sm text-gray-500 mt-2">Tüm masalar dolu veya masa eklemeniz gerekiyor</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      {availableTables.length} boş masa mevcut
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableTables.map((table) => (
                        <motion.button
                          key={table._id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTableToOpen(table)}
                          className={`
                            p-4 rounded-xl border-2 transition-all text-left
                            ${selectedTableToOpen?._id === table._id
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-200 hover:border-green-300 bg-white'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Users className="w-5 h-5 text-gray-600" />
                            </div>
                            {selectedTableToOpen?._id === table._id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">Masa {table.number}</h3>
                          {table.location && (
                            <p className="text-xs text-gray-500 mt-1">{table.location}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{table.capacity} kişilik</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOpenTableModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleOpenTable}
                    disabled={!selectedTableToOpen || openingTable}
                    className={`
                      flex-1 px-6 py-3 rounded-xl font-bold transition-all
                      ${!selectedTableToOpen || openingTable
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                      }
                    `}
                  >
                    {openingTable ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Açılıyor...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        Masa Aç
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}


        {/* 🆕 GELIŞMIŞ MANUEL ÜRÜN EKLEME MODALI - POS STYLE */}
        {showAddItemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowAddItemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 📌 HEADER - Sticky */}
              <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">Hızlı Sipariş</h2>
                      <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                        {selectedTable?.tableName || `Masa ${selectedTable?.tableNumber}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddItemModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* 🔍 ARAMA BAR - Sticky */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 outline-none transition-all"
                    />
                    {menuSearchTerm && (
                      <button
                        onClick={() => setMenuSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 📁 KATEGORİ FİLTRELERİ - Sticky */}
                {categories.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Tümü
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => setSelectedCategory(cat._id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                          selectedCategory === cat._id
                            ? 'bg-white text-blue-600 shadow-lg'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 📦 BODY - Split Layout */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {loadingMenu ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Menü yükleniyor...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 🍕 SOL: ÜRÜN GRİD */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {menuItems
                          .filter(item => {
                            const matchesSearch = !menuSearchTerm || 
                              item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                              item.description?.toLowerCase().includes(menuSearchTerm.toLowerCase())
                            const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
                            return matchesSearch && matchesCategory
                          })
                          .map((item) => (
                            <motion.button
                              key={item._id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedProduct(item)}
                              className={`
                                relative p-3 sm:p-4 rounded-xl border-2 transition-all text-left h-full
                                ${selectedProduct?._id === item._id
                                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                                  : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-md'
                                }
                              `}
                            >
                              {/* Image */}
                              {item.image ? (
                                <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-2">
                                  <Coffee className="w-8 h-8 text-amber-600" />
                                </div>
                              )}

                              {/* Info */}
                              <div>
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">
                                  {item.name}
                                </h3>
                                <p className="text-lg sm:text-xl font-bold text-blue-600">
                                  ₺{item.price}
                                </p>
                              </div>

                              {/* Selected Badge */}
                              {selectedProduct?._id === item._id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                      </div>

                      {/* Sonuç Yok */}
                      {menuItems.filter(item => {
                        const matchesSearch = !menuSearchTerm || 
                          item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(menuSearchTerm.toLowerCase())
                        const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
                        return matchesSearch && matchesCategory
                      }).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="font-bold text-lg mb-2">Ürün bulunamadı</p>
                          <p className="text-sm mb-4">Farklı bir arama terimi veya kategori deneyin</p>
                          <button
                            onClick={() => {
                              setMenuSearchTerm('')
                              setSelectedCategory('all')
                            }}
                            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                          >
                            Filtreleri Temizle
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 📋 SAĞ: SEÇİLİ ÜRÜN & MİKTAR */}
                    <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 flex flex-col">
                      {selectedProduct ? (
                        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
                          {/* Ürün Özeti */}
                          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                            <div className="flex items-start gap-3 mb-4">
                              {selectedProduct.image ? (
                                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                  <Image
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                                  <Coffee className="w-10 h-10 text-amber-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">
                                  {selectedProduct.name}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {selectedProduct.description}
                                </p>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                  ₺{selectedProduct.price}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Miktar Seçimi - BIG BUTTONS */}
                          <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                              Miktar
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center font-bold text-3xl shadow-sm active:scale-95"
                              >
                                -
                              </button>
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={itemQuantity}
                                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full text-center text-4xl sm:text-5xl font-bold text-gray-900 bg-white rounded-xl border-2 border-gray-300 py-4 outline-none focus:border-blue-500 transition-colors"
                                />
                              </div>
                              <button
                                onClick={() => setItemQuantity(itemQuantity + 1)}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all flex items-center justify-center font-bold text-3xl shadow-sm active:scale-95"
                              >
                                +
                              </button>
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="flex gap-2 mt-3">
                              {[1, 2, 3, 5].map(num => (
                                <button
                                  key={num}
                                  onClick={() => setItemQuantity(num)}
                                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                                    itemQuantity === num
                                      ? 'bg-blue-500 text-white shadow-md'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Not */}
                          <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              <MessageSquare className="w-4 h-4 inline mr-2" />
                              Not (Opsiyonel)
                            </label>
                            <textarea
                              value={itemNotes}
                              onChange={(e) => setItemNotes(e.target.value)}
                              placeholder="Örn: Az şekerli, soğuk..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none transition-colors resize-none text-sm"
                            />
                          </div>

                          {/* Spacer */}
                          <div className="flex-1"></div>

                          {/* Toplam */}
                          <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-700 font-medium">Birim Fiyat:</span>
                              <span className="text-lg font-bold text-gray-900">₺{selectedProduct.price}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-700 font-medium">Miktar:</span>
                              <span className="text-lg font-bold text-gray-900">x{itemQuantity}</span>
                            </div>
                            <div className="border-t-2 border-blue-300 pt-2 flex items-center justify-between">
                              <span className="text-gray-900 font-bold">Toplam:</span>
                              <span className="text-3xl font-bold text-blue-600">
                                ₺{(selectedProduct.price * itemQuantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Hızlı Ekle Butonu */}
                          <button
                            onClick={handleAddItemToTable}
                            disabled={addingItem}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                          >
                            {addingItem ? (
                              <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Ekleniyor...
                              </>
                            ) : (
                              <>
                                <Plus className="w-5 h-5" />
                                Hızlı Ekle
                              </>
                            )}
                          </button>

                          <p className="text-xs text-center text-gray-500 mt-2">
                            Modal kapanmaz, devam edebilirsiniz
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-center">
                          <div>
                            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                              <ShoppingCart className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              Ürün Seçin
                            </h3>
                            <p className="text-sm text-gray-600">
                              Soldan eklemek istediğiniz ürünü seçin
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 📌 FOOTER - Action Buttons */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddItemModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                  >
                    Kapat
                  </button>
                  <div className="text-sm text-gray-600 flex items-center gap-2 px-4">
                            <span className="font-medium">Ürün sayısı:</span>
                    <span className="font-bold text-blue-600">
                      {menuItems.filter(item => {
                        const matchesSearch = !menuSearchTerm || 
                          item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(menuSearchTerm.toLowerCase())
                        const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
                        return matchesSearch && matchesCategory
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}