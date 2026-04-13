import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getUploadUrl,
  confirmUpload,
  getDownloadUrl,
  downloadFile,
  listFiles,
} from '../controllers/fileController.js'

const router = Router()

// All routes require authentication
router.post('/upload-url', authenticate, getUploadUrl)
router.post('/confirm-upload', authenticate, confirmUpload)
router.get('/download-url', authenticate, getDownloadUrl)
router.get('/download', authenticate, downloadFile)
router.get('/list', authenticate, listFiles)

export default router
