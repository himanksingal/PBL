import { rolePermissions } from '../services/mockData.js'

export function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role
    const allowed = rolePermissions[role] || []
    if (!allowed.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
