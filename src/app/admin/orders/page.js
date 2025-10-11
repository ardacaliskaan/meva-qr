'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, Search, Filter, Eye, Trash2, X, Plus,
  Package, ChefHat, CheckCircle, AlertCircle, XCircle,
  MapPin, MessageSquare, DollarSign, RefreshCw,
  Sparkles, Coffee, Download, Printer,
  BarChart3, Activity, Grid, List,
  Volume2, VolumeX, Minus, ShoppingCart, Check
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [originalOrders, setOriginalOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [selectedTable, setSelectedTable] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const audioRef = useRef(null)
  const previousOrderCountRef = useRef(0)

  const statusConfig = {
    pending: { label: 'Bekliyor', color: 'yellow', icon: Clock, gradient: 'from-yellow-400 to-orange-500' },
    preparing: { label: 'Hazırlanıyor', color: 'blue', icon: ChefHat, gradient: 'from-blue-500 to-indigo-600' },
    ready: { label: 'Hazır', color: 'green', icon: CheckCircle, gradient: 'from-green-500 to-emerald-600' },
    delivered: { label: 'Teslim Edildi', color: 'purple', icon: Package, gradient: 'from-purple-500 to-pink-600' }
  }

  // 🆕 10 SANİYEDE BİR OTOMATİK YENİLEME
  useEffect(() => {
    loadOrders()
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 10000) // 10 saniye
      return () => clearInterval(interval)
    }
  }, [filterStatus, dateFilter, autoRefresh])

  useEffect(() => {
    if (soundEnabled && originalOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      playNotificationSound()
      toast.success('Yeni sipariş geldi! 🔔', { duration: 4000 })
    }
    previousOrderCountRef.current = originalOrders.length
  }, [originalOrders.length, soundEnabled])

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
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
        excludeCompleted: 'true' // 🆕 Completed masaları gösterme
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

  // 🆕 ÜRÜN BAZLI DURUM GÜNCELLEMESİ
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
        
        // Modal açıksa güncelle
        if (selectedTable) {
          const updatedTable = orders.find(t => t.tableNumber === selectedTable.tableNumber)
          if (updatedTable) setSelectedTable(updatedTable)
        }
      }
    } catch (error) {
      toast.error('Güncelleme hatası')
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'updateStatus', status: newStatus })
      })

      const result = await res.json()
      if (result.success) {
        toast.success('Sipariş durumu güncellendi ✅')
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
      const res = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' })
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

  // 🆕 MASA KAPAT - TÜM SİPARİŞLERİ COMPLETED YAP
  const closeTable = async (tableNumber) => {
    if (!confirm(`Masa ${tableNumber} kapatılsın mı?\n\nMüşteri masadan kalktı ve ödeme yapıldı.\nTüm siparişler tamamlanacak.`)) return

    try {
      const res = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'closeTable', tableNumber })
      })

      const result = await res.json()
      if (result.success) {
        toast.success(`✅ Masa ${tableNumber} kapatıldı!`, {
          icon: '🎉',
          duration: 3000
        })
        playNotificationSound()
        loadOrders()
        setShowModal(false)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
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
        table.tableNumber.toString().includes(search) ||
        table.orders?.some(o => 
          o.orderNumber?.toLowerCase().includes(search) ||
          o.items?.some(i => i.name.toLowerCase().includes(search))
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

  const getUrgencyColor = (createdAt) => {
    const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000)
    if (minutes > 30) return 'red'
    if (minutes > 15) return 'orange'
    return 'green'
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
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 space-y-4">
            {/* Top Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <ChefHat className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                    Sipariş Yönetimi
                    {refreshing && <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    {filteredOrders.length} aktif masa • {originalOrders.length} sipariş
                    {autoRefresh && <span className="ml-2 text-green-600">• Otomatik yenileme açık</span>}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {[
                    { mode: 'grid', icon: Grid, label: 'Kart' },
                    { mode: 'list', icon: List, label: 'Liste' }
                  ].map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        viewMode === mode
                          ? 'bg-white text-amber-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2.5 rounded-xl transition-all ${
                    soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="Ses Bildirimleri"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2.5 rounded-xl transition-all ${
                    autoRefresh ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="Otomatik Yenileme (10 saniye)"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-xl transition-all ${
                    showFilters ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowStatsModal(true)}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>

                <button
                  onClick={exportData}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                >
                  <Download className="w-5 h-5" />
                </button>

                <button
                  onClick={loadOrders}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Yenile</span>
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = stats[status] || 0
                  const Icon = config.icon
                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                      className={`p-3 rounded-xl transition-all ${
                        filterStatus === status
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                          : `bg-${config.color}-50 hover:bg-${config.color}-100`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${filterStatus === status ? 'text-white' : `text-${config.color}-600`}`} />
                        <span className={`text-xl font-bold ${filterStatus === status ? 'text-white' : `text-${config.color}-900`}`}>
                          {count}
                        </span>
                      </div>
                      <div className={`text-xs font-medium mt-1 ${filterStatus === status ? 'text-white' : `text-${config.color}-700`}`}>
                        {config.label}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Masa, sipariş, ürün ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="today">Bugün</option>
                        <option value="week">Bu Hafta</option>
                        <option value="month">Bu Ay</option>
                        <option value="all">Tümü</option>
                      </select>
                    </div>

                    {(filterStatus !== 'all' || searchTerm) && (
                      <button
                        onClick={() => {
                          setFilterStatus('all')
                          setSearchTerm('')
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        Filtreleri Temizle
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              const urgency = getUrgencyColor(table.createdAt)
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
                          <div className="text-2xl font-bold">Masa {table.tableNumber}</div>
                          <div className="text-sm opacity-90 flex items-center gap-2">
                            <span>{table.orders?.length || 0} sipariş</span>
                            <span>•</span>
                            <span>{totalItems} ürün</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">₺{table.totalAmount.toFixed(2)}</div>
                        <div className="text-xs opacity-90 uppercase tracking-wide">Toplam</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 text-${urgency}-500`} />
                        <span className="text-sm text-gray-600">{getTimeAgo(table.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(table.orders || []).slice(0, 2).map((order) => (
                        <div key={order.id} className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              #{order.orderNumber?.slice(-6) || order.id.slice(-6)}
                            </span>
                            <span className="text-sm font-bold text-amber-600">
                              ₺{order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
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

      {/* 🎯 MASA DETAY MODAL - HER ÜRÜN İÇİN DURUM */}
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
                      <h2 className="text-3xl font-bold">Masa {selectedTable.tableNumber}</h2>
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

              {/* Modal Body - SCROLLABLE */}
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

                    {/* 🆕 HER ÜRÜN İÇİN AYRI DURUM KONTROL */}
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
                                  sizes="80px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Coffee className="w-8 h-8 text-amber-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                                <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-sm font-bold">
                                  {item.quantity}x
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                ₺{item.price.toFixed(2)} × {item.quantity} = ₺{(item.price * item.quantity).toFixed(2)}
                              </p>

                              {/* 🆕 ÜRÜN DURUM BUTONLARI */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {Object.entries(statusConfig).map(([status, config]) => {
                                  const Icon = config.icon
                                  const isActive = item.status === status
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => updateItemStatus(order.id, itemIdx, status)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        isActive
                                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                                          : `bg-${config.color}-50 text-${config.color}-700 hover:bg-${config.color}-100`
                                      }`}
                                    >
                                      <Icon className="w-3.5 h-3.5" />
                                      {config.label}
                                    </button>
                                  )
                                })}
                              </div>

                              {/* Zorunlu Seçimler */}
                              {item.selectedOptions && item.selectedOptions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
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

                              {/* Customizations */}
                              {(item.customizations?.removed?.length > 0 || item.customizations?.extras?.length > 0) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {item.customizations.removed?.length > 0 && (
                                    <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                                      <div className="flex items-center gap-1 mb-1">
                                        <XCircle className="w-3 h-3 text-red-600" />
                                        <span className="text-xs font-bold text-red-600">Çıkarılan</span>
                                      </div>
                                      <div className="text-xs text-red-700">
                                        {item.customizations.removed.map(r => r.name || r).join(', ')}
                                      </div>
                                    </div>
                                  )}
                                  {item.customizations.extras?.length > 0 && (
                                    <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                                      <div className="flex items-center gap-1 mb-1">
                                        <Plus className="w-3 h-3 text-green-600" />
                                        <span className="text-xs font-bold text-green-600">Ekstra</span>
                                      </div>
                                      <div className="space-y-0.5">
                                        {item.customizations.extras.map((e, eIdx) => (
                                          <div key={eIdx} className="text-xs text-green-700 flex justify-between">
                                            <span>{e.name || e}</span>
                                            {e.price && <span className="font-bold">+₺{e.price.toFixed(2)}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Notes */}
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
              <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">İstatistikler</h2>
                  </div>
                  <button
                    onClick={() => setShowStatsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                    <Package className="w-8 h-8 text-blue-600 mb-3" />
                    <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
                    <div className="text-sm text-blue-700">Toplam Sipariş</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                    <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                    <div className="text-3xl font-bold text-green-900">₺{stats.totalRevenue?.toFixed(2)}</div>
                    <div className="text-sm text-green-700">Toplam Ciro</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                    <Activity className="w-8 h-8 text-purple-600 mb-3" />
                    <div className="text-3xl font-bold text-purple-900">₺{stats.averageOrderValue?.toFixed(2)}</div>
                    <div className="text-sm text-purple-700">Ortalama Sipariş</div>
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