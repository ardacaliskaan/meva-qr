import { NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, access } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import sharp from 'sharp'

// 🔥 CRITICAL: Next.js 15 App Router için body size limiti
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 saniye timeout

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      )
    }

    // Dosya validasyonu
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Sadece JPEG, PNG ve WebP dosyaları destekleniyor' },
        { status: 400 }
      )
    }

    // Dosya boyutu kontrolü (10MB max - işleme öncesi)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 10MB\'dan büyük olamaz' },
        { status: 400 }
      )
    }

    // Dosyayı buffer'a çevir
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Unique filename oluştur
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const filename = `menu-${timestamp}-${randomString}.webp` // WebP formatında kaydet

    // Upload klasörünü oluştur
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'menu')
    
    try {
      await access(uploadDir, constants.F_OK)
    } catch {
      await mkdir(uploadDir, { recursive: true })
      console.log('✅ Upload klasörü oluşturuldu:', uploadDir)
    }

    // Sharp ile resmi işle
    try {
      const processedImage = await sharp(buffer)
        // Metadata'yı oku
        .metadata()
        .then(metadata => {
          console.log('📸 Original dimensions:', metadata.width, 'x', metadata.height)
          
          // Resmi işle: 800x600 standart boyut (4:3 aspect ratio)
          return sharp(buffer)
            .resize(800, 600, {
              fit: 'cover', // Resmi kırparak sığdır
              position: 'center' // Ortadan kırp
            })
            .webp({ 
              quality: 85, // Kalite (1-100)
              effort: 4 // Compression effort (0-6, yüksek = daha iyi sıkıştırma)
            })
            .toBuffer()
        })

      // İşlenmiş resmi kaydet
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, processedImage)
      console.log('✅ Resim işlendi ve kaydedildi:', filepath)

      // Public URL oluştur
      const imageUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/uploads/menu/${filename}`

      // Dosya boyutunu hesapla
      const processedSize = processedImage.length
      const originalSize = buffer.length
      const reduction = ((1 - processedSize / originalSize) * 100).toFixed(1)

      console.log(`📊 Boyut optimizasyonu: ${originalSize} -> ${processedSize} bytes (${reduction}% küçültme)`)

      return NextResponse.json({
        success: true,
        image: {
          filename: filename,
          url: imageUrl,
          originalName: file.name,
          size: processedSize,
          originalSize: originalSize,
          reduction: `${reduction}%`,
          dimensions: '800x600',
          type: 'image/webp'
        },
        message: 'Resim başarıyla yüklendi ve optimize edildi'
      })

    } catch (sharpError) {
      console.error('❌ Sharp processing error:', sharpError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Resim işlenirken hata oluştu',
          details: process.env.NODE_ENV === 'development' ? sharpError.message : undefined
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Image upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Resim yüklenirken hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Resim silme
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename gerekli' },
        { status: 400 }
      )
    }

    // Güvenlik: Path traversal saldırılarını önle
    const safeName = path.basename(filename)
    if (safeName !== filename) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dosya adı' },
        { status: 400 }
      )
    }

    // Dosya yolunu oluştur
    const filepath = path.join(process.cwd(), 'public', 'uploads', 'menu', safeName)

    try {
      await access(filepath, constants.F_OK)
      await unlink(filepath)
      console.log('✅ Dosya silindi:', filepath)
      
      return NextResponse.json({
        success: true,
        message: 'Resim başarıyla silindi'
      })
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          success: true,
          message: 'Dosya zaten mevcut değil'
        })
      }
      throw error
    }

  } catch (error) {
    console.error('❌ Image delete error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Resim silinirken hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}