import { env } from '../config/env.js'
import { isDatabaseConnected } from '../config/db.js'
import { LocalCredential } from '../models/LocalCredential.js'
import { UserProfile } from '../models/UserProfile.js'
import { hashPassword } from './passwordService.js'

export async function ensureBootstrapAdmin() {
  if (!isDatabaseConnected()) return
  if (!env.bootstrapAdminUsername || !env.bootstrapAdminPassword) return

  const existingCredential = await LocalCredential.findOne({
    username: env.bootstrapAdminUsername,
  }).lean()
  if (existingCredential) return

  const externalId = env.bootstrapAdminId || 'ADMIN-0001'

  const profile = await UserProfile.findOneAndUpdate(
    { externalId },
    {
      authSource: 'local',
      role: 'Master Admin',
      externalId,
      name: env.bootstrapAdminName || 'Master Admin',
      email: env.bootstrapAdminEmail || null,
      phone: env.bootstrapAdminPhone || null,
      department: 'Administration',
      semester: null,
      graduationYear: null,
      contact:
        [env.bootstrapAdminEmail, env.bootstrapAdminPhone].filter(Boolean).join(' | ') || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  await LocalCredential.create({
    userId: profile._id,
    userExternalId: profile.externalId,
    username: env.bootstrapAdminUsername,
    passwordHash: hashPassword(env.bootstrapAdminPassword),
    mustResetPassword: false,
    passwordUpdatedAt: new Date(),
  })

  console.log(`Bootstrap admin created: ${env.bootstrapAdminUsername}`)
}
