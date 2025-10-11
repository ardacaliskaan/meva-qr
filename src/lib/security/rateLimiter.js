// src/lib/security/rateLimiter.js
// Rate limiting utility
// Spam ve bot saldırılarını önlemek için hız sınırlaması

/**
 * Session için rate limit kontrolü yapar
 * @param {Object} session - Session object
 * @param {Object} db - MongoDB database instance
 * @returns {Object} Rate limit result
 */
export async function checkRateLimit(session, db) {
  const now = new Date()
  
  try {
    // ============================================
    // 1. İlk 15 Dakika - Sınırsız (Menü inceleme)
    // ============================================
    const sessionAge = now - new Date(session.startTime)
    const fifteenMinutes = 15 * 60 * 1000
    
    if (sessionAge < fifteenMinutes) {
      // İlk 15 dakika tamamen serbest
      return {
        allowed: true,
        reason: 'INITIAL_GRACE_PERIOD'
      }
    }
    
    // ============================================
    // 2. Son 5 Dakikadaki Sipariş Kontrolü
    // ============================================
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    const recentOrders = await db.collection('orders')
      .countDocuments({
        sessionId: session.sessionId,
        createdAt: { $gte: fiveMinutesAgo }
      })
    
    const LIMIT_5MIN = 8 // 4 kişi x 2 sipariş = makul limit
    
    if (recentOrders >= LIMIT_5MIN) {
      // En eski siparişi bul
      const oldestRecentOrder = await db.collection('orders')
        .findOne(
          { 
            sessionId: session.sessionId, 
            createdAt: { $gte: fiveMinutesAgo } 
          },
          { sort: { createdAt: 1 } }
        )
      
      if (oldestRecentOrder) {
        const retryAfter = Math.ceil(
          (new Date(oldestRecentOrder.createdAt).getTime() + 5 * 60 * 1000 - now.getTime()) / 1000
        )
        
        return {
          allowed: false,
          reason: 'RATE_LIMIT_5MIN',
          message: `Son 5 dakikada ${LIMIT_5MIN} sipariş verildi. Lütfen ${Math.ceil(retryAfter / 60)} dakika bekleyin.`,
          retryAfter: Math.max(retryAfter, 1)
        }
      }
    }
    
    // ============================================
    // 3. Son 1 Saatteki Sipariş Kontrolü
    // ============================================
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const hourlyOrders = await db.collection('orders')
      .countDocuments({
        sessionId: session.sessionId,
        createdAt: { $gte: oneHourAgo }
      })
    
    const LIMIT_1HOUR = 30
    
    if (hourlyOrders >= LIMIT_1HOUR) {
      return {
        allowed: false,
        reason: 'RATE_LIMIT_1HOUR',
        message: `Son 1 saatte ${LIMIT_1HOUR} sipariş verildi. Lütfen biraz bekleyin.`,
        retryAfter: 300 // 5 dakika
      }
    }
    
    // ============================================
    // 4. Toplam Sipariş Limiti
    // ============================================
    const TOTAL_LIMIT = 100
    
    if (session.orderCount >= TOTAL_LIMIT) {
      return {
        allowed: false,
        reason: 'TOTAL_LIMIT_REACHED',
        message: 'Maksimum sipariş limitine ulaşıldı. Lütfen garson çağırın.',
        retryAfter: null
      }
    }
    
    // ============================================
    // Tüm kontroller geçildi
    // ============================================
    return {
      allowed: true,
      reason: 'OK'
    }
    
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Hata durumunda izin ver (güvenli taraf)
    return {
      allowed: true,
      reason: 'ERROR_FALLBACK'
    }
  }
}

/**
 * Cihaz bazlı rate limit (opsiyonel)
 * @param {string} sessionId - Session ID
 * @param {string} deviceFingerprint - Device fingerprint
 * @param {Object} db - MongoDB database instance
 * @returns {Object} Rate limit result
 */
export async function checkDeviceRateLimit(sessionId, deviceFingerprint, db) {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  
  try {
    // Son 1 dakikadaki cihaz siparişleri
    const recentDeviceOrders = await db.collection('orders')
      .countDocuments({
        sessionId,
        deviceFingerprint,
        createdAt: { $gte: oneMinuteAgo }
      })
    
    const DEVICE_LIMIT_1MIN = 3
    
    if (recentDeviceOrders >= DEVICE_LIMIT_1MIN) {
      return {
        allowed: false,
        reason: 'DEVICE_RATE_LIMIT',
        message: 'Çok hızlı sipariş veriyorsunuz. Lütfen 1 dakika bekleyin.',
        retryAfter: 60
      }
    }
    
    return {
      allowed: true,
      reason: 'OK'
    }
    
  } catch (error) {
    console.error('Device rate limit error:', error)
    return {
      allowed: true,
      reason: 'ERROR_FALLBACK'
    }
  }
}

/**
 * Rate limit bilgilerini güncelle (sipariş sonrası)
 * @param {string} sessionId - Session ID
 * @param {Object} db - MongoDB database instance
 */
export async function updateRateLimitStats(sessionId, db) {
  try {
    await db.collection('sessions').updateOne(
      { sessionId },
      {
        $set: {
          'rateLimits.lastOrderTime': new Date()
        },
        $inc: {
          orderCount: 1
        }
      }
    )
  } catch (error) {
    console.error('Update rate limit stats error:', error)
  }
}

/**
 * Rate limit window'u sıfırla (cleanup için)
 * @param {Object} db - MongoDB database instance
 */
export async function resetRateLimitWindows(db) {
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  
  try {
    // 5 dakikadan eski window'ları sıfırla
    await db.collection('sessions').updateMany(
      {
        'rateLimits.recentOrdersWindow': { $lt: fiveMinutesAgo }
      },
      {
        $set: {
          'rateLimits.recentOrdersCount': 0,
          'rateLimits.recentOrdersWindow': now
        }
      }
    )
  } catch (error) {
    console.error('Reset rate limit windows error:', error)
  }
}