import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import {
  assignStudentsToFaculty,
  listFacultyOptions,
  listStudentOptions,
} from '../controllers/assignmentController.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('assign-guide'))

router.get('/faculties', listFacultyOptions)
router.get('/students', listStudentOptions)
router.post('/link', assignStudentsToFaculty)

export default router
