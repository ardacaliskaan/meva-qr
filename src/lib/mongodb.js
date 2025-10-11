import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant-qr'
const options = {}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // Development ortamında global variable kullan
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // Production ortamında yeni client oluştur
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise