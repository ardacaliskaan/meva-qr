// src/app/admin/users/page.js - ULTRA DETAILED VERSION

'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Activity,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'


const USER_ROLES = {
  admin: { label: 'Yönetici', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Shield, description: 'Tüm yetkilere sahip' },
  waiter: { label: 'Garson', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: UsersIcon, description: 'Sipariş yönetimi' },
  kitchen: { label: 'Mutfak', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: UsersIcon, description: 'Mutfak işlemleri' },
  cashier: { label: 'Kasiyer', color: 'bg-green-100 text-green-800 border-green-200', icon: UsersIcon, description: 'Ödeme işlemleri' }
}

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'İsim (A-Z)' },
  { value: 'name-desc', label: 'İsim (Z-A)' },
  { value: 'role-asc', label: 'Rol (A-Z)' },
  { value: 'createdAt-desc', label: 'En Yeni' },
  { value: 'createdAt-asc', label: 'En Eski' },
]

export default function UsersPage() {
  // State Management
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt-desc')
  
  // UI State
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedStats, setExpandedStats] = useState(true)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
    recentLogins: 0
  })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'waiter',
    phone: '',
    isActive: true
  })

  // Form validation errors
  const [formErrors, setFormErrors] = useState({})

  // Initial load
  useEffect(() => {
    fetchUsers()
  }, [])

  // Fetch users from API
  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      
      setError(null)
      
      console.log('🔄 Fetching users...')
      
      const response = await fetch(apiPath('/api/admin/users?stats=true'), {
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }))
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (data.success) {
        console.log('✅ Users loaded:', data.users?.length || 0)
        setUsers(data.users || [])
        
        const statistics = data.statistics || data.stats || {
          total: 0,
          active: 0,
          inactive: 0,
          byRole: {},
          recentLogins: 0
        }
        console.log('📊 Stats:', statistics)
        setStats(statistics)
        
        if (!silent) {
          toast.success(`${data.users?.length || 0} kullanıcı yüklendi`)
        }
      } else {
        console.error('❌ API returned error:', data.error)
        throw new Error(data.error || 'Kullanıcılar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('❌ Fetch error:', error)
      setError(error.message)
      toast.error(error.message || 'Bağlantı hatası')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Form validation
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Ad soyad gerekli'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Ad soyad en az 2 karakter olmalı'
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Kullanıcı adı gerekli'
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Kullanıcı adı en az 3 karakter olmalı'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Kullanıcı adı sadece harf, rakam ve _ içerebilir'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçersiz email formatı'
    }
    
    if (!editingUser && !formData.password) {
      errors.password = 'Şifre gerekli'
    } else if (formData.password && formData.password.length < 4) {
      errors.password = 'Şifre en az 4 karakter olmalı'
    }
    
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      errors.phone = 'Geçersiz telefon formatı'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Lütfen formu doğru doldurun')
      return
    }

    setSubmitting(true)

    try {
      const method = editingUser ? 'PUT' : 'POST'
      const bodyData = editingUser 
        ? { ...formData, id: editingUser._id || editingUser.id }
        : formData
      
      console.log(`${method} /api/admin/users`, bodyData)
      
      const response = await fetch(apiPath('/api/admin/users'), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      })

      const data = await response.json()
      console.log('Response:', data)

      if (data.success) {
        toast.success(
          editingUser 
            ? '✅ Kullanıcı güncellendi' 
            : '✅ Kullanıcı eklendi',
          { duration: 3000 }
        )
        setShowModal(false)
        resetForm()
        fetchUsers(true)
      } else {
        toast.error(data.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('İşlem sırasında hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (user) => {
    console.log('Editing user:', user)
    setEditingUser(user)
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role,
      phone: user.phone || '',
      isActive: user.isActive
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Handle delete
  const handleDelete = async (userId, userName) => {
    if (!confirm(`"${userName}" kullanıcısını silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('🗑️ Kullanıcı silindi')
        fetchUsers(true)
      } else {
        toast.error(data.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi sırasında hata oluştu')
    }
  }

  // Handle status toggle
  const handleStatusToggle = async (userId, currentStatus, userName) => {
    try {
      const response = await fetch(apiPath('/api/admin/users'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: userId,
          isActive: !currentStatus 
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          currentStatus 
            ? `❌ ${userName} devre dışı bırakıldı` 
            : `✅ ${userName} aktif edildi`
        )
        fetchUsers(true)
      } else {
        toast.error(data.error || 'Durum değiştirilemedi')
      }
    } catch (error) {
      console.error('Status toggle error:', error)
      toast.error('Durum değiştirme hatası')
    }
  }

  // View user details
  const viewUserDetails = (user) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'waiter',
      phone: '',
      isActive: true
    })
    setFormErrors({})
    setEditingUser(null)
    setShowPassword(false)
  }

  // Export users to CSV
  const exportToCSV = () => {
    const csv = [
      ['Ad Soyad', 'Kullanıcı Adı', 'Email', 'Telefon', 'Rol', 'Durum'].join(','),
      ...filteredAndSortedUsers.map(user => [
        user.name,
        user.username,
        user.email || '',
        user.phone || '',
        USER_ROLES[user.role]?.label || user.role,
        user.isActive ? 'Aktif' : 'Pasif'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kullanicilar-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('📥 CSV indirildi')
  }

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesRole = filterRole === 'all' || user.role === filterRole
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive)
      
      return matchesSearch && matchesRole && matchesStatus
    })

    // Sort
    const [field, order] = sortBy.split('-')
    filtered.sort((a, b) => {
      let aVal = a[field]
      let bVal = b[field]
      
      if (field === 'name' || field === 'role') {
        aVal = aVal?.toLowerCase() || ''
        bVal = bVal?.toLowerCase() || ''
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [users, searchTerm, filterRole, filterStatus, sortBy])

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Hiç giriş yapmadı'
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Kullanıcılar Yükleniyor</p>
          <p className="text-sm text-gray-500 mt-1">Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 p-4">
        <div className="bg-red-50 border-4 border-red-200 rounded-full p-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bağlantı Hatası</h2>
          <p className="text-gray-600 mb-1">{error}</p>
          <p className="text-sm text-gray-500">
            Lütfen konsolu (F12) kontrol edin ve tekrar deneyin
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchUsers()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tekrar Dene</span>
          </button>
          <button
            onClick={() => window.location.href = '/admin'}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (users.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 p-4">
        <div className="bg-blue-50 border-4 border-blue-200 rounded-full p-6">
          <UsersIcon className="w-16 h-16 text-blue-500" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz Kullanıcı Yok</h2>
          <p className="text-gray-600 mb-4">
            Sisteme henüz kullanıcı eklenmemiş. Başlamak için seed script&apos;ini çalıştırın.
          </p>
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg font-mono text-sm mb-4">
            node scripts/seed.js
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchUsers()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yenile</span>
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Kullanıcıyı Ekle</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Debug Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Info className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-yellow-900">Debug Bilgileri</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-yellow-800">
                <span>📊 Toplam: <strong>{users.length}</strong></span>
                <span>✅ Aktif: <strong>{stats.active}</strong></span>
                <span>❌ Pasif: <strong>{stats.inactive}</strong></span>
                <span>🔍 Filtrelenen: <strong>{filteredAndSortedUsers.length}</strong></span>
                <span>🔐 Admin: <strong>{stats.byRole?.admin || 0}</strong></span>
                <span>👨‍🍳 Garson: <strong>{stats.byRole?.waiter || 0}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={`w-5 h-5 text-yellow-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <UsersIcon className="w-8 h-8 text-white" />
            </div>
            <span>Kullanıcı Yönetimi</span>
          </h1>
          <p className="text-gray-600 mt-2">Garson ve diğer kullanıcıları yönetin</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">CSV İndir</span>
          </button>
          
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Yeni Kullanıcı</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Toplam"
          value={stats.total}
          icon={UsersIcon}
          color="blue"
          change="+2 bu ay"
        />
        <StatsCard
          title="Aktif"
          value={stats.active}
          icon={CheckCircle2}
          color="green"
          change={`${Math.round((stats.active / stats.total) * 100)}%`}
        />
        <StatsCard
          title="Pasif"
          value={stats.inactive}
          icon={XCircle}
          color="red"
          change={`${Math.round((stats.inactive / stats.total) * 100)}%`}
        />
        <StatsCard
          title="Garsonlar"
          value={stats.byRole?.waiter || 0}
          icon={UsersIcon}
          color="purple"
        />
        <StatsCard
          title="Son Giriş (24s)"
          value={stats.recentLogins || 0}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="İsim, kullanıcı adı veya email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all"
              >
                <option value="all">Tüm Roller</option>
                {Object.entries(USER_ROLES).map(([key, role]) => (
                  <option key={key} value={key}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sıralama:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>{filteredAndSortedUsers.length}</strong> / {users.length} kullanıcı gösteriliyor
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Rol & Yetki
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Aktivite
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedUsers.map((user, index) => (
                <motion.tr
                  key={user._id || user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-blue-50/50 transition-all group"
                >
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-lg font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {user.isActive && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">@{user.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${USER_ROLES[user.role]?.color}`}>
                        {USER_ROLES[user.role]?.label || user.role}
                      </span>
                      <p className="text-xs text-gray-500">
                        {user.permissions?.length || 0} yetki
                      </p>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      {user.email ? (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Email yok</span>
                      )}
                      {user.phone ? (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{user.phone}</span>
                        </div>
                      ) : null}
                    </div>
                  </td>

                  {/* Activity */}
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Kayıt: {new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Activity className="w-3.5 h-3.5" />
                        <span>
                          {user.metadata?.lastLogin 
                            ? `Son: ${new Date(user.metadata.lastLogin).toLocaleDateString('tr-TR')}`
                            : 'Hiç giriş yok'
                          }
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusToggle(user._id || user.id, user.isActive, user.name)}
                      className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-200'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Pasif
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Detay"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id || user.id, user.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Empty filtered state */}
          {filteredAndSortedUsers.length === 0 && users.length > 0 && (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kullanıcı Bulunamadı</h3>
              <p className="text-gray-500 mb-4">Arama kriterlerinize uygun kullanıcı yok</p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterRole('all')
                  setFilterStatus('all')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal - I'll continue in next response due to length */}
      <AnimatePresence>
        {showModal && (
          <Modal
            title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
            onClose={() => setShowModal(false)}
          >
            <UserForm
              formData={formData}
              setFormData={setFormData}
              formErrors={formErrors}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              editingUser={editingUser}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => setShowModal(false)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <Modal
            title="Kullanıcı Detayları"
            onClose={() => setShowDetailModal(false)}
          >
            <UserDetail user={selectedUser} onClose={() => setShowDetailModal(false)} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color, change }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  )
}

// Modal Component
function Modal({ title, children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// User Form Component
function UserForm({ formData, setFormData, formErrors, showPassword, setShowPassword, editingUser, submitting, onSubmit, onCancel }) {
  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ad Soyad <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 border-2 ${formErrors.name ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          placeholder="Ahmet Yılmaz"
        />
        {formErrors.name && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.name}</span>
          </p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Kullanıcı Adı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className={`w-full px-4 py-3 border-2 ${formErrors.username ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          placeholder="ahmet_y"
          disabled={!!editingUser}
        />
        {formErrors.username && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.username}</span>
          </p>
        )}
        {editingUser && (
          <p className="mt-1 text-xs text-gray-500">Kullanıcı adı değiştirilemez</p>
        )}
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-4 py-3 border-2 ${formErrors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            placeholder="ahmet@restaurant.com"
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.email}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full px-4 py-3 border-2 ${formErrors.phone ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            placeholder="+90 555 123 45 67"
          />
          {formErrors.phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.phone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Şifre {!editingUser && <span className="text-red-500">*</span>}
          {editingUser && <span className="text-gray-500 text-xs">(Boş bırakılırsa değişmez)</span>}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`w-full px-4 py-3 pr-12 border-2 ${formErrors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formErrors.password && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.password}</span>
          </p>
        )}
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Rol <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {Object.entries(USER_ROLES).map(([key, role]) => (
            <option key={key} value={key}>
              {role.label} - {role.description}
            </option>
          ))}
        </select>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
        <div>
          <p className="font-semibold text-gray-900">Aktif Durumu</p>
          <p className="text-sm text-gray-600">Kullanıcı sisteme giriş yapabilsin mi?</p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
            formData.isActive ? 'bg-green-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
              formData.isActive ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center space-x-2 min-w-[120px] justify-center"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Kaydediliyor...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>{editingUser ? 'Güncelle' : 'Oluştur'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// User Detail Component
function UserDetail({ user, onClose }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
          <span className="text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
          <p className="text-gray-500 font-mono">@{user.username}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem icon={Shield} label="Rol" value={USER_ROLES[user.role]?.label || user.role} />
        <InfoItem 
          icon={user.isActive ? CheckCircle2 : XCircle} 
          label="Durum" 
          value={user.isActive ? 'Aktif' : 'Pasif'}
          valueClass={user.isActive ? 'text-green-600' : 'text-red-600'}
        />
        <InfoItem icon={Mail} label="Email" value={user.email || 'Belirtilmemiş'} />
        <InfoItem icon={Phone} label="Telefon" value={user.phone || 'Belirtilmemiş'} />
        <InfoItem 
          icon={Calendar} 
          label="Kayıt Tarihi" 
          value={new Date(user.createdAt).toLocaleDateString('tr-TR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })} 
        />
        <InfoItem 
          icon={Activity} 
          label="Son Giriş" 
          value={user.metadata?.lastLogin 
            ? new Date(user.metadata.lastLogin).toLocaleDateString('tr-TR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Hiç giriş yapmadı'
          } 
        />
      </div>

      {/* Permissions */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Yetkiler ({user.permissions?.length || 0})</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {user.permissions?.map((permission, index) => (
            <span 
              key={index}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200"
            >
              {permission}
            </span>
          )) || (
            <span className="text-sm text-gray-500 italic">Yetki bulunmuyor</span>
          )}
        </div>
      </div>

      {/* Close Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
        >
          Kapat
        </button>
      </div>
    </div>
  )
}

// Info Item Component
function InfoItem({ icon: Icon, label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}