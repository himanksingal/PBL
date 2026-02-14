import { localAuthUsers } from './mockData.js'

const localUserProfiles = localAuthUsers.map((entry) => ({ ...entry.profile }))

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function getLocalProfileById(id) {
  return localUserProfiles.find((user) => user.id === id) || null
}

export function getLocalUsers({ search = '', semester, graduationYear, role, sortBy = 'name', sortOrder = 'asc' }) {
  let users = [...localUserProfiles]

  if (search) {
    const q = normalize(search)
    users = users.filter((user) => {
      const haystack = [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.department,
        user.semester,
        user.graduationYear,
        user.role,
      ]
        .filter(Boolean)
        .map(normalize)
      return haystack.some((value) => value.includes(q))
    })
  }

  if (semester) users = users.filter((user) => String(user.semester || '') === String(semester))
  if (graduationYear) {
    users = users.filter((user) => String(user.graduationYear || '') === String(graduationYear))
  }
  if (role) users = users.filter((user) => user.role === role)

  const dir = sortOrder === 'desc' ? -1 : 1
  const resolvedSortBy = sortBy === 'externalId' ? 'id' : sortBy
  users.sort((a, b) => {
    const left = normalize(a[resolvedSortBy])
    const right = normalize(b[resolvedSortBy])
    if (left < right) return -1 * dir
    if (left > right) return 1 * dir
    return 0
  })

  return users
}

export function getLocalStats() {
  const counts = localUserProfiles.reduce(
    (acc, user) => {
      if (user.role === 'Student') acc.students += 1
      if (user.role === 'Faculty Coordinator' || user.role === 'Faculty') acc.faculty += 1
      if (user.role === 'Master Admin') acc.admins += 1
      return acc
    },
    { students: 0, faculty: 0, admins: 0 }
  )

  return {
    ...counts,
    totalUsers: localUserProfiles.length,
  }
}

export function createLocalUser(input) {
  const newUser = {
    id: input.id,
    name: input.name,
    role: input.role,
    email: input.email || null,
    phone: input.phone || null,
    department: input.department || null,
    branch: input.branch || null,
    semester: input.semester || null,
    graduationYear: input.graduationYear || null,
  }

  localUserProfiles.push(newUser)
  return newUser
}

export function updateLocalUser(id, updates) {
  const index = localUserProfiles.findIndex((user) => user.id === id)
  if (index === -1) return null

  const prev = localUserProfiles[index]
  const next = {
    ...prev,
    ...updates,
    id: prev.id,
  }

  localUserProfiles[index] = next
  return next
}

export function deleteLocalUser(id) {
  const index = localUserProfiles.findIndex((user) => user.id === id)
  if (index === -1) return false
  localUserProfiles.splice(index, 1)
  return true
}
