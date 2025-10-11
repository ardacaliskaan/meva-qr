// scripts/cleanup-products.js
// Sadece menu (ürünler) collection'ını temizler

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'restaurant-qr'

async function cleanupProducts() {
  console.log('🧹 ÜRÜN TEMİZLEME BAŞLIYOR...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ MongoDB bağlantısı başarılı!\n')
    
    const db = client.db(DB_NAME)
    
    // Önce mevcut ürün sayısını göster
    const productCount = await db.collection('menu').countDocuments()
    console.log(`📦 Mevcut ürün sayısı: ${productCount}`)
    
    if (productCount === 0) {
      console.log('ℹ️  Silinecek ürün yok!')
      return
    }
    
    // Onay iste
    console.log('\n⚠️  TÜM ÜRÜNLER SİLİNECEK!')
    console.log('⚠️  Bu işlem geri alınamaz!\n')
    
    // 5 saniye bekle (manuel onay için)
    console.log('⏳ 5 saniye içinde iptal etmek için Ctrl+C basın...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Ürünleri sil
    console.log('\n🗑️  Ürünler siliniyor...')
    const result = await db.collection('menu').deleteMany({})
    
    console.log(`\n✅ ${result.deletedCount} ürün başarıyla silindi!`)
    console.log('✨ Menu collection temiz!')
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n👋 MongoDB bağlantısı kapatıldı')
  }
}

// Script'i çalıştır
cleanupProducts()
  .then(() => {
    console.log('\n🎉 İşlem tamamlandı!')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })