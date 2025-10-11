const { MongoClient } = require('mongodb')

const uri = 'mongodb://localhost:27017/restaurant-qr'

const demoCategories = [
  {
    name: 'Pizzalar',
    description: 'Taze malzemelerle hazırlanan özel pizzalarımız',
    slug: 'pizzalar',
    parentId: null,
    image: null,
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Burgerlar',
    description: 'Lezzetli burger çeşitlerimiz',
    slug: 'burgerlar',
    parentId: null,
    image: null,
    sortOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Başlangıçlar',
    description: 'Yemeğe başlamadan önce tadabileceğiniz lezzetler',
    slug: 'baslangiclar',
    parentId: null,
    image: null,
    sortOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'İçecekler',
    description: 'Serinletici ve ısıtıcı içecek seçenekleri',
    slug: 'icecekler',
    parentId: null,
    image: null,
    sortOrder: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Tatlılar',
    description: 'Yemeğinizi tatlı bir şekilde tamamlayın',
    slug: 'tatlilar',
    parentId: null,
    image: null,
    sortOrder: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const demoIngredients = [
  // Et Ürünleri
  {
    name: 'Tavuk Göğsü',
    description: 'Taze tavuk göğsü fileto',
    category: 'meat',
    allergens: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    extraPrice: 5.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Beef Köfte',
    description: 'Dana eti köftesi',
    category: 'meat',
    allergens: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    extraPrice: 8.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Pepperoni',
    description: 'İtalyan usulü pepperoni',
    category: 'meat',
    allergens: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    extraPrice: 6.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Süt Ürünleri
  {
    name: 'Mozzarella Peyniri',
    description: 'Taze mozzarella peyniri',
    category: 'dairy',
    allergens: ['dairy'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    extraPrice: 4.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cheddar Peyniri',
    description: 'Olgun cheddar peyniri',
    category: 'dairy',
    allergens: ['dairy'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    extraPrice: 3.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Sebzeler
  {
    name: 'Domates',
    description: 'Taze domates dilimleri',
    category: 'vegetable',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 1.50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Marul',
    description: 'Çıtır marul yaprakları',
    category: 'vegetable',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 1.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Soğan',
    description: 'Taze soğan halkaları',
    category: 'vegetable',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 1.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mantar',
    description: 'Taze champignon mantarı',
    category: 'vegetable',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 2.50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Biber',
    description: 'Renkli biber karışımı',
    category: 'vegetable',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 2.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Soslar
  {
    name: 'Domates Sosu',
    description: 'Ev yapımı domates sosu',
    category: 'sauce',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 0.50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mayonez',
    description: 'Kremalı mayonez',
    category: 'sauce',
    allergens: ['eggs'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    extraPrice: 0.50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'BBQ Sos',
    description: 'Baharatli BBQ sosu',
    category: 'sauce',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 1.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Baharatlar
  {
    name: 'Fesleğen',
    description: 'Taze fesleğen yaprakları',
    category: 'spice',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 0.50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Oregano',
    description: 'Kurutulmuş oregano',
    category: 'spice',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 0.50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Diğer
  {
    name: 'Turşu',
    description: 'Taze salatalık turşusu',
    category: 'other',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    extraPrice: 1.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const demoMenuItems = [
  // Pizza Kategorisi
  {
    name: 'Margherita Pizza',
    description: 'Taze mozzarella, domates sosu, fesleğen yaprakları',
    price: 45.90,
    category: 'Pizza',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Pepperoni dilimi, mozzarella peyniri, domates sosu',
    price: 52.90,
    category: 'Pizza',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Karışık Pizza',
    description: 'Sucuk, sosis, mantar, biber, mozzarella peyniri',
    price: 58.90,
    category: 'Pizza',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Burger Kategorisi
  {
    name: 'Klasik Burger',
    description: 'Beef köfte, marul, domates, soğan, turşu, burger sosu',
    price: 38.90,
    category: 'Burger',
    image: null,
    allergens: ['gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Chicken Burger',
    description: 'Tavuk göğsü, marul, domates, mayonez',
    price: 35.90,
    category: 'Burger',
    image: null,
    allergens: ['gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Double Burger',
    description: 'Çift köfte, çift peynir, özel burger sosu',
    price: 48.90,
    category: 'Burger',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Başlangıçlar
  {
    name: 'Mozarella Stick',
    description: '6 adet çıtır mozarella çubukları',
    price: 28.90,
    category: 'Başlangıçlar',
    image: null,
    allergens: ['gluten', 'dairy'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Soğan Halkası',
    description: 'Çıtır soğan halkaları, ranch sos ile',
    price: 24.90,
    category: 'Başlangıçlar',
    image: null,
    allergens: ['gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // İçecekler
  {
    name: 'Coca Cola',
    description: 'Soğuk coca cola 330ml',
    price: 8.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Fanta',
    description: 'Soğuk fanta 330ml',
    price: 8.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Su',
    description: 'Doğal kaynak suyu 500ml',
    price: 4.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Türk Kahvesi',
    description: 'Geleneksel Türk kahvesi, lokum ile',
    price: 18.90,
    category: 'İçecekler',
    image: null,
    allergens: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Tatlılar
  {
    name: 'Tiramisu',
    description: 'Geleneksel İtalyan tatlısı',
    price: 32.90,
    category: 'Tatlılar',
    image: null,
    allergens: ['dairy', 'eggs'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Çikolatalı Sufle',
    description: 'Sıcak çikolatalı sufle, vanilyalı dondurma ile',
    price: 28.90,
    category: 'Tatlılar',
    image: null,
    allergens: ['dairy', 'eggs', 'gluten'],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const demoOrders = [
  {
    tableNumber: 5,
    items: [
      {
        menuItemId: 'temp-id-1',
        name: 'Margherita Pizza',
        price: 45.90,
        quantity: 1
      },
      {
        menuItemId: 'temp-id-2',
        name: 'Coca Cola',
        price: 8.90,
        quantity: 2
      }
    ],
    totalAmount: 63.70,
    status: 'preparing',
    customerNotes: 'Az baharatlı olsun',
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 dakika önce
    updatedAt: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    tableNumber: 3,
    items: [
      {
        menuItemId: 'temp-id-3',
        name: 'Klasik Burger',
        price: 38.90,
        quantity: 1
      }
    ],
    totalAmount: 38.90,
    status: 'completed',
    customerNotes: '',
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 dakika önce
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    tableNumber: 7,
    items: [
      {
        menuItemId: 'temp-id-4',
        name: 'Pepperoni Pizza',
        price: 52.90,
        quantity: 1
      },
      {
        menuItemId: 'temp-id-5',
        name: 'Tiramisu',
        price: 32.90,
        quantity: 1
      }
    ],
    totalAmount: 85.80,
    status: 'pending',
    customerNotes: 'Tatlıyı sonra getirin',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 dakika önce
    updatedAt: new Date(Date.now() - 5 * 60 * 1000)
  }
]

async function seedDatabase() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('MongoDB bağlantısı başarılı!')
    
    const db = client.db('restaurant-qr')
    
    // Mevcut verileri temizle
    await db.collection('categories').deleteMany({})
    await db.collection('ingredients').deleteMany({})
    await db.collection('menu').deleteMany({})
    await db.collection('orders').deleteMany({})
    console.log('Mevcut veriler temizlendi')
    
    // Kategorileri ekle
    const categoryResult = await db.collection('categories').insertMany(demoCategories)
    console.log(`${categoryResult.insertedCount} kategori eklendi`)
    
    // Malzemeleri ekle
    const ingredientResult = await db.collection('ingredients').insertMany(demoIngredients)
    console.log(`${ingredientResult.insertedCount} malzeme eklendi`)
    
    // Kategori ID'lerini al
    const categories = await db.collection('categories').find({}).toArray()
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id.toString()
    })

    // Malzeme ID'lerini al
    const ingredients = await db.collection('ingredients').find({}).toArray()
    const ingredientMap = {}
    ingredients.forEach(ing => {
      ingredientMap[ing.name] = ing._id.toString()
    })

    // Menü öğelerini güncelle (kategori ve malzeme ID'leri ile)
    const updatedMenuItems = demoMenuItems.map(item => ({
      ...item,
      categoryId: categoryMap[item.category.toLowerCase().replace(/\s+/g, '-')] || categoryMap['pizzalar'],
      // Örnek malzeme ataması
      ingredients: item.category === 'Pizza' ? [
        ingredientMap['Domates Sosu'],
        ingredientMap['Mozzarella Peyniri'],
        ingredientMap['Fesleğen']
      ].filter(Boolean) : item.category === 'Burger' ? [
        ingredientMap['Beef Köfte'],
        ingredientMap['Marul'],
        ingredientMap['Domates'],
        ingredientMap['Soğan']
      ].filter(Boolean) : []
    }))
    
    // Menü öğelerini ekle
    const menuResult = await db.collection('menu').insertMany(updatedMenuItems)
    console.log(`${menuResult.insertedCount} menü öğesi eklendi`)
    
    // Siparişleri ekle
    const ordersResult = await db.collection('orders').insertMany(demoOrders)
    console.log(`${ordersResult.insertedCount} sipariş eklendi`)
    
    console.log('Demo veriler başarıyla eklendi!')
    
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await client.close()
  }
}

// Script'i çalıştır
seedDatabase()