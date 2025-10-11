// src/app/api/admin/users/route.js - DEBUG VERSION

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { 
  validateUser, 
  createUser, 
  updateUser,
  buildUserFilter,
  buildUserSort,
  USER_ROLES,
  hasPermission
} from '@/lib/models/user'
import { verifyToken } from '@/lib/auth'

// GET - Kullanıcıları listele
export async function GET(request) {
  try {
    console.log('🔵 GET /api/admin/users started')
    
    // Permission check
    const authResult = await verifyToken(request)
    console.log('🔐 Auth result:', authResult.success ? 'SUCCESS' : 'FAILED')
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    console.log('👤 User:', authResult.user.username, authResult.user.role)
    
    if (!hasPermission(authResult.user.permissions, 'users.view')) {
      console.log('❌ Permission denied: users.view')
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    console.log('✅ Permission granted: users.view')
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 100 // Artırıldı
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeStats = searchParams.get('stats') === 'true'
    
    console.log('📋 Query params:', { page, limit, sortBy, sortOrder, includeStats })
    
    // Build filter
    const filter = buildUserFilter({
      role: searchParams.get('role'),
      isActive: searchParams.get('isActive'),
      search: searchParams.get('search')
    })
    
    console.log('🔍 Filter:', JSON.stringify(filter))
    
    // Build sort
    const sort = buildUserSort(sortBy, sortOrder)
    
    console.log('📊 Sort:', JSON.stringify(sort))
    
    // Calculate pagination
    const skip = (page - 1) * limit
    console.log('📄 Pagination:', { skip, limit })
    
    // Count total documents first
    const totalCount = await db.collection('users').countDocuments(filter)
    console.log('📊 Total users in DB:', totalCount)
    
    // Fetch users WITHOUT projection first to debug
    console.log('🔄 Fetching users...')
    const usersRaw = await db.collection('users')
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()
    
    console.log('📦 Raw users count:', usersRaw.length)
    console.log('📦 First user (raw):', usersRaw[0] ? {
      _id: usersRaw[0]._id,
      name: usersRaw[0].name,
      username: usersRaw[0].username,
      role: usersRaw[0].role
    } : 'NO USERS')
    
    // Remove passwords
    const users = usersRaw.map(user => {
      const { password, ...userWithoutPassword } = user
      return {
        ...userWithoutPassword,
        id: user._id.toString()
      }
    })
    
    console.log('✅ Users formatted count:', users.length)
    
    // Response data
    const responseData = {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    }
    
    // Include statistics
    if (includeStats) {
      console.log('📊 Calculating stats...')
      
      const allUsers = await db.collection('users')
        .find({}, { projection: { password: 0 } })
        .toArray()
      
      console.log('📊 All users for stats:', allUsers.length)
      
      const stats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.isActive).length,
        inactive: allUsers.filter(u => !u.isActive).length,
        byRole: {
          admin: allUsers.filter(u => u.role === USER_ROLES.ADMIN).length,
          waiter: allUsers.filter(u => u.role === USER_ROLES.WAITER).length,
          kitchen: allUsers.filter(u => u.role === USER_ROLES.KITCHEN).length,
          cashier: allUsers.filter(u => u.role === USER_ROLES.CASHIER).length
        },
        recentLogins: allUsers.filter(u => {
          if (!u.metadata?.lastLogin) return false
          const lastLogin = new Date(u.metadata.lastLogin)
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return lastLogin > dayAgo
        }).length
      }
      
      console.log('📊 Stats calculated:', stats)
      
      responseData.statistics = stats
    }
    
    console.log('✅ Response ready:', {
      usersCount: responseData.users.length,
      statsTotal: responseData.statistics?.total
    })
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('❌ Users GET error:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Kullanıcılar alınamadı: ' + error.message },
      { status: 500 }
    )
  }
}

// POST - Yeni kullanıcı oluştur
export async function POST(request) {
  try {
    console.log('🟢 POST /api/admin/users started')
    
    // Permission check
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, 'users.create')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı oluşturma yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    console.log('📝 Creating user:', data.username, data.role)
    
    // Validation
    const errors = validateUser(data)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0] },
        { status: 400 }
      )
    }
    
    // Username unique kontrolü
    const existingUser = await db.collection('users')
      .findOne({ username: data.username.trim().toLowerCase() })
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      )
    }
    
    // Email unique kontrolü (eğer verilmişse)
    if (data.email) {
      const existingEmail = await db.collection('users')
        .findOne({ email: data.email.trim().toLowerCase() })
      
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Bu email zaten kullanılıyor' },
          { status: 400 }
        )
      }
    }
    
    // Sadece admin yeni admin oluşturabilir
    if (data.role === USER_ROLES.ADMIN && authResult.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Sadece yöneticiler yeni yönetici oluşturabilir' },
        { status: 403 }
      )
    }
    
    // Create user
    const userData = await createUser({
      ...data,
      createdBy: authResult.user.id
    })
    
    const result = await db.collection('users').insertOne(userData)
    
    console.log('✅ User created:', result.insertedId.toString())
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: `${data.role === USER_ROLES.ADMIN ? 'Yönetici' : 'Kullanıcı'} başarıyla oluşturuldu`
    })
    
  } catch (error) {
    console.error('❌ Users POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Kullanıcı oluşturulamadı: ' + error.message },
      { status: 500 }
    )
  }
}

// PUT - Kullanıcı güncelle
export async function PUT(request) {
  try {
    console.log('🟡 PUT /api/admin/users started')
    
    // Permission check
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, 'users.update')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı güncelleme yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, ...updateData } = data
    
    console.log('📝 Updating user:', id)
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      )
    }
    
    // Validation
    const errors = validateUser(updateData, true) // isUpdate = true
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0] },
        { status: 400 }
      )
    }
    
    // Mevcut kullanıcıyı kontrol et
    const existingUser = await db.collection('users')
      .findOne({ _id: new ObjectId(id) })
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }
    
    // Update user
    const updateFields = updateUser(updateData)
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }
    
    console.log('✅ User updated:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi'
    })
    
  } catch (error) {
    console.error('❌ Users PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Kullanıcı güncellenemedi: ' + error.message },
      { status: 500 }
    )
  }
}

// DELETE - Kullanıcı sil (soft delete)
export async function DELETE(request) {
  try {
    console.log('🔴 DELETE /api/admin/users started')
    
    // Permission check
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(authResult.user.permissions, 'users.delete')) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı silme yetkiniz bulunmuyor' },
        { status: 403 }
      )
    }
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log('🗑️ Deleting user:', id)
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await db.collection('users')
      .findOne({ _id: new ObjectId(id) })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }
    
    // Soft delete (isActive = false)
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: authResult.user.id
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı silinemedi' },
        { status: 500 }
      )
    }
    
    console.log('✅ User soft deleted:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    })
    
  } catch (error) {
    console.error('❌ Users DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Kullanıcı silinemedi: ' + error.message },
      { status: 500 }
    )
  }
}