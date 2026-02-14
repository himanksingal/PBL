import { Router } from 'express'
import { keycloakCallback, keycloakLogin, login, logout } from '../controllers/authController.js'

const router = Router()

router.post('/login', login)
router.post('/logout', logout)
router.get('/keycloak/login', keycloakLogin)
router.get('/keycloak/callback', keycloakCallback)

export default router
