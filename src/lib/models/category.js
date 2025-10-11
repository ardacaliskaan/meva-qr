// Category Model - Helper Functions
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const validateCategory = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Kategori adı en az 2 karakter olmalıdır')
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('Kategori adı 100 karakterden uzun olamaz')
  }
  
  if (data.description && data.description.length > 500) {
    errors.push('Açıklama 500 karakterden uzun olamaz')
  }
  
  return errors
}

export const buildCategoryTree = (categories) => {
  const categoryMap = {}
  const rootCategories = []
  
  // İlk önce tüm kategorileri map'e ekle
  categories.forEach(cat => {
    cat.children = []
    categoryMap[cat.id] = cat
  })
  
  // Parent-child ilişkilerini kur
  categories.forEach(cat => {
    if (cat.parentId && categoryMap[cat.parentId]) {
      categoryMap[cat.parentId].children.push(cat)
    } else {
      rootCategories.push(cat)
    }
  })
  
  // Sıralamaya göre sırala
  const sortCategories = (cats) => {
    return cats.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      }
      return a.name.localeCompare(b.name)
    }).map(cat => ({
      ...cat,
      children: cat.children.length > 0 ? sortCategories(cat.children) : []
    }))
  }
  
  return sortCategories(rootCategories)
}

export const createCategory = (data) => {
  const slug = data.slug || generateSlug(data.name)
  
  return {
    name: data.name.trim(),
    description: data.description?.trim() || '',
    slug,
    parentId: data.parentId || null,
    image: data.image || null,
    sortOrder: parseInt(data.sortOrder) || 0,
    isActive: data.isActive !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export const updateCategory = (data) => {
  const slug = data.slug || generateSlug(data.name)
  
  return {
    name: data.name.trim(),
    description: data.description?.trim() || '',
    slug,
    parentId: data.parentId || null,
    image: data.image || null,
    sortOrder: parseInt(data.sortOrder) || 0,
    isActive: data.isActive !== false,
    updatedAt: new Date()
  }
}

// Category tree helpers
export const findCategoryPath = (categories, categoryId) => {
  const path = []
  
  const findPath = (cats, targetId, currentPath = []) => {
    for (const cat of cats) {
      const newPath = [...currentPath, cat]
      
      if (cat.id === targetId) {
        path.push(...newPath)
        return true
      }
      
      if (cat.children && cat.children.length > 0) {
        if (findPath(cat.children, targetId, newPath)) {
          return true
        }
      }
    }
    return false
  }
  
  findPath(categories, categoryId)
  return path
}

export const getAllCategoryIds = (category) => {
  const ids = [category.id]
  
  if (category.children && category.children.length > 0) {
    category.children.forEach(child => {
      ids.push(...getAllCategoryIds(child))
    })
  }
  
  return ids
}

export const flattenCategories = (categories) => {
  const flattened = []
  
  const flatten = (cats, level = 0) => {
    cats.forEach(cat => {
      flattened.push({ ...cat, level })
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children, level + 1)
      }
    })
  }
  
  flatten(categories)
  return flattened
}