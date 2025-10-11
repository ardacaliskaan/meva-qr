// src/lib/security/sessionValidator.js
// Session validation utility
// Oturum doğrulama ve kontrol fonksiyonları

/**
 * Session'ı doğrular ve geçerliliğini kontrol eder
 * @param {string} sessionId - Session ID
 * @param {Object} db - MongoDB database instance
 * @returns {Object} Validation result
 */
export async function validateSession(sessionId, db) {
  if (!sessionId) {
    return {
      valid: false,
      error: 'Session ID gerekli',
      code: 'SESSION_ID_REQUIRED'
    }
  }
  
  try {
    // Session'ı bul
    const session = await db.collection('sessions').findOne({
      sessionId,
      status: 'active'
    })
    
    if (!session) {
      return {
        valid: false,
        error: 'Oturum bulunamadı',
        code: 'SESSION_NOT_FOUND'
      }
    }
    
    // Expire kontrolü
    const now = new Date()
    if (now > new Date(session.expiryTime)) {
      // Session'ı expired olarak işaretle
      await db.collection('sessions').updateOne(
        { sessionId },
        { 
          $set: { 
            status: 'expired',
            updatedAt: now
          }
        }
      )
      
      return {
        valid: false,
        error: 'Oturum süresi doldu. Lütfen QR kodu tekrar okutun.',
        code: 'SESSION_EXPIRED'
      }
    }
    
    // Her şey OK
    return {
      valid: true,
      session
    }
    
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      valid: false,
      error: 'Oturum doğrulama hatası',
      code: 'VALIDATION_ERROR'
    }
  }
}

/**
 * Device'ı session'a ekler veya günceller
 * @param {string} sessionId - Session ID
 * @param {Object} deviceInfo - Device bilgileri
 * @param {Object} db - MongoDB database instance
 * @returns {Object} Result
 */
export async function registerDevice(sessionId, deviceInfo, db) {
  try {
    const session = await db.collection('sessions').findOne({ sessionId })
    
    if (!session) {
      return { success: false, error: 'Session bulunamadı' }
    }
    
    // Device zaten kayıtlı mı?
    const deviceExists = session.devices?.some(
      d => d.fingerprint === deviceInfo.fingerprint
    )
    
    if (deviceExists) {
      // Sadece lastSeen güncelle
      await db.collection('sessions').updateOne(
        { 
          sessionId,
          'devices.fingerprint': deviceInfo.fingerprint
        },
        {
          $set: {
            'devices.$.lastSeen': new Date(),
            lastActivity: new Date()
          },
          $inc: {
            'devices.$.orderCount': 0 // Sadece update için
          }
        }
      )
      
      return {
        success: true,
        isNew: false,
        message: 'Device güncellendi'
      }
    } else {
      // Yeni device ekle
      await db.collection('sessions').updateOne(
        { sessionId },
        {
          $push: {
            devices: {
              fingerprint: deviceInfo.fingerprint,
              ipAddress: deviceInfo.ipAddress,
              userAgent: deviceInfo.userAgent,
              deviceInfo: deviceInfo.deviceInfo,
              firstSeen: new Date(),
              lastSeen: new Date(),
              orderCount: 0
            }
          },
          $inc: {
            totalDevices: 1
          },
          $set: {
            lastActivity: new Date(),
            updatedAt: new Date()
          }
        }
      )
      
      // Cihaz sayısını kontrol et
      const updatedSession = await db.collection('sessions').findOne({ sessionId })
      
      // 15+ cihaz varsa işaretle
      if (updatedSession.totalDevices >= 15) {
        await db.collection('sessions').updateOne(
          { sessionId },
          {
            $set: {
              'flags.isSuspicious': true,
              'flags.autoFlagged': true,
              'flags.flaggedAt': new Date()
            },
            $addToSet: {
              'flags.reasons': 'EXCESSIVE_DEVICES'
            }
          }
        )
      }
      
      return {
        success: true,
        isNew: true,
        message: 'Yeni device eklendi',
        totalDevices: updatedSession.totalDevices
      }
    }
    
  } catch (error) {
    console.error('Device registration error:', error)
    return {
      success: false,
      error: 'Device kayıt hatası'
    }
  }
}

/**
 * Session'ın son aktivite zamanını günceller
 * @param {string} sessionId - Session ID
 * @param {Object} db - MongoDB database instance
 */
export async function updateSessionActivity(sessionId, db) {
  try {
    await db.collection('sessions').updateOne(
      { sessionId },
      {
        $set: {
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }
    )
  } catch (error) {
    console.error('Update activity error:', error)
  }
}

/**
 * Expired session'ları temizle (cleanup job için)
 * @param {Object} db - MongoDB database instance
 * @returns {number} Temizlenen session sayısı
 */
export async function cleanupExpiredSessions(db) {
  try {
    const result = await db.collection('sessions').updateMany(
      {
        status: 'active',
        expiryTime: { $lt: new Date() }
      },
      {
        $set: {
          status: 'expired',
          updatedAt: new Date()
        }
      }
    )
    
    return result.modifiedCount
  } catch (error) {
    console.error('Cleanup error:', error)
    return 0
  }
}