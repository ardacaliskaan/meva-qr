// src/app/api/feedback/route.js
// Anonim Müşteri Feedback API
// SQL Injection & XSS korumalı

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// 🔒 INPUT SANITİZATİON - XSS & SQL Injection koruması
function sanitizeInput(input) {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    // HTML/Script tags temizle
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    // SQL Injection karakterleri temizle
    .replace(/['";\\]/g, '')
    // Özel karakterleri encode et
    .replace(/[<>]/g, '')
    .substring(0, 1000) // Max 1000 karakter
}

// Geçerli kategoriler
const VALID_CATEGORIES = ['service', 'food', 'staff', 'other']

// Kategori isimleri
const CATEGORY_LABELS = {
  'service': 'Hizmet Kalitesi',
  'food': 'Ürün & Lezzet',
  'staff': 'Personel',
  'other': 'Diğer'
}

// GET - Admin için feedback listesi
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeStats = searchParams.get('stats') === 'true'
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Query oluştur
    const query = {}
    
    if (status !== 'all') {
      query.status = status
    }
    
    if (category !== 'all' && VALID_CATEGORIES.includes(category)) {
      query.category = category
    }
    
    // Feedbackleri çek
    const feedbacks = await db.collection('feedbacks')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
    
    // Format data
    const formattedFeedbacks = feedbacks.map(feedback => ({
      id: feedback._id.toString(),
      category: feedback.category,
      categoryLabel: CATEGORY_LABELS[feedback.category] || feedback.category,
      rating: feedback.rating,
      message: feedback.message,
      status: feedback.status,
      adminNotes: feedback.adminNotes,
      createdAt: feedback.createdAt,
      readAt: feedback.readAt,
      resolvedAt: feedback.resolvedAt
    }))
    
    const response = {
      success: true,
      feedbacks: formattedFeedbacks,
      total: formattedFeedbacks.length
    }
    
    // İstatistikler ekle
    if (includeStats) {
      const allFeedbacks = await db.collection('feedbacks').find({}).toArray()
      
      const stats = {
        total: allFeedbacks.length,
        unread: allFeedbacks.filter(f => f.status === 'new').length,
        read: allFeedbacks.filter(f => f.status === 'read').length,
        resolved: allFeedbacks.filter(f => f.status === 'resolved').length,
        byCategory: {
          service: allFeedbacks.filter(f => f.category === 'service').length,
          food: allFeedbacks.filter(f => f.category === 'food').length,
          staff: allFeedbacks.filter(f => f.category === 'staff').length,
          other: allFeedbacks.filter(f => f.category === 'other').length
        },
        averageRating: allFeedbacks.filter(f => f.rating).length > 0
          ? (allFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / allFeedbacks.filter(f => f.rating).length).toFixed(1)
          : 0,
        ratingDistribution: {
          5: allFeedbacks.filter(f => f.rating === 5).length,
          4: allFeedbacks.filter(f => f.rating === 4).length,
          3: allFeedbacks.filter(f => f.rating === 3).length,
          2: allFeedbacks.filter(f => f.rating === 2).length,
          1: allFeedbacks.filter(f => f.rating === 1).length
        }
      }
      
      response.statistics = stats
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Feedbackler yüklenemedi' },
      { status: 500 }
    )
  }
}

// POST - Yeni feedback oluştur (ANONİM)
export async function POST(request) {
  try {
    const data = await request.json()
    
    // 🔒 INPUT VALİDASYON
    const category = data.category?.toLowerCase()
    const rating = data.rating ? parseInt(data.rating) : null
    const message = sanitizeInput(data.message || '')
    
    // Kategori kontrolü
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz kategori' },
        { status: 400 }
      )
    }
    
    // Mesaj kontrolü
    if (!message || message.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Mesaj en az 10 karakter olmalıdır' },
        { status: 400 }
      )
    }
    
    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Mesaj en fazla 1000 karakter olabilir' },
        { status: 400 }
      )
    }
    
    // Rating kontrolü (optional)
    if (rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz rating' },
        { status: 400 }
      )
    }
    
    // 🔒 RATE LIMITING - Aynı IP'den dakikada en fazla 3 feedback
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Son 1 dakikadaki feedbackleri kontrol et
    const oneMinuteAgo = new Date(Date.now() - 60000)
    const recentFeedbacks = await db.collection('feedbacks')
      .countDocuments({
        ipAddress: clientIP,
        createdAt: { $gte: oneMinuteAgo }
      })
    
    if (recentFeedbacks >= 3) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen biraz bekleyin.' },
        { status: 429 }
      )
    }
    
    // Feedback oluştur
    const feedback = {
      category,
      categoryLabel: CATEGORY_LABELS[category],
      rating: rating,
      message: message,
      status: 'new', // new, read, resolved
      adminNotes: null,
      ipAddress: clientIP, // Sadece rate limiting için, admin panelde gösterilmez
      userAgent: request.headers.get('user-agent') || 'unknown',
      createdAt: new Date(),
      readAt: null,
      resolvedAt: null
    }
    
    const result = await db.collection('feedbacks').insertOne(feedback)
    
    console.log('✅ Feedback created:', result.insertedId.toString())
    
    return NextResponse.json({
      success: true,
      message: 'Geri bildiriminiz başarıyla kaydedildi',
      feedbackId: result.insertedId.toString()
    })
    
  } catch (error) {
    console.error('Feedback POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Feedback kaydedilemedi' },
      { status: 500 }
    )
  }
}

// PUT - Feedback durumu güncelle (SADECE ADMIN)
export async function PUT(request) {
  try {
    const data = await request.json()
    const { id, status, adminNotes } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID gerekli' },
        { status: 400 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const updateData = {
      updatedAt: new Date()
    }
    
    // Status güncelleme
    if (status) {
      if (!['new', 'read', 'resolved'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Geçersiz durum' },
          { status: 400 }
        )
      }
      
      updateData.status = status
      
      if (status === 'read' && !updateData.readAt) {
        updateData.readAt = new Date()
      }
      
      if (status === 'resolved') {
        updateData.resolvedAt = new Date()
      }
    }
    
    // Admin notları
    if (adminNotes !== undefined) {
      updateData.adminNotes = sanitizeInput(adminNotes)
    }
    
    const result = await db.collection('feedbacks').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Feedback bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Feedback güncellendi'
    })
    
  } catch (error) {
    console.error('Feedback PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Feedback güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Feedback sil (SADECE ADMIN)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID gerekli' },
        { status: 400 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const result = await db.collection('feedbacks').deleteOne({
      _id: new ObjectId(id)
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Feedback bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Feedback silindi'
    })
    
  } catch (error) {
    console.error('Feedback DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Feedback silinemedi' },
      { status: 500 }
    )
  }
}