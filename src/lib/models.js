// Menu Item Model
export const createMenuItem = (data) => {
  return {
    name: data.name,
    description: data.description,
    price: parseFloat(data.price),
    category: data.category,
    image: data.image || null,
    allergens: data.allergens || [],
    available: data.available !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Order Model  
export const createOrder = (data) => {
  return {
    tableNumber: parseInt(data.tableNumber),
    items: data.items.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity)
    })),
    totalAmount: parseFloat(data.totalAmount),
    status: data.status || 'pending', // pending, preparing, ready, completed
    customerNotes: data.customerNotes || '',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Validation functions
export const validateMenuItem = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Ürün adı en az 2 karakter olmalıdır')
  }
  
  if (!data.description || data.description.trim().length < 5) {
    errors.push('Ürün açıklaması en az 5 karakter olmalıdır')  
  }
  
  if (!data.price || data.price <= 0) {
    errors.push('Fiyat 0\'dan büyük olmalıdır')
  }
  
  if (!data.category || data.category.trim().length < 2) {
    errors.push('Kategori seçilmelidir')
  }
  
  return errors
}

export const validateOrder = (data) => {
  const errors = []
  
  if (!data.tableNumber || data.tableNumber < 1) {
    errors.push('Geçerli masa numarası giriniz')
  }
  
  if (!data.items || data.items.length === 0) {
    errors.push('En az bir ürün seçilmelidir')
  }
  
  if (!data.totalAmount || data.totalAmount <= 0) {
    errors.push('Toplam tutar hesaplanamadı')
  }
  
  return errors
}