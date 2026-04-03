import 'dotenv/config'
import mongoose from 'mongoose'
import { UserProfile } from './src/models/UserProfile.js'
import { env } from './src/config/env.js'

async function check() {
  await mongoose.connect(env.mongodbUri)
  const roles = await UserProfile.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ])
  console.log("Roles in DB:", roles)
  await mongoose.disconnect()
}

check().catch(console.error)
