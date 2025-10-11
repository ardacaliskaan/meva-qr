// src/app/api/admin/sessions/route.js
// Admin Sessions Management API

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

/**
 * GET /api/admin/sessions
 * Aktif session'ları listeler
 * Query params:
 *   ?status=active|expired|closed|all (default: active)
 *   ?includeStats=true
 *   ?suspicious=true (sadece şüpheli olanlar)
 *   ?tableNumber=5 (belirli masa)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const includeStats = searchParams.get('includeStats') === 'true'
    const suspiciousOnly = searchParams.get('suspicious') === 'true'
    const tableNumber = searchParams.get('tableNumber')
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Filter oluştur
    const filter = {}
    
    if (status === 'active') {
      filter.status = 'active'
      filter.expiryTime = { $gt: new Date() }
    } else if (status === 'expired') {
      filter.status = 'active'
      filter.expiryTime = { $lte: new Date() }
    } else if (status === 'closed') {
      filter.status = 'closed'
    }
    // 'all' için filter boş kalır
    
    if (suspiciousOnly) {
      filter['flags.isSuspicious'] = true
    }
    
    if (tableNumber) {
      filter.tableNumber = parseInt(tableNumber)
    }
    
    // Session'ları getir
    const sessions = await db.collection('sessions')
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray()
    
    // Format session data
    const formattedSessions = sessions.map(session => {
      const now = new Date()
      const startTime = new Date(session.startTime)
      const duration = Math.floor((now - startTime) / (1000 * 60)) // dakika
      
      return {
        id: session._id.toString(),
        sessionId: session.sessionId,
        tableNumber: session.tableNumber,
        status: session.status,
        startTime: session.startTime,
        expiryTime: session.expiryTime,
        lastActivity: session.lastActivity,
        duration,
        deviceCount: session.totalDevices || 0,
        orderCount: session.orderCount || 0,
        totalAmount: session.totalAmount || 0,
        isSuspicious: session.flags?.isSuspicious || false,
        suspiciousReasons: session.flags?.reasons || [],
        devices: session.devices || [],
        orders: session.orders || []
      }
    })
    
    const response = {
      success: true,
      sessions: formattedSessions
    }
    
    // İstatistikler istenmişse
    if (includeStats) {
      const allActiveSessions = await db.collection('sessions')
        .find({ status: 'active', expiryTime: { $gt: new Date() } })
        .toArray()
      
      const stats = {
        totalActive: allActiveSessions.length,
        totalDevices: allActiveSessions.reduce((sum, s) => sum + (s.totalDevices || 0), 0),
        totalOrders: allActiveSessions.reduce((sum, s) => sum + (s.orderCount || 0), 0),
        totalRevenue: allActiveSessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
        suspiciousCount: allActiveSessions.filter(s => s.flags?.isSuspicious).length,
        averageDevicesPerSession: allActiveSessions.length > 0 
          ? (allActiveSessions.reduce((sum, s) => sum + (s.totalDevices || 0), 0) / allActiveSessions.length).toFixed(1)
          : 0,
        averageOrdersPerSession: allActiveSessions.length > 0
          ? (allActiveSessions.reduce((sum, s) => sum + (s.orderCount || 0), 0) / allActiveSessions.length).toFixed(1)
          : 0
      }
      
      response.statistics = stats
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Admin Sessions GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Session\'lar alınamadı' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/sessions/:sessionId/close
 * Session'ı kapat
 */
export async function PUT(request) {
  try {
    const { sessionId, action, reason } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID gerekli' },
        { status: 400 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Session'ı bul
    const session = await db.collection('sessions')
      .findOne({ sessionId })
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session bulunamadı' },
        { status: 404 }
      )
    }
    
    if (action === 'close') {
      // Session'ı kapat
      await db.collection('sessions').updateOne(
        { sessionId },
        {
          $set: {
            status: 'closed',
            closedAt: new Date(),
            closedBy: 'admin', // TODO: gerçek admin ID'si
            closedReason: reason || 'Manuel kapatma',
            updatedAt: new Date()
          }
        }
      )
      
      // İlgili masanın currentSessionId'sini temizle
      if (session.tableId) {
        await db.collection('tables').updateOne(
          { _id: new ObjectId(session.tableId) },
          {
            $set: {
              currentSessionId: null,
              status: 'empty',
              updatedAt: new Date()
            }
          }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Session başarıyla kapatıldı'
      })
      
    } else if (action === 'flag') {
      // Session'ı işaretle
      await db.collection('sessions').updateOne(
        { sessionId },
        {
          $set: {
            'flags.isSuspicious': true,
            'flags.manuallyFlagged': true,
            'flags.flaggedAt': new Date(),
            'flags.flaggedBy': 'admin', // TODO: gerçek admin ID'si
            updatedAt: new Date()
          },
          $push: {
            'flags.reasons': reason || 'Manuel işaretleme'
          }
        }
      )
      
      return NextResponse.json({
        success: true,
        message: 'Session şüpheli olarak işaretlendi'
      })
      
    } else if (action === 'unflag') {
      // İşareti kaldır
      await db.collection('sessions').updateOne(
        { sessionId },
        {
          $set: {
            'flags.isSuspicious': false,
            'flags.manuallyFlagged': false,
            updatedAt: new Date()
          }
        }
      )
      
      return NextResponse.json({
        success: true,
        message: 'Session işareti kaldırıldı'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Geçersiz aksiyon' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ Admin Sessions PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'İşlem gerçekleştirilemedi' },
      { status: 500 }
    )
  }
}