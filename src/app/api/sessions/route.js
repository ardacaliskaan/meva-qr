// src/app/api/sessions/route.js
// Sessions Management API
// Session oluşturma ve doğrulama

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { randomUUID } from 'crypto'
import { 
  validateSession, 
  registerDevice, 
  updateSessionActivity 
} from '@/lib/security/sessionValidator'

// Helper: Client IP al
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

// POST - Session Oluştur veya Mevcut Session'ı Getir
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const body = await request.json()
    const { tableNumber, deviceInfo } = body
    
    // Validasyon
    if (!tableNumber) {
      return NextResponse.json({
        success: false,
        error: 'Masa numarası gerekli'
      }, { status: 400 })
    }
    
    // Masa kontrolü
    const table = await db.collection('tables').findOne({ 
      number: parseInt(tableNumber) 
    })
    
    if (!table) {
      return NextResponse.json({
        success: false,
        error: 'Masa bulunamadı'
      }, { status: 404 })
    }
    
    // ============================================
    // Aktif Session Kontrolü
    // ============================================
    const existingSession = await db.collection('sessions').findOne({
      tableNumber: parseInt(tableNumber),
      status: 'active',
      expiryTime: { $gt: new Date() }
    })
    
    if (existingSession) {
      // Mevcut session var - device'ı kaydet
      const deviceRegistration = await registerDevice(
        existingSession.sessionId,
        {
          fingerprint: deviceInfo.fingerprint || 'unknown',
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          deviceInfo: {
            browser: deviceInfo.browser || 'unknown',
            os: deviceInfo.os || 'unknown',
            isMobile: deviceInfo.isMobile || false,
            screenResolution: deviceInfo.screen || 'unknown'
          }
        },
        db
      )
      
      return NextResponse.json({
        success: true,
        session: {
          sessionId: existingSession.sessionId,
          tableNumber: existingSession.tableNumber,
          expiryTime: existingSession.expiryTime,
          startTime: existingSession.startTime,
          orderCount: existingSession.orderCount || 0,
          totalAmount: existingSession.totalAmount || 0,
          deviceCount: existingSession.totalDevices || 1,
          isNew: false
        },
        deviceRegistration,
        message: 'Aktif oturum bulundu'
      })
    }
    
    // ============================================
    // Yeni Session Oluştur
    // ============================================
    const sessionId = randomUUID()
    const now = new Date()
    const expiryTime = new Date(now.getTime() + (4 * 60 * 60 * 1000)) // 4 saat
    
    const newSession = {
      sessionId,
      tableId: table._id,
      tableNumber: parseInt(tableNumber),
      status: 'active',
      
      // Zaman bilgileri
      startTime: now,
      expiryTime,
      lastActivity: now,
      closedAt: null,
      closedBy: null,
      
      // Device tracking
      devices: [
        {
          fingerprint: deviceInfo.fingerprint || 'unknown',
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          deviceInfo: {
            browser: deviceInfo.browser || 'unknown',
            os: deviceInfo.os || 'unknown',
            isMobile: deviceInfo.isMobile || false,
            screenResolution: deviceInfo.screen || 'unknown'
          },
          firstSeen: now,
          lastSeen: now,
          orderCount: 0
        }
      ],
      totalDevices: 1,
      
      // İstatistikler
      orderCount: 0,
      totalAmount: 0,
      orders: [],
      
      // Güvenlik
      flags: {
        isSuspicious: false,
        reasons: [],
        autoFlagged: false,
        manuallyFlagged: false,
        flaggedAt: null,
        flaggedBy: null
      },
      
      // Rate limiting
      rateLimits: {
        lastOrderTime: null,
        recentOrdersCount: 0,
        recentOrdersWindow: now
      },
      
      // Metadata
      createdAt: now,
      updatedAt: now
    }
    
    // Session'ı kaydet
    await db.collection('sessions').insertOne(newSession)
    
    // Masa durumunu güncelle
    await db.collection('tables').updateOne(
      { _id: table._id },
      {
        $set: {
          currentSessionId: sessionId,
          lastSessionTime: now,
          status: 'occupied'
        }
      }
    )
    
    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        tableNumber: parseInt(tableNumber),
        expiryTime,
        startTime: now,
        orderCount: 0,
        totalAmount: 0,
        deviceCount: 1,
        isNew: true
      },
      message: 'Yeni oturum başlatıldı'
    })
    
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Oturum oluşturulamadı'
    }, { status: 500 })
  }
}

// GET - Session Doğrula
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const fingerprint = searchParams.get('fingerprint')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID gerekli'
      }, { status: 400 })
    }
    
    // Session'ı doğrula
    const validation = await validateSession(sessionId, db)
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: validation.error,
        code: validation.code
      }, { status: 401 })
    }
    
    const session = validation.session
    
    // Device kontrolü (soft - sadece istatistik)
    let deviceMatch = true
    if (fingerprint) {
      deviceMatch = session.devices?.some(
        d => d.fingerprint === fingerprint
      ) || false
    }
    
    // Last activity güncelle
    await updateSessionActivity(sessionId, db)
    
    return NextResponse.json({
      success: true,
      valid: true,
      canOrder: true,
      session: {
        sessionId: session.sessionId,
        tableNumber: session.tableNumber,
        expiryTime: session.expiryTime,
        orderCount: session.orderCount || 0,
        totalAmount: session.totalAmount || 0,
        deviceCount: session.totalDevices || 1,
        isSuspicious: session.flags?.isSuspicious || false
      },
      deviceMatch
    })
    
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({
      success: false,
      valid: false,
      error: 'Doğrulama hatası'
    }, { status: 500 })
  }
}

// PUT - Session Güncelle
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const body = await request.json()
    const { sessionId, action } = body
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID gerekli'
      }, { status: 400 })
    }
    
    // Session kontrolü
    const session = await db.collection('sessions').findOne({ sessionId })
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session bulunamadı'
      }, { status: 404 })
    }
    
    // Action'a göre işlem
    if (action === 'extend') {
      // Session süresini uzat
      const newExpiryTime = new Date(Date.now() + (4 * 60 * 60 * 1000))
      
      await db.collection('sessions').updateOne(
        { sessionId },
        {
          $set: {
            expiryTime: newExpiryTime,
            updatedAt: new Date()
          }
        }
      )
      
      return NextResponse.json({
        success: true,
        message: 'Oturum uzatıldı',
        expiryTime: newExpiryTime
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Geçersiz action'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Güncelleme hatası'
    }, { status: 500 })
  }
}