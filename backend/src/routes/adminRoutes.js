import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import {
  createUser,
  deleteUser,
  getAdminStats,
  listUsers,
  updateUser,
} from '../controllers/adminController.js'
import { updateEnums } from '../controllers/metaController.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('manage-users'))

router.get('/stats', getAdminStats)
router.get('/users', listUsers)
router.post('/users', createUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.put('/enums', updateEnums)

export default router
