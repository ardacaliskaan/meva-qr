'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Star, Filter, Search, Eye, Check, X, Trash2,
  BarChart3, TrendingUp, Users, Utensils, Sparkles, AlertCircle,
  Clock, CheckCircle, XCircle, StickyNote, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const categories = [
    { id: 'service', label: 'Hizmet Kalitesi', icon: Sparkles, color: 'blue' },
    { id: 'food', label: 'Ürün & Lezzet', icon: Utensils, color: 'orange' },
    { id: 'staff', label: 'Personel', icon: Users, color: 'purple' },
    { id: 'other', label: 'Diğer', icon: AlertCircle, color: 'gray' }
  ]

  const statusOptions = [
    { value: 'new', label: 'Yeni', icon: Clock, color: 'yellow' },
    { value: 'read', label: 'Okundu', icon: Eye, color: 'blue' },
    { value: 'resolved', label: 'Çözüldü', icon: CheckCircle, color: 'green' }
  ]

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      
      const response = await fetch(apiPath('/api/feedback?stats=true'))
      const data = await response.json()
      
      if (data.success) {
        setFeedbacks(data.feedbacks || [])
        setStats(data.statistics || null)
        
        if (!silent) {
          toast.success(`${data.feedbacks?.length || 0} geri bildirim yüklendi`)
        }
      } else {
        toast.error('Geri bildirimler yüklenemedi')
      }
    } catch (error) {
      console.error('Load feedbacks error:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (filterStatus !== 'all' && feedback.status !== filterStatus) return false
    if (filterCategory !== 'all' && feedback.category !== filterCategory) return false
    if (searchTerm && !feedback.message.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const updateFeedbackStatus = async (id, status) => {
    try {
      setUpdating(true)
      
      const response = await fetch(apiPath('/api/feedback'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Durum güncellendi')
        await loadFeedbacks(true)
        
        if (selectedFeedback?.id === id) {
          const updated = feedbacks.find(f => f.id === id)
          if (updated) {
            setSelectedFeedback({ ...updated, status })
          }
        }
      } else {
        toast.error(data.error || 'Güncelleme başarısız')
      }
    } catch (error) {
      console.error('Update status error:', error)
      toast.error('Güncelleme hatası')
    } finally {
      setUpdating(false)
    }
  }

  const saveAdminNotes = async () => {
    if (!selectedFeedback) return
    
    try {
      setUpdating(true)
      
      const response = await fetch(apiPath('/api/feedback'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFeedback.id,
          adminNotes: adminNotes
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Not kaydedildi')
        await loadFeedbacks(true)
        setShowDetailModal(false)
      } else {
        toast.error(data.error || 'Kaydetme başarısız')
      }
    } catch (error) {
      console.error('Save notes error:', error)
      toast.error('Kaydetme hatası')
    } finally {
      setUpdating(false)
    }
  }

  const deleteFeedback = async (id) => {
    if (!confirm('Bu geri bildirimi silmek istediğinizden emin misiniz?')) return
    
    try {
      const response = await fetch(apiPath(`/api/feedback?id=${id}`), {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Geri bildirim silindi')
        await loadFeedbacks(true)
        if (selectedFeedback?.id === id) {
          setShowDetailModal(false)
        }
      } else {
        toast.error(data.error || 'Silme başarısız')
      }
    } catch (error) {
      console.error('Delete feedback error:', error)
      toast.error('Silme hatası')
    }
  }

  const openDetail = (feedback) => {
    setSelectedFeedback(feedback)
    setAdminNotes(feedback.adminNotes || '')
    setShowDetailModal(true)
    
    // Yeni ise okundu olarak işaretle
    if (feedback.status === 'new') {
      updateFeedbackStatus(feedback.id, 'read')
    }
  }

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.icon : AlertCircle
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.color : 'gray'
  }

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption ? statusOption.color : 'gray'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Geri bildirimler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-indigo-600" />
            Müşteri Geri Bildirimleri
          </h1>
          <p className="text-gray-600">Müşteri görüş ve önerilerini yönetin</p>
        </div>
        
        <button
          onClick={() => loadFeedbacks()}
          disabled={refreshing}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Yeni</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.unread}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ort. Rating</p>
                <p className="text-3xl font-bold text-amber-600">{stats.averageRating}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Çözüldü</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Geri bildirimlerde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Tüm Durumlar</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Geri Bildirim Bulunamadı</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Filtreleri değiştirip tekrar deneyin'
                : 'Henüz hiç geri bildirim yok'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFeedbacks.map((feedback, index) => {
              const CategoryIcon = getCategoryIcon(feedback.category)
              const StatusIcon = statusOptions.find(s => s.value === feedback.status)?.icon || Clock
              
              return (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openDetail(feedback)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className={`w-12 h-12 bg-${getCategoryColor(feedback.category)}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <CategoryIcon className={`w-6 h-6 text-${getCategoryColor(feedback.category)}-600`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${getCategoryColor(feedback.category)}-100 text-${getCategoryColor(feedback.category)}-700`}>
                          {feedback.categoryLabel}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${getStatusColor(feedback.status)}-100 text-${getStatusColor(feedback.status)}-700 flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusOptions.find(s => s.value === feedback.status)?.label}
                        </span>
                        {feedback.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(feedback.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-gray-900 mb-2 line-clamp-2">{feedback.message}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(feedback.createdAt)}
                        </span>
                        {feedback.adminNotes && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <StickyNote className="w-4 h-4" />
                            Admin notu var
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetail(feedback)
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Detay"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFeedback(feedback.id)
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl font-bold mb-1">Geri Bildirim Detayı</h2>
                    <p className="text-sm text-indigo-100">{selectedFeedback.categoryLabel}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Rating */}
                {selectedFeedback.rating && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Memnuniyet Derecesi
                    </label>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < selectedFeedback.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        ({selectedFeedback.rating}/5)
                      </span>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mesaj
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tarih
                  </label>
                  <p className="text-gray-600">{formatDate(selectedFeedback.createdAt)}</p>
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Durum
                  </label>
                  <div className="flex gap-2">
                    {statusOptions.map(status => {
                      const StatusIcon = status.icon
                      const isActive = selectedFeedback.status === status.value
                      
                      return (
                        <button
                          key={status.value}
                          onClick={() => updateFeedbackStatus(selectedFeedback.id, status.value)}
                          disabled={updating || isActive}
                          className={`
                            flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
                            ${isActive
                              ? `bg-${status.color}-100 text-${status.color}-700 border-2 border-${status.color}-300`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          <StatusIcon className="w-5 h-5" />
                          {status.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Notları
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Bu geri bildirim hakkında notlar ekleyin..."
                    className="w-full h-32 border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">Sadece admin panelde görüntülenir</p>
                    <p className="text-xs text-gray-500">{adminNotes.length} / 500</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={saveAdminNotes}
                    disabled={updating}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Kaydet
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteFeedback(selectedFeedback.id)}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Sil
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}