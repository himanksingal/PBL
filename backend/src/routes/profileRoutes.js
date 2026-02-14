import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getProfile } from '../controllers/profileController.js'

const router = Router()

router.get('/', authenticate, getProfile)

export default router
