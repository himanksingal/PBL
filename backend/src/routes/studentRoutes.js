import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { uploadOfferLetter } from '../middleware/upload.js'
import {
  exportPblPresentations,
  getExaminerByGuide,
  submitPblPresentation,
} from '../controllers/studentController.js'

const router = Router()

router.get('/examiner', authenticate, requirePermission('submit-update'), getExaminerByGuide)
router.post(
  '/pbl-presentations',
  authenticate,
  requirePermission('submit-update'),
  uploadOfferLetter.single('offerLetterPdf'),
  submitPblPresentation
)
router.get('/pbl-presentations/export', authenticate, requirePermission('submit-update'), exportPblPresentations)

export default router
