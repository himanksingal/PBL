import { env } from '../config/env.js'
import { isDatabaseConnected } from '../config/db.js'
import { UserProfile } from '../models/UserProfile.js'

export async function ensureBootstrapAdmin() {
  if (!isDatabaseConnected()) return
  if (!env.bootstrapAdminUsername || !env.bootstrapAdminPassword) return

  // Migration: Lowercase all roles
  const rolesToUpdate = [
    { old: 'Student', new: 'student' },
    { old: 'Faculty', new: 'faculty' },
    { old: 'Master Admin', new: 'admin' }
  ]
  for (const { old: oldRole, new: newRole } of rolesToUpdate) {
    await UserProfile.updateMany(
      { role: oldRole },
      { $set: { role: newRole } }
    )
  }

  await UserProfile.updateMany(
    {},
    {
      $unset: {
        contact: '',
        assignedFacultyId: '',
        isMainCoordinator: '',
        mainCoordinatorAssignedBy: '',
        externalId: '',
        authSource: ''
      },
    }
  )

  // Drop deprecated indexes
  try {
    await UserProfile.collection.dropIndex('externalId_1')
  } catch (err) {
    if (err.code !== 27) { // 27 = IndexNotFound
      console.log('Skipped dropping externalId_1 index (not found or error)')
    }
  }

  // Drop another potential old index
  try {
    await UserProfile.collection.dropIndex('userExternalId_1')
  } catch (err) {
    // Ignore if not present
  }

  const registrationNumber = env.bootstrapAdminId || 'ADMIN-0001'

  // Ensure admin profile exists in MongoDB for Keycloak lazy-linking
  await UserProfile.findOneAndUpdate(
    { registrationNumber },
    {
      role: 'admin',
      registrationNumber,
      salutation: null,
      firstName: env.bootstrapAdminName || 'Admin',
      lastName: null,
      name: env.bootstrapAdminName || 'Admin',
      email: env.bootstrapAdminEmail || null,
      phone: env.bootstrapAdminPhone || null,
      department: 'Administration',
      branch: null,
      semester: null,
      graduationYear: null,
      assignedFacultyRegistrationNumber: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  console.log(`Bootstrap admin profile ensured: ${registrationNumber}`)
}
