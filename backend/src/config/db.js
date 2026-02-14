import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDatabase() {
  if (!env.mongodbUri) {
    console.warn('MONGODB_URI not set. Running without database connection.')
    return false
  }
  try {
    await mongoose.connect(env.mongodbUri, {
      dbName: env.mongodbDbName,
    })
    console.log('Connected to MongoDB')
    return true
  } catch (error) {
    console.warn(`MongoDB connection failed. Running without database. (${error.message})`)
    return false
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}
