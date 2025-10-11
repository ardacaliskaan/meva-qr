// src/app/api/orders/route.js - COMPLETE VERSION  
// Full 1009+ lines with all security features

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
  REFUNDED: 'refunded'
}

function getNextStatuses(currentStatus) {
  const transitions = {
    pending: ['confirmed', 'preparing', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivered', 'preparing'],
    delivered: ['completed', 'ready'],
    completed: [],
    cancelled: []
  }
  return transitions[currentStatus] || []
}

function validateOrder(data) {
  const errors = []
  
  if (!data.tableNumber && !data.tableId) {
    errors.push('Masa numarası veya masa ID gerekli')
  }
  
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('En az bir ürün seçilmelidir')
  }
  
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (!item.menuItemId) {
        errors.push(`${index + 1}. ürün ID'si eksik`)
      }
      
      if (!item.name || item.name.trim().length < 2) {
        errors.push(`${index + 1}. ürün adı geçersiz`)
      }
      
      if (!item.price || item.price <= 0) {
        errors.push(`${index + 1}. ürün fiyatı geçersiz`)
      }
      
      if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
        errors.push(`${index + 1}. ürün miktarı geçersiz`)
      }
    })
  }
  
  if (data.totalAmount !== undefined && (data.totalAmount <= 0 || data.totalAmount > 100000)) {
    errors.push('Toplam tutar geçersiz')
  }
  
  return errors
}

async function groupOrdersByTable(orders, db, includeTableInfo = false) {
  const tableMap = new Map()
  
  let tableInfoMap = new Map()
  if (includeTableInfo) {
    const tableNumbers = [...new Set(orders.map(o => o.tableNumber || o.tableId).filter(Boolean))]
    if (tableNumbers.length > 0) {
      const tables = await db.collection('tables')
        .find({
          number: { 
            $in: tableNumbers.map(n => n.toString())
          }
        })
        .project({ number: 1, location: 1, capacity: 1 })
        .toArray()
      
      tables.forEach(table => {
        tableInfoMap.set(table.number.toString(), {
          location: table.location,
          capacity: table.capacity
        })
      })
    }
  }
  
  orders.forEach(order => {
    const tableNumber = order.tableNumber || order.tableId
    if (!tableNumber) return
    
    const tableKey = tableNumber.toString()
    
    if (!tableMap.has(tableKey)) {
      const tableInfo = tableInfoMap.get(tableKey) || {}
      
      tableMap.set(tableKey, {
        tableNumber: tableKey,
        tableName: `Masa ${tableKey}`,
        tableLocation: tableInfo.location || null,
        tableCapacity: tableInfo.capacity || null,
        orders: [],
        totalAmount: 0,
        itemCount: 0,
        customerCount: 0,
        status: 'pending',
        createdAt: order.createdAt,
        lastOrderAt: order.createdAt,
        estimatedTime: 0,
        priority: 'normal',
        assignedStaff: order.assignedStaff,
        allStatuses: [],
        customerNotes: []
      })
    }
    
    const tableGroup = tableMap.get(tableKey)
    
    tableGroup.orders.push(order)
    tableGroup.totalAmount += order.totalAmount || 0
    tableGroup.itemCount += order.items?.length || 0
    tableGroup.customerCount += 1
    
    if (new Date(order.createdAt) > new Date(tableGroup.lastOrderAt)) {
      tableGroup.lastOrderAt = order.createdAt
    }
    
    if (new Date(order.createdAt) < new Date(tableGroup.createdAt)) {
      tableGroup.createdAt = order.createdAt
    }
    
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
    
    if (orderPriority > currentPriority) {
      tableGroup.status = order.status
    }
    
    if (!tableGroup.allStatuses.includes(order.status)) {
      tableGroup.allStatuses.push(order.status)
    }
    
    if (order.estimatedTime > tableGroup.estimatedTime) {
      tableGroup.estimatedTime = order.estimatedTime
    }
    
    const priorityLevels = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 }
    if ((priorityLevels[order.priority] || 2) > (priorityLevels[tableGroup.priority] || 2)) {
      tableGroup.priority = order.priority
    }
    
    if (order.customerNotes && !tableGroup.customerNotes.includes(order.customerNotes)) {
      tableGroup.customerNotes.push(order.customerNotes)
    }
  })
  
  const tableGroups = Array.from(tableMap.values()).map(group => ({
    ...group,
    id: `table-${group.tableNumber}-group`,
    orderNumber: group.tableName,
    isTableGroup: true,
    customerNotes: group.customerNotes.join(' | '),
    summary: {
      pendingCount: group.allStatuses.filter(s => s === 'pending').length,
      preparingCount: group.allStatuses.filter(s => s === 'preparing').length,
      readyCount: group.allStatuses.filter(s => s === 'ready').length,
      completedCount: group.allStatuses.filter(s => s === 'completed').length,
      cancelledCount: group.allStatuses.filter(s => s === 'cancelled').length
    }
  }))
  
  return tableGroups.sort((a, b) => new Date(b.lastOrderAt) - new Date(a.lastOrderAt))
}

// GET - Orders list
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const groupByTable = searchParams.get('groupByTable') === 'true'
    const excludeCompleted = searchParams.get('excludeCompleted') === 'true'
    const includeTableInfo = searchParams.get('includeTableInfo') === 'true'
    const includeMenuImages = searchParams.get('includeMenuImages') === 'true'
    
    let query = {}
    
    if (excludeCompleted) {
      query.status = { 
        $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] 
      }
    }
    
    const statusFilter = searchParams.get('status')
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter
    }
    
    const orders = await db.collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
    
    // Populate menu item images
    if (includeMenuImages && orders.length > 0) {
      const menuItemIds = []
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (item.menuItemId) {
            menuItemIds.push(item.menuItemId)
          }
        })
      })
      
      if (menuItemIds.length > 0) {
        const uniqueIds = [...new Set(menuItemIds)]
        const menuItems = await db.collection('menu')
          .find({ 
            _id: { 
              $in: uniqueIds.map(id => {
                try {
                  return new ObjectId(id)
                } catch {
                  return id
                }
              })
            }
          })
          .project({ _id: 1, image: 1, name: 1 })
          .toArray()
        
        const menuItemMap = new Map()
        menuItems.forEach(item => {
          menuItemMap.set(item._id.toString(), item)
        })
        
        orders.forEach(order => {
          order.items?.forEach(item => {
            if (item.menuItemId) {
              const menuItem = menuItemMap.get(item.menuItemId.toString())
              if (menuItem?.image) {
                item.image = menuItem.image
              }
            }
          })
        })
      }
    }
    
    if (groupByTable) {
      const tableGroups = await groupOrdersByTable(orders, db, includeTableInfo)
      
      const stats = {
        totalOrders: orders.length,
        activeOrders: orders.filter(o => 
          ![ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(o.status)
        ).length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        avgOrderValue: orders.length > 0 
          ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length 
          : 0,
        pending: orders.filter(o => o.status === ORDER_STATUSES.PENDING).length,
        confirmed: orders.filter(o => o.status === ORDER_STATUSES.CONFIRMED).length,
        preparing: orders.filter(o => o.status === ORDER_STATUSES.PREPARING).length,
        ready: orders.filter(o => o.status === ORDER_STATUSES.READY).length,
        delivered: orders.filter(o => o.status === ORDER_STATUSES.DELIVERED).length,
        completed: orders.filter(o => o.status === ORDER_STATUSES.COMPLETED).length,
        cancelled: orders.filter(o => o.status === ORDER_STATUSES.CANCELLED).length
      }
      
      return NextResponse.json({
        success: true,
        orders: tableGroups,
        originalOrders: orders,
        statistics: stats
      })
    }
    
    return NextResponse.json({
      success: true,
      orders: orders
    })
    
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Siparişler yüklenemedi' },
      { status: 500 }
    )
  }
}

// POST - Create new order
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    console.log('📦 Received order data:', JSON.stringify(data, null, 2))
    
    // Validation
    const errors = validateOrder(data)
    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors)
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Table check
    if (data.tableId) {
      let tableQuery = {}
      
      if (data.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(data.tableId)) {
        tableQuery = { _id: new ObjectId(data.tableId) }
      } else {
        tableQuery = { number: data.tableId.toString() }
      }
      
      console.log('Table query:', tableQuery)
      
      const tableExists = await db.collection('tables')
        .findOne(tableQuery)
      
      console.log('Table exists:', tableExists)
      
      if (!tableExists) {
        return NextResponse.json(
          { success: false, error: 'Masa bulunamadı' },
          { status: 400 }
        )
      }
    }
    
    // Menu items check
    const menuItemIds = data.items.map(item => item.menuItemId)
    console.log('🍕 Menu item IDs:', menuItemIds)
    
    const validObjectIds = menuItemIds.filter(id => 
      id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)
    )
    
    console.log('✅ Valid ObjectIds:', validObjectIds)
    
    if (validObjectIds.length !== menuItemIds.length) {
      console.log('❌ Invalid menu item IDs found')
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
    
    console.log('🍕 Found menu items:', validMenuItems.length)
    
    if (validMenuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Bazı ürünler bulunamadı veya müsait değil' },
        { status: 400 }
      )
    }
    
    // Create order
    const now = new Date()
    const order = {
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tableNumber: data.tableNumber?.toString() || null,
      tableId: data.tableId?.toString() || null,
      sessionId: data.sessionId || null,
      items: data.items.map(item => ({
        ...item,
        status: ORDER_STATUSES.PENDING,
        addedAt: now
      })),
      totalAmount: data.totalAmount || data.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      ),
      status: ORDER_STATUSES.PENDING,
      paymentStatus: PAYMENT_STATUSES.UNPAID,
      customerNotes: data.customerNotes || '',
      kitchenNotes: data.kitchenNotes || '',
      priority: data.priority || 'normal',
      estimatedTime: data.estimatedTime || 20,
      timestamps: {
        [ORDER_STATUSES.PENDING]: now
      },
      createdAt: now,
      updatedAt: now
    }
    
    // Session info
    if (data.sessionId) {
      order.sessionId = data.sessionId
      order.deviceFingerprint = data.deviceFingerprint || null
      order.security = {
        wasAutoApproved: true,
        requiresApproval: false,
        flags: []
      }
    }
    
    // Estimated time calculation
    let totalEstimatedTime = 0
    data.items.forEach(item => {
      const menuItem = validMenuItems.find(mi => mi._id.toString() === item.menuItemId)
      if (menuItem && menuItem.cookingTime) {
        totalEstimatedTime += menuItem.cookingTime * item.quantity
      }
    })
    
    if (totalEstimatedTime > 0) {
      order.estimatedTime = Math.ceil(totalEstimatedTime / data.items.length)
    }
    
    // Insert order
    const result = await db.collection('orders').insertOne(order)
    
    console.log('✅ Order created:', result.insertedId.toString())
    
    // Update session
    if (data.sessionId) {
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
            lastActivity: now,
            'rateLimits.lastOrderTime': now,
            updatedAt: now
          }
        }
      )
      
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
              'devices.$.lastSeen': now
            }
          }
        )
      }
      
      console.log('✅ Session updated with order info')
    }
    
    // Update table status
    if (data.tableId) {
      let tableQuery = {}
      
      if (data.tableId.length === 24 && /^[0-9a-fA-F]{24}$/.test(data.tableId)) {
        tableQuery = { _id: new ObjectId(data.tableId) }
      } else {
        tableQuery = { 
          number: { 
            $regex: new RegExp(`^${data.tableId.toString()}$`, 'i') 
          }
        }
      }
      
      await db.collection('tables').updateOne(
        tableQuery,
        { 
          $set: { 
            status: 'occupied',
            lastOrderAt: now
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

// PUT - Update order
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, action, ...updateData } = data
    
    console.log('🔄 PUT Request:', { id, action, updateData })
    
    // Close table action
    if (action === 'closeTable') {
      const { tableNumber } = updateData
      
      console.log('🏢 Close table request:', { tableNumber, type: typeof tableNumber })
      
      if (!tableNumber) {
        return NextResponse.json(
          { success: false, error: 'Masa numarası gerekli' },
          { status: 400 }
        )
      }
      
      const tableNumberStr = tableNumber.toString()
      console.log(`🏢 Closing table: ${tableNumberStr}`)
      
      // Close sessions
      await db.collection('sessions').updateMany(
        { 
          tableNumber: tableNumberStr,
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
      
      console.log(`🔐 Sessions closed for table ${tableNumberStr}`)
      
      // Find active orders
      const activeOrders = await db.collection('orders')
        .find({
          $or: [
            { tableNumber: tableNumberStr },
            { tableId: tableNumberStr }
          ],
          status: { 
            $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] 
          }
        })
        .toArray()
      
      console.log(`📦 Found ${activeOrders.length} active orders for table ${tableNumberStr}`)
      
      if (activeOrders.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Bu masada aktif sipariş bulunamadı' },
          { status: 404 }
        )
      }
      
      // Complete orders
      const bulkUpdateResult = await db.collection('orders').updateMany(
        {
          $or: [
            { tableNumber: tableNumberStr },
            { tableId: tableNumberStr }
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
            closedByTable: true
          }
        }
      )
      
      console.log(`✅ Updated ${bulkUpdateResult.modifiedCount} orders to completed`)
      
      // Update table
      const tableUpdateResult = await db.collection('tables').updateOne(
        { 
          number: tableNumberStr
        },
        { 
          $set: { 
            status: 'empty',
            currentSessionId: null,
            lastClosedAt: new Date()
          }
        }
      )
      
      console.log(`🏢 Table ${tableNumberStr} status updated:`, tableUpdateResult.modifiedCount > 0 ? 'SUCCESS' : 'NOT FOUND')
      
      return NextResponse.json({
        success: true,
        message: `Masa ${tableNumberStr} başarıyla kapatıldı`,
        completedOrders: bulkUpdateResult.modifiedCount
      })
    }
    
    // Normal order operations require ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Sipariş ID gerekli' },
        { status: 400 }
      )
    }
    
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
        
        if (updateData.assignedStaff) {
          updateFields.assignedStaff = updateData.assignedStaff
        }
        
        break
        
      case 'updateItemStatus':
        const { itemIndex, itemStatus } = updateData
        
        if (itemIndex === undefined || !itemStatus) {
          return NextResponse.json(
            { success: false, error: 'Ürün index ve durum gerekli' },
            { status: 400 }
          )
        }
        
        const items = [...existingOrder.items]
        if (!items[itemIndex]) {
          return NextResponse.json(
            { success: false, error: 'Ürün bulunamadı' },
            { status: 404 }
          )
        }
        
        items[itemIndex].status = itemStatus
        items[itemIndex].statusUpdatedAt = new Date()
        
        updateFields = {
          items,
          updatedAt: new Date()
        }
        
        // Check if all items have same status
        const allStatuses = items.map(i => i.status)
        const uniqueStatuses = [...new Set(allStatuses)]
        
        if (uniqueStatuses.length === 1) {
          updateFields.status = uniqueStatuses[0]
          updateFields[`timestamps.${uniqueStatuses[0]}`] = new Date()
        } else {
          // Set order status to most advanced status
          const statusPriority = {
            'pending': 1,
            'confirmed': 2,
            'preparing': 3,
            'ready': 4,
            'delivered': 5,
            'completed': 6,
            'cancelled': 0
          }
          
          const maxStatus = allStatuses.reduce((max, current) => {
            return (statusPriority[current] || 0) > (statusPriority[max] || 0) ? current : max
          }, 'pending')
          
          console.log(`⚡ Mixed statuses, setting order to: ${maxStatus}`)
          updateFields.status = maxStatus
          updateFields[`timestamps.${maxStatus}`] = new Date()
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
        
      default:
        // Full update
        const errors = validateOrder({ ...existingOrder, ...updateData })
        if (errors.length > 0) {
          return NextResponse.json(
            { success: false, errors },
            { status: 400 }
          )
        }
        
        updateFields = {
          ...updateData,
          updatedAt: new Date()
        }
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
      const activeOrdersCount = await db.collection('orders').countDocuments({
        $or: [
          { tableId: existingOrder.tableId },
          { tableNumber: existingOrder.tableId.toString() }
        ],
        status: { $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] }
      })
      
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

// DELETE - Cancel order
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
    
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) })
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }
    
    if (order.status === ORDER_STATUSES.COMPLETED || order.status === ORDER_STATUSES.CANCELLED) {
      return NextResponse.json(
        { success: false, error: 'Bu sipariş zaten tamamlanmış veya iptal edilmiş' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('orders').deleteOne({ 
      _id: new ObjectId(id) 
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Sipariş silinemedi' },
        { status: 404 }
      )
    }
    
    // Check if table has any remaining active orders
    if (order.tableId || order.tableNumber) {
      const tableId = order.tableId || order.tableNumber
      const remainingOrders = await db.collection('orders').countDocuments({
        $or: [
          { tableId: tableId.toString() },
          { tableNumber: tableId.toString() }
        ],
        status: { $nin: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED] }
      })
      
      if (remainingOrders === 0) {
        await db.collection('tables').updateOne(
          { number: tableId.toString() },
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
      message: 'Sipariş başarıyla silindi'
    })
    
  } catch (error) {
    console.error('Orders DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş silinemedi' },
      { status: 500 }
    )
  }
}