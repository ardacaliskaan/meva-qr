// scripts/seed.js - Demo Kullanıcılar Eklendi

const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-qr'

// 🆕 Demo Kullanıcılar
const demoUsers = [
  {
    name: 'Restaurant Admin',
    username: 'admin',
    email: 'admin@restaurant.com',
    password: bcrypt.hashSync('admin123', 12),
    role: 'admin',
    phone: '+90 555 000 00 01',
    avatar: null,
    isActive: true,
    permissions: [
      'users.*',
      'orders.*',
      'menu.*',
      'categories.*',
      'ingredients.*',
      'tables.*',
      'reports.*',
      'settings.*'
    ],
    metadata: {
      lastLogin: null,
      loginCount: 0,
      createdBy: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Ahmet Yılmaz',
    username: 'ahmet_y',
    email: 'ahmet@restaurant.com',
    password: bcrypt.hashSync('garson123', 12),
    role: 'waiter',
    phone: '+90 555 111 11 11',
    avatar: null,
    isActive: true,
    permissions: [
      'orders.view',
      'orders.update',
      'orders.create',
      'tables.view',
      'tables.close',
      'menu.view'
    ],
    metadata: {
      lastLogin: null,
      loginCount: 0,
      createdBy: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mehmet Demir',
    username: 'mehmet_d',
    email: 'mehmet@restaurant.com',
    password: bcrypt.hashSync('garson123', 12),
    role: 'waiter',
    phone: '+90 555 222 22 22',
    avatar: null,
    isActive: true,
    permissions: [
      'orders.view',
      'orders.update',
      'orders.create',
      'tables.view',
      'tables.close',
      'menu.view'
    ],
    metadata: {
      lastLogin: null,
      loginCount: 0,
      createdBy: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Ali Şen',
    username: 'ali_s',
    email: 'ali@restaurant.com',
    password: bcrypt.hashSync('mutfak123', 12),
    role: 'kitchen',
    phone: '+90 555 444 44 44',
    avatar: null,
    isActive: true,
    permissions: [
      'orders.view',
      'orders.update',
      'menu.view'
    ],
    metadata: {
      lastLogin: null,
      loginCount: 0,
      createdBy: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Zeynep Çelik',
    username: 'zeynep_c',
    email: null,
    password: bcrypt.hashSync('kasiyer123', 12),
    role: 'cashier',
    phone: '+90 555 555 55 55',
    avatar: null,
    isActive: false, // Pasif kullanıcı örneği
    permissions: [
      'orders.view',
      'orders.payment',
      'reports.view'
    ],
    metadata: {
      lastLogin: null,
      loginCount: 0,
      createdBy: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

async function seedDatabase() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ MongoDB bağlantısı başarılı!')
    
    const db = client.db('restaurant-qr')
    
    // 🆕 Users collection'ı seed et
    console.log('\n📝 Kullanıcılar seed ediliyor...')
    await db.collection('users').deleteMany({})
    const usersResult = await db.collection('users').insertMany(demoUsers)
    console.log(`✅ ${usersResult.insertedCount} kullanıcı eklendi`)
    
    console.log('\n🔐 Demo Giriş Bilgileri:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👨‍💼 Admin:')
    console.log('   Kullanıcı Adı: admin')
    console.log('   Şifre: admin123')
    console.log('')
    console.log('👨‍🍳 Garsonlar:')
    console.log('   Kullanıcı Adı: ahmet_y / Şifre: garson123')
    console.log('   Kullanıcı Adı: mehmet_d / Şifre: garson123')
    console.log('')
    console.log('🍳 Mutfak:')
    console.log('   Kullanıcı Adı: ali_s / Şifre: mutfak123')
    console.log('')
    console.log('💰 Kasiyer (Pasif):')
    console.log('   Kullanıcı Adı: zeynep_c / Şifre: kasiyer123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('✨ Seed işlemi tamamlandı!')
    
  } catch (error) {
    console.error('❌ Seed hatası:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// Script'i çalıştır
seedDatabase()