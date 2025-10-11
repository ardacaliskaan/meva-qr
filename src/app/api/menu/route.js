import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
export const runtime = 'nodejs';

// GET - Müşteri menüsü (filtreleme destekli)
export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant-qr')
    
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const categoryId = searchParams.get('categoryId')
    const subcategoryId = searchParams.get('subcategoryId')
    const categorySlug = searchParams.get('categorySlug')
    const subcategorySlug = searchParams.get('subcategorySlug')
    const availableOnly = searchParams.get('availableOnly') !== 'false' // Default true
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    
    // Filter oluştur
    const filter = {}
    
    // Availability filtreleme (default olarak sadece müsait ürünler)
    if (availableOnly) {
      filter.available = { $ne: false }
    }
    
    // Kategori filtreleme
    if (categoryId) {
      filter.categoryId = categoryId
    } else if (categorySlug) {
      // Slug ile kategori bul
      const category = await db.collection('categories')
        .findOne({ slug: categorySlug, isActive: { $ne: false } })
      
      if (category) {
        filter.categoryId = category._id.toString()
      }
    }
    
    // Alt kategori filtreleme
    if (subcategoryId) {
      filter.subcategoryId = subcategoryId
    } else if (subcategorySlug) {
      // Slug ile alt kategori bul
      const subcategory = await db.collection('categories')
        .findOne({ slug: subcategorySlug, isActive: { $ne: false } })
      
      if (subcategory) {
        filter.subcategoryId = subcategory._id.toString()
      }
    }
    
    // Featured filtreleme
    if (featured === 'true') {
      filter.featured = true
    }
    
    // Arama filtreleme
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    console.log('Menu filter:', filter) // Debug için
    
    // Menü öğelerini getir
    const menuItems = await db.collection('menu')
      .find(filter)
      .sort({ featured: -1, sortOrder: 1, name: 1 })
      .toArray()
    
    // Kategorileri getir (menu item'ları zenginleştirmek için)
    const categories = await db.collection('categories')
      .find({ isActive: { $ne: false } })
      .toArray()
    
    // Malzemeleri getir
    const ingredients = await db.collection('ingredients')
      .find({})
      .toArray()
    
    // ID'leri string'e çevir ve zenginleştir
    const formattedItems = menuItems.map(item => {
      // Kategori bilgilerini ekle
      const category = categories.find(cat => cat._id.toString() === item.categoryId)
      const subcategory = item.subcategoryId 
        ? categories.find(cat => cat._id.toString() === item.subcategoryId)
        : null
      
      // Malzeme bilgilerini ekle
      const itemIngredients = (item.ingredients || []).map(ingredientId => {
        return ingredients.find(ing => ing._id.toString() === ingredientId)
      }).filter(Boolean)
      
      return {
        ...item,
        id: item._id.toString(),
        _id: undefined,
          price: parseFloat(item.price) || 0, // Bu satırı ekle
        category: category ? {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug
        } : null,
        subcategory: subcategory ? {
          id: subcategory._id.toString(), 
          name: subcategory.name,
          slug: subcategory.slug
        } : null,
        ingredients: itemIngredients.map(ing => ({
          id: ing._id.toString(),
          name: ing.name,
          category: ing.category,
          allergens: ing.allergens || [],
          isVegan: ing.isVegan || false,
          isVegetarian: ing.isVegetarian || false,
          isGlutenFree: ing.isGlutenFree || false
        }))
      }
    })
    
    // Kategorileri grupla
    const categoryGroups = {}
    formattedItems.forEach(item => {
      if (item.category) {
        const catId = item.category.id
        if (!categoryGroups[catId]) {
          categoryGroups[catId] = {
            category: item.category,
            items: []
          }
        }
        categoryGroups[catId].items.push(item)
      }
    })
    
    return NextResponse.json({
      success: true,
      items: formattedItems,
      categoryGroups: Object.values(categoryGroups),
      total: formattedItems.length,
      filter: {
        categoryId,
        subcategoryId,
        categorySlug,
        subcategorySlug,
        availableOnly,
        featured,
        search
      }
    })
    
  } catch (error) {
    console.error('Customer Menu GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Menü alınamadı' },
      { status: 500 }
    )
  }
}