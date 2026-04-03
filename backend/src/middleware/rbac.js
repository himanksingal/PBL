import { rolePermissions } from '../services/permissions.js'

export function requirePermission(permission) {
  return (req, res, next) => {
    const baseRole = req.user?.role
    const role =
      baseRole === 'Faculty' && req.user?.isCoordinator ? 'Faculty Coordinator' : baseRole
    const allowed = rolePermissions[role] || []
    if (!allowed.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
