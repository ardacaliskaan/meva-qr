'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Coffee, Utensils, Cookie, Wine, Gift, ChevronRight, Sparkles, Clock, GraduationCap, Tag, Heart, Instagram, Facebook, Twitter } from 'lucide-react'
import Image from 'next/image'
import MenuFooter from '@/components/MenuFooter'
import { apiPath } from '@/lib/api'



export default function CategoriesPage({ params }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const router = useRouter()

  const categoryIcons = {
    'kahvaltı': Coffee,
    'kahvaltılık': Coffee,
    'ana-yemek': Utensils,
    'ana-yemekler': Utensils,
    'aperatif': Cookie,
    'aperatifler': Cookie,
    'tatlı': Cookie,
    'tatlılar': Cookie,
    'içecek': Wine,
    'içecekler': Wine,
    'kahve': Coffee,
    'kahveler': Coffee,
    'kampanya': Gift,
    'kampanyalar': Gift,
    'default': Utensils
  }

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (tableId) {
      fetchCategories()
    }
  }, [tableId])

  const fetchCategories = async () => {
    try {
      const response = await fetch(apiPath('/api/admin/categories'))
      const data = await response.json()
      
      if (data.success) {
        const mainCategories = data.flatCategories?.filter(cat => !cat.parentId && cat.isActive) || []
        setCategories(mainCategories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (categoryName) => {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-')
    const IconComponent = categoryIcons[slug] || categoryIcons.default
    return IconComponent
  }

  const handleCategoryClick = (category) => {
    router.push(`/menu/${tableId}/${category.slug}`)
  }

  const handleBackClick = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-emerald-300 border-t-emerald-600 rounded-full mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-emerald-700 text-lg font-medium"
            >
              Menümüz hazırlanıyor...
            </motion.p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-emerald-200 shadow-lg"
      >
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBackClick}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
          
          <div className="text-center">
            <motion.h1 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-2xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700 bg-clip-text text-transparent"
            >
              MEVA CAFE
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-600 text-sm font-semibold flex items-center justify-center gap-2 mt-1"
            >
              <Sparkles className="w-4 h-4" />
              Masa {tableId}
            </motion.p>
          </div>
          
          <div className="w-12"></div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 mt-6"
        >
          <h2 className="text-3xl md:text-4xl font-black text-emerald-800 mb-3">
            Menümüzü Keşfedin
          </h2>
          <p className="text-emerald-600 text-lg font-medium flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            Taze, lezzetli ve sizin için hazır
          </p>
        </motion.div>

        {categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block p-8 bg-white rounded-3xl border border-emerald-200 shadow-xl">
              <Coffee className="w-20 h-20 text-emerald-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-emerald-800 mb-3">Henüz Kategori Eklenmemiş</h3>
              <p className="text-emerald-600 text-lg">Lütfen daha sonra tekrar deneyin</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            <AnimatePresence mode="popLayout">
              {categories.map((category, index) => {
                const IconComponent = getCategoryIcon(category.name)
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -8 }}
                    onClick={() => handleCategoryClick(category)}
                    className="group cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 h-52">
                      {category.image ? (
                        <div className="absolute inset-0">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            priority={index < 2}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/95 via-teal-50/90 to-emerald-50/85 group-hover:from-emerald-50/90 group-hover:via-teal-50/85 group-hover:to-emerald-50/80 transition-all duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-transparent to-teal-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-100 to-green-100" />
                      )}

                      <div className="relative h-full flex flex-col justify-between p-6">
                        <div className="flex items-start justify-between">
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                            className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl"
                          >
                            <IconComponent className="w-7 h-7 text-white" />
                          </motion.div>

                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="px-4 py-2 bg-emerald-200/80 backdrop-blur-md rounded-full border border-emerald-300"
                          >
                            <span className="text-emerald-700 font-bold text-sm">Yeni</span>
                          </motion.div>
                        </div>

                        <div>
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-3xl md:text-4xl font-black text-emerald-900 mb-2 drop-shadow-sm group-hover:text-emerald-700 transition-colors duration-300">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-emerald-700 text-base font-medium leading-relaxed">
                                  {category.description}
                                </p>
                              )}
                            </div>

                            <motion.div
                              whileHover={{ x: 8 }}
                              className="flex-shrink-0 p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300"
                            >
                              <ChevronRight className="w-6 h-6 text-white" />
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <MenuFooter />

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}