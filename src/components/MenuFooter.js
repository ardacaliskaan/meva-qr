'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, Tag, Heart, Coffee, Instagram, 
  MessageCircle, X, Send, Star, Sparkles, AlertCircle, Users, Utensils
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function MenuFooter() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const mottos = [
    {
      icon: GraduationCap,
      title: "Öğrenci Dostu",
      description: "Özel fiyatlarla her zaman yanınızdayız"
    },
    {
      icon: Tag,
      title: "Kampanyanın Tek Adresi",
      description: "Her gün yeni fırsatlar"
    },
    {
      icon: Heart,
      title: "Karabükte Düzenli İkramın Tek Adresi",
      description: "Sürekli ikramlarımızla sizi mutlu ediyoruz"
    }
  ]

  const feedbackCategories = [
    {
      id: 'service',
      label: 'Hizmet Kalitesi',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      id: 'food',
      label: 'Ürün & Lezzet',
      icon: Utensils,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700'
    },
    {
      id: 'staff',
      label: 'Personel',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      id: 'other',
      label: 'Diğer',
      icon: AlertCircle,
      color: 'from-gray-500 to-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700'
    }
  ]

  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/meva.pastacafe", label: "Instagram" }
  ]

  const handleSubmitFeedback = async () => {
    // Validation
    if (!selectedCategory) {
      toast.error('Lütfen bir kategori seçin')
      return
    }

    if (!message.trim()) {
      toast.error('Lütfen mesajınızı yazın')
      return
    }

    if (message.trim().length < 5) {
      toast.error('Mesajınız en az 5 karakter olmalıdır')
      return
    }

    if (message.length > 1000) {
      toast.error('Mesajınız en fazla 1000 karakter olabilir')
      return
    }

    try {
      setSubmitting(true)
      
      console.log('📤 Feedback gönderiliyor...', {
        category: selectedCategory,
        rating: rating || null,
        message: message.trim()
      })

      const response = await fetch(apiPath('/api/feedback'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          category: selectedCategory,
          rating: rating || null,
          message: message.trim()
        })
      })

      console.log('📥 Response status:', response.status)
      
      // Response'u text olarak al
      const responseText = await response.text()
      console.log('📥 Response text:', responseText)
      
      // JSON parse et
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse hatası:', parseError)
        throw new Error('Sunucu yanıtı okunamadı')
      }
      
      console.log('📥 Parsed data:', data)

      if (response.ok && data.success) {
        toast.success('Görüşünüz için teşekkür ederiz! 💚', {
          duration: 4000,
          icon: '✨'
        })
        
        // Reset form
        setSelectedCategory('')
        setRating(0)
        setMessage('')
        setShowFeedbackModal(false)
      } else {
        // API'den gelen hata mesajını göster
        toast.error(data.error || data.message || 'Bir hata oluştu')
        console.error('❌ API Error:', data)
      }
    } catch (error) {
      console.error('❌ Feedback error:', error)
      toast.error('Bağlantı hatası: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <footer className="relative z-10 mt-16 border-t border-emerald-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Mottos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {mottos.map((motto, index) => {
              const IconComponent = motto.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900 mb-2">
                    {motto.title}
                  </h3>
                  <p className="text-sm text-emerald-600 font-medium">
                    {motto.description}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* FEEDBACK CTA BUTTON */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 border-2 border-emerald-200 shadow-sm">
              <div className="text-center max-w-2xl mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg"
                >
                  <MessageCircle className="w-8 h-8 text-white" />
                </motion.div>
                
                <h3 className="text-xl md:text-3xl font-bold text-emerald-900 mb-3">
                  Müşteri Bizim Doktorumuzdur
                </h3>
                
                <p className="text-emerald-700 mb-6 text-sm md:text-base px-4">
                  Görüş, öneri ve şikayetleriniz bizim için çok değerli. 
                  Hizmetlerimizi geliştirmemize yardımcı olun.
                </p>
                
                <motion.button
                  onClick={() => setShowFeedbackModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto text-sm md:text-base"
                >
                  <MessageCircle className="w-5 h-5" />
                  Görüş Bildir
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="border-t border-emerald-200 my-8"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div className="text-emerald-800">
                <p className="font-bold text-lg">MEVA CAFE</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-emerald-100 hover:bg-emerald-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                    aria-label={social.label}
                  >
                    <IconComponent className="w-5 h-5 text-emerald-700" />
                  </motion.a>
                )
              })}
            </div>
          </div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-xs text-gray-600 flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span>© 2025 Tüm Hakları Saklıdır</span>
              <span className="text-gray-400 hidden sm:inline">•</span>
              <a 
                href="https://ardacaliskan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Arda Çalışkan
              </a>
            </p>
          </motion.div>
        </div>
      </footer>

      {/* FEEDBACK MODAL */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-6 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-white">
                      <h2 className="text-lg sm:text-2xl font-bold">Görüş Bildir</h2>
                      <p className="text-xs sm:text-sm text-emerald-100">Anonim ve güvenli</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Kategori Seçin *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {feedbackCategories.map((category) => {
                      const IconComponent = category.icon
                      const isSelected = selectedCategory === category.id
                      
                      return (
                        <motion.button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200
                            ${isSelected 
                              ? `${category.bgColor} ${category.borderColor} shadow-md` 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center mb-2 mx-auto
                            ${isSelected 
                              ? `bg-gradient-to-br ${category.color}` 
                              : 'bg-gray-100'
                            }
                          `}>
                            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <p className={`text-xs font-medium text-center ${isSelected ? category.textColor : 'text-gray-600'}`}>
                            {category.label}
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Memnuniyet Derecesi (İsteğe Bağlı)
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        onClick={() => setRating(star)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-center text-sm text-gray-600 mt-2">
                      {rating === 5 && '⭐ Mükemmel!'}
                      {rating === 4 && '😊 Çok İyi'}
                      {rating === 3 && '👍 İyi'}
                      {rating === 2 && '😐 Orta'}
                      {rating === 1 && '😞 Kötü'}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mesajınız *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Görüş, öneri veya şikayetinizi buraya yazabilirsiniz..."
                    className="w-full h-32 sm:h-40 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      En az 5 karakter
                    </p>
                    <p className={`text-xs ${message.length > 900 ? 'text-red-600' : 'text-gray-500'}`}>
                      {message.length} / 1000
                    </p>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Gizlilik ve Güvenlik
                      </p>
                      <p className="text-xs text-blue-700">
                        Geri bildiriminiz tamamen anonimdir. Hiçbir kişisel bilginiz kaydedilmez.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmitFeedback}
                  disabled={submitting || !selectedCategory || !message.trim()}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  className={`
                    w-full py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                    ${submitting || !selectedCategory || !message.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl'
                    }
                  `}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gönder
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}