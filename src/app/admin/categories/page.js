'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, ChevronDown, ChevronRight,
  Folder, FolderOpen, Image as ImageIcon, Save, X, AlertCircle,
  DragHandleDots2, MoreVertical, Check
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'
import { apiPath } from '@/lib/api'


export default function CategoriesAdminPage() {
  // States
  const [categories, setCategories] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit'
  const [modalType, setModalType] = useState('main') // 'main', 'sub'
  const [selectedParent, setSelectedParent] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: null,
    image: null,
    sortOrder: 0,
    isActive: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch(apiPath('/api/admin/categories'))
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories || [])
        setFlatCategories(data.flatCategories || [])
        
        // Tüm ana kategorileri genişletilmiş olarak başlat
        const mainCategories = (data.flatCategories || []).filter(cat => !cat.parentId)
        setExpandedCategories(new Set(mainCategories.map(cat => cat.id)))
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error)
      toast.error('Kategoriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const openAddModal = (type = 'main', parentCategory = null) => {
    setModalMode('add')
    setModalType(type)
    setSelectedParent(parentCategory)
    setFormData({
      name: '',
      description: '',
      slug: '',
      parentId: parentCategory?.id || null,
      image: null,
      sortOrder: 0,
      isActive: true
    })
    setShowModal(true)
  }

  const openEditModal = (category) => {
    setModalMode('edit')
    setModalType(category.parentId ? 'sub' : 'main')
    setEditingCategory(category)
    setSelectedParent(category.parentId ? flatCategories.find(cat => cat.id === category.parentId) : null)
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      parentId: category.parentId,
      image: category.image,
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setSelectedParent(null)
    setFormData({
      name: '',
      description: '',
      slug: '',
      parentId: null,
      image: null,
      sortOrder: 0,
      isActive: true
    })
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { slug: generateSlug(value) })
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Kategori adı gerekli!')
      return
    }

    try {
      const url = '/api/admin/categories'
      const method = modalMode === 'edit' ? 'PUT' : 'POST'
      const body = modalMode === 'edit' 
        ? { ...formData, id: editingCategory.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        await fetchCategories()
        closeModal()
        toast.success(modalMode === 'edit' ? 'Kategori güncellendi!' : 'Kategori eklendi!')
      } else {
        toast.error(result.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Kategori kaydetme hatası:', error)
      toast.error('Kaydetme sırasında hata oluştu')
    }
  }

  const handleDelete = async (category) => {
    // Alt kategorisi varsa uyar
    const hasSubcategories = flatCategories.some(cat => cat.parentId === category.id)
    if (hasSubcategories) {
      toast.error('Bu kategorinin alt kategorileri var. Önce onları silin.')
      return
    }

    if (!confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await fetchCategories()
        toast.success('Kategori silindi!')
      } else {
        toast.error(result.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Kategori silme hatası:', error)
      toast.error('Silme sırasında hata oluştu')
    }
  }

  const toggleCategoryStatus = async (category) => {
    try {
      const response = await fetch(apiPath('/api/admin/categories'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...category,
          isActive: !category.isActive
        })
      })

      const result = await response.json()

      if (result.success) {
        await fetchCategories()
        toast.success(`Kategori ${!category.isActive ? 'aktif' : 'pasif'} hale getirildi`)
      } else {
        toast.error(result.error || 'Durum değiştirilemedi')
      }
    } catch (error) {
      console.error('Kategori durum değiştirme hatası:', error)
      toast.error('Durum değiştirme sırasında hata oluştu')
    }
  }

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id} className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
        {/* Ana kategori */}
        <div className={`p-4 ${level > 0 ? 'ml-8 border-l-4 border-amber-200' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Expand/Collapse Button */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              )}

              {/* Icon */}
              <div className="flex-shrink-0">
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="w-8 h-8 text-amber-500" />
                  ) : (
                    <Folder className="w-8 h-8 text-amber-600" />
                  )
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-amber-400 rounded-sm"></div>
                  </div>
                )}
              </div>

              {/* Image */}
              {category.image && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Category Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className={`font-semibold text-lg ${category.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {category.name}
                  </h3>
                  {!category.isActive && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                      Pasif
                    </span>
                  )}
                  {level > 0 && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full font-medium">
                      Alt Kategori
                    </span>
                  )}
                </div>
                {category.description && (
                  <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">Slug: {category.slug}</span>
                  <span className="text-xs text-gray-500">Sıra: {category.sortOrder}</span>
                  {hasChildren && (
                    <span className="text-xs text-amber-600 font-medium">
                      {category.children.length} alt kategori
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Add Subcategory (sadece ana kategoriler için) */}
              {level === 0 && (
                <button
                  onClick={() => openAddModal('sub', category)}
                  className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors group"
                  title="Alt kategori ekle"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}

              {/* Toggle Status */}
              <button
                onClick={() => toggleCategoryStatus(category)}
                className={`p-2 rounded-lg transition-colors ${
                  category.isActive 
                    ? 'hover:bg-green-50 text-green-600' 
                    : 'hover:bg-gray-50 text-gray-400'
                }`}
                title={category.isActive ? 'Pasif yap' : 'Aktif yap'}
              >
                {category.isActive ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              {/* Edit */}
              <button
                onClick={() => openEditModal(category)}
                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(category)}
                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Alt kategoriler */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pl-4 pb-4 space-y-2">
                {category.children.map(child => 
                  renderCategory(child, level + 1)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Kategoriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Kategori Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">Menü kategorilerinizi organize edin ve yönetin</p>
        </div>
        
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openAddModal('main')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Ana Kategori Ekle
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Toplam Kategori</p>
              <p className="text-3xl font-bold text-gray-900">{flatCategories.length}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Folder className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Ana Kategori</p>
              <p className="text-3xl font-bold text-gray-900">
                {flatCategories.filter(cat => !cat.parentId).length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Aktif Kategori</p>
              <p className="text-3xl font-bold text-gray-900">
                {flatCategories.filter(cat => cat.isActive).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kategori yok</h3>
            <p className="text-gray-600 mb-6">İlk kategorinizi oluşturarak başlayın</p>
            <button
              onClick={() => openAddModal('main')}
              className="bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Ana Kategori Ekle
            </button>
          </div>
        ) : (
          categories.map(category => renderCategory(category))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {modalMode === 'edit' ? 'Kategori Düzenle' : 
                     modalType === 'main' ? 'Ana Kategori Ekle' : 'Alt Kategori Ekle'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {modalType === 'sub' && selectedParent && (
                  <p className="text-amber-100 text-sm mt-1">
                    Ana Kategori: {selectedParent.name}
                  </p>
                )}
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Örn: İçecekler"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Kategori açıklaması..."
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleFormChange('slug', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50"
                    placeholder="otomatik-oluşturulur"
                    readOnly
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori Görseli
                  </label>
                  <ImageUpload
                    currentImage={formData.image}
                    onImageUploaded={(imageData) => handleFormChange('image', imageData.url)}
                    onImageRemoved={() => handleFormChange('image', null)}
                    size="sm"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => handleFormChange('sortOrder', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    min="0"
                  />
                  <p className="text-gray-500 text-xs mt-1">Küçük sayılar önce görünür</p>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    Durum
                  </label>
                  <button
                    type="button"
                    onClick={() => handleFormChange('isActive', !formData.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    {modalMode === 'edit' ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}