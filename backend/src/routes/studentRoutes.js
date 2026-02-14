import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { uploadOfferLetter } from '../middleware/upload.js'
import {
  exportPblPresentations,
  getAssignedFacultyForStudent,
  getExaminerByGuide,
  getMySubmissionStatus,
  submitPblPresentation,
} from '../controllers/studentController.js'
import { getStudentDashboardPanelConfig as getPanelConfigFromFacultyController } from '../controllers/studentDashboardConfigController.js'

const router = Router()

router.get('/examiner', authenticate, requirePermission('submit-update'), getExaminerByGuide)
router.get('/assigned-faculty', authenticate, requirePermission('submit-update'), getAssignedFacultyForStudent)
router.get('/dashboard-panel', authenticate, requirePermission('view-project'), getPanelConfigFromFacultyController)
router.get('/pbl-presentations/status', authenticate, requirePermission('submit-update'), getMySubmissionStatus)
router.post(
  '/pbl-presentations',
  authenticate,
  requirePermission('submit-update'),
  uploadOfferLetter.single('offerLetterPdf'),
  submitPblPresentation
)
router.get('/pbl-presentations/export', authenticate, requirePermission('view-student'), exportPblPresentations)

export default router
