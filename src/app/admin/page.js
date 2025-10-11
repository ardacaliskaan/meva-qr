// src/app/admin/page.js - REAL-TIME DASHBOARD
'use client'
import { useState, useEffect } from 'react'
import { 
  ShoppingBag, Users, TrendingUp, Clock, 
  RefreshCw, Package, DollarSign, Activity,
  Eye, ChefHat, CheckCircle, AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiPath } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    activeTables: 0,
    dailyRevenue: 0,
    avgTime: 0,
    activeOrders: 0,
    totalMenuItems: 0,
    pendingOrders: 0,
    completedToday: 0
  })
  
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 10000) // 10 saniyede bir
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadDashboardData = async () => {
    try {
      if (!loading) setRefreshing(true)
      
      // Paralel API çağrıları
      const [ordersRes, tablesRes, menuRes] = await Promise.all([
        fetch(apiPath('/api/orders?today=true&excludeCompleted=false&stats=true')),
        fetch(apiPath('/api/admin/tables')),
        fetch(apiPath('/api/admin/menu?stats=true'))
      ])

      const [ordersData, tablesData, menuData] = await Promise.all([
        ordersRes.json(),
        tablesRes.json(),
        menuRes.json()
      ])

      // Siparişler
      let allOrders = []
      let todayRevenue = 0
      let avgCookingTime = 0
      let activeOrdersCount = 0
      let pendingCount = 0
      let completedCount = 0

      if (ordersData.success) {
        allOrders = ordersData.originalOrders || ordersData.orders || []
        
        // Bugünkü siparişler
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const todayOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= today
        })

        // İstatistikler
        todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        
        activeOrdersCount = allOrders.filter(o => 
          !['completed', 'cancelled'].includes(o.status)
        ).length

        pendingCount = allOrders.filter(o => o.status === 'pending').length
        completedCount = todayOrders.filter(o => o.status === 'completed').length

        // Ortalama hazırlama süresi
        const ordersWithTime = allOrders.filter(o => o.estimatedTime)
        if (ordersWithTime.length > 0) {
          avgCookingTime = Math.round(
            ordersWithTime.reduce((sum, o) => sum + (o.estimatedTime || 0), 0) / ordersWithTime.length
          )
        }

        // Son siparişler (son 10)
        const sortedOrders = [...allOrders]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
        
        setRecentOrders(sortedOrders)
      }

      // Masalar
      let activeTables = 0
      if (tablesData.success) {
        activeTables = (tablesData.tables || []).filter(t => t.status === 'occupied').length
      }

      // Menü
      let totalMenuItems = 0
      if (menuData.success) {
        totalMenuItems = (menuData.items || []).length
      }

      setStats({
        todayOrders: allOrders.length,
        activeTables,
        dailyRevenue: todayRevenue,
        avgTime: avgCookingTime,
        activeOrders: activeOrdersCount,
        totalMenuItems,
        pendingOrders: pendingCount,
        completedToday: completedCount
      })

    } catch (error) {
      console.error('Dashboard data load error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Bekliyor',
      confirmed: 'Onaylandı',
      preparing: 'Hazırlanıyor',
      ready: 'Hazır',
      delivered: 'Teslim Edildi',
      completed: 'Tamamlandı',
      cancelled: 'İptal'
    }
    return labels[status] || status
  }

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
          <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard Yükleniyor</h3>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }

  const statsCards = [
    { 
      label: 'Bugünkü Siparişler', 
      value: stats.todayOrders, 
      icon: ShoppingBag, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Aktif Masalar', 
      value: stats.activeTables, 
      icon: Users, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    { 
      label: 'Günlük Ciro', 
      value: `₺${stats.dailyRevenue.toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Ortalama Süre', 
      value: stats.avgTime > 0 ? `${stats.avgTime} dk` : '-', 
      icon: Clock, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    { 
      label: 'Aktif Siparişler', 
      value: stats.activeOrders, 
      icon: Activity, 
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600'
    },
    { 
      label: 'Bekleyen', 
      value: stats.pendingOrders, 
      icon: AlertCircle, 
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600'
    },
    { 
      label: 'Tamamlanan', 
      value: stats.completedToday, 
      icon: CheckCircle, 
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600'
    },
    { 
      label: 'Menü Ürünleri', 
      value: stats.totalMenuItems, 
      icon: ChefHat, 
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Restoran istatistikleri ve özet bilgiler
                {refreshing && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Yenileniyor...
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2.5 rounded-xl transition-all ${
                  autoRefresh ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                }`}
                title="Otomatik Yenileme (10 saniye)"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={loadDashboardData}
                disabled={refreshing}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Yenile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 font-medium">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border-2 border-gray-200"
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Son Siparişler
              </h2>
              <span className="text-sm text-gray-500">
                Toplam {recentOrders.length} sipariş
              </span>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz sipariş yok</h3>
              <p className="text-gray-600">Yeni siparişler buradan görünecek</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sipariş No</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masa</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Ürünler</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          #{order.orderNumber?.slice(-6) || order.id.slice(-6)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Masa {order.tableNumber || order.tableId}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {order.items?.map(item => item.name).join(', ') || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items?.length || 0} ürün
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-amber-600">
                          ₺{(order.totalAmount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {getTimeAgo(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
        >
          <a
            href="/meva/admin/orders"
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 text-center group"
          >
            <ShoppingBag className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900">Siparişler</h3>
            <p className="text-xs text-gray-500 mt-1">Sipariş yönetimi</p>
          </a>

          <a
            href="/meva/admin/tables"
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 text-center group"
          >
            <Users className="w-8 h-8 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900">Masalar</h3>
            <p className="text-xs text-gray-500 mt-1">Masa yönetimi</p>
          </a>

          <a
            href="/meva/admin/menu"
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300 text-center group"
          >
            <ChefHat className="w-8 h-8 text-amber-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900">Menü</h3>
            <p className="text-xs text-gray-500 mt-1">Ürün yönetimi</p>
          </a>

          <a
            href="/meva/admin/qr"
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 text-center group"
          >
            <Eye className="w-8 h-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900">QR Kod</h3>
            <p className="text-xs text-gray-500 mt-1">QR kod oluştur</p>
          </a>
        </motion.div>
      </div>
    </div>
  )
}