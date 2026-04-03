import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import {
  getPhaseConfigs,
  updatePhaseConfig,
  deletePhaseConfig,
  submitPhase,
  getStudentSubmissions,
  reviewSubmission,
  evaluateStudent,
  lockEvaluations,
  unlockEvaluations,
  editSubmissionForms,
  getStudentAllSubmissions,
  getMyPhaseSubmission
} from '../controllers/phaseController.js'

const uploadRoot = path.resolve(process.cwd(), 'backend', 'uploads', 'phases')
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadRoot)
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
    cb(null, `${Date.now()}-${safeName}`)
  },
})

const uploadPhaseDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

const router = Router()

// Public / Any Authenticated User
router.get('/config', authenticate, getPhaseConfigs)

// Student Actions
// 'submit-update' permission is typical for students
router.get('/my-submissions/:phaseId', authenticate, requirePermission('submit-update'), getMyPhaseSubmission)
router.post('/submit/:phaseId', authenticate, requirePermission('submit-update'), uploadPhaseDocument.any(), submitPhase)

// Faculty / Coordinator / Admin Actions
router.get('/submissions', authenticate, requirePermission('view-student'), getStudentSubmissions)
router.patch('/review/:submissionId', authenticate, requirePermission('remark'), reviewSubmission)
router.patch('/edit-submission/:submissionId', authenticate, requirePermission('set-assessments'), editSubmissionForms)
router.get('/student-submissions/:studentReg', authenticate, requirePermission('view-student'), getStudentAllSubmissions)
router.post('/evaluate', authenticate, requirePermission('remark'), evaluateStudent)

// Coordinator / Admin Actions
router.patch('/evaluate/lock', authenticate, requirePermission('set-assessments'), lockEvaluations)
router.patch('/evaluate/unlock', authenticate, requirePermission('set-assessments'), unlockEvaluations)
router.put('/config/:phaseId', authenticate, requirePermission('set-assessments'), updatePhaseConfig)
router.delete('/config/:phaseId', authenticate, requirePermission('set-assessments'), deletePhaseConfig)

export default router
