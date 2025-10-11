'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Plus, Minus, ShoppingCart, X, Check, 
  Coffee, Clock, Flame, Star, Heart, AlertCircle 
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
// 🔐 YENİ: Session Manager Import
import { SessionManager } from '@/lib/sessionManager'
import { apiPath } from '@/lib/api'

export default function ProductsPage({ params }) {
  // States
  const [menuItems, setMenuItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const [categorySlug, setCategorySlug] = useState(null)
  const [currentCategory, setCurrentCategory] = useState(null)
  
  // 🔐 YENİ: Session States
  const [session, setSession] = useState(null)
  const [sessionManager, setSessionManager] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [customizations, setCustomizations] = useState({
    removed: [],
    extras: []
  })
  const [quantity, setQuantity] = useState(1)
  const [itemNotes, setItemNotes] = useState('')
  
  const router = useRouter()

  // Cart key for localStorage
  const getCartKey = () => `meva-cart-${tableId}`

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
      setCategorySlug(resolvedParams.categorySlug)
    }
    unwrapParams()
  }, [params])

  // 🔐 YENİ: Session Başlatma
  useEffect(() => {
    if (tableId) {
      initSession()
    }
  }, [tableId])

  useEffect(() => {
    if (tableId && categorySlug) {
      loadData()
      loadCart()
    }
  }, [tableId, categorySlug])

  // 🔐 YENİ: Session Başlatma Fonksiyonu
  const initSession = async () => {
    try {
      setSessionLoading(true)
      
      const manager = new SessionManager(parseInt(tableId))
      setSessionManager(manager)
      
      console.log('🔐 Initializing session for table:', tableId)
      
      const result = await manager.initSession()
      
      if (result.success) {
        setSession(result.session)
        console.log('✅ Session initialized:', result.session.sessionId)
        console.log('📱 Device fingerprint:', manager.deviceInfo.fingerprint)
        
        if (result.isNew) {
          toast.success('Hoş geldiniz! Sipariş vermeye hazırsınız.', {
            duration: 3000,
            icon: '👋'
          })
        } else {
          console.log('ℹ️ Existing session found')
        }
      } else {
        console.error('❌ Session init failed:', result.error)
        // Session başlamazsa da devam et (backward compatible)
        toast.error('Bağlantı hatası. Sipariş verirken sorun yaşayabilirsiniz.', {
          duration: 4000
        })
      }
    } catch (error) {
      console.error('💥 Session initialization error:', error)
      // Hata olursa da devam et
    } finally {
      setSessionLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Paralel API çağrıları
      const [menuRes, categoriesRes, ingredientsRes] = await Promise.all([
        fetch(apiPath('/api/menu')),
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
        const allCategories = categoriesData.flatCategories || []
        setCategories(allCategories)
        
        // Mevcut kategoriyi bul
        const category = allCategories.find(cat => cat.slug === categorySlug)
        setCurrentCategory(category)
        
        // Ürünleri filtrele
        if (category) {
          const filtered = (menuData.items || []).filter(item => 
            item.categoryId === category.id && item.available !== false
          )
          setFilteredItems(filtered)
        }
      }

      if (ingredientsData.success) {
        setIngredients(ingredientsData.ingredients || [])
      }

    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Menü yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem(getCartKey())
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Sepet yüklenirken hata:', error)
    }
  }

  const saveCart = (newCart) => {
    try {
      localStorage.setItem(getCartKey(), JSON.stringify(newCart))
      setCart(newCart)
    } catch (error) {
      console.error('Sepet kaydedilirken hata:', error)
    }
  }

  const openItemModal = (item) => {
    setSelectedItem(item)
    setCustomizations({ removed: [], extras: [] })
    setQuantity(1)
    setItemNotes('')
    setShowItemModal(true)
  }

  const closeItemModal = () => {
    setShowItemModal(false)
    setSelectedItem(null)
  }

  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId)
    return ingredient ? ingredient.name : ''
  }

  const handleRemoveIngredient = (ingredientId) => {
    const newRemoved = customizations.removed.includes(ingredientId)
      ? customizations.removed.filter(id => id !== ingredientId)
      : [...customizations.removed, ingredientId]
    
    setCustomizations(prev => ({ ...prev, removed: newRemoved }))
  }

  const handleAddExtra = (ingredientId) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId)
    if (!ingredient) return

    const existingExtra = customizations.extras.find(extra => extra.ingredientId === ingredientId)
    
    if (existingExtra) {
      // Zaten var, çıkar
      setCustomizations(prev => ({
        ...prev,
        extras: prev.extras.filter(extra => extra.ingredientId !== ingredientId)
      }))
    } else {
      // Ekle
      setCustomizations(prev => ({
        ...prev,
        extras: [...prev.extras, { ingredientId, price: ingredient.extraPrice || 0 }]
      }))
    }
  }

  const calculateItemPrice = () => {
    if (!selectedItem) return 0
    
    const basePrice = selectedItem.price || 0
    const extrasPrice = customizations.extras.reduce((sum, extra) => sum + extra.price, 0)
    
    return (basePrice + extrasPrice) * quantity
  }

  const addToCart = () => {
    if (!selectedItem) return

    const cartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price || 0,
      quantity,
      customizations,
      notes: itemNotes,
      totalPrice: calculateItemPrice(),
      image: selectedItem.image
    }

    const newCart = [...cart, cartItem]
    saveCart(newCart)
    
    toast.success(`${selectedItem.name} sepete eklendi!`)
    closeItemModal()
  }

  const removeFromCart = (cartItemId) => {
    const newCart = cart.filter(item => item.id !== cartItemId)
    saveCart(newCart)
    toast.success('Ürün sepetten çıkarıldı')
  }

  const updateCartQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    const newCart = cart.map(item => 
      item.id === cartItemId 
        ? { ...item, quantity: newQuantity, totalPrice: (item.price + item.customizations.extras.reduce((sum, extra) => sum + extra.price, 0)) * newQuantity }
        : item
    )
    saveCart(newCart)
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  // 🔐 GÜNCELLENMIŞ: Session Güvenliği ile Sipariş Gönderme
  const sendOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş!')
      return
    }

    try {
      // 🔐 Session Bilgilerini Hazırla
      const orderData = {
        tableNumber: parseInt(tableId),
        tableId: tableId.toString(),
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
          customizations: item.customizations || { removed: [], extras: [] },
          notes: item.notes || ''
        })),
        totalAmount: parseFloat(getCartTotal()) || 0,
        status: 'pending',
        customerNotes: ''
      }

      // 🔐 YENİ: Session bilgilerini ekle
      if (session && sessionManager) {
        orderData.sessionId = session.sessionId
        orderData.deviceFingerprint = sessionManager.deviceInfo.fingerprint
        orderData.deviceInfo = {
          browser: sessionManager.deviceInfo.browser,
          os: sessionManager.deviceInfo.os,
          isMobile: sessionManager.deviceInfo.isMobile
        }
        
        console.log('🔐 Sending order with session:', session.sessionId)
      } else {
        console.log('⚠️ Sending order WITHOUT session (backward compatible mode)')
      }

      console.log('📦 Sending order data:', JSON.stringify(orderData, null, 2))

      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      console.log('📡 Response status:', response.status)
      
      const result = await response.json()
      console.log('📦 Response:', result)
      
      // 🔐 YENİ: Hata Kodlarını Handle Et
      if (!response.ok || !result.success) {
        // Session hataları
        if (result.code === 'SESSION_EXPIRED' || result.code === 'INVALID_SESSION') {
          toast.error(result.error || 'Oturum süresi doldu. Lütfen QR kodu tekrar okutun.', {
            duration: 5000,
            icon: '⏰'
          })
          
          // Session'ı temizle ve yeniden başlat
          if (sessionManager) {
            sessionManager.clearSession()
            await initSession()
          }
          return
        }
        
        // Rate LimitDenemee

        if (result.code === 'RATE_LIMIT_EXCEEDED') {
          const waitTime = result.retryAfter ? Math.ceil(result.retryAfter / 60) : 2
          toast.error(`${result.error}\n\nLütfen ${waitTime} dakika bekleyin.`, {
            duration: 6000,
            icon: '⏱️'
          })
          return
        }
        
        // Bot Detection
        if (result.code === 'BOT_DETECTED' || result.code === 'SLOW_DOWN') {
          toast.error(result.error || 'Çok hızlı sipariş veriyorsunuz. Lütfen bekleyin.', {
            duration: 5000,
            icon: '🤖'
          })
          return
        }
        
        // Duplicate Order
        if (result.code === 'DUPLICATE_SUSPECTED') {
          // Onay dialogu göster
          const confirmed = window.confirm(
            `${result.error}\n\nTekrar sipariş vermek istediğinizden emin misiniz?`
          )
          Denemee
Denemee
Denemee
Denemee

          if (confirmed) {
            // Confirmed flag ile tekrar gönder
            orderData.confirmed = true
            
            const retryResponse = await fetch(apiPath('/api/orders'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            })
            
            const retryResult = await retryResponse.json()
            
            if (retryResponse.ok && retryResult.success) {
              // Başarılı
              localStorage.removeItem(getCartKey())
              setCart([])
              setShowCartModal(false)
              
              toast.success(`Siparişiniz başarıyla gönderildi!\n\nSipariş No: ${retryResult.orderNumber || 'N/A'}`, {
                duration: 5000,
                icon: '✅'
              })
            } else {
              throw new Error(retryResult.error || 'Sipariş gönderilemedi')
            }
          }
          return
        }
        
        // Validation errors
        if (result.errors && Array.isArray(result.errors)) {
          toast.error(`Hata: ${result.errors.join(', ')}`, {
            duration: 5000
          })
          return
        }
        
        // Genel hata
        throw new Error(result.error || 'Sipariş oluşturulamadı')
      }
      
      // ✅ Başarılı
      localStorage.removeItem(getCartKey())
      setCart([])
      setShowCartModal(false)
      
      toast.success(`Siparişiniz başarıyla gönderildi!\n\nSipariş No: ${result.orderNumber || 'N/A'}`, {
        duration: 5000,
        icon: '✅'
      })
      
      // 🔐 Session istatistiklerini güncelle (opsiyonel)
      if (sessionManager) {
        sessionManager.updateLastActivity()
      }
      
    } catch (error) {
      console.error('💥 Sipariş gönderilirken hata:', error)
      toast.error(`Sipariş gönderilirken hata oluştu: ${error.message}`, {
        duration: 5000
      })
    }
  }

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-amber-600 mt-4 font-medium">
            {sessionLoading ? 'Bağlantı kuruluyor...' : 'Ürünler yükleniyor...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-amber-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-amber-600" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-amber-700">
              {currentCategory?.name}
            </h1>
            <p className="text-sm text-amber-600">Masa {tableId}</p>
            {/* 🔐 YENİ: Session Durumu (Debug - production'da kaldırılabilir) */}
            {session && (
              <p className="text-xs text-green-600 mt-0.5">
                🔐 Güvenli bağlantı aktif
              </p>
            )}
          </div>
          
          <button
            onClick={() => setShowCartModal(true)}
            className="relative p-2 hover:bg-amber-100 rounded-full transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-amber-600" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-600 mb-2">
              Bu kategoride henüz ürün yok
            </h3>
            <p className="text-amber-500">Lütfen başka bir kategori deneyin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => openItemModal(item)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group active:scale-95 overflow-hidden"
              >
                {/* Product Image */}
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
                      <Coffee className="w-16 h-16 text-amber-300" />
                    </div>
                  )}
                  
                  {/* Quick Add Button */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-amber-500 text-white p-2 rounded-full shadow-lg">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-amber-800 text-lg leading-tight group-hover:text-amber-900 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-right">
                      <span className="text-xl font-bold text-amber-600">
                        ₺{item.price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-amber-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Product Features */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {item.cookingTime && (
                        <div className="flex items-center text-amber-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{item.cookingTime}dk</span>
                        </div>
                      )}
                      {item.spicyLevel > 0 && (
                        <div className="flex items-center text-red-500">
                          <Flame className="w-3 h-3 mr-1" />
                          <span>Acı</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-amber-600 ml-1">4.8</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setShowCartModal(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-30"
        >
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6" />
            <span className="font-bold">₺{getCartTotal().toFixed(2)}</span>
          </div>
        </motion.button>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {showItemModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={closeItemModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative">
                {selectedItem.image ? (
                  <div className="relative h-64">
                    <Image
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-amber-300" />
                  </div>
                )}
                
                <button
                  onClick={closeItemModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-amber-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-16rem)]">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-amber-800">
                    {selectedItem.name}
                  </h2>
                  <span className="text-2xl font-bold text-amber-600">
                    ₺{calculateItemPrice().toFixed(2)}
                  </span>
                </div>

                {selectedItem.description && (
                  <p className="text-amber-600 mb-6">
                    {selectedItem.description}
                  </p>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <h3 className="font-semibold text-amber-800 mb-3">Adet</h3>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
                    >
                      <Minus className="w-5 h-5 text-amber-600" />
                    </button>
                    <span className="text-xl font-bold text-amber-800 min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-amber-600" />
                    </button>
                  </div>
                </div>

                {/* Ingredients */}
                {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-amber-800 mb-3">Malzemeler</h3>
                    <div className="space-y-2">
                      {selectedItem.ingredients.map((ingredientId, index) => {
                        const ingredientName = getIngredientName(ingredientId)
                        const isRemoved = customizations.removed.includes(ingredientId)
                        
                        return (
                          <div key={`ingredient-${ingredientId}-${index}`} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <span className={`${isRemoved ? 'line-through text-amber-400' : 'text-amber-700'}`}>
                              {ingredientName}
                            </span>
                            <button
                              onClick={() => handleRemoveIngredient(ingredientId)}
                              className={`p-1 rounded-full transition-colors ${
                                isRemoved 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {isRemoved ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Extras */}
                {ingredients.filter(ing => ing.extraPrice > 0).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-amber-800 mb-3">Ekstra Malzemeler</h3>
                    <div className="space-y-2">
                      {ingredients.filter(ing => ing.extraPrice > 0).map(ingredient => {
                        const isAdded = customizations.extras.some(extra => extra.ingredientId === ingredient.id)
                        
                        return (
                          <div key={ingredient.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <div>
                              <span className="text-amber-700">{ingredient.name}</span>
                              <span className="text-amber-500 text-sm ml-2">
                                +₺{ingredient.extraPrice.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAddExtra(ingredient.id)}
                              className={`p-1 rounded-full transition-colors ${
                                isAdded 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-amber-100 text-amber-600'
                              }`}
                            >
                              {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-6">
                  <h3 className="font-semibold text-amber-800 mb-3">Özel İstekler</h3>
                  <textarea
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="Örn: Az şekerli olsun..."
                    className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
DenemeeDenemee
Denemee
Denemee
Denemee
Denemee
Denemee
Denemee
Denemee
Denemee
Denemee
Denemee
Denemee


                {/* Add to Cart Button */}
                <button
                  onClick={addToCart}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300"
                >
                  Sepete Ekle - ₺{calculateItemPrice().toFixed(2)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
Denemee
      {/* Cart Modal */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowCartModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b border-amber-100">
                <h2 className="text-xl font-bold text-amber-800">Sepetim</h2>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-amber-600" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                    <p className="text-amber-600">Sepetiniz boş</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="bg-amber-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-amber-800">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="p-1 bg-amber-200 rounded-full hover:bg-amber-300 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-amber-600" />
                            </button>
                            <span className="font-medium text-amber-800 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-1 bg-amber-200 rounded-full hover:bg-amber-300 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-amber-600" />
                            </button>
                          </div>
                          
                          <span className="font-bold text-amber-600">
                            ₺{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Customizations */}
                        {(item.customizations.removed.length > 0 || item.customizations.extras.length > 0) && (
                          <div className="mt-2 text-xs text-amber-600">
                            {item.customizations.removed.length > 0 && (
                              <div>Çıkarılan: {item.customizations.removed.map(id => getIngredientName(id)).join(', ')}</div>
                            )}
                            {item.customizations.extras.length > 0 && (
                              <div>Ekstra: {item.customizations.extras.map(extra => getIngredientName(extra.ingredientId)).join(', ')}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-amber-100 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-amber-800">Toplam:</span>
                    <span className="text-2xl font-bold text-amber-600">
                      ₺{getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <button
                    onClick={sendOrder}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300"
                  >
                    Sipariş Ver
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}