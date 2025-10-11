// scripts/setupSecurity.js
// Database Setup için GÜVENLİ Script
// SADECE YENİ collection ve index'ler ekler
// Mevcut verilere DOKUNMAZ!

const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-qr'

async function setupSecurity() {
  const client = new MongoClient(uri)
  
  try {
    console.log('🔄 MongoDB bağlantısı kuruluyor...')
    await client.connect()
    console.log('✅ MongoDB bağlantısı başarılı!\n')
    
    const db = client.db('restaurant-qr')
    
    // ============================================
    // 1. SESSIONS COLLECTION OLUŞTUR
    // ============================================
    console.log('📦 1/4 - Sessions collection oluşturuluyor...')
    
    try {
      // Collection var mı kontrol et
      const collections = await db.listCollections({ name: 'sessions' }).toArray()
      
      if (collections.length === 0) {
        await db.createCollection('sessions')
        console.log('   ✅ Sessions collection oluşturuldu')
      } else {
        console.log('   ℹ️  Sessions collection zaten mevcut')
      }
    } catch (error) {
      console.log('   ⚠️  Collection oluşturma atlandı:', error.message)
    }
    
    // ============================================
    // 2. SESSIONS COLLECTION INDEX'LERİ
    // ============================================
    console.log('\n📑 2/4 - Sessions index\'leri oluşturuluyor...')
    
    try {
      const sessionIndexes = await db.collection('sessions').createIndexes([
        { 
          key: { sessionId: 1 }, 
          unique: true,
          name: 'sessionId_unique'
        },
        { 
          key: { tableId: 1, status: 1 },
          name: 'tableId_status'
        },
        { 
          key: { tableNumber: 1, status: 1 },
          name: 'tableNumber_status'
        },
        { 
          key: { expiryTime: 1 },
          name: 'expiryTime'
        },
        { 
          key: { status: 1, updatedAt: -1 },
          name: 'status_updatedAt'
        }
      ])
      console.log(`   ✅ ${sessionIndexes.length} index oluşturuldu`)
    } catch (error) {
      console.log('   ⚠️  Index oluşturma hatası:', error.message)
    }
    
    // ============================================
    // 3. ORDERS COLLECTION YENİ INDEX'LER
    // ============================================
    console.log('\n📑 3/4 - Orders collection\'a yeni index\'ler ekleniyor...')
    
    try {
      const orderIndexes = await db.collection('orders').createIndexes([
        { 
          key: { sessionId: 1 },
          name: 'sessionId'
        },
        { 
          key: { 'security.requiresApproval': 1, status: 1 },
          name: 'security_approval_status'
        }
      ])
      console.log(`   ✅ ${orderIndexes.length} yeni index eklendi`)
    } catch (error) {
      console.log('   ⚠️  Index ekleme hatası:', error.message)
    }
    
    // ============================================
    // 4. TABLES COLLECTION YENİ INDEX
    // ============================================
    console.log('\n📑 4/4 - Tables collection\'a yeni index ekleniyor...')
    
    try {
      await db.collection('tables').createIndex(
        { currentSessionId: 1 },
        { name: 'currentSessionId' }
      )
      console.log('   ✅ Index eklendi')
    } catch (error) {
      console.log('   ⚠️  Index ekleme hatası:', error.message)
    }
    
    // ============================================
    // KONTROL VE ÖZET
    // ============================================
    console.log('\n' + '='.repeat(50))
    console.log('📊 KURULUM ÖZETİ')
    console.log('='.repeat(50))
    
    // Sessions collection kontrolü
    const sessionsCount = await db.collection('sessions').countDocuments()
    console.log(`✅ Sessions Collection: ${sessionsCount} döküman`)
    
    const sessionsIndexes = await db.collection('sessions').indexes()
    console.log(`✅ Sessions Indexes: ${sessionsIndexes.length} adet`)
    
    // Orders collection kontrolü
    const ordersIndexes = await db.collection('orders').indexes()
    console.log(`✅ Orders Indexes: ${ordersIndexes.length} adet`)
    
    // Tables collection kontrolü
    const tablesIndexes = await db.collection('tables').indexes()
    console.log(`✅ Tables Indexes: ${tablesIndexes.length} adet`)
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 GÜVENLİK SİSTEMİ KURULUMU TAMAMLANDI!')
    console.log('='.repeat(50))
    console.log('\n✅ Mevcut veriler korundu')
    console.log('✅ Sadece yeni yapılar eklendi')
    console.log('✅ Sistem çalışmaya devam edebilir')
    console.log('\nSONRAKİ ADIM: API dosyalarını oluşturun\n')
    
  } catch (error) {
    console.error('\n❌ HATA:', error.message)
    console.error('Detay:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('📪 MongoDB bağlantısı kapatıldı')
  }
}

// Script'i çalıştır
setupSecurity().catch(console.error)