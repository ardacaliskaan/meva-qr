import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { 
  validateMenuItem, 
  createMenuItem, 
  updateMenuItem,
  buildMenuFilter,
  buildMenuSort,
  enrichMenuItem,
  getMenuStatistics
} from '@/lib/models/menu'

// GET - Menü öğelerini getir
// GET - Menü öğelerini getir
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page')) || 1
    
    // 🔥 YENİ: Admin paneli için tüm kayıtları çek
    const isAdmin = searchParams.get('enrich') === 'true' || searchParams.get('stats') === 'true'
    const limit = isAdmin 
      ? 0  // 0 = limit yok, tüm kayıtlar
      : (parseInt(searchParams.get('limit')) || 50) // Müşteri menüsü için limit
    
    const sortBy = searchParams.get('sortBy') || 'sortOrder'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const includeStats = searchParams.get('stats') === 'true'
    const enrichData = searchParams.get('enrich') === 'true'
    
    // Filtreleri oluştur
    const filter = buildMenuFilter({
      categoryId: searchParams.get('categoryId'),
      subcategoryId: searchParams.get('subcategoryId'),
      availableOnly: searchParams.get('availableOnly'),
      featuredOnly: searchParams.get('featuredOnly'),
      isVegan: searchParams.get('isVegan'),
      isVegetarian: searchParams.get('isVegetarian'),
      isGlutenFree: searchParams.get('isGlutenFree'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      search: searchParams.get('search')
    })
    
    // Sıralamayı oluştur
    const sort = buildMenuSort(sortBy, sortOrder)
    
    // Pagination hesaplama (sadece limit varsa)
    const skip = limit > 0 ? (page - 1) * limit : 0
    
    // Menü öğelerini getir
    const query = db.collection('menu').find(filter).sort(sort)
    
    // Limit varsa uygula
    const queryWithLimit = limit > 0 
      ? query.skip(skip).limit(limit)
      : query.skip(skip) // Limit yok, tümünü çek
    
    const [menuItems, totalCount] = await Promise.all([
      queryWithLimit.toArray(),
      db.collection('menu').countDocuments(filter)
    ])
    
    // ID'leri string'e çevir
    const formattedItems = menuItems.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }))
    
    let response = {
      success: true,
      items: formattedItems,
      pagination: {
        total: totalCount,
        page,
        limit: limit || totalCount, // Limit yoksa total'i göster
        pages: limit > 0 ? Math.ceil(totalCount / limit) : 1
      }
    }
    
    // Zenginleştirilmiş veri istenmişse
    if (enrichData) {
      // Kategorileri ve malzemeleri getir
      const [categories, ingredients] = await Promise.all([
        db.collection('categories').find({}).toArray(),
        db.collection('ingredients').find({}).toArray()
      ])
      
      const formattedCategories = categories.map(cat => ({
        ...cat,
        id: cat._id.toString()
      }))
      
      const formattedIngredients = ingredients.map(ing => ({
        ...ing,
        id: ing._id.toString()
      }))
      
      // Menü öğelerini zenginleştir
      response.items = formattedItems.map(item => 
        enrichMenuItem(item, formattedCategories, formattedIngredients)
      )
    }
    
    // İstatistikler istenmişse
    if (includeStats) {
      response.statistics = getMenuStatistics(formattedItems)
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Menu GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğeleri alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni menü öğesi ekle
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    // Validasyon
    const errors = validateMenuItem(data)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Kategori kontrolü
    const categoryExists = await db.collection('categories')
      .findOne({ _id: new ObjectId(data.categoryId) })
    
    if (!categoryExists) {
      return NextResponse.json(
        { success: false, error: 'Ana kategori bulunamadı' },
        { status: 400 }
      )
    }
    
    // Alt kategori kontrolü (eğer verilmişse)
    if (data.subcategoryId) {
      const subcategoryExists = await db.collection('categories')
        .findOne({ 
          _id: new ObjectId(data.subcategoryId),
          parentId: data.categoryId
        })
      
      if (!subcategoryExists) {
        return NextResponse.json(
          { success: false, error: 'Alt kategori bulunamadı veya seçilen ana kategoriye ait değil' },
          { status: 400 }
        )
      }
    }
    
    // Slug unique kontrolü
    const menuItem = createMenuItem(data)
    
    const existingSlug = await db.collection('menu')
      .findOne({ slug: menuItem.slug })
    
    if (existingSlug) {
      // Slug'a sayı ekleyerek unique yap
      let counter = 1
      let newSlug = `${menuItem.slug}-${counter}`
      
      while (await db.collection('menu').findOne({ slug: newSlug })) {
        counter++
        newSlug = `${menuItem.slug}-${counter}`
      }
      
      menuItem.slug = newSlug
    }
    
    // Malzeme ID'lerini kontrol et
    if (menuItem.ingredients.length > 0) {
      const validIngredients = await db.collection('ingredients')
        .find({ 
          _id: { $in: menuItem.ingredients.map(id => new ObjectId(id)) }
        })
        .toArray()
      
      if (validIngredients.length !== menuItem.ingredients.length) {
        return NextResponse.json(
          { success: false, error: 'Geçersiz malzeme ID\'si bulundu' },
          { status: 400 }
        )
      }
    }
    
    const result = await db.collection('menu').insertOne(menuItem)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: 'Menü öğesi başarıyla eklendi'
    })
    
  } catch (error) {
    console.error('Menu POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi eklenemedi' },
      { status: 500 }
    )
  }
}

// PUT - Menü öğesini güncelle
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ürün ID gerekli' },
        { status: 400 }
      )
    }
    
    // Validasyon
    const errors = validateMenuItem(updateData)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Mevcut ürünü kontrol et
    const existingItem = await db.collection('menu')
      .findOne({ _id: new ObjectId(id) })
    
    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }
    
    // Kategori kontrolü
    const categoryExists = await db.collection('categories')
      .findOne({ _id: new ObjectId(updateData.categoryId) })
    
    if (!categoryExists) {
      return NextResponse.json(
        { success: false, error: 'Ana kategori bulunamadı' },
        { status: 400 }
      )
    }
    
    // Alt kategori kontrolü (eğer verilmişse)
    if (updateData.subcategoryId) {
      const subcategoryExists = await db.collection('categories')
        .findOne({ 
          _id: new ObjectId(updateData.subcategoryId),
          parentId: updateData.categoryId
        })
      
      if (!subcategoryExists) {
        return NextResponse.json(
          { success: false, error: 'Alt kategori bulunamadı veya seçilen ana kategoriye ait değil' },
          { status: 400 }
        )
      }
    }
    
    // Güncellenmiş menü öğesini oluştur
    const updatedItem = updateMenuItem(updateData)
    
    // Slug unique kontrolü (kendisi hariç)
    const existingSlug = await db.collection('menu')
      .findOne({ 
        slug: updatedItem.slug,
        _id: { $ne: new ObjectId(id) }
      })
    
    if (existingSlug) {
      // Slug'a sayı ekleyerek unique yap
      let counter = 1
      let newSlug = `${updatedItem.slug}-${counter}`
      
      while (await db.collection('menu').findOne({ 
        slug: newSlug,
        _id: { $ne: new ObjectId(id) }
      })) {
        counter++
        newSlug = `${updatedItem.slug}-${counter}`
      }
      
      updatedItem.slug = newSlug
    }
    
    // Malzeme ID'lerini kontrol et
    if (updatedItem.ingredients.length > 0) {
      const validIngredients = await db.collection('ingredients')
        .find({ 
          _id: { $in: updatedItem.ingredients.map(id => new ObjectId(id)) }
        })
        .toArray()
      
      if (validIngredients.length !== updatedItem.ingredients.length) {
        return NextResponse.json(
          { success: false, error: 'Geçersiz malzeme ID\'si bulundu' },
          { status: 400 }
        )
      }
    }
    
    const result = await db.collection('menu').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedItem }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Menü öğesi başarıyla güncellendi'
    })
    
  } catch (error) {
    console.error('Menu PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Menü öğesini sil
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ürün ID gerekli' },
        { status: 400 }
      )
    }
    
    // Ürünü bul
    const menuItem = await db.collection('menu')
      .findOne({ _id: new ObjectId(id) })
    
    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'Ürün bulunamadı' },
        { status: 404 }
      )
    }
    
    // Aktif siparişlerde kullanılıp kullanılmadığını kontrol et
    const activeOrder = await db.collection('orders')
      .findOne({ 
        'items.menuItemId': id,
        status: { $in: ['pending', 'preparing', 'ready'] }
      })
    
    if (activeOrder) {
      return NextResponse.json(
        { success: false, error: 'Bu ürün aktif siparişlerde kullanıldığı için silinemez' },
        { status: 400 }
      )
    }
    
    // Ürünü sil
    const result = await db.collection('menu').deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün silinemedi' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Menü öğesi başarıyla silindi'
    })
    
  } catch (error) {
    console.error('Menu DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü öğesi silinemedi' },
      { status: 500 }
    )
  }
}