import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import {
  exportAllStudentResponses,
  exportAssignedStudentResponses,
  getAssignedStudentsWithSubmissions,
  grantPblResubmit,
  editPblSubmission
} from '../controllers/facultyController.js'
import {
  getStudentDashboardPanelConfig,
  updateStudentDashboardPanelConfig,
} from '../controllers/studentDashboardConfigController.js'

const router = Router()

router.use(authenticate)
router.use(requirePermission('view-student'))

router.get('/students', getAssignedStudentsWithSubmissions)
router.get('/responses/export', exportAssignedStudentResponses)
router.get('/responses/export-all', exportAllStudentResponses)
router.get('/student-dashboard-panel', getStudentDashboardPanelConfig)
router.put('/student-dashboard-panel', updateStudentDashboardPanelConfig)
router.patch('/responses/resubmit', grantPblResubmit)
router.put('/responses/:id', requirePermission('set-assessments'), editPblSubmission)

export default router
