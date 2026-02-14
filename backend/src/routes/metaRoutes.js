import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getEnums } from '../controllers/metaController.js'

const router = Router()

router.use(authenticate)
router.get('/enums', getEnums)

export default router
