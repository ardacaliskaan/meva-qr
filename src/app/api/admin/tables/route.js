import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// GET - Tüm masaları listele (query parametreleriyle)
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    // 🆕 Query parametrelerini al
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const location = searchParams.get('location')
    
    // 🆕 Query objesi oluştur
    const query = {}
    
    if (status) {
      query.status = status
    }
    
    if (location) {
      query.location = location
    }
    
    console.log('📋 Tables query:', query)
    
    const tables = await db.collection('tables')
      .find(query)
      .sort({ number: 1 })
      .toArray()

    console.log(`✅ Found ${tables.length} tables`)

    // 🆕 Consistent response format
    return NextResponse.json({
      success: true,
      tables,
      count: tables.length
    })
  } catch (error) {
    console.error('Tables GET error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 })
  }
}

// POST - Yeni masa oluştur
export async function POST(request) {
  try {
    const data = await request.json()
    const { number, capacity, location, status, notes } = data

    // Validasyon
    if (!number || !capacity) {
      return NextResponse.json({ 
        success: false,
        error: 'Masa numarası ve kapasite gerekli' 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('restaurant-qr')

    // Masa numarası unique kontrolü (string bazlı)
    const existingTable = await db.collection('tables').findOne({ number: number.trim() })
    if (existingTable) {
      return NextResponse.json({ 
        success: false,
        error: 'Bu masa numarası zaten kullanımda' 
      }, { status: 400 })
    }

    const tableData = {
      number: number.trim(),  // artık string olarak saklanıyor
      capacity: parseInt(capacity),
      location: location || 'main',
      status: status || 'empty',
      notes: notes || '',
      qrCode: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('tables').insertOne(tableData)
    const newTable = await db.collection('tables').findOne({ _id: result.insertedId })

    return NextResponse.json({
      success: true,
      table: newTable
    })
  } catch (error) {
    console.error('Tables POST error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 })
  }
}

// PUT - Masa güncelle
export async function PUT(request) {
  try {
    const data = await request.json()
    const { _id, number, capacity, location, status, notes, qrCode } = data

    if (!_id) {
      return NextResponse.json({ 
        success: false,
        error: 'Masa ID gerekli' 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('restaurant-qr')
    const { ObjectId } = require('mongodb')

    // Eğer masa numarası değişiyorsa, unique kontrolü yap (string bazlı)
    if (number) {
      const existingTable = await db.collection('tables').findOne({
        number: number.trim(),
        _id: { $ne: new ObjectId(_id) }
      })
      if (existingTable) {
        return NextResponse.json({ 
          success: false,
          error: 'Bu masa numarası zaten kullanımda' 
        }, { status: 400 })
      }
    }

    const updateData = {
      updatedAt: new Date()
    }

    if (number !== undefined) updateData.number = number.trim()
    if (capacity !== undefined) updateData.capacity = parseInt(capacity)
    if (location !== undefined) updateData.location = location
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (qrCode !== undefined) updateData.qrCode = qrCode

    const result = await db.collection('tables').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Masa bulunamadı' 
      }, { status: 404 })
    }

    const updatedTable = await db.collection('tables').findOne({ _id: new ObjectId(_id) })
    return NextResponse.json({
      success: true,
      table: updatedTable
    })
  } catch (error) {
    console.error('Tables PUT error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 })
  }
}

// DELETE - Masa sil
export async function DELETE(request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: 'Masa ID gerekli' 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('restaurant-qr')
    const { ObjectId } = require('mongodb')

    const table = await db.collection('tables').findOne({ _id: new ObjectId(id) })
    if (!table) {
      return NextResponse.json({ 
        success: false,
        error: 'Masa bulunamadı' 
      }, { status: 404 })
    }

    // Masanın aktif siparişi var mı kontrol et
    const activeOrders = await db.collection('orders').findOne({
      tableId: table.number.toString(),
      status: { $in: ['pending', 'preparing', 'ready'] }
    })

    if (activeOrders) {
      return NextResponse.json({
        success: false,
        error: 'Bu masanın aktif siparişi bulunuyor. Önce siparişleri tamamlayın.'
      }, { status: 400 })
    }

    const result = await db.collection('tables').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Masa silinemedi' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Masa başarıyla silindi' 
    })
  } catch (error) {
    console.error('Tables DELETE error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 })
  }
}