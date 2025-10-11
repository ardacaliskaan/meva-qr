'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Search, Filter,
  ChefHat, Clock, Flame, Star, Package, Image as ImageIcon,
  X, Save, AlertCircle, Tag, Utensils, ShoppingCart, Sparkles
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'
import { ingredientCategories } from '@/lib/models/ingredient'
import { apiPath } from '@/lib/api'

export default function AdminMenuPage() {
  // States
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSubcategory, setFilterSubcategory] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit'
  const [editingItem, setEditingItem] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    subcategoryId: '',
    image: null,
    ingredients: [],
    customizations: {
      removable: [],
      extras: []
    },
    requiredOptions: [], // 🆕 ZORUNLU SEÇİMLER
    nutritionInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    allergens: [],
    dietaryInfo: {
      isVegan: false,
      isVegetarian: false,
      isGlutenFree: false,
      isKeto: false,
      isLowCarb: false
    },
    cookingTime: '',
    spicyLevel: 0,
    sortOrder: 0,
    available: true,
    featured: false
  })

  const tabs = [
    { id: 'basic', label: 'Temel Bilgiler', icon: Package },
    { id: 'ingredients', label: 'Malzemeler', icon: ChefHat },
    { id: 'customization', label: 'Özelleştirme', icon: Utensils },
    { id: 'nutrition', label: 'Beslenme & Diyet', icon: Tag }
  ]

  const allergenOptions = [
    'gluten', 'dairy', 'eggs', 'nuts', 'peanuts', 'shellfish', 'fish', 'soy', 'sesame'
  ]

  const spicyLevels = [
    { value: 0, label: 'Acısız', color: 'text-gray-500' },
    { value: 1, label: 'Hafif Acı', color: 'text-yellow-500' },
    { value: 2, label: 'Orta Acı', color: 'text-orange-500' },
    { value: 3, label: 'Acı', color: 'text-red-500' },
    { value: 4, label: 'Çok Acı', color: 'text-red-600' },
    { value: 5, label: 'Ekstrem Acı', color: 'text-red-800' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Paralel API çağrıları
      const [menuRes, categoriesRes, ingredientsRes] = await Promise.all([
        fetch(apiPath('/api/admin/menu?enrich=true&stats=true')),
        fetch(apiPath('/api/admin/categories')),
        fetch(apiPath('/api/admin/ingredients'))
      ])

      const [menuData, categoriesData, ingredientsData] = await Promise.all([
        menuRes.json(),
        categoriesRes.json(),
        ingredientsRes.json()
      ])

      if (menuData.success) {
        setMenuItems(menuData.items || [])
      }

      if (categoriesData.success) {
        setCategories(categoriesData.categories || [])
        setFlatCategories(categoriesData.flatCategories || [])
      }

      if (ingredientsData.success) {
        setIngredients(ingredientsData.ingredients || [])
      }

    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setEditingItem(null)
    resetForm()
    setActiveTab('basic')
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setModalMode('edit')
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      categoryId: item.categoryId || '',
      subcategoryId: item.subcategoryId || '',
      image: item.image || null,
      ingredients: item.ingredients || [],
      customizations: item.customizations || { removable: [], extras: [] },
      requiredOptions: item.requiredOptions || [], // 🆕
      nutritionInfo: item.nutritionInfo || { calories: '', protein: '', carbs: '', fat: '' },
      allergens: item.allergens || [],
      dietaryInfo: item.dietaryInfo || {
        isVegan: false, isVegetarian: false, isGlutenFree: false, isKeto: false, isLowCarb: false
      },
      cookingTime: item.cookingTime?.toString() || '',
      spicyLevel: item.spicyLevel || 0,
      sortOrder: item.sortOrder || 0,
      available: item.available !== false,
      featured: item.featured || false
    })
    setActiveTab('basic')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      subcategoryId: '',
      image: null,
      ingredients: [],
      customizations: { removable: [], extras: [] },
      requiredOptions: [], // 🆕
      nutritionInfo: { calories: '', protein: '', carbs: '', fat: '' },
      allergens: [],
      dietaryInfo: {
        isVegan: false, isVegetarian: false, isGlutenFree: false, isKeto: false, isLowCarb: false
      },
      cookingTime: '',
      spicyLevel: 0,
      sortOrder: 0,
      available: true,
      featured: false
    })
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev }
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        newData[parent] = { ...newData[parent], [child]: value }
      } else {
        newData[field] = value
        
        // Kategori değiştiğinde alt kategoriyi sıfırla
        if (field === 'categoryId') {
          newData.subcategoryId = ''
        }
      }
      
      return newData
    })
  }

  // 🆕 ZORUNLU SEÇİM FONKSİYONLARI
  const addRequiredOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      label: '',
      required: true,
      options: []
    }
    setFormData(prev => ({
      ...prev,
      requiredOptions: [...prev.requiredOptions, newOption]
    }))
  }

  const updateRequiredOption = (optionId, field, value) => {
    setFormData(prev => ({
      ...prev,
      requiredOptions: prev.requiredOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const removeRequiredOption = (optionId) => {
    setFormData(prev => ({
      ...prev,
      requiredOptions: prev.requiredOptions.filter(opt => opt.id !== optionId)
    }))
  }

  const addOptionChoice = (optionId) => {
    const newChoice = {
      value: '',
      label: '',
      price: 0
    }
    setFormData(prev => ({
      ...prev,
      requiredOptions: prev.requiredOptions.map(opt =>
        opt.id === optionId
          ? { ...opt, options: [...opt.options, newChoice] }
          : opt
      )
    }))
  }

  const updateOptionChoice = (optionId, choiceIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      requiredOptions: prev.requiredOptions.map(opt =>
        opt.id === optionId
          ? {
              ...opt,
              options: opt.options.map((choice, idx) =>
                idx === choiceIndex ? { ...choice, [field]: value } : choice
              )
            }
          : opt
      )
    }))
  }

  const removeOptionChoice = (optionId, choiceIndex) => {
    setFormData(prev => ({
      ...prev,
      requiredOptions: prev.requiredOptions.map(opt =>
        opt.id === optionId
          ? {
              ...opt,
              options: opt.options.filter((_, idx) => idx !== choiceIndex)
            }
          : opt
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.price || !formData.categoryId) {
      toast.error('Zorunlu alanları doldurun!')
      return
    }

    try {
      const url = '/api/admin/menu'
      const method = modalMode === 'edit' ? 'PUT' : 'POST'
      const body = modalMode === 'edit' 
        ? { ...formData, id: editingItem.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        await loadData()
        closeModal()
        toast.success(modalMode === 'edit' ? 'Ürün güncellendi!' : 'Ürün eklendi!')
      } else {
        toast.error(result.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Ürün kaydetme hatası:', error)
      toast.error('Kaydetme sırasında hata oluştu')
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`"${item.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/menu?id=${item.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await loadData()
        toast.success('Ürün silindi!')
      } else {
        toast.error(result.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Ürün silme hatası:', error)
      toast.error('Silme sırasında hata oluştu')
    }
  }

  const toggleAvailability = async (item) => {
    try {
      const response = await fetch(apiPath('/api/admin/menu'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          available: !item.available,
          id: item.id
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadData()
        toast.success(`Ürün ${!item.available ? 'aktif' : 'pasif'} hale getirildi`)
      } else {
        toast.error(result.error || 'Durum değiştirilemedi')
      }
    } catch (error) {
      console.error('Durum değiştirme hatası:', error)
      toast.error('Durum değiştirme sırasında hata oluştu')
    }
  }

  // Filtreleme
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !filterCategory || item.categoryId === filterCategory
    const matchesSubcategory = !filterSubcategory || item.subcategoryId === filterSubcategory
    
    return matchesSearch && matchesCategory && matchesSubcategory
  })

  // Alt kategorileri getir
  const getSubcategories = (categoryId) => {
    return flatCategories.filter(cat => cat.parentId === categoryId)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Menü yükleniyor...</p>
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
            Menü Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">Ürünlerinizi ekleyin, düzenleyin ve yönetin</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Yeni Ürün Ekle
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Toplam Ürün</p>
              <p className="text-3xl font-bold text-gray-900">{menuItems.length}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Müsait Ürün</p>
              <p className="text-3xl font-bold text-gray-900">
                {menuItems.filter(item => item.available !== false).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Öne Çıkan</p>
              <p className="text-3xl font-bold text-gray-900">
                {menuItems.filter(item => item.featured).length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Ortalama Fiyat</p>
              <p className="text-3xl font-bold text-gray-900">
                ₺{menuItems.length > 0 
                  ? (menuItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) / menuItems.length).toFixed(2)
                  : '0.00'
                }
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setFilterSubcategory('')
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Tüm Kategoriler</option>
            {flatCategories.filter(cat => !cat.parentId).map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Subcategory Filter */}
          <select
            value={filterSubcategory}
            onChange={(e) => setFilterSubcategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={!filterCategory}
          >
            <option value="">Tüm Alt Kategoriler</option>
            {getSubcategories(filterCategory).map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterCategory('')
              setFilterSubcategory('')
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Filtreleri Temizle
          </button>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-xl border border-gray-200">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ürün yok</h3>
            <p className="text-gray-600 mb-6">İlk ürününüzü oluşturarak başlayın</p>
            <button
              onClick={openAddModal}
              className="bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Ürün Ekle
            </button>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ChefHat className="w-16 h-16 text-amber-300" />
                  </div>
                )}
                
                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col space-y-2">
                  {item.featured && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Öne Çıkan
                    </span>
                  )}
                  {!item.available && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Stokta Yok
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                      item.available 
                        ? 'bg-green-500/90 hover:bg-green-600/90' 
                        : 'bg-gray-500/90 hover:bg-gray-600/90'
                    }`}
                    title={item.available ? 'Stoktan Çıkar' : 'Stoka Ekle'}
                  >
                    {item.available ? (
                      <Eye className="w-4 h-4 text-white" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 bg-blue-500/90 hover:bg-blue-600/90 rounded-full backdrop-blur-sm transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 bg-red-500/90 hover:bg-red-600/90 rounded-full backdrop-blur-sm transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-gray-900 transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-xl font-bold text-amber-600">
                    ₺{(parseFloat(item.price) || 0).toFixed(2)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Category Info */}
                <div className="flex items-center space-x-2 mb-4">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                    {item.category?.name}
                  </span>
                  {item.subcategory && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      {item.subcategory.name}
                    </span>
                  )}
                </div>

                {/* Features */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    {item.cookingTime && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{item.cookingTime}dk</span>
                      </div>
                    )}
                    {item.spicyLevel > 0 && (
                      <div className="flex items-center">
                        <Flame className="w-3 h-3 mr-1 text-red-500" />
                        <span>{spicyLevels[item.spicyLevel]?.label}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                    <span>4.8</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {modalMode === 'edit' ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="border-b border-gray-200 px-6">
                <div className="flex space-x-8">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-amber-500 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmit} className="h-[calc(90vh-140px)] overflow-y-auto">
                <div className="p-6">
                  {/* Basic Tab */}
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      {/* Name & Description */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Ürün Adı *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="Örn: Margherita Pizza"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Fiyat (₺) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => handleFormChange('price', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Açıklama *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                          rows={4}
                          placeholder="Ürün açıklaması..."
                          required
                        />
                      </div>

                      {/* Categories */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Ana Kategori *
                          </label>
                          <select
                            value={formData.categoryId}
                            onChange={(e) => handleFormChange('categoryId', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            required
                          >
                            <option value="">Kategori Seçin</option>
                            {flatCategories.filter(cat => !cat.parentId).map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Alt Kategori
                          </label>
                          <select
                            value={formData.subcategoryId}
                            onChange={(e) => handleFormChange('subcategoryId', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            disabled={!formData.categoryId}
                          >
                            <option value="">Alt Kategori Seçin</option>
                            {getSubcategories(formData.categoryId).map(subcategory => (
                              <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ürün Görseli
                        </label>
                        <ImageUpload
                          currentImage={formData.image}
                          onImageUploaded={(imageData) => handleFormChange('image', imageData.url)}
                          onImageRemoved={() => handleFormChange('image', null)}
                          size="default"
                        />
                      </div>

                      {/* Additional Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Hazırlama Süresi (dk)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={formData.cookingTime}
                            onChange={(e) => handleFormChange('cookingTime', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="15"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Acılık Seviyesi
                          </label>
                          <select
                            value={formData.spicyLevel}
                            onChange={(e) => handleFormChange('spicyLevel', parseInt(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            {spicyLevels.map(level => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Sıralama
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.sortOrder}
                            onChange={(e) => handleFormChange('sortOrder', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Status Toggles */}
                      <div className="flex items-center justify-between space-x-6">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-gray-700 mr-4">
                            Müsait
                          </label>
                          <button
                            type="button"
                            onClick={() => handleFormChange('available', !formData.available)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.available ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.available ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-gray-700 mr-4">
                            Öne Çıkan
                          </label>
                          <button
                            type="button"
                            onClick={() => handleFormChange('featured', !formData.featured)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.featured ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.featured ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ingredients Tab */}
                  {activeTab === 'ingredients' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <ChefHat className="w-5 h-5" />
                          Ürün Malzemeleri
                        </h3>
                        <p className="text-blue-700 text-sm">
                          Bu üründe bulunan temel malzemeleri seçin. Malzemeler müşteri menüsünde görünecek.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                        {ingredientCategories.map(category => {
                          const categoryIngredients = ingredients.filter(ing => ing.category === category.value)
                          if (categoryIngredients.length === 0) return null

                          return (
                            <div key={category.value} className="bg-white rounded-xl border border-gray-200 p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 capitalize flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                {category.label}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {categoryIngredients.map(ingredient => (
                                  <label
                                    key={ingredient.id}
                                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.ingredients.includes(ingredient.id)}
                                      onChange={(e) => {
                                        const newIngredients = e.target.checked
                                          ? [...formData.ingredients, ingredient.id]
                                          : formData.ingredients.filter(id => id !== ingredient.id)
                                        handleFormChange('ingredients', newIngredients)
                                      }}
                                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">{ingredient.name}</span>
                                    {ingredient.extraPrice > 0 && (
                                      <span className="text-xs text-amber-600">
                                        (+₺{ingredient.extraPrice.toFixed(2)})
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Customization Tab - 🆕 ZORUNLU SEÇİMLER BURAYA */}
                  {activeTab === 'customization' && (
                    <div className="space-y-6">
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Utensils className="w-5 h-5" />
                          Ürün Özelleştirme
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Müşterilerin çıkarabileceği veya ekstra olarak ekleyebileceği malzemeleri belirleyin.
                        </p>
                      </div>

                      {/* 🆕 ZORUNLU SEÇİMLER BÖLÜMÜ */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Zorunlu Seçimler
                          </h4>
                          <button
                            type="button"
                            onClick={addRequiredOption}
                            className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Seçim Grubu Ekle
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                          Müşterilerin sipariş verirken seçmesi gereken opsiyonlar (örn: Boyut, Şeker seviyesi, İçecek sıcaklığı)
                        </p>

                        {formData.requiredOptions.length === 0 ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">Henüz zorunlu seçim yok</p>
                            <p className="text-gray-400 text-sm mb-4">
                              Müşterilerinizin ürünü sipariş ederken seçim yapması gereken opsiyon grupları ekleyin
                            </p>
                            <button
                              type="button"
                              onClick={addRequiredOption}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                            >
                              İlk seçim grubunu oluştur
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {formData.requiredOptions.map((opt, optIdx) => (
                              <div key={opt.id} className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50/50">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) => updateRequiredOption(opt.id, 'label', e.target.value)}
                                      placeholder="Seçim Grubu Adı (örn: Boyut, Şeker Seviyesi, Sıcaklık)"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeRequiredOption(opt.id)}
                                    className="ml-3 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Seçim grubunu sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="flex items-center mb-3">
                                  <input
                                    type="checkbox"
                                    checked={opt.required}
                                    onChange={(e) => updateRequiredOption(opt.id, 'required', e.target.checked)}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <label className="ml-2 text-sm text-gray-700">Bu seçim zorunlu</label>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">Seçenekler:</label>
                                    <button
                                      type="button"
                                      onClick={() => addOptionChoice(opt.id)}
                                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                                    >
                                      + Seçenek Ekle
                                    </button>
                                  </div>

                                  {opt.options.length === 0 ? (
                                    <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg bg-white">
                                      <p className="text-sm text-gray-500">Henüz seçenek yok</p>
                                      <p className="text-xs text-gray-400 mt-1">Yukarıdaki butondan seçenek ekleyin</p>
                                    </div>
                                  ) : (
                                    opt.options.map((choice, choiceIdx) => (
                                      <div key={choiceIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                        <input
                                          type="text"
                                          value={choice.value}
                                          onChange={(e) => updateOptionChoice(opt.id, choiceIdx, 'value', e.target.value)}
                                          placeholder="Değer (örn: small)"
                                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <input
                                          type="text"
                                          value={choice.label}
                                          onChange={(e) => updateOptionChoice(opt.id, choiceIdx, 'label', e.target.value)}
                                          placeholder="Görünen Ad (örn: Küçük)"
                                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={choice.price}
                                          onChange={(e) => updateOptionChoice(opt.id, choiceIdx, 'price', parseFloat(e.target.value) || 0)}
                                          placeholder="Fiyat"
                                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeOptionChoice(opt.id, choiceIdx)}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Seçeneği sil"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Removable Ingredients */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Çıkarılabilir Malzemeler</h4>
                        <p className="text-gray-600 text-sm mb-4">
                          Müşteriler bu malzemeleri üründen çıkarabilir (örn: soğan, turşu)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {formData.ingredients.map(ingredientId => {
                            const ingredient = ingredients.find(ing => ing.id === ingredientId)
                            if (!ingredient) return null

                            return (
                              <label
                                key={ingredientId}
                                className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.customizations.removable.includes(ingredientId)}
                                  onChange={(e) => {
                                    const newRemovable = e.target.checked
                                      ? [...formData.customizations.removable, ingredientId]
                                      : formData.customizations.removable.filter(id => id !== ingredientId)
                                    handleFormChange('customizations', {
                                      ...formData.customizations,
                                      removable: newRemovable
                                    })
                                  }}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">{ingredient.name}</span>
                              </label>
                            )
                          })}
                        </div>
                        {formData.ingredients.length === 0 && (
                          <p className="text-gray-500 text-sm italic">
                            Önce &quot;Malzemeler&quot; sekmesinden malzeme seçin
                          </p>
                        )}
                      </div>

                      {/* Extra Ingredients */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Ekstra Malzemeler</h4>
                        <p className="text-gray-600 text-sm mb-4">
                          Müşteriler ekstra ücret karşılığında bu malzemeleri ekleyebilir
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {ingredients.filter(ing => ing.extraPrice > 0).map(ingredient => (
                            <label
                              key={ingredient.id}
                              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 cursor-pointer"
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.customizations.extras.some(extra => extra.ingredientId === ingredient.id)}
                                  onChange={(e) => {
                                    const newExtras = e.target.checked
                                      ? [...formData.customizations.extras, {
                                          ingredientId: ingredient.id,
                                          price: ingredient.extraPrice
                                        }]
                                      : formData.customizations.extras.filter(extra => extra.ingredientId !== ingredient.id)
                                    handleFormChange('customizations', {
                                      ...formData.customizations,
                                      extras: newExtras
                                    })
                                  }}
                                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-gray-700">{ingredient.name}</span>
                              </div>
                              <span className="text-sm font-medium text-amber-600">
                                +₺{ingredient.extraPrice.toFixed(2)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nutrition Tab */}
                  {activeTab === 'nutrition' && (
                    <div className="space-y-6">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <Tag className="w-5 h-5" />
                          Beslenme Bilgileri & Diyet
                        </h3>
                        <p className="text-green-700 text-sm">
                          Ürünün beslenme değerleri ve diyet özelliklerini belirleyin.
                        </p>
                      </div>

                      {/* Nutrition Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Beslenme Değerleri (100g için)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Kalori (kcal)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.nutritionInfo.calories}
                              onChange={(e) => handleFormChange('nutritionInfo.calories', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              placeholder="250"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Protein (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.nutritionInfo.protein}
                              onChange={(e) => handleFormChange('nutritionInfo.protein', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              placeholder="12.5"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Karbonhidrat (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.nutritionInfo.carbs}
                              onChange={(e) => handleFormChange('nutritionInfo.carbs', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              placeholder="30.2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Yağ (g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.nutritionInfo.fat}
                              onChange={(e) => handleFormChange('nutritionInfo.fat', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              placeholder="8.7"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Allergens */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Alerjenler</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {allergenOptions.map(allergen => (
                            <label
                              key={allergen}
                              className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.allergens.includes(allergen)}
                                onChange={(e) => {
                                  const newAllergens = e.target.checked
                                    ? [...formData.allergens, allergen]
                                    : formData.allergens.filter(a => a !== allergen)
                                  handleFormChange('allergens', newAllergens)
                                }}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">{allergen}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Dietary Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Diyet Özellikleri</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: 'isVegan', label: 'Vegan', color: 'green' },
                            { key: 'isVegetarian', label: 'Vejetaryen', color: 'emerald' },
                            { key: 'isGlutenFree', label: 'Glutensiz', color: 'yellow' },
                            { key: 'isKeto', label: 'Keto', color: 'purple' },
                            { key: 'isLowCarb', label: 'Düşük Karbonhidrat', color: 'blue' }
                          ].map(diet => (
                            <label
                              key={diet.key}
                              className={`flex items-center justify-between p-4 bg-${diet.color}-50 rounded-lg hover:bg-${diet.color}-100 cursor-pointer border border-${diet.color}-200`}
                            >
                              <span className={`text-sm font-medium text-${diet.color}-800`}>
                                {diet.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={formData.dietaryInfo[diet.key]}
                                onChange={(e) => handleFormChange(`dietaryInfo.${diet.key}`, e.target.checked)}
                                className={`rounded border-gray-300 text-${diet.color}-600 focus:ring-${diet.color}-500`}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex space-x-3">
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
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}