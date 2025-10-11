// src/lib/security/botDetector.js
// Bot detection utility
// Otomatik sipariş verme ve bot davranışlarını tespit eder

/**
 * Bot pattern'i tespit eder
 * @param {Object} session - Session object
 * @param {Object} orderData - Sipariş verisi
 * @param {Object} db - MongoDB database instance
 * @returns {Object} Bot detection result
 */
export async function detectBotPattern(session, orderData, db) {
  const detections = []
  
  try {
    // ============================================
    // 1. Çok Hızlı Ardışık Sipariş
    // ============================================
    const rapidOrderCheck = await checkRapidOrders(session.sessionId, db)
    if (rapidOrderCheck.isBot) {
      detections.push(rapidOrderCheck)
    }
    
    // ============================================
    // 2. Aynı Ürün Yüksek Miktar
    // ============================================
    const highQuantityCheck = checkHighQuantity(orderData)
    if (highQuantityCheck.suspicious) {
      detections.push(highQuantityCheck)
    }
    
    // ============================================
    // 3. Eşit Aralıklı Siparişler (Bot Pattern)
    // ============================================
    const uniformTimingCheck = await checkUniformTiming(session.sessionId, db)
    if (uniformTimingCheck.isBot) {
      detections.push(uniformTimingCheck)
    }
    
    // ============================================
    // Sonuç Değerlendirmesi
    // ============================================
    
    // Yüksek güven bot
    const highConfidenceBot = detections.some(d => d.confidence >= 0.9)
    if (highConfidenceBot) {
      return {
        isBot: true,
        confidence: 0.95,
        action: 'BLOCK',
        reason: detections.map(d => d.reason).join(', '),
        message: 'Bot davranışı tespit edildi',
        detections
      }
    }
    
    // Orta güven - yavaşlat
    const mediumConfidenceBot = detections.some(d => d.confidence >= 0.7)
    if (mediumConfidenceBot) {
      return {
        isBot: true,
        confidence: 0.75,
        action: 'WAIT',
        reason: detections.map(d => d.reason).join(', '),
        message: 'Çok hızlı sipariş veriyorsunuz. Lütfen 10 saniye bekleyin.',
        waitTime: 10,
        detections
      }
    }
    
    // Düşük güven - sadece uyar
    if (detections.length > 0) {
      return {
        isBot: false,
        confidence: 0.5,
        action: 'WARN',
        reason: detections.map(d => d.reason).join(', '),
        message: null,
        detections
      }
    }
    
    // Temiz
    return {
      isBot: false,
      confidence: 0,
      action: null,
      reason: null,
      detections: []
    }
    
  } catch (error) {
    console.error('Bot detection error:', error)
    // Hata durumunda false positive'den kaçın
    return {
      isBot: false,
      confidence: 0,
      action: null,
      reason: 'DETECTION_ERROR',
      error: error.message
    }
  }
}

/**
 * Hızlı ardışık sipariş kontrolü
 */
async function checkRapidOrders(sessionId, db) {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const tenSecondsAgo = new Date(now.getTime() - 10 * 1000)
  
  // Son 1 dakikadaki siparişler
  const recentOrders = await db.collection('orders')
    .find({
      sessionId,
      createdAt: { $gte: oneMinuteAgo }
    })
    .sort({ createdAt: 1 })
    .toArray()
  
  if (recentOrders.length >= 5) {
    // 1 dakikada 5+ sipariş = BOT!
    return {
      isBot: true,
      confidence: 0.95,
      reason: '1 dakikada 5+ sipariş',
      severity: 'HIGH'
    }
  }
  
  // Son 10 saniye kontrolü
  const veryRecentOrders = await db.collection('orders')
    .countDocuments({
      sessionId,
      createdAt: { $gte: tenSecondsAgo }
    })
  
  if (veryRecentOrders >= 2) {
    // 10 saniyede 2 sipariş = şüpheli
    return {
      isBot: true,
      confidence: 0.75,
      reason: '10 saniyede 2 sipariş',
      severity: 'MEDIUM'
    }
  }
  
  return {
    isBot: false,
    confidence: 0,
    reason: null
  }
}

/**
 * Yüksek miktar kontrolü
 */
function checkHighQuantity(orderData) {
  const items = orderData.items || []
  
  // Tek üründen 10+ adet
  const highQuantityItems = items.filter(item => item.quantity >= 10)
  
  if (highQuantityItems.length > 0) {
    return {
      suspicious: true,
      confidence: 0.6,
      reason: `${highQuantityItems[0].name} x${highQuantityItems[0].quantity}`,
      severity: 'MEDIUM',
      action: 'CONFIRM',
      message: `${highQuantityItems[0].quantity} adet ${highQuantityItems[0].name} sipariş etmek istediğinizden emin misiniz?`
    }
  }
  
  // Toplam ürün sayısı 20+
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  if (totalQuantity >= 20) {
    return {
      suspicious: true,
      confidence: 0.5,
      reason: `Toplam ${totalQuantity} ürün`,
      severity: 'LOW',
      action: 'CONFIRM',
      message: `Toplam ${totalQuantity} ürün sipariş etmek istediğinizden emin misiniz?`
    }
  }
  
  return {
    suspicious: false,
    confidence: 0,
    reason: null
  }
}

/**
 * Eşit aralıklı sipariş kontrolü (bot pattern)
 */
async function checkUniformTiming(sessionId, db) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  
  const recentOrders = await db.collection('orders')
    .find({
      sessionId,
      createdAt: { $gte: fiveMinutesAgo }
    })
    .sort({ createdAt: 1 })
    .limit(10)
    .toArray()
  
  if (recentOrders.length < 4) {
    return { isBot: false, confidence: 0, reason: null }
  }
  
  // Siparişler arası süreleri hesapla
  const intervals = []
  for (let i = 1; i < recentOrders.length; i++) {
    const interval = new Date(recentOrders[i].createdAt) - new Date(recentOrders[i-1].createdAt)
    intervals.push(interval)
  }
  
  // Ortalama interval
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  
  // Standart sapma
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - avgInterval, 2)
  }, 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  
  // Eğer standart sapma çok düşükse (çok düzenli) = BOT
  // İnsan davranışı daha rastgele olur
  const coefficient = stdDev / avgInterval // Varyasyon katsayısı
  
  if (coefficient < 0.2 && intervals.length >= 4) {
    // Çok düzenli siparişler = BOT!
    return {
      isBot: true,
      confidence: 0.90,
      reason: 'Eşit aralıklı sipariş pattern',
      severity: 'HIGH',
      details: {
        avgInterval: Math.round(avgInterval / 1000),
        stdDev: Math.round(stdDev / 1000),
        coefficient
      }
    }
  }
  
  return {
    isBot: false,
    confidence: 0,
    reason: null
  }
}

/**
 * Duplicate sipariş kontrolü
 * @param {Object} orderData - Yeni sipariş
 * @param {string} sessionId - Session ID
 * @param {Object} db - MongoDB database instance
 */
export async function checkDuplicateOrder(orderData, sessionId, db) {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
  
  try {
    // Son 1 dakikadaki siparişleri kontrol et
    const recentOrders = await db.collection('orders')
      .find({
        sessionId,
        createdAt: { $gte: oneMinuteAgo }
      })
      .toArray()
    
    // Aynı ürünler var mı?
    for (const recentOrder of recentOrders) {
      const isSimilar = checkOrderSimilarity(orderData, recentOrder)
      if (isSimilar.isDuplicate) {
        return {
          isDuplicate: true,
          confidence: 0.8,
          message: 'Bu siparişi az önce verdiniz. Tekrar vermek istiyor musunuz?',
          action: 'CONFIRM',
          similarOrder: recentOrder
        }
      }
    }
    
    return {
      isDuplicate: false,
      confidence: 0
    }
    
  } catch (error) {
    console.error('Duplicate check error:', error)
    return { isDuplicate: false, confidence: 0 }
  }
}

/**
 * İki siparişin benzerliğini kontrol et
 */
function checkOrderSimilarity(order1, order2) {
  const items1 = order1.items || []
  const items2 = order2.items || []
  
  if (items1.length !== items2.length) {
    return { isDuplicate: false }
  }
  
  // Ürün ID'lerini karşılaştır
  const ids1 = items1.map(i => i.menuItemId).sort()
  const ids2 = items2.map(i => i.menuItemId).sort()
  
  const match = ids1.every((id, index) => id === ids2[index])
  
  return {
    isDuplicate: match,
    similarity: match ? 1.0 : 0.0
  }
}