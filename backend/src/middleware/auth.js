import { decodeToken } from '../services/tokenService.js'
import { UserProfile } from '../models/UserProfile.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const bearer = header.replace('Bearer ', '')
  const cookieToken = req.cookies?.app_session || ''
  const token = bearer || cookieToken
  const decoded = decodeToken(token)

  if (!decoded || !decoded.role) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (decoded.id) {
    const profile = await UserProfile.findOne({ externalId: decoded.id }).lean()
    if (profile) {
      req.user = {
        id: profile.externalId,
        registrationNumber: profile.registrationNumber || profile.externalId,
        name: profile.name,
        role: profile.role,
        email: profile.email,
        phone: profile.phone,
        department: profile.department,
        branch: profile.branch || null,
        semester: profile.semester,
        graduationYear: profile.graduationYear,
        assignedFacultyRegistrationNumber: profile.assignedFacultyRegistrationNumber || null,
      }
      return next()
    }
  }

  if (decoded.id && decoded.name) {
    req.user = {
      id: decoded.id,
      registrationNumber: decoded.registrationNumber || decoded.id,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email || null,
      phone: null,
      department: decoded.department || null,
      branch: decoded.branch || null,
      semester: null,
      graduationYear: null,
      assignedFacultyRegistrationNumber: null,
    }
    return next()
  }

  return res.status(401).json({ error: 'Unauthorized' })
}
