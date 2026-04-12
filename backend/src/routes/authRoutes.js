import { Router } from 'express'
import {
  keycloakCallback,
  keycloakLogin,
  login,
  logout,
  refreshSession,
  resetFirstLoginPassword,
} from '../controllers/authController.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/login', loginLimiter, login)
router.post('/reset-first-login-password', loginLimiter, resetFirstLoginPassword)
router.post('/logout', logout)
router.post('/refresh', refreshSession)
router.get('/keycloak/login', keycloakLogin)
router.get('/keycloak/callback', keycloakCallback)

export default router
