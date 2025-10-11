// Ingredient Model - Helper Functions
export const validateIngredient = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Malzeme adı en az 2 karakter olmalıdır')
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('Malzeme adı 100 karakterden uzun olamaz')
  }
  
  if (!data.category) {
    errors.push('Malzeme kategorisi seçilmelidir')
  }
  
  const validCategories = [
    'meat', 'dairy', 'vegetable', 'fruit', 'grain', 'spice', 'sauce', 'other'
  ]
  
  if (data.category && !validCategories.includes(data.category)) {
    errors.push('Geçersiz malzeme kategorisi')
  }
  
  if (data.extraPrice && (isNaN(data.extraPrice) || data.extraPrice < 0)) {
    errors.push('Ekstra fiyat geçersiz')
  }
  
  if (data.extraPrice && data.extraPrice > 999) {
    errors.push('Ekstra fiyat çok yüksek')
  }
  
  return errors
}

export const createIngredient = (data) => {
  return {
    name: data.name.trim(),
    category: data.category,
    description: data.description?.trim() || '',
    allergens: data.allergens || [],
    isVegetarian: data.isVegetarian || false,
    isVegan: data.isVegan || false,
    isGlutenFree: data.isGlutenFree || false,
    isKeto: data.isKeto || false,
    isLowCarb: data.isLowCarb || false,
    extraPrice: parseFloat(data.extraPrice) || 0,
    isActive: data.isActive !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export const updateIngredient = (data) => {
  return {
    name: data.name.trim(),
    category: data.category,
    description: data.description?.trim() || '',
    allergens: data.allergens || [],
    isVegetarian: data.isVegetarian || false,
    isVegan: data.isVegan || false,
    isGlutenFree: data.isGlutenFree || false,
    isKeto: data.isKeto || false,
    isLowCarb: data.isLowCarb || false,
    extraPrice: parseFloat(data.extraPrice) || 0,
    isActive: data.isActive !== false,
    updatedAt: new Date()
  }
}

// Ingredient category helpers
export const getIngredientCategoryLabel = (category) => {
  const categoryLabels = {
    meat: 'Et Ürünleri',
    dairy: 'Süt Ürünleri', 
    vegetable: 'Sebzeler',
    fruit: 'Meyveler',
    grain: 'Tahıllar',
    spice: 'Baharat & Otlar',
    sauce: 'Soslar',
    other: 'Diğer'
  }
  
  return categoryLabels[category] || category
}

export const ingredientCategories = [
  { value: 'meat', label: 'Et Ürünleri' },
  { value: 'dairy', label: 'Süt Ürünleri' },
  { value: 'vegetable', label: 'Sebzeler' },
  { value: 'fruit', label: 'Meyveler' },
  { value: 'grain', label: 'Tahıllar' },
  { value: 'spice', label: 'Baharat & Otlar' },
  { value: 'sauce', label: 'Soslar' },
  { value: 'other', label: 'Diğer' }
]

// Allergen helpers
export const allergenLabels = {
  gluten: 'Gluten',
  dairy: 'Süt',
  eggs: 'Yumurta',
  nuts: 'Kuruyemiş',
  peanuts: 'Fıstık',
  shellfish: 'Kabuklu Deniz Ürünleri',
  fish: 'Balık',
  soy: 'Soya',
  sesame: 'Susam'
}

export const getAllergenLabel = (allergen) => {
  return allergenLabels[allergen] || allergen
}

// Filter helpers
export const buildIngredientFilter = (params) => {
  const filter = {}
  
  if (params.category) {
    filter.category = params.category
  }
  
  if (params.isVegetarian === 'true') {
    filter.isVegetarian = true
  }
  
  if (params.isVegan === 'true') {
    filter.isVegan = true
  }
  
  if (params.isGlutenFree === 'true') {
    filter.isGlutenFree = true
  }
  
  if (params.hasExtraPrice === 'true') {
    filter.extraPrice = { $gt: 0 }
  }
  
  if (params.search) {
    filter.$or = [
      { name: { $regex: params.search, $options: 'i' } },
      { description: { $regex: params.search, $options: 'i' } }
    ]
  }
  
  if (params.activeOnly === 'true') {
    filter.isActive = { $ne: false }
  }
  
  return filter
}

export const buildIngredientSort = (sortBy = 'category', sortOrder = 'asc') => {
  const sort = {}
  
  switch (sortBy) {
    case 'name':
      sort.name = sortOrder === 'desc' ? -1 : 1
      break
    case 'category':
      sort.category = sortOrder === 'desc' ? -1 : 1
      sort.name = 1 // Secondary sort
      break
    case 'extraPrice':
      sort.extraPrice = sortOrder === 'desc' ? -1 : 1
      break
    case 'createdAt':
      sort.createdAt = sortOrder === 'desc' ? -1 : 1
      break
    default:
      sort.category = 1
      sort.name = 1
  }
  
  return sort
}