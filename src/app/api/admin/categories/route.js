import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { 
  generateSlug, 
  validateCategory, 
  buildCategoryTree, 
  createCategory, 
  updateCategory 
} from '@/lib/models/category'

// GET - Tüm kategorileri getir
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    // Filter oluştur
    const filter = includeInactive ? {} : { isActive: { $ne: false } }
    
    const categories = await db.collection('categories')
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .toArray()
    
    // ID'leri string'e çevir
    const formattedCategories = categories.map(cat => ({
      ...cat,
      id: cat._id.toString(),
      _id: undefined,
      children: []
    }))
    
    // Tree yapısını oluştur
    const categoryTree = buildCategoryTree(formattedCategories)
    
    return NextResponse.json({
      success: true,
      categories: categoryTree,
      flatCategories: formattedCategories,
      total: formattedCategories.length,
      mainCategories: formattedCategories.filter(cat => !cat.parentId).length,
      subCategories: formattedCategories.filter(cat => cat.parentId).length
    })
    
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategoriler alınamadı' },
      { status: 500 }
    )
  }
}

// POST - Yeni kategori ekle
export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    
    // Validasyon
    const errors = validateCategory(data)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Slug oluştur
    const slug = data.slug || generateSlug(data.name)
    
    // Parent ID kontrolü
    if (data.parentId) {
      const parentExists = await db.collection('categories')
        .findOne({ _id: new ObjectId(data.parentId) })
      
      if (!parentExists) {
        return NextResponse.json(
          { success: false, error: 'Ana kategori bulunamadı' },
          { status: 400 }
        )
      }
    }
    
    // Aynı seviyede slug unique kontrolü
    const existingSlugFilter = { slug }
    if (data.parentId) {
      existingSlugFilter.parentId = data.parentId
    } else {
      existingSlugFilter.parentId = { $exists: false }
    }
    
    const existingCategory = await db.collection('categories').findOne(existingSlugFilter)
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Bu kategoride aynı URL slug zaten mevcut' },
        { status: 400 }
      )
    }
    
    // Kategori oluştur
    const category = createCategory(data)
    
    const result = await db.collection('categories').insertOne(category)
    
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: `${data.parentId ? 'Alt kategori' : 'Ana kategori'} başarıyla eklendi`
    })
    
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategori eklenemedi' },
      { status: 500 }
    )
  }
}

// PUT - Kategori güncelle
export async function PUT(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kategori ID gerekli' },
        { status: 400 }
      )
    }
    
    // Validasyon
    const errors = validateCategory(updateData)
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }
    
    // Mevcut kategoriyi kontrol et
    const existingCategory = await db.collection('categories')
      .findOne({ _id: new ObjectId(id) })
    
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }
    
    // Parent ID kontrolü
    if (updateData.parentId) {
      // Kendi kendisini parent yapamaz
      if (updateData.parentId === id) {
        return NextResponse.json(
          { success: false, error: 'Kategori kendi kendisinin alt kategorisi olamaz' },
          { status: 400 }
        )
      }
      
      // Parent'ın var olduğunu kontrol et
      const parentExists = await db.collection('categories')
        .findOne({ _id: new ObjectId(updateData.parentId) })
      
      if (!parentExists) {
        return NextResponse.json(
          { success: false, error: 'Ana kategori bulunamadı' },
          { status: 400 }
        )
      }
      
      // Circular reference kontrolü (parent'ın bu kategorinin child'ı olmaması)
      const checkCircular = async (parentId, targetId) => {
        const parent = await db.collection('categories')
          .findOne({ _id: new ObjectId(parentId) })
        
        if (!parent || !parent.parentId) return false
        if (parent.parentId === targetId) return true
        
        return await checkCircular(parent.parentId, targetId)
      }
      
      const isCircular = await checkCircular(updateData.parentId, id)
      if (isCircular) {
        return NextResponse.json(
          { success: false, error: 'Döngüsel referans oluşturulamaz' },
          { status: 400 }
        )
      }
    }
    
    // Slug güncelleme
    const slug = updateData.slug || generateSlug(updateData.name)
    
    // Slug unique kontrolü (kendisi hariç)
    const existingSlugFilter = { 
      slug,
      _id: { $ne: new ObjectId(id) }
    }
    
    if (updateData.parentId) {
      existingSlugFilter.parentId = updateData.parentId
    } else {
      existingSlugFilter.parentId = { $exists: false }
    }
    
    const duplicateSlug = await db.collection('categories').findOne(existingSlugFilter)
    if (duplicateSlug) {
      return NextResponse.json(
        { success: false, error: 'Bu kategoride aynı URL slug zaten mevcut' },
        { status: 400 }
      )
    }
    
    // Güncelleme verilerini hazırla
    const updateFields = updateCategory({ ...updateData, slug })
    
    const result = await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla güncellendi'
    })
    
  } catch (error) {
    console.error('Categories PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategori güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Kategori sil
export async function DELETE(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kategori ID gerekli' },
        { status: 400 }
      )
    }
    
    // Kategoriyi bul
    const category = await db.collection('categories')
      .findOne({ _id: new ObjectId(id) })
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }
    
    // Alt kategorileri kontrol et
    const hasSubcategories = await db.collection('categories')
      .findOne({ parentId: id })
    
    if (hasSubcategories) {
      return NextResponse.json(
        { success: false, error: 'Bu kategorinin alt kategorileri var. Önce onları silin.' },
        { status: 400 }
      )
    }
    
    // Bu kategoriye bağlı ürünleri kontrol et
    const hasProducts = await db.collection('menu')
      .findOne({ categoryId: id })
    
    if (hasProducts) {
      return NextResponse.json(
        { success: false, error: 'Bu kategoriye bağlı ürünler var. Önce onları başka kategoriye taşıyın.' },
        { status: 400 }
      )
    }
    
    // Kategoriyi sil
    const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Kategori silinemedi' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    })
    
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Kategori silinemedi' },
      { status: 500 }
    )
  }
}