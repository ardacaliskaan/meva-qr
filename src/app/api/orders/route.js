// src/app/api/orders/route.js - Session Güvenliği Eklenmiş Versiyon

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { 
  validateOrder, 
  createOrder, 
  updateOrder,
  buildOrderFilter,
  buildOrderSort,
  calculateOrderStats,
  getKitchenOrders,
  getOrderTrends,
  getTablePerformance,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  getNextStatuses,
  getOrderDuration
} from '@/lib/models/order'

// 🔐 YENİ: Session Security Imports
import { validateSession, registerDevice, updateSessionActivity } from '@/lib/security/sessionValidator'
import { checkRateLimit, updateRateLimitStats } from '@/lib/security/rateLimiter'
import { detectBotPattern, checkDuplicateOrder } from '@/lib/security/botDetector'

// GET - Orders listesi (masa bazlı gruplandırma ile)
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeStats = searchParams.get('stats') === 'true'
    const kitchenView = searchParams.get('kitchenView') === 'true'
    const analytics = searchParams.get('analytics') === 'true'
    const groupByTable = searchParams.get('groupByTable') !== 'false' // Default true
    
    // Build filter
    const filter = buildOrderFilter({
      status: searchParams.get('status'),
      statuses: searchParams.get('statuses')?.split(','),
      tableNumber: searchParams.get('tableNumber'),
      tableId: searchParams.get('tableId'),
      orderType: searchParams.get('orderType'),
      priority: searchParams.get('priority'),
      paymentStatus: searchParams.get('paymentStatus'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      today: searchParams.get('today'),
      assignedStaff: searchParams.get('assignedStaff'),
      minAmount: searchParams.get('minAmount'),
      maxAmount: searchParams.get('maxAmount'),
      search: searchParams.get('search')
    })
    const excludeCompleted = searchParams.get('excludeCompleted') === 'true'
if (excludeCompleted) {
  filter.status = { 
    $nin: ['completed', 'cancelled'] 
  }
}
    // Build sort
    const sort = buildOrderSort(sortBy, sortOrder)
    
    console.log('Orders filter:', filter) // Debug
    console.log('Orders sort:', sort) // Debug
    
    // Kitchen view has different logic
    if (kitchenView) {
      const kitchenOrders = await db.collection('orders')
        .find({
          status: { $in: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PREPARING, ORDER_STATUSES.READY] },
          ...filter
        })
        .sort({ priority: -1, createdAt: 1 })
        .toArray()
      
      const formattedOrders = kitchenOrders.map(order => ({
        ...order,
        id: order._id.toString(),
        _id: undefined,
        duration: getOrderDuration(order)
      }))
      
      return NextResponse.json({
        success: true,
        orders: formattedOrders,
        view: 'kitchen',
        total: formattedOrders.length
      })
    }
    
    // Get all orders (without pagination for grouping)
    const allOrders = await db.collection('orders')
      .find(filter)
      .sort(sort)
      .toArray()
    
    // Format orders
    const formattedOrders = allOrders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined,
      duration: getOrderDuration(order)
    }))
    
    let response = {
      success: true,
      orders: formattedOrders,
      pagination: {
        total: formattedOrders.length,
        page: 1,
        limit: formattedOrders.length,
        pages: 1
      }
    }
    
    // 🔥 MASA BAZLI GRUPLAMA - YENİ ÖZELLİK!
    if (groupByTable) {
      const tableGroups = groupOrdersByTable(formattedOrders)
      response.tableGroups = tableGroups
      response.orders = tableGroups // Ana liste olarak masa gruplarını döndür
      response.originalOrders = formattedOrders // Orijinal siparişleri de sakla
      
      console.log(`📊 Grouped ${formattedOrders.length} orders into ${tableGroups.length} table groups`)
    }
    
    // Include statistics
    if (includeStats) {
      response.statistics = calculateOrderStats(formattedOrders)
    }
    
    // Include analytics
    if (analytics) {
      const allOrdersForAnalytics = await db.collection('orders')
        .find({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }) // Last 30 days
        .toArray()
      
      const formattedAllOrders = allOrdersForAnalytics.map(order => ({
        ...order,
        id: order._id.toString()
      }))
      
      response.analytics = {
        trends: getOrderTrends(formattedAllOrders, 7),
        tablePerformance: getTablePerformance(formattedAllOrders),
        statusDistribution: calculateOrderStats(formattedAllOrders)
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Siparişler alınamadı' },
      { status: 500 }
    )
  }
}

// 🍽️ MASA BAZLI GRUPLAMA FONKSİYONU
function groupOrdersByTable(orders) {
  const tableMap = new Map()
  
  orders.forEach(order => {
    const tableKey = order.tableNumber || order.tableId || 'unknown'
    
    if (!tableMap.has(tableKey)) {
      tableMap.set(tableKey, {
        tableNumber: order.tableNumber,
        tableId: order.tableId,
        orders: [],
        totalAmount: 0,
        itemCount: 0,
        customerCount: 0, // Kaç farklı sipariş (kişi)
        status: 'pending', // Genel masa durumu
        createdAt: order.createdAt, // İlk sipariş zamanı
        lastOrderAt: order.createdAt, // Son sipariş zamanı
        estimatedTime: 0,
        priority: 'normal',
        assignedStaff: order.assignedStaff,
        allStatuses: [],
        customerNotes: []
      })
    }
    
    const tableGroup = tableMap.get(tableKey)
    
    // Siparişi gruba ekle
    tableGroup.orders.push(order)
    tableGroup.totalAmount += order.totalAmount || 0
    tableGroup.itemCount += order.items?.length || 0
    tableGroup.customerCount += 1
    
    // En son sipariş zamanını güncelle
    if (new Date(order.createdAt) > new Date(tableGroup.lastOrderAt)) {
      tableGroup.lastOrderAt = order.createdAt
    }
    
    // En eski sipariş zamanını güncelle
    if (new Date(order.createdAt) < new Date(tableGroup.createdAt)) {
      tableGroup.createdAt = order.createdAt
    }
    
    // Durum prioritesi belirleme
    const statusPriority = {
      'pending': 1,
      'confirmed': 2, 
      'preparing': 3,
      'ready': 4,
      'delivered': 5,
      'completed': 6,
      'cancelled': 0
    }
    
    const currentPriority = statusPriority[tableGroup.status] || 0
    const orderPriority = statusPriority[order.status] || 0
    
    // En yüksek öncelikli durumu masa durumu yap
    if (orderPriority > currentPriority) {
      tableGroup.status = order.status
    }
    
    // Tüm durumları topla
    if (!tableGroup.allStatuses.includes(order.status)) {
      tableGroup.allStatuses.push(order.status)
    }
    
    // Tahmini süreyi güncelle (en uzun süre)
    if (order.estimatedTime > tableGroup.estimatedTime) {
      tableGroup.estimatedTime = order.estimatedTime
    }
    
    // Öncelik seviyesini güncelle
    const priorityLevels = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 }
    if ((priorityLevels[order.priority] || 2) > (priorityLevels[tableGroup.priority] || 2)) {
      tableGroup.priority = order.priority
    }
    
    // Müşteri notlarını topla
    if (order.customerNotes && !tableGroup.customerNotes.includes(order.customerNotes)) {
      tableGroup.customerNotes.push(order.customerNotes)
    }
  })
  
  // Map'i array'e çevir ve sırala
  const tableGroups = Array.from(tableMap.values()).map(group => ({
    ...group,
    id: `table-${group.tableNumber}-group`, // Unique ID
    orderNumber: `Masa ${group.tableNumber}`, // Display name
    isTableGroup: true, // Bu bir masa grubu olduğunu belirt
    customerNotes: group.customerNotes.join(' | '), // Notları birleştir
    // Masa için özet istatistikler
    summary: {
      pendingCount: group.allStatuses.filter(s => s === 'pending').length,
      preparingCount: group.allStatuses.filter(s => s === 'preparing').length,
      readyCount: group.allStatuses.filter(s => s === 'ready').length,
      completedCount: group.allStatuses.filter(s => s === 'completed').length,
      cancelledCount: group.allStatuses.filter(s => s === 'cancelled').length
    }
  }))
  
  // En son sipariş zamanına göre sırala
  return tableGroups.sort((a, b) => new Date(b.lastOrderAt) - new Date(a.lastOrderAt))
}

// POST - Yeni sipariş oluştur (🔐 SESSION GÜVENLİĞİ EKLENDİ)
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    console.log('📦 Received order data:', JSON.stringify(data, null, 2)) // Debug
    
    // ============================================
    // 🔐 SESSION GÜVENLİK KONTROLLERI (YENİ!)
    // ============================================
    
    // Session ID var mı?
    if (data.sessionId) {
      console.log('🔐 Session security enabled for order')
      
      // 1️⃣ SESSION VALIDATION
      const sessionValidation = await validateSession(data.sessionId, db)
      
      if (!sessionValidation.valid) {
        console.log('❌ Session validation failed:', sessionValidation.error)
        return NextResponse.json({
          success: false,
          error: sessionValidation.error,
          code: sessionValidation.code,
          action: 'RESCAN_QR'
        }, { status: 401 })
      }
      
      const session = sessionValidation.session
      console.log('✅ Session validated:', session.sessionId)
      
      // 2️⃣ DEVICE REGISTRATION/UPDATE
      if (data.deviceFingerprint) {
        const deviceResult = await registerDevice(
          data.sessionId,
          {
            fingerprint: data.deviceFingerprint,
            ipAddress: request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            deviceInfo: data.deviceInfo || {}
          },
          db
        )
        
        console.log('📱 Device registered:', deviceResult.message)
      }
      
      // 3️⃣ RATE LIMITING
      const rateLimitCheck = await checkRateLimit(session, db)
      
      if (!rateLimitCheck.allowed) {
        console.log('🚫 Rate limit exceeded:', rateLimitCheck.reason)
        return NextResponse.json({
          success: false,
          error: rateLimitCheck.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitCheck.retryAfter
        }, { status: 429 })
      }
      
      console.log('✅ Rate limit check passed')
      
      // 4️⃣ BOT DETECTION
      const botCheck = await detectBotPattern(session, data, db)
      
      if (botCheck.isBot && botCheck.action === 'BLOCK') {
        console.log('🤖 Bot detected - BLOCKING:', botCheck.reason)
        
        // Session'ı şüpheli olarak işaretle
        await db.collection('sessions').updateOne(
          { sessionId: data.sessionId },
          {
            $set: {
              'flags.isSuspicious': true,
              'flags.autoFlagged': true,
              'flags.flaggedAt': new Date()
            },
            $addToSet: {
              'flags.reasons': 'BOT_DETECTED'
            }
          }
        )
        
        return NextResponse.json({
          success: false,
          error: botCheck.message,
          code: 'BOT_DETECTED',
          action: 'WAIT',
          waitTime: 10
        }, { status: 429 })
      }
      
      if (botCheck.isBot && botCheck.action === 'WAIT') {
        console.log('⚠️ Bot suspected - SLOWING DOWN:', botCheck.reason)
        return NextResponse.json({
          success: false,
          error: botCheck.message || 'Lütfen 10 saniye bekleyin',
          code: 'SLOW_DOWN',
          waitTime: botCheck.waitTime || 10
        }, { status: 429 })
      }
      
      console.log('✅ Bot detection passed')
      
      // 5️⃣ DUPLICATE CHECK
      const duplicateCheck = await checkDuplicateOrder(data, data.sessionId, db)
      
      if (duplicateCheck.isDuplicate && !data.confirmed) {
        console.log('⚠️ Duplicate order detected')
        return NextResponse.json({
          success: false,
          error: duplicateCheck.message,
          code: 'DUPLICATE_SUSPECTED',
          action: 'CONFIRM',
          requireConfirmation: true
        }, { status: 400 })
      }
      
      console.log('✅ All security checks passed')
    } else {
      console.log('ℹ️ No session ID - backward compatible mode')
    }
    
    // ============================================
    // NORMAL SİPARİŞ İŞLEMLERİ (MEVCUT KOD)
    // ============================================
    
    // Validation
    const errors = validateOrder(data)
    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors) // Debug
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Table kontrolü (eğer tableId verilmişse)
    if (data.tableId) {
      // tableId ObjectId formatında mı kontrol et
      let tableQuery = {}
      
      if (data.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(data.tableId)) {
        // ObjectId formatında
        tableQuery = { _id: new ObjectId(data.tableId) }
      } else {
        // Masa numarası formatında (string veya number)
  tableQuery = { number: data.tableId.toString() }  // ✅ DOĞRU
      }
      
      console.log('Table query:', tableQuery) // Debug
      
      const tableExists = await db.collection('tables')
        .findOne(tableQuery)
      
      console.log('Table exists:', tableExists) // Debug
      
      if (!tableExists) {
        return NextResponse.json(
          { success: false, error: 'Masa bulunamadı' },
          { status: 400 }
        )
      }
    }
    
    // Menu items kontrolü
    const menuItemIds = data.items.map(item => item.menuItemId)
    console.log('🍕 Menu item IDs:', menuItemIds) // Debug
    
    // ObjectId formatını kontrol et
    const validObjectIds = menuItemIds.filter(id => 
      id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)
    )
    
    console.log('✅ Valid ObjectIds:', validObjectIds) // Debug
    
    if (validObjectIds.length !== menuItemIds.length) {
      console.log('❌ Invalid menu item IDs found') // Debug
      return NextResponse.json(
        { success: false, error: 'Geçersiz ürün ID\'leri bulundu' },
        { status: 400 }
      )
    }
    
    const validMenuItems = await db.collection('menu')
      .find({ 
        _id: { $in: validObjectIds.map(id => new ObjectId(id)) },
        available: { $ne: false }
      })
      .toArray()
    
    console.log('🍕 Found menu items:', validMenuItems.length) // Debug
    
    if (validMenuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Bazı ürünler bulunamadı veya müsait değil' },
        { status: 400 }
      )
    }
    
    // Create order
    const order = createOrder(data)
    
    // 🔐 YENİ: Session bilgilerini order'a ekle
    if (data.sessionId) {
      order.sessionId = data.sessionId
      order.deviceFingerprint = data.deviceFingerprint || null
      order.security = {
        wasAutoApproved: true,
        requiresApproval: false,
        flags: []
      }
    }
    
    // Estimated time calculation based on items
    let totalEstimatedTime = 0
    data.items.forEach(item => {
      const menuItem = validMenuItems.find(mi => mi._id.toString() === item.menuItemId)
      if (menuItem && menuItem.cookingTime) {
        totalEstimatedTime += menuItem.cookingTime * item.quantity
      }
    })
    
    if (totalEstimatedTime > 0) {
      order.estimatedTime = Math.ceil(totalEstimatedTime / data.items.length) // Average
    }
    
    // Insert order
    const result = await db.collection('orders').insertOne(order)
    
    console.log('✅ Order created:', result.insertedId.toString())
    
    // ============================================
    // 🔐 YENİ: SESSION GÜNCELLEME
    // ============================================
    if (data.sessionId) {
      // Session istatistiklerini güncelle
      await db.collection('sessions').updateOne(
        { sessionId: data.sessionId },
        {
          $inc: {
            orderCount: 1,
            totalAmount: order.totalAmount || 0
          },
          $push: {
            orders: result.insertedId
          },
          $set: {
            lastActivity: new Date(),
            'rateLimits.lastOrderTime': new Date(),
            updatedAt: new Date()
          }
        }
      )
      
      // Device order count güncelle
      if (data.deviceFingerprint) {
        await db.collection('sessions').updateOne(
          { 
            sessionId: data.sessionId,
            'devices.fingerprint': data.deviceFingerprint
          },
          {
            $inc: {
              'devices.$.orderCount': 1
            },
            $set: {
              'devices.$.lastSeen': new Date()
            }
          }
        )
      }
      
      console.log('✅ Session updated with order info')
    }
    
    // Update table status if needed
    if (data.tableId) {
      let tableQuery = {}
      
      if (data.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(data.tableId)) {
        // ObjectId formatında
        tableQuery = { _id: new ObjectId(data.tableId) }
      } else {
        // Masa numarası formatında
tableQuery = { 
  number: { 
    $regex: new RegExp(`^${data.tableId.toString()}$`, 'i') 
  }
}      }
      
      await db.collection('tables').updateOne(
        tableQuery,
        { 
          $set: { 
            status: 'occupied',
            lastOrderAt: new Date()
          }
        }
      )
    }
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      orderNumber: order.orderNumber,
      estimatedTime: order.estimatedTime,
      message: 'Sipariş başarıyla oluşturuldu'
    })
    
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş oluşturulamadı' },
      { status: 500 }
    )
  }
}

// PUT - Sipariş güncelle (status, payment, table operations)
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, action, ...updateData } = data
    
    // 🏢 MASA KAPATMA ÖZELLİĞİ - YENİ!
    if (action === 'closeTable') {
      const { tableNumber } = updateData
      
      if (!tableNumber) {
        return NextResponse.json(
          { success: false, error: 'Masa numarası gerekli' },
          { status: 400 }
        )
      }
      
      console.log(`🏢 Closing table ${tableNumber}...`) // Debug
      
      // 🔐 YENİ: Masa kapatılırken session'ı da kapat
      await db.collection('sessions').updateOne(
        { 
          tableNumber: tableNumber.toString(),
          status: 'active'
        },
        {
          $set: {
            status: 'closed',
            closedAt: new Date(),
            updatedAt: new Date()
          }
        }
      )
      
      console.log(`🔐 Session closed for table ${tableNumber}`)
      
      // O masadaki tüm aktif siparişleri bul
      const activeOrders = await db.collection('orders')
        .find({
          $or: [
            { tableNumber: tableNumber.toString() },
            { tableId: tableNumber.toString() }
          ],
          status: { 
            $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] 
          }
        })
        .toArray()
      
      console.log(`📦 Found ${activeOrders.length} active orders for table ${tableNumber}`) // Debug
      
      if (activeOrders.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Bu masada aktif sipariş bulunamadı' },
          { status: 404 }
        )
      }
      
      // Tüm aktif siparişleri 'completed' durumuna getir
      const bulkUpdateResult = await db.collection('orders').updateMany(
        {
          $or: [
            { tableNumber: tableNumber.toString() },
            { tableId: tableNumber.toString() }
          ],
          status: { 
            $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] 
          }
        },
        {
          $set: {
            status: ORDER_STATUSES.COMPLETED,
            [`timestamps.${ORDER_STATUSES.COMPLETED}`]: new Date(),
            updatedAt: new Date(),
            closedByTable: true // Masa kapatma ile tamamlandığını belirt
          }
        }
      )
      
      console.log(`✅ Updated ${bulkUpdateResult.modifiedCount} orders to completed`) // Debug
      
      // Masanın durumunu 'empty' yap
      await db.collection('tables').updateOne(
        { 
          $or: [
            { number: tableNumber.toString()  },
            { _id: tableNumber.length === 24 ? new ObjectId(tableNumber) : null }
          ].filter(Boolean)
        },
        { 
          $set: { 
            status: 'empty',
            currentSessionId: null,
            lastClosedAt: new Date()
          }
        }
      )
      
      console.log(`🏢 Table ${tableNumber} status updated to empty`) // Debug
      
      return NextResponse.json({
        success: true,
        message: `Masa ${tableNumber} başarıyla kapatıldı`,
        completedOrders: bulkUpdateResult.modifiedCount
      })
    }
    
    // Normal sipariş işlemleri için ID gerekli
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID gerekli' },
        { status: 400 }
      )
    }
    
    // Find existing order
    const existingOrder = await db.collection('orders')
      .findOne({ _id: new ObjectId(id) })
    
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    let updateFields = {}
    
    // Handle different actions
    switch (action) {
      case 'updateStatus':
        const newStatus = updateData.status
        const allowedNextStatuses = getNextStatuses(existingOrder.status)
        
        if (!allowedNextStatuses.includes(newStatus)) {
          return NextResponse.json(
            { success: false, error: `${existingOrder.status} durumundan ${newStatus} durumuna geçiş yapılamaz` },
            { status: 400 }
          )
        }
        
        updateFields = {
          status: newStatus,
          [`timestamps.${newStatus}`]: new Date(),
          updatedAt: new Date()
        }
        
        // Add staff assignment if provided
        if (updateData.assignedStaff) {
          updateFields.assignedStaff = updateData.assignedStaff
        }
        
        break
        
      case 'updatePayment':
        if (!Object.values(PAYMENT_STATUSES).includes(updateData.paymentStatus)) {
          return NextResponse.json(
            { success: false, error: 'Geçersiz ödeme durumu' },
            { status: 400 }
          )
        }
        
        updateFields = {
          paymentStatus: updateData.paymentStatus,
          updatedAt: new Date()
        }
        
        // If payment is completed, mark order as completed
        if (updateData.paymentStatus === PAYMENT_STATUSES.PAID && 
            existingOrder.status === ORDER_STATUSES.DELIVERED) {
          updateFields.status = ORDER_STATUSES.COMPLETED
          updateFields[`timestamps.${ORDER_STATUSES.COMPLETED}`] = new Date()
        }
        
        break
        
      case 'addNotes':
        updateFields = {
          customerNotes: updateData.customerNotes || existingOrder.customerNotes,
          kitchenNotes: updateData.kitchenNotes || existingOrder.kitchenNotes,
          updatedAt: new Date()
        }
        break
        
      case 'updatePriority':
        updateFields = {
          priority: updateData.priority,
          updatedAt: new Date()
        }
        break
        
      case 'assignStaff':
        updateFields = {
          assignedStaff: updateData.assignedStaff,
          updatedAt: new Date()
        }
        break

case 'updateItemStatus':
  // 🆕 HER ÜRÜN İÇİN AYRI DURUM GÜNCELLEMESİ
  const { itemIndex, itemStatus } = updateData
  
  // Validasyon
  if (itemIndex === undefined || !itemStatus) {
    return NextResponse.json(
      { success: false, error: 'Item index ve status gerekli' },
      { status: 400 }
    )
  }
  
  if (!Object.values(ORDER_STATUSES).includes(itemStatus)) {
    return NextResponse.json(
      { success: false, error: 'Geçersiz item status' },
      { status: 400 }
    )
  }
  
  console.log(`📦 Updating item ${itemIndex} to status: ${itemStatus}`) // Debug
  
  // Ürünün durumunu güncelle
  updateFields = {
    [`items.${itemIndex}.status`]: itemStatus,
    [`items.${itemIndex}.updatedAt`]: new Date(),
    updatedAt: new Date()
  }
  
  // 🔥 AKILLI DURUM GÜNCELLEMESİ
  // Tüm itemlar aynı durumda mı kontrol et
  const currentOrder = await db.collection('orders').findOne({ _id: new ObjectId(id) })
  
  if (currentOrder && currentOrder.items) {
    // Güncelleme sonrası tüm item durumlarını hesapla
    const allItemStatuses = currentOrder.items.map((item, idx) => 
      idx === itemIndex ? itemStatus : (item.status || 'pending')
    )
    
    console.log('📊 All item statuses after update:', allItemStatuses) // Debug
    
    // Tüm itemlar aynı durumdaysa, order status'ü de güncelle
    const allSame = allItemStatuses.every(s => s === itemStatus)
    
    if (allSame) {
      console.log(`✅ All items are ${itemStatus}, updating order status`) // Debug
      updateFields.status = itemStatus
      updateFields[`timestamps.${itemStatus}`] = new Date()
    } else {
      // Farklı durumlardaysa, en ileri durum ne ise o olsun
      const statusPriority = {
        'pending': 1,
        'confirmed': 2,
        'preparing': 3,
        'ready': 4,
        'delivered': 5,
        'completed': 6
      }
      
      const maxStatus = allItemStatuses.reduce((max, current) => {
        return (statusPriority[current] || 0) > (statusPriority[max] || 0) ? current : max
      }, 'pending')
      
      console.log(`⚡ Mixed statuses, setting order to: ${maxStatus}`) // Debug
      updateFields.status = maxStatus
      updateFields[`timestamps.${maxStatus}`] = new Date()
    }
  }
  
  break
        
      default:
        // Full update
        const errors = validateOrder({ ...existingOrder, ...updateData })
        if (errors.length > 0) {
          return NextResponse.json(
            { success: false, errors },
            { status: 400 }
          )
        }
        
        updateFields = updateOrder(updateData)
    }
    
    // Update order
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    // Handle table status updates
    if (updateFields.status === ORDER_STATUSES.COMPLETED && existingOrder.tableId) {
      // Check if table has any other active orders
      const activeOrdersCount = await db.collection('orders').countDocuments({
        $or: [
          { tableId: existingOrder.tableId },
          { tableNumber: existingOrder.tableId.toString() }
        ],
        status: { $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] }
      })
      
      // If no active orders, mark table as empty
      if (activeOrdersCount === 0) {
        let tableQuery = {}
        
        if (existingOrder.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(existingOrder.tableId)) {
          tableQuery = { _id: new ObjectId(existingOrder.tableId) }
        } else {
          tableQuery = { number: existingOrder.tableId.toString() }
        }
        
        await db.collection('tables').updateOne(
          tableQuery,
          { 
            $set: { 
              status: 'empty',
              currentSessionId: null
            }
          }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sipariş başarıyla güncellendi'
    })
    
  } catch (error) {
    console.error('Orders PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Sipariş iptal et
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID gerekli' },
        { status: 400 }
      )
    }
    
    // Find order
    const order = await db.collection('orders')
      .findOne({ _id: new ObjectId(id) })
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    // Check if order can be cancelled
    const cancellableStatuses = [ORDER_STATUSES.PENDING, ORDER_STATUSES.CONFIRMED]
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Bu durumda olan sipariş iptal edilemez' },
        { status: 400 }
      )
    }
    
    // Update order status to cancelled instead of deleting
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: ORDER_STATUSES.CANCELLED,
          [`timestamps.${ORDER_STATUSES.CANCELLED}`]: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş iptal edilemedi' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sipariş başarıyla iptal edildi'
    })
    
  } catch (error) {
    console.error('Orders DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş iptal edilemedi' },
      { status: 500 }
    )
  }
}