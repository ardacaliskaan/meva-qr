import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { createIngredient, validateIngredient } from '@/lib/models/ingredient'

// GET - Tüm malzemeleri getir
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const ingredients = await db.collection('ingredients')
      .find({})
      .sort({ category: 1, name: 1 })
      .toArray()
    
    const formattedIngredients = ingredients.map(ingredient => ({
      ...ingredient,
      id: ingredient._id.toString(),
      _id: undefined
    }))
    
    return NextResponse.json({
      success: true,
      ingredients: formattedIngredients
    })
    
  } catch (error) {
    console.error('Ingredients GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Malzemeler alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni malzeme ekle
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    // Validasyon
    const errors = validateIngredient(data)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Aynı isimde malzeme var mı kontrol et
    const existingIngredient = await db.collection('ingredients')
      .findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } })
    
    if (existingIngredient) {
      return NextResponse.json(
        { success: false, error: 'Bu malzeme zaten mevcut' },
        { status: 400 }
      )
    }
    
    const ingredient = createIngredient(data)
    const result = await db.collection('ingredients').insertOne(ingredient)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: 'Malzeme başarıyla eklendi'
    })
    
  } catch (error) {
    console.error('Ingredients POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Malzeme eklenemedi' },
      { status: 500 }
    )
  }
}

// PUT - Malzeme güncelle
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Malzeme ID gerekli' },
        { status: 400 }
      )
    }
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }
    
    const result = await db.collection('ingredients').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Malzeme bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Malzeme güncellendi'
    })
    
  } catch (error) {
    console.error('Ingredients PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Malzeme güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Malzeme sil
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Malzeme ID gerekli' },
        { status: 400 }
      )
    }
    
    // Bu malzemeyi kullanan menü öğelerini kontrol et
    const menuItems = await db.collection('menu')
      .find({ 
        $or: [
          { 'ingredients': id },
          { 'customizations.removable': id },
          { 'customizations.extras': { $elemMatch: { ingredientId: id } } }
        ]
      }).toArray()
    
    if (menuItems.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu malzeme ürünlerde kullanılıyor, önce ürünlerden kaldırın' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('ingredients').deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Malzeme bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Malzeme silindi'
    })
    
  } catch (error) {
    console.error('Ingredients DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Malzeme silinemedi' },
      { status: 500 }
    )
  }
}