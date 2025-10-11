'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RefreshCw, Users, Smartphone, ShoppingCart, DollarSign,
  AlertTriangle, X, Check, Clock, Monitor, AlertCircle,
  Ban, Flag, Eye, Wifi
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('active')
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false)

  useEffect(() => {
    fetchSessions()
    
    // Auto-refresh her 30 saniyede
    const interval = setInterval(() => {
      fetchSessions(true)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [filterStatus, showSuspiciousOnly])

  const fetchSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      
      const params = new URLSearchParams({
        status: filterStatus,
        includeStats: 'true'
      })
      
      if (showSuspiciousOnly) {
        params.append('suspicious', 'true')
      }
      
      const response = await fetch(`/api/admin/sessions?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setSessions(data.sessions)
        if (data.statistics) {
          setStats(data.statistics)
        }
        if (!silent) {
          toast.success(`${data.sessions.length} oturum yüklendi`)
        }
      } else {
        toast.error(data.error || 'Oturumlar yüklenemedi')
      }
    } catch (error) {
      console.error('Sessions fetch error:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const closeSession = async (sessionId, reason) => {
    if (!confirm('Bu oturumu kapatmak istediğinize emin misiniz?')) return
    
    try {
      const response = await fetch(apiPath('/api/admin/sessions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'close',
          reason
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Oturum kapatıldı')
        fetchSessions(true)
      } else {
        toast.error(data.error || 'Oturum kapatılamadı')
      }
    } catch (error) {
      console.error('Close session error:', error)
      toast.error('İşlem gerçekleştirilemedi')
    }
  }

  const flagSession = async (sessionId, reason) => {
    try {
      const response = await fetch(apiPath('/api/admin/sessions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'flag',
          reason: reason || 'Manuel işaretleme'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Oturum işaretlendi')
        fetchSessions(true)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('İşlem gerçekleştirilemedi')
    }
  }

  const unflagSession = async (sessionId) => {
    try {
      const response = await fetch(apiPath('/api/admin/sessions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'unflag'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('İşaret kaldırıldı')
        fetchSessions(true)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('İşlem gerçekleştirilemedi')
    }
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}dk`
    }
    return `${mins}dk`
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Oturumlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Oturum Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">Aktif oturumları izleyin ve yönetin</p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchSessions()}
            disabled={refreshing}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Wifi className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.totalActive}</p>
                <p className="text-blue-100 text-sm">Aktif Oturum</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Smartphone className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.totalDevices}</p>
                <p className="text-purple-100 text-sm">Toplam Cihaz</p>
              </div>
            </div>
            <p className="text-purple-100 text-xs mt-2">
              Ort: {stats.averageDevicesPerSession} cihaz/oturum
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
                <p className="text-green-100 text-sm">Toplam Sipariş</p>
              </div>
            </div>
            <p className="text-green-100 text-xs mt-2">
              Ort: {stats.averageOrdersPerSession} sipariş/oturum
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.totalRevenue.toFixed(0)}₺</p>
                <p className="text-amber-100 text-sm">Toplam Ciro</p>
              </div>
            </div>
            {stats.suspiciousCount > 0 && (
              <p className="text-amber-100 text-xs mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.suspiciousCount} şüpheli oturum
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Durum:</span>
            {['active', 'expired', 'closed', 'all'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'active' ? 'Aktif' : 
                 status === 'expired' ? 'Süresi Dolmuş' :
                 status === 'closed' ? 'Kapatılmış' : 'Tümü'}
              </button>
            ))}
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSuspiciousOnly}
              onChange={(e) => setShowSuspiciousOnly(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Sadece Şüpheli Oturumlar
            </span>
          </label>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Oturum bulunamadı</p>
            <p className="text-gray-500 text-sm mt-2">
              {filterStatus === 'active' ? 'Şu anda aktif oturum yok' : 'Bu filtrede oturum yok'}
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                session.isSuspicious 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Sol Taraf - Session Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Masa {session.tableNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatTime(session.startTime)} · {formatDuration(session.duration)}
                      </p>
                    </div>
                    
                    {session.isSuspicious && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Şüpheli
                      </span>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {session.deviceCount} cihaz
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {session.orderCount} sipariş
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {session.totalAmount.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>
                  
                  {/* Suspicious Reasons */}
                  {session.isSuspicious && session.suspiciousReasons.length > 0 && (
                    <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Şüpheli Nedenler:
                      </p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {session.suspiciousReasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Sağ Taraf - Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedSession(session)
                      setShowDetailModal(true)
                    }}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detay
                  </button>
                  
                  {session.status === 'active' && (
                    <>
                      {session.isSuspicious ? (
                        <button
                          onClick={() => unflagSession(session.sessionId)}
                          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Onayla
                        </button>
                      ) : (
                        <button
                          onClick={() => flagSession(session.sessionId)}
                          className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Flag className="w-4 h-4" />
                          İşaretle
                        </button>
                      )}
                      
                      <button
                        onClick={() => closeSession(session.sessionId, 'Manuel kapatma')}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Kapat
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(false)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Oturum Detayları - Masa {selectedSession.tableNumber}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Session Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Oturum Bilgileri</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session ID:</span>
                      <span className="font-mono text-gray-900">{selectedSession.sessionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Başlangıç:</span>
                      <span className="text-gray-900">
                        {new Date(selectedSession.startTime).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Süre:</span>
                      <span className="text-gray-900">{formatDuration(selectedSession.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durum:</span>
                      <span className={`font-medium ${
                        selectedSession.status === 'active' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {selectedSession.status === 'active' ? 'Aktif' : 'Kapalı'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Devices */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Cihazlar ({selectedSession.deviceCount})
                  </h3>
                  <div className="space-y-2">
                    {selectedSession.devices.map((device, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Monitor className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            Cihaz {idx + 1}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 ml-6">
                          <p>IP: {device.ipAddress}</p>
                          <p>Sipariş: {device.orderCount || 0} adet</p>
                          <p>İlk görülme: {formatTime(device.firstSeen)}</p>
                        </div>
                      </div>
                    ))}
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