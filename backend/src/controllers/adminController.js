import { isDatabaseConnected } from '../config/db.js'
import { UserProfile } from '../models/UserProfile.js'
import { LocalCredential } from '../models/LocalCredential.js'
import { hashPassword } from '../services/passwordService.js'

function buildSearchFilter(search) {
  if (!search) return {}
  const regex = new RegExp(search, 'i')
  return {
    $or: [
      { externalId: regex },
      { name: regex },
      { email: regex },
      { phone: regex },
      { department: regex },
      { semester: regex },
      { graduationYear: regex },
      { role: regex },
    ],
  }
}

function normalizeUser(document, credentialByUserId) {
  const credential = credentialByUserId?.get(String(document._id))
  return {
    id: document.externalId,
    name: document.name,
    role: document.role,
    authSource: document.authSource || 'local',
    username: credential?.username || null,
    mustResetPassword: Boolean(credential?.mustResetPassword),
    email: document.email,
    phone: document.phone,
    department: document.department,
    semester: document.semester,
    graduationYear: document.graduationYear,
    contact: document.contact,
    isMainCoordinator: Boolean(document.isMainCoordinator),
    mainCoordinatorAssignedBy: document.mainCoordinatorAssignedBy || null,
  }
}

async function findCredentialForProfile(profile) {
  return LocalCredential.findOne({
    $or: [{ userId: profile._id }, { userExternalId: profile.externalId }],
  }).lean()
}

function buildUserPayload(body, { isCreate }) {
  const payload = {
    id: String(body.id || '').trim(),
    name: String(body.name || '').trim(),
    role: String(body.role || '').trim(),
    authSource: String(body.authSource || 'local').trim().toLowerCase(),
    username: body.username ? String(body.username).trim() : null,
    password: body.password ? String(body.password) : null,
    forcePasswordReset:
      body.forcePasswordReset === undefined
        ? null
        : body.forcePasswordReset === true ||
          body.forcePasswordReset === 'true' ||
          body.forcePasswordReset === 1 ||
          body.forcePasswordReset === '1',
    email: body.email ? String(body.email).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    department: body.department ? String(body.department).trim() : null,
    semester: body.semester ? String(body.semester).trim() : null,
    graduationYear: body.graduationYear ? String(body.graduationYear).trim() : null,
    contact: body.contact ? String(body.contact).trim() : null,
    isMainCoordinator: Boolean(body.isMainCoordinator),
    mainCoordinatorAssignedBy: body.mainCoordinatorAssignedBy
      ? String(body.mainCoordinatorAssignedBy).trim()
      : null,
  }

  if (!payload.id || !payload.name || !payload.role) {
    return { error: 'id, name and role are required.' }
  }

  if (!['Student', 'Faculty Coordinator', 'Master Admin'].includes(payload.role)) {
    return { error: 'Invalid role.' }
  }

  if (!['local', 'keycloak'].includes(payload.authSource)) {
    return { error: 'Invalid authSource. Use local or keycloak.' }
  }

  if (payload.authSource === 'local') {
    if (!payload.username) {
      return { error: 'username is required for local auth users.' }
    }
    if (isCreate && !payload.password) {
      return { error: 'password is required for new local auth users.' }
    }
    if (payload.password && payload.password.length < 8) {
      return { error: 'password must be at least 8 characters.' }
    }
  }

  if (payload.role !== 'Faculty Coordinator') {
    payload.isMainCoordinator = false
    payload.mainCoordinatorAssignedBy = null
  }

  if (!payload.contact) {
    payload.contact = [payload.email, payload.phone].filter(Boolean).join(' | ') || null
  }

  return { payload }
}

function ensureDb(res) {
  if (isDatabaseConnected()) return true
  res.status(503).json({ error: 'Database unavailable.' })
  return false
}

export async function getAdminStats(req, res) {
  if (!ensureDb(res)) return

  const [students, faculty, admins, totalUsers] = await Promise.all([
    UserProfile.countDocuments({ role: 'Student' }),
    UserProfile.countDocuments({ role: 'Faculty Coordinator' }),
    UserProfile.countDocuments({ role: 'Master Admin' }),
    UserProfile.countDocuments({}),
  ])

  return res.json({ students, faculty, admins, totalUsers })
}

export async function listUsers(req, res) {
  if (!ensureDb(res)) return

  const { search = '', semester = '', graduationYear = '', role = '', sortBy = 'name', sortOrder = 'asc' } =
    req.query

  const filter = {
    ...buildSearchFilter(search),
  }

  if (semester) filter.semester = semester
  if (graduationYear) filter.graduationYear = graduationYear
  if (role) filter.role = role

  const allowedSort = new Set(['name', 'semester', 'graduationYear', 'role', 'externalId'])
  const sortField = allowedSort.has(sortBy) ? sortBy : 'name'
  const sortDir = sortOrder === 'desc' ? -1 : 1

  const users = await UserProfile.find(filter)
    .sort({ [sortField]: sortDir })
    .lean()

  const userIds = users.map((user) => user._id)
  const externalIds = users.map((user) => user.externalId)
  const credentials = await LocalCredential.find({
    $or: [{ userId: { $in: userIds } }, { userExternalId: { $in: externalIds } }],
  })
    .select({ userId: 1, userExternalId: 1, username: 1, mustResetPassword: 1, _id: 0 })
    .lean()

  const externalIdByMongoId = new Map(users.map((user) => [user.externalId, String(user._id)]))
  const credentialByUserId = new Map()
  credentials.forEach((item) => {
    if (item.userId) {
      credentialByUserId.set(String(item.userId), item)
      return
    }
    if (item.userExternalId && externalIdByMongoId.has(item.userExternalId)) {
      credentialByUserId.set(externalIdByMongoId.get(item.userExternalId), item)
    }
  })

  return res.json({
    users: users.map((user) => normalizeUser(user, credentialByUserId)),
  })
}

export async function createUser(req, res) {
  if (!ensureDb(res)) return

  const { payload, error } = buildUserPayload(req.body, { isCreate: true })
  if (error) return res.status(400).json({ error })

  const existingProfile = await UserProfile.findOne({ externalId: payload.id }).lean()
  if (existingProfile) {
    return res.status(409).json({ error: 'User id already exists.' })
  }

  if (payload.authSource === 'local') {
    const existingUsername = await LocalCredential.findOne({ username: payload.username }).lean()
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already exists.' })
    }
  }

  const created = await UserProfile.create({
    externalId: payload.id,
    role: payload.role,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    department: payload.department,
    semester: payload.semester,
    graduationYear: payload.graduationYear,
    contact: payload.contact,
    isMainCoordinator: payload.isMainCoordinator,
    mainCoordinatorAssignedBy: payload.mainCoordinatorAssignedBy,
    authSource: payload.authSource,
  })

  if (payload.authSource === 'local') {
    await LocalCredential.create({
      userId: created._id,
      userExternalId: created.externalId,
      username: payload.username,
      passwordHash: hashPassword(payload.password),
      mustResetPassword: payload.forcePasswordReset ?? true,
      passwordUpdatedAt: new Date(),
    })
  }

  return res.status(201).json({ user: normalizeUser(created, new Map()) })
}

export async function updateUser(req, res) {
  if (!ensureDb(res)) return

  const userId = req.params.id
  const { payload, error } = buildUserPayload({ ...req.body, id: userId }, { isCreate: false })
  if (error) return res.status(400).json({ error })

  const current = await UserProfile.findOne({ externalId: userId }).lean()
  if (!current) {
    return res.status(404).json({ error: 'User not found.' })
  }

  const existingCredential = await findCredentialForProfile(current)

  if (payload.authSource === 'local') {
    if (!payload.username && !existingCredential) {
      return res.status(400).json({ error: 'username is required for local auth users.' })
    }

    if (payload.username) {
      const sameUsernameOnAnother = await LocalCredential.findOne({
        username: payload.username,
        userId: { $ne: current._id },
      }).lean()
      if (sameUsernameOnAnother) {
        return res.status(409).json({ error: 'Username already exists.' })
      }
    }

    const updateSet = {}
    if (payload.username) updateSet.username = payload.username
    if (payload.password) updateSet.passwordHash = hashPassword(payload.password)
    if (payload.forcePasswordReset === true || payload.password) updateSet.mustResetPassword = true
    if (payload.forcePasswordReset === false && !payload.password) updateSet.mustResetPassword = false
    if (payload.password) updateSet.passwordUpdatedAt = new Date()

    if (existingCredential) {
      const selector = existingCredential.userId
        ? { userId: current._id }
        : { userExternalId: current.externalId }
      if (Object.keys(updateSet).length > 0) {
        await LocalCredential.updateOne(selector, {
          $set: { ...updateSet, userId: current._id, userExternalId: current.externalId },
        })
      }
    } else {
      await LocalCredential.create({
        userId: current._id,
        userExternalId: current.externalId,
        username: payload.username,
        passwordHash: hashPassword(payload.password || 'ChangeMe@123'),
        mustResetPassword: payload.forcePasswordReset ?? true,
        passwordUpdatedAt: new Date(),
      })
    }
  } else {
    await LocalCredential.deleteOne({
      $or: [{ userId: current._id }, { userExternalId: current.externalId }],
    })
  }

  const updated = await UserProfile.findOneAndUpdate(
    { externalId: userId },
    {
      role: payload.role,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      department: payload.department,
      semester: payload.semester,
      graduationYear: payload.graduationYear,
      contact: payload.contact,
      isMainCoordinator: payload.isMainCoordinator,
      mainCoordinatorAssignedBy: payload.mainCoordinatorAssignedBy,
      authSource: payload.authSource,
    },
    { new: true }
  ).lean()

  const credential = await LocalCredential.findOne({
    $or: [{ userId: current._id }, { userExternalId: current.externalId }],
  })
    .select({ userId: 1, userExternalId: 1, username: 1, mustResetPassword: 1, _id: 0 })
    .lean()

  return res.json({
    user: normalizeUser(updated, new Map(credential ? [[String(current._id), credential]] : [])),
  })
}

export async function deleteUser(req, res) {
  if (!ensureDb(res)) return

  const userId = req.params.id

  if (req.user?.id === userId) {
    return res.status(400).json({ error: 'You cannot delete your own account.' })
  }

  const deleted = await UserProfile.findOneAndDelete({ externalId: userId }).lean()
  if (!deleted) {
    return res.status(404).json({ error: 'User not found.' })
  }

  await LocalCredential.deleteOne({
    $or: [{ userId: deleted._id }, { userExternalId: deleted.externalId }],
  })
  return res.status(204).send()
}
