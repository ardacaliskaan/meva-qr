'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { apiPath, apiEndpoint } from '@/lib/api'

export default function ImageUpload({ 
  currentImage = null, 
  onImageUploaded, 
  onImageRemoved,
  className = '',
  size = 'default' // 'sm', 'default', 'lg'
}) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef(null)

  // CRITICAL: currentImage prop değiştiğinde previewUrl'i güncelle
  useEffect(() => {
    console.log('📸 ImageUpload currentImage changed:', currentImage)
    setPreviewUrl(currentImage)
    setImageError(false)
  }, [currentImage])

  const sizeClasses = {
    sm: 'w-32 h-32',
    default: 'w-48 h-48',
    lg: 'w-64 h-64'
  }

  const handleFiles = async (files) => {
    const file = files[0]
    if (!file) return

    // Dosya validasyonu
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPEG, PNG ve WebP dosyaları destekleniyor')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Dosya boyutu 5MB\'dan büyük olamaz')
      return
    }

    // Preview göster (geçici base64)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
      setImageError(false)
    }
    reader.readAsDataURL(file)

    // Upload işlemi
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('📤 Uploading image...')
const response = await fetch(apiEndpoint('/api/upload'), {
        method: 'POST',
        body: formData,
        credentials: 'include' // CRITICAL: Cookie gönder
      })

      const result = await response.json()
      console.log('📥 Upload response:', result)

      if (result.success) {
        toast.success('Resim başarıyla yüklendi!')
        setPreviewUrl(result.image.url)
        setImageError(false)
        
        // Parent component'e bildir
        if (onImageUploaded) {
          console.log('✅ Calling onImageUploaded with:', result.image)
          onImageUploaded(result.image)
        }
      } else {
        toast.error(result.error || 'Yükleme hatası')
        setPreviewUrl(currentImage) // Geri al
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      toast.error('Yükleme sırasında hata oluştu')
      setPreviewUrl(currentImage) // Geri al
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeImage = (e) => {
    e?.stopPropagation()
    console.log('🗑️ Removing image')
    setPreviewUrl(null)
    setImageError(false)
    
    // Parent component'e bildir
    if (onImageRemoved) {
      onImageRemoved()
    }
    
    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {previewUrl ? (
          // Image Preview
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`relative ${sizeClasses[size]} rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-lg group`}
          >
            {!imageError ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
                sizes={`(max-width: 768px) 100vw, ${sizeClasses[size]}`}
                onError={() => {
                  console.error('❌ Image load error:', previewUrl)
                  setImageError(true)
                }}
                priority={false}
                unoptimized={previewUrl.startsWith('data:')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-center p-4">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Resim yüklenemedi</p>
                </div>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="p-2 bg-white/90 rounded-full text-slate-700 hover:bg-white transition-colors"
                  title="Resmi Değiştir"
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={removeImage}
                  className="p-2 bg-red-500/90 rounded-full text-white hover:bg-red-500 transition-colors"
                  title="Resmi Kaldır"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Upload Loading */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-sm font-medium">Yükleniyor...</span>
                </div>
              </div>
            )}

            {/* Upload Success */}
            {!uploading && previewUrl && !previewUrl.startsWith('data:') && !imageError && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-green-500 rounded-full p-1 shadow-lg">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // Upload Area
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`${sizeClasses[size]} border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer group ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <motion.div
                animate={{ y: dragActive ? -10 : 0 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  dragActive 
                    ? 'bg-indigo-100' 
                    : 'bg-gray-100 group-hover:bg-indigo-50'
                } transition-colors`}
              >
                <ImageIcon className={`w-8 h-8 ${
                  dragActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'
                } transition-colors`} />
              </motion.div>
              
              <p className={`text-sm font-medium mb-1 ${
                dragActive ? 'text-indigo-600' : 'text-gray-700'
              }`}>
                {dragActive ? 'Bırakın' : 'Tıklayın veya sürükleyin'}
              </p>
              
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP (Max 5MB)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}