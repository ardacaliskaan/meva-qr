const bcrypt = require('bcryptjs')

async function generatePasswordHash() {
  const password = 'admin123'
  const hash = await bcrypt.hash(password, 12)
  
  console.log('Password:', password)
  console.log('Hash:', hash)
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hash)
  console.log('Hash is valid:', isValid)
}

generatePasswordHash()