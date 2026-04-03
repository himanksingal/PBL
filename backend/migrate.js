import 'dotenv/config'
import mongoose from 'mongoose'
import { UserProfile } from './src/models/UserProfile.js'
import { env } from './src/config/env.js'

async function migrate() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDbName })
  console.log('Connected to MongoDB for migration...')

  const romToNum = { 'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6', 'VII': '7', 'VIII': '8' }
  
  for (const [rom, num] of Object.entries(romToNum)) {
    const res = await UserProfile.updateMany({ semester: rom }, { $set: { semester: num } })
    console.log(`Updated semester ${rom} to ${num}: ${res.modifiedCount} modified.`)
  }

  const roleRes = await UserProfile.updateMany(
    { role: 'Faculty Coordinator' },
    { $set: { role: 'Faculty', isCoordinator: true } },
    { strict: false }
  )
  console.log(`Updated Faculty Coordinators: ${roleRes.modifiedCount} modified.`)

  await mongoose.disconnect()
  console.log('Migration completed.')
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
