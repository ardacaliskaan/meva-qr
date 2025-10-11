'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit, Trash2, Save, X, Loader2, 
  Leaf, DollarSign, Tag, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'


export default function AdminIngredientsPage() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    allergens: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    extraPrice: '',
    isActive: true
  })

  const categoryOptions = [
    { value: 'meat', label: 'Et Ürünleri', color: 'bg-red-100 text-red-700' },
    { value: 'dairy', label: 'Süt Ürünleri', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'vegetable', label: 'Sebze', color: 'bg-green-100 text-green-700' },
    { value: 'fruit', label: 'Meyve', color: 'bg-orange-100 text-orange-700' },
    { value: 'grain', label: 'Tahıl', color: 'bg-amber-100 text-amber-700' },
    { value: 'spice', label: 'Baharat', color: 'bg-purple-100 text-purple-700' },
    { value: 'sauce', label: 'Sos', color: 'bg-pink-100 text-pink-700' },
    { value: 'other', label: 'Diğer', color: 'bg-slate-100 text-slate-700' }
  ]

  const allergenOptions = [
    'gluten', 'dairy', 'eggs', 'nuts', 'peanuts', 'soy', 'fish', 'shellfish', 'sesame'
  ]

  useEffect(() => {
    fetchIngredients()
  }, [])

  const fetchIngredients = async () => {
    try {
      setLoading(true)
      const response = await fetch(apiPath('/api/admin/ingredients'))
      const data = await response.json()
      
      if (data.success) {
        setIngredients(data.ingredients)
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error)
      toast.error('Malzemeler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
const url = apiPath('/api/admin/ingredients')
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem 
        ? { ...formData, id: editingItem.id }
        : formData

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        await fetchIngredients()
        resetForm()
        toast.success(editingItem ? 'Malzeme güncellendi!' : 'Malzeme eklendi!')
      } else {
        toast.error(result.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Error saving ingredient:', error)
      toast.error('Kaydetme hatası!')
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" malzemesini silmek istediğinizden emin misiniz?`)) return

    try {
      const response = await fetch(`/api/admin/ingredients?id=${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchIngredients()
        toast.success('Malzeme silindi!')
      } else {
        toast.error(result.error || 'Silme hatası')
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      toast.error('Silme hatası!')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      allergens: item.allergens || [],
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false,
      extraPrice: item.extraPrice?.toString() || '',
      isActive: item.isActive !== false
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'other',
      allergens: [],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      extraPrice: '',
      isActive: true
    })
    setShowAddForm(false)
    setEditingItem(null)
  }

  const handleAllergenChange = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  const getCategoryInfo = (category) => {
    return categoryOptions.find(opt => opt.value === category) || categoryOptions[categoryOptions.length - 1]
  }

  const filteredIngredients = filterCategory === 'all' 
    ? ingredients 
    : ingredients.filter(ing => ing.category === filterCategory)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Malzeme Yönetimi
          </h1>
          <p className="text-slate-600 mt-2">Menü öğelerinizde kullanacağınız malzemeleri yönetin</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Yeni Malzeme
        </motion.button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Tümü ({ingredients.length})
          </button>
          
          {categoryOptions.map(category => {
            const count = ingredients.filter(ing => ing.category === category.value).length
            if (count === 0) return null
            
            return (
              <button
                key={category.value}
                onClick={() => setFilterCategory(category.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterCategory === category.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {category.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="grid gap-4">
        {filteredIngredients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Tag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {filterCategory === 'all' ? 'Henüz malzeme yok' : 'Bu kategoride malzeme yok'}
            </h3>
            <p className="text-slate-600 mb-6">
              {filterCategory === 'all' 
                ? 'İlk malzemenizi oluşturarak başlayın'
                : 'Bu kategori için malzeme ekleyin'
              }
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Malzeme Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map(ingredient => {
              const categoryInfo = getCategoryInfo(ingredient.category)
              
              return (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 p-6 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{ingredient.name}</h3>
                        {!ingredient.isActive && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            Pasif
                          </span>
                        )}
                      </div>
                      
                      <span className={`px-2 py-1 text-xs rounded-full ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(ingredient)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(ingredient.id, ingredient.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {ingredient.description && (
                    <p className="text-slate-600 text-sm mb-3">{ingredient.description}</p>
                  )}

                  {/* Price */}
                  {ingredient.extraPrice > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">+₺{ingredient.extraPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Diet Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ingredient.isVegan && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        Vegan
                      </span>
                    )}
                    {ingredient.isVegetarian && !ingredient.isVegan && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        Vejetaryen
                      </span>
                    )}
                    {ingredient.isGlutenFree && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Glutensiz
                      </span>
                    )}
                  </div>

                  {/* Allergens */}
                  {ingredient.allergens && ingredient.allergens.length > 0 && (
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-medium text-slate-600">Alerjenler:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ingredient.allergens.map(allergen => (
                          <span key={allergen} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            {allergen === 'gluten' ? 'Gluten' :
                             allergen === 'dairy' ? 'Süt' :
                             allergen === 'eggs' ? 'Yumurta' :
                             allergen === 'nuts' ? 'Fındık' : allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingItem ? 'Malzeme Düzenle' : 'Yeni Malzeme Ekle'}
                  </h2>
                  <button 
                    onClick={resetForm}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Malzeme Adı *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Malzeme adını girin"
                          required
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Kategori *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          required
                        >
                          {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Extra Price */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Ekstra Fiyat (₺)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.extraPrice}
                          onChange={(e) => setFormData({...formData, extraPrice: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                          min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1">Müşteri bu malzemeyi ekstra isterse ödenecek ücret</p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Açıklama
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows="3"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                          placeholder="Malzeme açıklaması..."
                        />
                      </div>

                      {/* Diet Options */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Diyet Seçenekleri
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.isVegetarian}
                              onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}
                              className="w-4 h-4 text-green-600 bg-slate-50 border-slate-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-slate-700">Vejetaryen</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.isVegan}
                              onChange={(e) => setFormData({...formData, isVegan: e.target.checked})}
                              className="w-4 h-4 text-green-600 bg-slate-50 border-slate-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-slate-700">Vegan</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.isGlutenFree}
                              onChange={(e) => setFormData({...formData, isGlutenFree: e.target.checked})}
                              className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">Glutensiz</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                              className="w-4 h-4 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700">Malzeme aktif</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allergens */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Alerjenler
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allergenOptions.map(allergen => (
                        <label
                          key={allergen}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            formData.allergens.includes(allergen)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.allergens.includes(allergen)}
                            onChange={() => handleAllergenChange(allergen)}
                            className="w-4 h-4 text-orange-600 bg-white border-slate-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {allergen === 'gluten' ? 'Gluten' :
                             allergen === 'dairy' ? 'Süt Ürünleri' :
                             allergen === 'eggs' ? 'Yumurta' :
                             allergen === 'nuts' ? 'Fındık/Fıstık' :
                             allergen === 'peanuts' ? 'Yer Fıstığı' :
                             allergen === 'soy' ? 'Soya' :
                             allergen === 'fish' ? 'Balık' :
                             allergen === 'shellfish' ? 'Kabuklu Deniz Ürünleri' :
                             allergen === 'sesame' ? 'Susam' : allergen}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {editingItem ? 'Güncelle' : 'Malzeme Ekle'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200"
                    >
                      İptal
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}