// Order Model - Professional Order Management System

// Order Status Workflow
export const ORDER_STATUSES = {
  PENDING: 'pending',         // Yeni sipariş alındı
  CONFIRMED: 'confirmed',     // Sipariş onaylandı
  PREPARING: 'preparing',     // Hazırlanıyor
  READY: 'ready',            // Hazır
  DELIVERED: 'delivered',     // Teslim edildi
  COMPLETED: 'completed',     // Tamamlandı (ödeme alındı)
  CANCELLED: 'cancelled'      // İptal edildi
}

// Payment Status
export const PAYMENT_STATUSES = {
  PENDING: 'pending',         // Ödeme bekleniyor
  PAID: 'paid',              // Ödendi
  PARTIAL: 'partial',        // Kısmi ödeme
  FAILED: 'failed',          // Ödeme başarısız
  REFUNDED: 'refunded'       // İade edildi
}

// Order Priority
export const ORDER_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

// Order Type
export const ORDER_TYPES = {
  DINE_IN: 'dine_in',        // Masada yeme
  TAKEAWAY: 'takeaway',      // Paket servisi
  DELIVERY: 'delivery'       // Kurye ile teslimat
}

// Status Labels (Turkish)
export const getStatusLabel = (status) => {
  const labels = {
    [ORDER_STATUSES.PENDING]: 'Bekliyor',
    [ORDER_STATUSES.CONFIRMED]: 'Onaylandı', 
    [ORDER_STATUSES.PREPARING]: 'Hazırlanıyor',
    [ORDER_STATUSES.READY]: 'Hazır',
    [ORDER_STATUSES.DELIVERED]: 'Teslim Edildi',
    [ORDER_STATUSES.COMPLETED]: 'Tamamlandı',
    [ORDER_STATUSES.CANCELLED]: 'İptal Edildi'
  }
  return labels[status] || status
}

// Status Colors for UI
export const getStatusColor = (status) => {
  const colors = {
    [ORDER_STATUSES.PENDING]: 'yellow',
    [ORDER_STATUSES.CONFIRMED]: 'blue',
    [ORDER_STATUSES.PREPARING]: 'orange',
    [ORDER_STATUSES.READY]: 'green',
    [ORDER_STATUSES.DELIVERED]: 'purple',
    [ORDER_STATUSES.COMPLETED]: 'gray',
    [ORDER_STATUSES.CANCELLED]: 'red'
  }
  return colors[status] || 'gray'
}

// Next possible statuses for workflow
export const getNextStatuses = (currentStatus) => {
  const workflows = {
    [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PREPARING, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.PREPARING]: [ORDER_STATUSES.READY, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.READY]: [ORDER_STATUSES.DELIVERED],
    [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.COMPLETED],
    [ORDER_STATUSES.COMPLETED]: [],
    [ORDER_STATUSES.CANCELLED]: []
  }
  return workflows[currentStatus] || []
}

// Validation Functions
export const validateOrder = (data) => {
  const errors = []
  
  // Table validation
  if (!data.tableNumber && !data.tableId) {
    errors.push('Masa numarası veya masa ID gerekli')
  }
  
  if (data.tableNumber && (data.tableNumber < 1 || data.tableNumber > 999)) {
    errors.push('Masa numarası 1-999 arasında olmalıdır')
  }
  
  // Items validation
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('En az bir ürün seçilmelidir')
  }
  
  // Items detailed validation
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
        errors.push(`${index + 1}. ürün miktarı 1-99 arasında olmalıdır`)
      }
    })
  }
  
  // Total amount validation
  if (!data.totalAmount || data.totalAmount <= 0) {
    errors.push('Toplam tutar hesaplanamadı')
  }
  
  // Status validation
  if (data.status && !Object.values(ORDER_STATUSES).includes(data.status)) {
    errors.push('Geçersiz sipariş durumu')
  }
  
  // Priority validation
  if (data.priority && !Object.values(ORDER_PRIORITIES).includes(data.priority)) {
    errors.push('Geçersiz öncelik seviyesi')
  }
  
  // Order type validation
  if (data.orderType && !Object.values(ORDER_TYPES).includes(data.orderType)) {
    errors.push('Geçersiz sipariş tipi')
  }
  
  return errors
}

// Order Creation
export const createOrder = (data) => {
  const now = new Date()
  
  // Calculate order number (YYYYMMDD + sequential number)
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const orderNumber = `${dateStr}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
  
  return {
    orderNumber,
    tableNumber: parseInt(data.tableNumber),
    tableId: data.tableId?.toString() || data.tableNumber?.toString(),
    orderType: data.orderType || ORDER_TYPES.DINE_IN,
    items: data.items.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name.trim(),
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      customizations: {
        removed: item.customizations?.removed || [],
        extras: item.customizations?.extras || []
      },
      selectedOptions: item.selectedOptions || [],  // 🆕 ZORUNLU SEÇİMLER EKLENDİ!
      notes: item.notes?.trim() || '',
      subtotal: parseFloat(item.price) * parseInt(item.quantity)
    })),
    totalAmount: parseFloat(data.totalAmount),
    status: data.status || ORDER_STATUSES.PENDING,
    paymentStatus: data.paymentStatus || PAYMENT_STATUSES.PENDING,
    priority: data.priority || ORDER_PRIORITIES.NORMAL,
    customerNotes: data.customerNotes?.trim() || '',
    kitchenNotes: data.kitchenNotes?.trim() || '',
    assignedStaff: data.assignedStaff || null,
    estimatedTime: data.estimatedTime || null,
    timestamps: {
      created: now,
      confirmed: null,
      preparing: null,
      ready: null,
      delivered: null,
      completed: null
    },
    createdAt: now,
    updatedAt: now
  }
}

// Order Update
export const updateOrder = (data) => {
  const updateFields = {
    ...data,
    updatedAt: new Date()
  }
  
  // Status change timestamp tracking
  if (data.status) {
    const statusField = data.status.toLowerCase()
    if (updateFields.timestamps && statusField in updateFields.timestamps) {
      updateFields.timestamps[statusField] = new Date()
    }
  }
  
  return updateFields
}

// Order Calculations
export const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity
    const extrasTotal = (item.customizations?.extras || [])
      .reduce((sum, extra) => sum + (extra.price * item.quantity), 0)
    return total + itemTotal + extrasTotal
  }, 0)
}

export const calculateOrderStats = (orders) => {
  const stats = {
    total: orders.length,
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    averageOrderTime: 0
  }
  
  let totalOrderTime = 0
  let completedOrders = 0
  
  orders.forEach(order => {
    // Status counts
    stats[order.status] = (stats[order.status] || 0) + 1
    
    // Revenue calculation
    if ([ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DELIVERED].includes(order.status)) {
      stats.totalRevenue += order.totalAmount
      completedOrders++
      
      // Order time calculation
      if (order.timestamps?.completed && order.timestamps?.created) {
        const orderTime = (new Date(order.timestamps.completed) - new Date(order.timestamps.created)) / (1000 * 60) // minutes
        totalOrderTime += orderTime
      }
    }
  })
  
  // Averages
  if (completedOrders > 0) {
    stats.averageOrderValue = stats.totalRevenue / completedOrders
    stats.averageOrderTime = totalOrderTime / completedOrders
  }
  
  return stats
}

// Filtering Helpers
export const buildOrderFilter = (params) => {
  const filter = {}
  
  // Status filtering
  if (params.status) {
    filter.status = params.status
  }
  
  // Multiple status filtering
  if (params.statuses && Array.isArray(params.statuses)) {
    filter.status = { $in: params.statuses }
  }
  
  // Table filtering
  if (params.tableNumber) {
    filter.tableNumber = parseInt(params.tableNumber)
  }
  
  if (params.tableId) {
    filter.tableId = params.tableId
  }
  
  // Order type filtering
  if (params.orderType) {
    filter.orderType = params.orderType
  }
  
  // Priority filtering
  if (params.priority) {
    filter.priority = params.priority
  }
  
  // Payment status filtering
  if (params.paymentStatus) {
    filter.paymentStatus = params.paymentStatus
  }
  
  // Date range filtering
  if (params.startDate || params.endDate) {
    filter.createdAt = {}
    if (params.startDate) {
      filter.createdAt.$gte = new Date(params.startDate)
    }
    if (params.endDate) {
      filter.createdAt.$lte = new Date(params.endDate)
    }
  }
  
  // Today filter
  if (params.today === 'true') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    filter.createdAt = {
      $gte: today,
      $lt: tomorrow
    }
  }
  
  // Staff filtering
  if (params.assignedStaff) {
    filter.assignedStaff = params.assignedStaff
  }
  
  // Amount range filtering
  if (params.minAmount || params.maxAmount) {
    filter.totalAmount = {}
    if (params.minAmount) {
      filter.totalAmount.$gte = parseFloat(params.minAmount)
    }
    if (params.maxAmount) {
      filter.totalAmount.$lte = parseFloat(params.maxAmount)
    }
  }
  
  // Search filtering
  if (params.search) {
    filter.$or = [
      { orderNumber: { $regex: params.search, $options: 'i' } },
      { 'items.name': { $regex: params.search, $options: 'i' } },
      { customerNotes: { $regex: params.search, $options: 'i' } }
    ]
  }
  
  return filter
}

// Sorting Helpers
export const buildOrderSort = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const sort = {}
  
  switch (sortBy) {
    case 'orderNumber':
      sort.orderNumber = sortOrder === 'desc' ? -1 : 1
      break
    case 'tableNumber':
      sort.tableNumber = sortOrder === 'desc' ? -1 : 1
      break
    case 'totalAmount':
      sort.totalAmount = sortOrder === 'desc' ? -1 : 1
      break
    case 'status':
      sort.status = sortOrder === 'desc' ? -1 : 1
      sort.createdAt = -1 // Secondary sort
      break
    case 'priority':
      // Priority custom sorting (urgent -> high -> normal -> low)
      const priorityOrder = {
        [ORDER_PRIORITIES.URGENT]: 4,
        [ORDER_PRIORITIES.HIGH]: 3,
        [ORDER_PRIORITIES.NORMAL]: 2,
        [ORDER_PRIORITIES.LOW]: 1
      }
      sort.priority = sortOrder === 'desc' ? -1 : 1
      sort.createdAt = -1 // Secondary sort
      break
    case 'updatedAt':
      sort.updatedAt = sortOrder === 'desc' ? -1 : 1
      break
    default:
      sort.createdAt = sortOrder === 'desc' ? -1 : 1
  }
  
  return sort
}

// Kitchen Display Helpers
export const getKitchenOrders = (orders) => {
  return orders
    .filter(order => [
      ORDER_STATUSES.CONFIRMED,
      ORDER_STATUSES.PREPARING,
      ORDER_STATUSES.READY
    ].includes(order.status))
    .sort((a, b) => {
      // Sort by priority first, then by creation time
      const priorityA = Object.values(ORDER_PRIORITIES).indexOf(a.priority)
      const priorityB = Object.values(ORDER_PRIORITIES).indexOf(b.priority)
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA // Higher priority first
      }
      
      return new Date(a.createdAt) - new Date(b.createdAt) // Older orders first
    })
}

// Time Calculations
export const getOrderDuration = (order) => {
  const start = new Date(order.createdAt)
  const end = order.timestamps?.completed 
    ? new Date(order.timestamps.completed)
    : new Date()
  
  return Math.floor((end - start) / (1000 * 60)) // minutes
}

export const getEstimatedCompletionTime = (order) => {
  if (!order.estimatedTime) return null
  
  const startTime = order.timestamps?.confirmed || order.createdAt
  const estimatedCompletion = new Date(new Date(startTime).getTime() + order.estimatedTime * 60000)
  
  return estimatedCompletion
}

// Order Analytics
export const getOrderTrends = (orders, days = 7) => {
  const trends = {}
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const dateKey = date.toISOString().slice(0, 10)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= date && orderDate < nextDay
    })
    
    trends[dateKey] = {
      date: dateKey,
      orderCount: dayOrders.length,
      revenue: dayOrders
        .filter(o => [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DELIVERED].includes(o.status))
        .reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: dayOrders.length > 0 
        ? dayOrders.reduce((sum, o) => sum + o.totalAmount, 0) / dayOrders.length 
        : 0
    }
  }
  
  return Object.values(trends)
}

// Table Performance
export const getTablePerformance = (orders) => {
  const tableStats = {}
  
  orders.forEach(order => {
    const tableKey = order.tableNumber || order.tableId || 'unknown'
    
    if (!tableStats[tableKey]) {
      tableStats[tableKey] = {
        tableNumber: order.tableNumber,
        orderCount: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        averageOrderTime: 0,
        completedOrders: 0
      }
    }
    
    tableStats[tableKey].orderCount++
    
    if ([ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DELIVERED].includes(order.status)) {
      tableStats[tableKey].totalRevenue += order.totalAmount
      tableStats[tableKey].completedOrders++
      
      if (order.timestamps?.completed && order.timestamps?.created) {
        const orderTime = (new Date(order.timestamps.completed) - new Date(order.timestamps.created)) / (1000 * 60)
        tableStats[tableKey].averageOrderTime += orderTime
      }
    }
  })
  
  // Calculate averages
  Object.values(tableStats).forEach(stats => {
    if (stats.completedOrders > 0) {
      stats.averageOrderValue = stats.totalRevenue / stats.completedOrders
      stats.averageOrderTime = stats.averageOrderTime / stats.completedOrders
    }
  })
  
  return Object.values(tableStats).sort((a, b) => b.totalRevenue - a.totalRevenue)
}