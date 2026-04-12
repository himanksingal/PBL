import { rolePermissions } from '../services/permissions.js'

export function requirePermission(permission) {
  return (req, res, next) => {
    const baseRole = req.user?.role
    const role =
      baseRole === 'faculty' && req.user?.isCoordinator ? 'Faculty Coordinator' : baseRole
    const allowed = rolePermissions[role] || []
    if (!allowed.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

export function requireGroup(requiredGroup) {
  return (req, res, next) => {
    const groups = req.user?.groups || []
    if (!groups.includes(requiredGroup)) {
      return res.status(403).json({ error: 'Forbidden: insufficient group membership' })
    }
    next()
  }
}
