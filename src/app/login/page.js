// src/app/admin/login/page.js - MEVA KAFE ADVANCED LOGIN
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, EyeOff, Lock, User, Loader2, ArrowRight, Coffee,
  Sparkles, Shield, CheckCircle, AlertCircle, Mail,
  KeyRound, Star, Heart, Zap, Moon, Sun
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({ username: '', password: '' })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Load saved credentials
  useEffect(() => {
    const saved = localStorage.getItem('meva_remember')
    if (saved) {
      const { username } = JSON.parse(saved)
      setFormData(prev => ({ ...prev, username }))
      setRememberMe(true)
    }
  }, [])

  const validateForm = () => {
    const newErrors = { username: '', password: '' }
    let isValid = true

    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı gerekli'
      isValid = false
    } else if (formData.username.length < 3) {
      newErrors.username = 'En az 3 karakter olmalı'
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gerekli'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'En az 6 karakter olmalı'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Lütfen formu düzgün doldurun')
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
        // Remember me
        if (rememberMe) {
          localStorage.setItem('meva_remember', JSON.stringify({ username: formData.username }))
        } else {
          localStorage.removeItem('meva_remember')
        }

        // Success animation
        toast.success('Hoş geldiniz! ☕', {
          icon: '🎉',
          style: {
            borderRadius: '12px',
            background: '#10b981',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        })

        setTimeout(() => {
          router.push('/admin')
        }, 800)
      } else {
        toast.error(result.error || 'Giriş yapılamadı', {
          icon: '❌'
        })
      }
    } catch (error) {
      toast.error('Bağlantı hatası. Lütfen tekrar deneyin.', {
        icon: '⚠️'
      })
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '16px',
            padding: '16px 24px',
            fontSize: '15px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          },
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDark ? 'bg-amber-400/20' : 'bg-amber-400/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Large gradient blobs */}
        <motion.div
          style={{
            x: mousePosition.x,
            y: mousePosition.y,
          }}
          className={`absolute top-0 left-0 w-96 h-96 ${
            isDark ? 'bg-amber-500/10' : 'bg-amber-300/40'
          } rounded-full blur-3xl`}
        />
        <motion.div
          style={{
            x: -mousePosition.x,
            y: -mousePosition.y,
          }}
          className={`absolute bottom-0 right-0 w-96 h-96 ${
            isDark ? 'bg-orange-500/10' : 'bg-orange-300/40'
          } rounded-full blur-3xl`}
        />
      </div>

      {/* Coffee Steam Animation */}
      <div className="absolute top-10 right-10 hidden lg:block">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-8 ${
              isDark ? 'bg-amber-400/30' : 'bg-amber-600/30'
            } rounded-full`}
            style={{ left: i * 8 }}
            animate={{
              y: [-20, -60],
              opacity: [0, 1, 0],
              scaleX: [1, 1.5, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Dark Mode Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsDark(!isDark)}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full backdrop-blur-xl border transition-colors ${
          isDark 
            ? 'bg-gray-800/80 border-gray-700 text-amber-400' 
            : 'bg-white/80 border-white/50 text-gray-700'
        } shadow-lg hover:shadow-xl`}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Main Container */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block space-y-8"
          >
            {/* Logo & Title */}
            <div className="space-y-6">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl backdrop-blur-xl border-2 shadow-2xl ${
                  isDark 
                    ? 'bg-gray-800/80 border-amber-500/50' 
                    : 'bg-white/80 border-amber-300/50'
                }`}
              >
                <Coffee className={`w-12 h-12 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </motion.div>
              
              <div>
                <h1 className={`text-6xl font-black mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Meva
                  <br />
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Kafe
                  </span>
                </h1>
                
                <p className={`text-xl leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Dijital menü ve sipariş yönetimi ile kahve deneyiminizi yükseltin
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Zap, text: 'Hızlı & Kolay', color: 'from-yellow-400 to-orange-500' },
                { icon: Shield, text: 'Güvenli Sistem', color: 'from-blue-400 to-indigo-500' },
                { icon: Sparkles, text: 'Modern Arayüz', color: 'from-purple-400 to-pink-500' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-2xl backdrop-blur-xl border ${
                    isDark 
                      ? 'bg-gray-800/50 border-gray-700/50' 
                      : 'bg-white/50 border-white/80'
                  } shadow-lg hover:shadow-xl transition-all group`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { value: '50+', label: 'Menü' },
                { value: '1K+', label: 'Sipariş' },
                { value: '99%', label: 'Memnuniyet' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={`text-center p-4 rounded-2xl backdrop-blur-xl border ${
                    isDark 
                      ? 'bg-gray-800/50 border-gray-700/50' 
                      : 'bg-white/50 border-white/80'
                  } shadow-lg`}
                >
                  <div className={`text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-1`}>
                    {stat.value}
                  </div>
                  <div className={`text-xs font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl border-2 ${
                isDark 
                  ? 'bg-gray-800/90 border-gray-700/50' 
                  : 'bg-white/95 border-white/50'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-8 relative overflow-hidden">
                {/* Animated stars */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    >
                      <Star className="w-4 h-4 text-white fill-white" />
                    </motion.div>
                  ))}
                </div>

                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl mb-4 border-2 border-white/30"
                  >
                    <Coffee className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">Hoş Geldiniz</h2>
                  <p className="text-white/90 text-sm font-medium">
                    Meva Kafe Admin Panel
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Kullanıcı Adı
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className={`w-5 h-5 ${
                          errors.username ? 'text-red-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => {
                          setFormData({ ...formData, username: e.target.value })
                          setErrors({ ...errors, username: '' })
                        }}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all text-base ${
                          errors.username
                            ? 'border-red-400 focus:border-red-500'
                            : isDark
                            ? 'bg-gray-700/50 border-gray-600 text-white focus:border-amber-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500'
                        } focus:outline-none focus:ring-4 focus:ring-amber-500/20`}
                        placeholder="Kullanıcı adınızı girin"
                        disabled={loading}
                      />
                      <AnimatePresence>
                        {formData.username && !errors.username && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence>
                      {errors.username && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-2 text-sm text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.username}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Şifre
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={`w-5 h-5 ${
                          errors.password ? 'text-red-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value })
                          setErrors({ ...errors, password: '' })
                        }}
                        className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all text-base ${
                          errors.password
                            ? 'border-red-400 focus:border-red-500'
                            : isDark
                            ? 'bg-gray-700/50 border-gray-600 text-white focus:border-amber-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500'
                        } focus:outline-none focus:ring-4 focus:ring-amber-500/20`}
                        placeholder="Şifrenizi girin"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-2 text-sm text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className={`ml-2 text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      } group-hover:text-amber-600 transition-colors`}>
                        Beni Hatırla
                      </span>
                    </label>

                    <button
                      type="button"
                      className={`text-sm font-medium hover:underline transition-colors ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}
                    >
                      Şifremi Unuttum?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed text-base group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                        <span className="relative z-10">Giriş yapılıyor...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Giriş Yap</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className={`absolute inset-0 flex items-center`}>
                    <div className={`w-full border-t ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className={`px-4 font-medium ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                    }`}>
                      veya
                    </span>
                  </div>
                </div>

                {/* Social Login (Mock) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`py-3 rounded-xl border-2 font-medium transition-all text-sm flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    className={`py-3 rounded-xl border-2 font-medium transition-all text-sm flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    QR
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className={`px-8 pb-8 text-center border-t ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="pt-6">
                  <p className="text-xs text-gray-500">
                    <a 
                      href="https://ardacaliskan.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                    >
                      Arda Çalışkan
                    </a>
                    {' '}&copy; 2025
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Meva Kafe QR Menu System v2.0
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}