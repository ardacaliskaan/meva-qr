// src/app/admin/reports/page.js - TAM GÜNCELLENMİŞ VERSİYON
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, DollarSign, ShoppingCart, Calendar, Download, 
  BarChart3, PieChart, Clock, Activity, Filter, RefreshCw,
  ArrowUp, ArrowDown, Package, Users, TrendingDown
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function ReportsPage() {
  const [period, setPeriod] = useState('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    loadReports()
  }, [period])

  const loadReports = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      let url = `/api/admin/reports?period=${period}`
      if (period === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`
      }

      const res = await fetch(apiPath(url))
      const result = await res.json()

      if (result.success) {
        setData(result)
        if (!silent) toast.success('Rapor yüklendi', { icon: '📊' })
      } else {
        toast.error('Rapor yüklenemedi')
      }
    } catch (error) {
      console.error('Report load error:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const exportToExcel = () => {
    if (!data) return
    
    const csvData = [
      ['🍽️ RESTORAN CİRO RAPORU'],
      [''],
      ['Rapor Dönemi', period],
      ['Başlangıç', new Date(data.period.start).toLocaleDateString('tr-TR')],
      ['Bitiş', new Date(data.period.end).toLocaleDateString('tr-TR')],
      [''],
      ['📊 ÖZET İSTATİSTİKLER'],
      ['Toplam Sipariş', data.summary.totalOrders],
      ['Tamamlanan Sipariş', data.summary.completedOrders],
      ['İptal Edilen', data.summary.cancelledOrders],
      ['Dönüşüm Oranı', `%${data.summary.conversionRate.toFixed(1)}`],
      [''],
      ['💰 CİRO BİLGİLERİ'],
      ['Toplam Ciro', `₺${data.summary.totalRevenue.toFixed(2)}`],
      ['İptal Edilen Ciro', `₺${data.summary.cancelledRevenue.toFixed(2)}`],
      ['Ortalama Sipariş Değeri', `₺${data.summary.avgOrderValue.toFixed(2)}`],
      ['Ortalama Hazırlama Süresi', `${data.summary.avgOrderTime.toFixed(0)} dakika`],
      [''],
      ['📅 GÜNLÜK TREND'],
      ['Tarih', 'Sipariş Sayısı', 'Ciro', 'Ortalama Sipariş'],
      ...data.dailyTrends.map(d => [
        d.date, 
        d.orderCount, 
        d.revenue.toFixed(2), 
        d.avgOrderValue.toFixed(2)
      ]),
      [''],
      ['🏆 EN ÇOK SATAN ÜRÜNLER'],
      ['Ürün Adı', 'Satış Adedi', 'Toplam Ciro'],
      ...data.topProducts.map(p => [
        p.name, 
        p.quantity, 
        p.revenue.toFixed(2)
      ]),
      [''],
      ['📁 KATEGORİ BAZLI SATIŞLAR'],
      ['Kategori', 'Satış Adedi', 'Toplam Ciro'],
      ...data.categorySales.map(c => [
        c.name, 
        c.quantity, 
        c.revenue.toFixed(2)
      ]),
      [''],
      ['🪑 EN VERİMLİ MASALAR'],
      ['Masa', 'Sipariş Sayısı', 'Toplam Ciro'],
      ...data.topTables.map(t => [
        `Masa ${t.table}`, 
        t.orderCount, 
        t.revenue.toFixed(2)
      ]),
      [''],
      ['📊 DURUM DAĞILIMI'],
      ['Durum', 'Adet'],
      ['Bekliyor', data.statusStats.pending || 0],
      ['Onaylandı', data.statusStats.confirmed || 0],
      ['Hazırlanıyor', data.statusStats.preparing || 0],
      ['Hazır', data.statusStats.ready || 0],
      ['Teslim Edildi', data.statusStats.delivered || 0],
      ['Tamamlandı', data.statusStats.completed || 0],
      ['İptal', data.statusStats.cancelled || 0],
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapor-${period}-${Date.now()}.csv`
    link.click()
    toast.success('Rapor indirildi!', { icon: '📊' })
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Rapor hazırlanıyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-600" />
            Raporlar & Analiz
          </h1>
          <p className="text-gray-600 mt-1">Detaylı satış ve performans raporları</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadReports(true)}
            disabled={refreshing}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {[
            { value: 'today', label: 'Bugün', icon: Calendar },
            { value: 'week', label: 'Bu Hafta', icon: Calendar },
            { value: 'month', label: 'Bu Ay', icon: Calendar },
            { value: 'year', label: 'Bu Yıl', icon: TrendingUp }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                period === p.value
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <p.icon className="w-4 h-4" />
              {p.label}
            </button>
          ))}
          
          <button
            onClick={() => setPeriod('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              period === 'custom'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Özel Tarih
          </button>
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              onClick={() => loadReports()}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all font-medium"
            >
              Uygula
            </button>
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-6">
          {/* ✅ YENİ SUMMARY CARDS - Sadece tamamlanan siparişler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Toplam Ciro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90">Toplam Ciro</p>
                  <p className="text-3xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90 mt-3 pt-3 border-t border-white/20">
                <ArrowUp className="w-4 h-4" />
                <span>Ortalama: {formatCurrency(data.summary.avgOrderValue)}</span>
              </div>
            </motion.div>

            {/* 2. Tamamlanan Sipariş */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90">Tamamlanan Sipariş</p>
                  <p className="text-3xl font-bold">{data.summary.completedOrders}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90 mt-3 pt-3 border-t border-white/20">
                <Activity className="w-4 h-4" />
                <span>Toplam: {data.summary.totalOrders} sipariş</span>
              </div>
            </motion.div>

            {/* 3. Dönüşüm Oranı */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90">Dönüşüm Oranı</p>
                  <p className="text-3xl font-bold">%{data.summary.conversionRate.toFixed(1)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90 mt-3 pt-3 border-t border-white/20">
                {data.summary.cancelledOrders > 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span>İptal: {data.summary.cancelledOrders}</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span>İptal yok</span>
                  </>
                )}
              </div>
            </motion.div>

            {/* 4. Ortalama Süre */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <div className="text-right">
                  <p className="text-sm opacity-90">Ort. Süre</p>
                  <p className="text-3xl font-bold">{data.summary.avgOrderTime.toFixed(0)} dk</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90 mt-3 pt-3 border-t border-white/20">
                <Activity className="w-4 h-4" />
                <span>Hazırlama süresi</span>
              </div>
            </motion.div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Günlük Ciro Trendi
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Ciro" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Daily Orders Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Günlük Sipariş Sayısı
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orderCount" fill="#3b82f6" name="Sipariş" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Saatlik Dağılım
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.hourlyDistribution.filter(h => h.orderCount > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orderCount" fill="#8b5cf6" name="Sipariş" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Category Sales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                Kategori Bazlı Satış
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={data.categorySales}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.revenue)}`}
                  >
                    {data.categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RechartsPie>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                En Çok Satan Ürünler
              </h3>
              <div className="space-y-3">
                {data.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.quantity} adet</p>
                      </div>
                    </div>
                    <p className="font-bold text-amber-600">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Tables */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                En Verimli Masalar
              </h3>
              <div className="space-y-3">
                {data.topTables.map((table, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Masa {table.table}</p>
                        <p className="text-sm text-gray-600">{table.orderCount} sipariş</p>
                      </div>
                    </div>
                    <p className="font-bold text-blue-600">{formatCurrency(table.revenue)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Status Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              Sipariş Durum Dağılımı
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(data.statusStats).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize mt-1">{status}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}