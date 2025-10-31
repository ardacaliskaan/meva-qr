// src/app/admin/feedback/page.js - Mevcut API ile uyumlu
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Star, ThumbsUp, Filter, Search, Eye, Trash2,
  X, Download, RefreshCw, BarChart3, Heart, Frown, Meh, Smile,
  Award, CheckCircle, Clock, Package, Users, ChefHat
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

const CATEGORY_LABELS = {
  'service': 'Hizmet Kalitesi',
  'food': 'Ürün & Lezzet',
  'staff': 'Personel',
  'other': 'Diğer'
}

const CATEGORY_ICONS = {
  'service': Heart,
  'food': Package,
  'staff': Users,
  'other': MessageSquare
}

const CATEGORY_COLORS = {
  'service': 'from-blue-500 to-indigo-600',
  'food': 'from-amber-500 to-orange-600',
  'staff': 'from-purple-500 to-pink-600',
  'other': 'from-gray-500 to-gray-700'
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadFeedbacks()
  }, [filterStatus, filterCategory])

  const loadFeedbacks = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      let url = '/api/feedback?stats=true&limit=100'
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`
      }
      if (filterCategory !== 'all') {
        url += `&category=${filterCategory}`
      }

      const res = await fetch(apiPath(url))
      const data = await res.json()

      if (data.success) {
        setFeedbacks(data.feedbacks || [])
        setStatistics(data.statistics)
        if (!silent) toast.success('Geri bildirimler yüklendi', { icon: '💬' })
      } else {
        toast.error('Yükleme hatası')
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateStatus = async (id, newStatus, notes = null) => {
    try {
      const res = await fetch(apiPath('/api/feedback'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: newStatus,
          ...(notes !== null && { adminNotes: notes })
        })
      })

      const result = await res.json()
      if (result.success) {
        toast.success('Durum güncellendi', { icon: '✅' })
        loadFeedbacks(true)
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback({ ...selectedFeedback, status: newStatus, adminNotes: notes })
        }
      }
    } catch (error) {
      toast.error('Güncelleme hatası')
    }
  }

  const deleteFeedback = async (id) => {
    if (!confirm('Bu geri bildirimi silmek istediğinizden emin misiniz?')) return

    try {
      const res = await fetch(apiPath(`/api/feedback?id=${id}`), {
        method: 'DELETE'
      })

      const result = await res.json()
      if (result.success) {
        toast.success('Geri bildirim silindi', { icon: '🗑️' })
        loadFeedbacks(true)
        if (selectedFeedback && selectedFeedback.id === id) {
          setShowDetailModal(false)
          setSelectedFeedback(null)
        }
      }
    } catch (error) {
      toast.error('Silme hatası')
    }
  }

  const exportToExcel = () => {
    const csvData = [
      ['🍽️ GERİ BİLDİRİM RAPORU'],
      [''],
      ['Tarih', 'Kategori', 'Rating', 'Durum', 'Mesaj', 'Admin Notları'],
      ...feedbacks.map(f => [
        new Date(f.createdAt).toLocaleDateString('tr-TR'),
        f.categoryLabel,
        f.rating || '-',
        f.status,
        f.message,
        f.adminNotes || '-'
      ])
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `feedback-${Date.now()}.csv`
    link.click()
    toast.success('Rapor indirildi!', { icon: '📊' })
  }

  const getRatingEmoji = (rating) => {
    if (!rating) return null
    if (rating >= 4.5) return <Award className="w-5 h-5 text-yellow-500" />
    if (rating >= 3.5) return <Smile className="w-5 h-5 text-green-500" />
    if (rating >= 2.5) return <Meh className="w-5 h-5 text-orange-500" />
    return <Frown className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'read': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new': return 'Yeni'
      case 'read': return 'Okundu'
      case 'resolved': return 'Çözüldü'
      default: return status
    }
  }

  const filteredFeedbacks = feedbacks.filter(f => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        f.message?.toLowerCase().includes(search) ||
        f.categoryLabel?.toLowerCase().includes(search) ||
        f.adminNotes?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Geri bildirimler yükleniyor...</p>
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
            <MessageSquare className="w-8 h-8 text-amber-600" />
            Müşteri Geri Bildirimleri
            {refreshing && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
          </h1>
          <p className="text-gray-600 mt-1">🏥 Müşteri doktorumuzdur - Anonim geri bildirimler</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadFeedbacks(true)}
            disabled={refreshing}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl transition-all ${
              showFilters ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter className="w-5 h-5" />
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

      {/* Stats Bar */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Total */}
          <motion.div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl p-4 text-white">
            <MessageSquare className="w-6 h-6 opacity-80 mb-2" />
            <p className="text-2xl font-bold">{statistics.total}</p>
            <p className="text-sm opacity-90">Toplam</p>
          </motion.div>

          {/* Unread */}
          <motion.div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-4 text-white">
            <Clock className="w-6 h-6 opacity-80 mb-2" />
            <p className="text-2xl font-bold">{statistics.unread}</p>
            <p className="text-sm opacity-90">Yeni</p>
          </motion.div>

          {/* Read */}
          <motion.div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
            <Eye className="w-6 h-6 opacity-80 mb-2" />
            <p className="text-2xl font-bold">{statistics.read}</p>
            <p className="text-sm opacity-90">Okundu</p>
          </motion.div>

          {/* Resolved */}
          <motion.div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
            <CheckCircle className="w-6 h-6 opacity-80 mb-2" />
            <p className="text-2xl font-bold">{statistics.resolved}</p>
            <p className="text-sm opacity-90">Çözüldü</p>
          </motion.div>

          {/* Average Rating */}
          <motion.div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
            <Star className="w-6 h-6 opacity-80 mb-2" />
            <p className="text-2xl font-bold">{statistics.averageRating}</p>
            <p className="text-sm opacity-90">Ort. Puan</p>
          </motion.div>

          {/* Stats Button */}
          <motion.button
            onClick={() => toast('İstatistikler genişletilecek', { icon: '📊' })}
            className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white hover:shadow-lg transition-all"
          >
            <BarChart3 className="w-6 h-6 opacity-80 mb-2 mx-auto" />
            <p className="text-sm font-bold">Detaylı</p>
            <p className="text-xs opacity-90">İstatistikler</p>
          </motion.button>
        </div>
      )}

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="new">Yeni</option>
                  <option value="read">Okundu</option>
                  <option value="resolved">Çözüldü</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="service">Hizmet Kalitesi</option>
                  <option value="food">Ürün & Lezzet</option>
                  <option value="staff">Personel</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Geri Bildirim Yok</h3>
          <p className="text-gray-600">
            {filterStatus !== 'all' || filterCategory !== 'all' || searchTerm
              ? 'Bu filtrelerle eşleşen geri bildirim yok'
              : 'Henüz müşteri geri bildirimi alınmadı'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFeedbacks.map((feedback, idx) => {
            const CategoryIcon = CATEGORY_ICONS[feedback.category] || MessageSquare
            return (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${CATEGORY_COLORS[feedback.category]} rounded-xl flex items-center justify-center text-white`}>
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{feedback.categoryLabel}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(feedback.status)}`}>
                    {getStatusLabel(feedback.status)}
                  </span>
                </div>

                {/* Rating */}
                {feedback.rating && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg">
                    {getRatingEmoji(feedback.rating)}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= feedback.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-amber-600 ml-auto">
                      {feedback.rating}/5
                    </span>
                  </div>
                )}

                {/* Message */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-3">{feedback.message}</p>
                </div>

                {/* Admin Notes */}
                {feedback.adminNotes && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Admin Notu:</p>
                    <p className="text-sm text-blue-700">{feedback.adminNotes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedFeedback(feedback)
                      setAdminNotes(feedback.adminNotes || '')
                      setShowDetailModal(true)
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Detay
                  </button>

                  {feedback.status === 'new' && (
                    <button
                      onClick={() => updateStatus(feedback.id, 'read')}
                      className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      title="Okundu İşaretle"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteFeedback(feedback.id)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-6 bg-gradient-to-r ${CATEGORY_COLORS[selectedFeedback.category]} text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedFeedback.categoryLabel}</h2>
                    <p className="text-sm opacity-90 mt-1">
                      {new Date(selectedFeedback.createdAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                {/* Rating */}
                {selectedFeedback.rating && (
                  <div className="mb-6 p-4 bg-amber-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRatingEmoji(selectedFeedback.rating)}
                        <div>
                          <p className="text-sm text-gray-600">Müşteri Puanı</p>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= selectedFeedback.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-amber-600">
                        {selectedFeedback.rating}/5
                      </p>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Mesaj</h3>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Admin Notları</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="İç kullanım için notlar ekleyin..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={() => updateStatus(selectedFeedback.id, selectedFeedback.status, adminNotes)}
                    className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    Notu Kaydet
                  </button>
                </div>

                {/* Status Actions */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Durum Güncelle</h3>
                  <div className="flex gap-2">
                    {['new', 'read', 'resolved'].map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedFeedback.id, status, adminNotes)}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                          selectedFeedback.status === status
                            ? 'bg-amber-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-bold"
                >
                  Kapat
                </button>
                <button
                  onClick={() => deleteFeedback(selectedFeedback.id)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-bold flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}