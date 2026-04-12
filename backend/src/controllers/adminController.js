import { isDatabaseConnected } from '../config/db.js'
import { UserProfile } from '../models/UserProfile.js'
import { EnumConfig } from '../models/EnumConfig.js'
import { enumDefaults } from '../services/enumDefaults.js'
import { ensureDb, parsePagination } from '../lib/helpers.js'

function buildSearchFilter(search) {
  if (!search) return {}
  const regex = new RegExp(search, 'i')
  return {
    $or: [
      { registrationNumber: regex },
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
      { department: regex },
      { branch: regex },
      { semester: regex },
      { role: regex },
    ],
  }
}

function normalizeUser(document) {
  return {
    id: document.registrationNumber,
    registrationNumber: document.registrationNumber,
    firstName: document.firstName,
    lastName: document.lastName || null,
    role: document.role,
    keycloakId: document.keycloakId || null,
    email: document.email,
    phone: document.phone,
    department: document.department,
    branch: document.branch,
    semester: document.semester,
    assignedFacultyRegistrationNumber: document.assignedFacultyRegistrationNumber || null,
    isCoordinator: document.isCoordinator || false,
  }
}

async function getEnumValues(key) {
  if (!isDatabaseConnected()) return enumDefaults[key] || []
  const doc = await EnumConfig.findOne({ key }).lean()
  if (!doc?.options?.length) return enumDefaults[key] || []
  return doc.options
}

async function buildUserPayload(body) {
  const firstName = String(body.firstName || '').trim()
  const lastName = body.lastName ? String(body.lastName).trim() : null

  const payload = {
    registrationNumber: body.id ? String(body.id).trim() : (body.registrationNumber ? String(body.registrationNumber).trim() : null),
    firstName,
    lastName,
    role: String(body.role || '').trim(),
    email: body.email ? String(body.email).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    department: body.department ? String(body.department).trim() : null,
    branch: body.branch ? String(body.branch).trim() : null,
    semester: body.semester ? String(body.semester).trim() : null,
    assignedFacultyRegistrationNumber: body.assignedFacultyRegistrationNumber
      ? String(body.assignedFacultyRegistrationNumber).trim()
      : null,
    isCoordinator: body.isCoordinator === true || body.isCoordinator === 'true',
  }

  if (!payload.registrationNumber || !payload.firstName || !payload.role) {
    return { error: 'registration number, first name and role are required.' }
  }

  const allowedRoles = await getEnumValues('roles')

  if (!allowedRoles.includes(payload.role)) {
    return { error: 'Invalid role.' }
  }

  return { payload }
}



export async function getAdminStats(req, res) {
  if (!ensureDb(res)) return

  const [students, faculty, admins, totalUsers] = await Promise.all([
    UserProfile.countDocuments({ role: 'student' }),
    UserProfile.countDocuments({ role: 'faculty' }),
    UserProfile.countDocuments({ role: 'admin' }),
    UserProfile.countDocuments({}),
  ])

  return res.json({ students, faculty, admins, totalUsers })
}

export async function listUsers(req, res) {
  if (!ensureDb(res)) return

  const {
    search = '',
    semester = '',
    department = '',
    branch = '',
    role = '',
    sortBy = 'firstName',
    sortOrder = 'asc',
  } = req.query
  const { page, pageSize, skip } = parsePagination(req.query)

  const filter = {
    ...buildSearchFilter(search),
  }

  if (semester) filter.semester = semester
  if (department) filter.department = department
  if (branch) filter.branch = branch
  
  if (role && role !== 'all') filter.role = role

  const allowedSort = new Set(['firstName', 'lastName', 'semester', 'role', 'registrationNumber'])
  const sortField = allowedSort.has(sortBy) ? sortBy : 'firstName'
  const sortDir = sortOrder === 'desc' ? -1 : 1

  const [users, total] = await Promise.all([
    UserProfile.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    UserProfile.countDocuments(filter),
  ])

  return res.json({
    users: users.map((user) => normalizeUser(user)),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  })
}

export async function createUser(req, res) {
  if (!ensureDb(res)) return

  const { payload, error } = await buildUserPayload(req.body)
  if (error) return res.status(400).json({ error })

  const created = await UserProfile.findOneAndUpdate(
    { registrationNumber: payload.registrationNumber },
    {
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      department: payload.department,
      branch: payload.branch,
      semester: payload.semester,
      assignedFacultyRegistrationNumber: payload.assignedFacultyRegistrationNumber,
      isCoordinator: payload.isCoordinator,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return res.status(201).json({ user: normalizeUser(created) })
}

export async function updateUser(req, res) {
  if (!ensureDb(res)) return

  const userIdentifier = req.params.id
  const existingProfile = await UserProfile.findOne({ registrationNumber: userIdentifier }).lean()

  if (!existingProfile) {
    return res.status(404).json({ error: 'User not found.' })
  }

  const { payload, error } = await buildUserPayload(
    { ...req.body, id: req.body?.registrationNumber || existingProfile.registrationNumber }
  )
  if (error) return res.status(400).json({ error })

  const regConflict = await UserProfile.findOne({
    registrationNumber: payload.registrationNumber,
    _id: { $ne: existingProfile._id },
  }).lean()
  if (regConflict) {
    return res.status(409).json({ error: 'Registration number already exists.' })
  }

  const updated = await UserProfile.findOneAndUpdate(
    { _id: existingProfile._id },
    {
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      registrationNumber: payload.registrationNumber,
      email: payload.email,
      phone: payload.phone,
      department: payload.department,
      branch: payload.branch,
      semester: payload.semester,
      assignedFacultyRegistrationNumber: payload.assignedFacultyRegistrationNumber,
      isCoordinator: payload.isCoordinator,
    },
    { new: true }
  ).lean()

  return res.json({ user: normalizeUser(updated) })
}

export async function deleteUser(req, res) {
  if (!ensureDb(res)) return

  const userIdentifier = req.params.id
  const target = await UserProfile.findOne({ registrationNumber: userIdentifier }).lean()

  if (!target) {
    return res.status(404).json({ error: 'User not found.' })
  }

  if (req.user?.registrationNumber === target.registrationNumber) {
    return res.status(400).json({ error: 'You cannot delete your own account.' })
  }

  await UserProfile.findByIdAndDelete(target._id)
  return res.status(204).send()
}
