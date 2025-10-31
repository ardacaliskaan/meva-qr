// src/app/api/admin/reports/route.js - DÜZELTİLMİŞ VERSİYON
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'today'
    
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // Tarih aralığı
    let start, end
    const now = new Date()
    
    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0))
        end = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'week':
        start = new Date(now)
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        end = new Date()
        break
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date()
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date()
        break
      case 'custom':
        start = new Date(startDate)
        end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        break
      default:
        start = new Date(now.setHours(0, 0, 0, 0))
        end = new Date()
    }

    // ✅ Tüm siparişleri çek
    const allOrders = await db.collection('orders')
      .find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: 1 })
      .toArray()

    // ✅ SADECE TAMAMLANAN SİPARİŞLER
    const completedOrders = allOrders.filter(o => 
      ['completed', 'delivered'].includes(o.status)
    )

    // Menü ve kategoriler
    const [menuItems, categories] = await Promise.all([
      db.collection('menu').find({}).toArray(),
      db.collection('categories').find({}).toArray()
    ])

    // ✅ TEMEL İSTATİSTİKLER (Sadece tamamlananlar)
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    const cancelledRevenue = allOrders
      .filter(o => o.status === 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    // ✅ GÜNLÜK TREND (Sadece tamamlananlar)
    const dailyTrends = {}
    completedOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0]
      if (!dailyTrends[dateKey]) {
        dailyTrends[dateKey] = { date: dateKey, orderCount: 0, revenue: 0 }
      }
      dailyTrends[dateKey].orderCount++
      dailyTrends[dateKey].revenue += order.totalAmount || 0
    })

    const dailyData = Object.values(dailyTrends).map(d => ({
      ...d,
      avgOrderValue: d.orderCount > 0 ? d.revenue / d.orderCount : 0
    }))

    // ✅ SAATLİK DAĞILIM (Sadece tamamlananlar)
    const hourlyData = Array(24).fill(0).map((_, i) => ({ 
      hour: i, 
      orderCount: 0, 
      revenue: 0 
    }))
    
    completedOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours()
      hourlyData[hour].orderCount++
      hourlyData[hour].revenue += order.totalAmount || 0
    })

    // ✅ ÜRÜN BAZLI SATIŞ (Sadece tamamlananlar)
    const productSales = {}
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        const key = item.menuItemId || item.name
        if (!productSales[key]) {
          productSales[key] = { name: item.name, quantity: 0, revenue: 0 }
        }
        productSales[key].quantity += item.quantity || 1
        productSales[key].revenue += (item.price || 0) * (item.quantity || 1)
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // ✅ KATEGORİ BAZLI SATIŞ (Sadece tamamlananlar)
    const categorySales = {}
    const menuItemMap = {}
    menuItems.forEach(item => { menuItemMap[item._id.toString()] = item })
    
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        const menuItem = menuItemMap[item.menuItemId]
        if (menuItem) {
          const category = categories.find(c => c._id.toString() === menuItem.categoryId)
          const catName = category?.name || 'Diğer'
          if (!categorySales[catName]) {
            categorySales[catName] = { name: catName, revenue: 0, quantity: 0 }
          }
          categorySales[catName].revenue += (item.price || 0) * (item.quantity || 1)
          categorySales[catName].quantity += item.quantity || 1
        }
      })
    })

    // ✅ MASA PERFORMANSI (Sadece tamamlananlar)
    const tablePerformance = {}
    completedOrders.forEach(order => {
      const tableKey = order.tableNumber || 'Bilinmeyen'
      if (!tablePerformance[tableKey]) {
        tablePerformance[tableKey] = { table: tableKey, orderCount: 0, revenue: 0 }
      }
      tablePerformance[tableKey].orderCount++
      tablePerformance[tableKey].revenue += order.totalAmount || 0
    })

    const topTables = Object.values(tablePerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // ✅ DURUM BAZLI (Tüm siparişler - bilgi amaçlı)
    const statusStats = {
      pending: allOrders.filter(o => o.status === 'pending').length,
      confirmed: allOrders.filter(o => o.status === 'confirmed').length,
      preparing: allOrders.filter(o => o.status === 'preparing').length,
      ready: allOrders.filter(o => o.status === 'ready').length,
      delivered: allOrders.filter(o => o.status === 'delivered').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length
    }

    // ✅ ORTALAMA SÜRE (Sadece tamamlananlar)
    let totalTime = 0
    let timeCount = 0
    completedOrders.forEach(order => {
      if (order.timestamps?.completed && order.timestamps?.created) {
        totalTime += (new Date(order.timestamps.completed) - new Date(order.timestamps.created)) / 60000
        timeCount++
      }
    })

    return NextResponse.json({
      success: true,
      period: { start, end, period },
      summary: {
        // ✅ Tamamlanan siparişler
        completedOrders: completedOrders.length,
        totalRevenue,
        avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
        avgOrderTime: timeCount > 0 ? totalTime / timeCount : 0,
        
        // ✅ Bilgi amaçlı (toplam)
        totalOrders: allOrders.length,
        cancelledOrders: statusStats.cancelled,
        cancelledRevenue,
        conversionRate: allOrders.length > 0 ? (completedOrders.length / allOrders.length * 100) : 0
      },
      dailyTrends: dailyData,
      hourlyDistribution: hourlyData,
      topProducts,
      categorySales: Object.values(categorySales).sort((a, b) => b.revenue - a.revenue),
      topTables,
      statusStats
    })

  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}