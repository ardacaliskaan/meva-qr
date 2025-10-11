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
  Settings, Bell, BellOff, Play
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
  
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  
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
  useEffect(() => {
    loadOrders()
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 5000) // 5 saniyede bir yenile
      return () => clearInterval(interval)
    }
  }, [filterStatus, dateFilter, autoRefresh])

  // 🚨 Detect new orders
  useEffect(() => {
    if (originalOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      const diff = originalOrders.length - previousOrderCountRef.current
      console.log('🔔 New order detected!', { previous: previousOrderCountRef.current, new: originalOrders.length, diff })
      handleNewOrderNotification()
    }

    if (originalOrders.length >= 0) {
      previousOrderCountRef.current = originalOrders.length
      localStorage.setItem('lastOrderCount', originalOrders.length.toString())
    }
  }, [originalOrders.length])

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

  const loadOrders = async () => {
    try {
      if (!loading) setRefreshing(true)
      
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
      toast.error('Yükleme hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
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
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6">
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
        </div>
      </div>

      {/* Orders Grid/List */}
      <div className="p-4 sm:p-6">
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
                            {order.items?.length || 0} ürün
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
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-7 h-7" />
                  </button>
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

                              {item.customizations && (
                                <div className="mt-2 space-y-1">
                                  {item.customizations.removed?.length > 0 && (
                                    <p className="text-xs text-red-600">
                                      <strong>Çıkarılanlar:</strong> {item.customizations.removed.join(', ')}
                                    </p>
                                  )}
                                  {item.customizations.extras?.length > 0 && (
                                    <p className="text-xs text-green-600">
                                      <strong>Ekstralar:</strong> {item.customizations.extras.map(e => e.name).join(', ')}
                                    </p>
                                  )}
                                </div>
                              )}

                              {item.notes && (
                                <p className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                  📝 {item.notes}
                                </p>
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
      </AnimatePresence>
    </div>
  )
}