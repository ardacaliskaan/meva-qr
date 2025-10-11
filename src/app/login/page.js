// src/app/admin/login/page.js - Modern & Mobile-Friendly

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Loader2, 
  ArrowRight,
  ChefHat,
  Sparkles,
  Shield,
  Coffee
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

import { apiPath } from '@/lib/api'

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(apiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Hoş geldiniz! 🎉')
        setTimeout(() => {
          router.push('/admin')
        }, 800)
      } else {
        toast.error(result.error || 'Giriş yapılamadı')
      }
    } catch (error) {
      toast.error('Bağlantı hatası. Lütfen tekrar deneyin.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Hızlı giriş için demo kullanıcıları
  const quickLogin = (username, password) => {
    setFormData({ username, password })
    toast.success('Demo bilgileri dolduruldu!')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        {/* Animated Blobs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 100, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding (Hidden on mobile) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block text-white space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 mb-6"
              >
                <ChefHat className="w-12 h-12" />
              </motion.div>
              
              <h1 className="text-5xl font-bold leading-tight">
                Restaurant<br/>
                <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  QR Menu
                </span>
              </h1>
              
              <p className="text-xl text-white/80 leading-relaxed">
                Modern restoran yönetim sistemi ile işletmenizi dijitalleştirin
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3 text-white/90"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-lg">QR Menü Sistemi</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center space-x-3 text-white/90"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <span className="text-lg">Sipariş Yönetimi</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-3 text-white/90"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-lg">Güvenli & Hızlı</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20">
              
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4"
                >
                  <ChefHat className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900">RestaurantQR</h2>
                <p className="text-gray-600 mt-1">Admin Paneli</p>
              </div>

              {/* Header */}
              <div className="text-center mb-8 hidden lg:block">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4"
                >
                  <Lock className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Hoş Geldiniz</h2>
                <p className="text-gray-600">Devam etmek için giriş yapın</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kullanıcı Adı
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
                      placeholder="Kullanıcı adınızı girin"
                      autoComplete="username"
                    />
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
                      placeholder="Şifrenizi girin"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Giriş yapılıyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                  </span>
                </div>
              </div>

              {/* Footer Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-center"
              >
                <p className="text-xs text-gray-500">
  <a 
    href="https://ardacaliskan.com" 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-gray-700 hover:text-gray-900 font-semibold transition-colors"
  >
    Arda Çalışkan
  </a> 
  &nbsp;QR Menu System v2.0
</p>

                <p className="text-xs text-gray-400 mt-1">
                  © 2025 Tüm hakları saklıdır
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}