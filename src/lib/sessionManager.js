// src/lib/sessionManager.js
// Frontend session management utility
// LocalStorage ile session yönetimi
import { apiPath } from '@/lib/api'

/**
 * Device fingerprint oluştur (basit versiyon)
 * @returns {string} Device fingerprint
 */
export function generateDeviceFingerprint() {
  try {
    const data = {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0
    }
    
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return 'fp_' + Math.abs(hash).toString(36)
  } catch (error) {
    console.error('Fingerprint generation error:', error)
    return 'fp_unknown_' + Date.now()
  }
}

/**
 * Device bilgilerini topla
 * @returns {Object} Device info
 */
export function getDeviceInfo() {
  try {
    const userAgent = navigator.userAgent.toLowerCase()
    
    // Browser detection
    let browser = 'unknown'
    if (userAgent.includes('chrome')) browser = 'Chrome'
    else if (userAgent.includes('safari')) browser = 'Safari'
    else if (userAgent.includes('firefox')) browser = 'Firefox'
    else if (userAgent.includes('edge')) browser = 'Edge'
    
    // OS detection
    let os = 'unknown'
    if (userAgent.includes('windows')) os = 'Windows'
    else if (userAgent.includes('mac')) os = 'macOS'
    else if (userAgent.includes('linux')) os = 'Linux'
    else if (userAgent.includes('android')) os = 'Android'
    else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) os = 'iOS'
    
    // Mobile detection
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    
    return {
      fingerprint: generateDeviceFingerprint(),
      browser,
      os,
      isMobile,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    }
  } catch (error) {
    console.error('Get device info error:', error)
    return {
      fingerprint: 'fp_error',
      browser: 'unknown',
      os: 'unknown',
      isMobile: false
    }
  }
}

/**
 * Session Manager Class
 */
export class SessionManager {
  constructor(tableNumber) {
  this.tableNumber = tableNumber.toString().toUpperCase() // 🔥 Büyük harfe çevir
    this.storageKey = `session_table_${tableNumber}`
    this.deviceInfo = getDeviceInfo()
  }
  
  /**
   * Session'ı localStorage'dan al
   * @returns {Object|null} Session data
   */
  getSession() {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) return null
      
      const session = JSON.parse(data)
      
      // Expire kontrolü
      if (new Date(session.expiryTime) <= new Date()) {
        this.clearSession()
        return null
      }
      
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }
  
  /**
   * Session'ı localStorage'a kaydet
   * @param {Object} sessionData - Session data
   */
  setSession(sessionData) {
    try {
      const data = {
        sessionId: sessionData.sessionId,
        tableNumber: sessionData.tableNumber,
        expiryTime: sessionData.expiryTime,
        startTime: sessionData.startTime || new Date().toISOString(),
        deviceFingerprint: this.deviceInfo.fingerprint,
        lastActivity: new Date().toISOString()
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Set session error:', error)
    }
  }
  
  /**
   * Session'ı temizle
   */
  clearSession() {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Clear session error:', error)
    }
  }
  
  /**
   * Son aktivite zamanını güncelle
   */
  updateLastActivity() {
    try {
      const session = this.getSession()
      if (session) {
        session.lastActivity = new Date().toISOString()
        localStorage.setItem(this.storageKey, JSON.stringify(session))
      }
    } catch (error) {
      console.error('Update activity error:', error)
    }
  }
  
  /**
   * Session başlat veya mevcut session'ı al
   * @returns {Promise<Object>} Session data
   */
  async initSession() {
    try {
      // Önce mevcut session'ı kontrol et
      const existingSession = this.getSession()
      
      if (existingSession) {
        // Validate et
        const validation = await this.validateSession(existingSession.sessionId)
        
        if (validation.success && validation.valid) {
          this.updateLastActivity()
          return {
            success: true,
            session: existingSession,
            isNew: false
          }
        }
        
        // Geçersiz ise temizle
        this.clearSession()
      }
      
      // Yeni session oluştur
const response = await fetch(apiPath('/api/sessions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
  tableNumber: this.tableNumber.toString(),  // String olarak gönder
  deviceInfo: this.deviceInfo
})
      })
      
      const data = await response.json()
      
      if (data.success) {
        this.setSession(data.session)
        return {
          success: true,
          session: data.session,
          isNew: data.session.isNew
        }
      }
      
      return {
        success: false,
        error: data.error || 'Session başlatılamadı'
      }
      
    } catch (error) {
      console.error('Init session error:', error)
      return {
        success: false,
        error: 'Bağlantı hatası'
      }
    }
  }
  
  /**
   * Session'ı doğrula
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Validation result
   */
async validateSession(sessionId) {
  try {
    const response = await fetch(
      apiPath(`/api/sessions?sessionId=${sessionId}&fingerprint=${this.deviceInfo.fingerprint}`)
    )
      
      const data = await response.json()
      return data
      
    } catch (error) {
      console.error('Validate session error:', error)
      return {
        success: false,
        valid: false,
        error: 'Doğrulama hatası'
      }
    }
  }
  
  /**
   * Session'ı uzat
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Result
   */
  async extendSession(sessionId) {
    try {
const response = await fetch(apiPath('/api/sessions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'extend'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // LocalStorage'ı güncelle
        const session = this.getSession()
        if (session) {
          session.expiryTime = data.expiryTime
          this.setSession(session)
        }
      }
      
      return data
      
    } catch (error) {
      console.error('Extend session error:', error)
      return {
        success: false,
        error: 'Uzatma hatası'
      }
    }
  }
  
  /**
   * Session bilgilerini al (debug için)
   * @returns {Object} Session info
   */
  getSessionInfo() {
    const session = this.getSession()
    if (!session) {
      return {
        exists: false,
        message: 'Session yok'
      }
    }
    
    const now = new Date()
    const expiry = new Date(session.expiryTime)
    const remaining = Math.floor((expiry - now) / 1000 / 60) // dakika
    
    return {
      exists: true,
      sessionId: session.sessionId,
      tableNumber: session.tableNumber,
      deviceFingerprint: session.deviceFingerprint,
      remainingMinutes: remaining,
      isExpired: remaining <= 0
    }
  }
}

/**
 * Tüm session'ları temizle (logout için)
 */
export function clearAllSessions() {
  try {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter(key => key.startsWith('session_table_'))
    
    sessionKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    return {
      success: true,
      cleared: sessionKeys.length
    }
  } catch (error) {
    console.error('Clear all sessions error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Expired session'ları temizle (cleanup için)
 */
export function cleanupExpiredSessions() {
  try {
    const keys = Object.keys(localStorage)
    const sessionKeys = keys.filter(key => key.startsWith('session_table_'))
    
    let cleaned = 0
    sessionKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        if (new Date(data.expiryTime) <= new Date()) {
          localStorage.removeItem(key)
          cleaned++
        }
      } catch (error) {
        // Parse hatası ise sil
        localStorage.removeItem(key)
        cleaned++
      }
    })
    
    return {
      success: true,
      cleaned
    }
  } catch (error) {
    console.error('Cleanup error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Auto-cleanup (sayfa yüklendiğinde)
if (typeof window !== 'undefined') {
  cleanupExpiredSessions()
}