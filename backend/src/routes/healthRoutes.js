import { Router } from 'express'
import { isDatabaseConnected } from '../config/db.js'
import { env } from '../config/env.js'

const router = Router()

router.get('/', async (req, res) => {
  const dbStatus = isDatabaseConnected() ? 'connected' : 'disconnected'
  let keycloakStatus = 'disabled'

  if (env.keycloakUrl && env.keycloakRealm) {
    try {
      const pingUrl = `${env.keycloakUrl.replace(/\/$/, '')}/realms/${env.keycloakRealm}/.well-known/openid-configuration`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(pingUrl, { method: 'GET', signal: controller.signal })
      clearTimeout(timeoutId)
      
      keycloakStatus = response.ok ? 'connected' : 'unreachable'
    } catch (e) {
      keycloakStatus = 'unreachable'
    }
  }

  const overallStatus = dbStatus === 'connected' && (keycloakStatus === 'disabled' || keycloakStatus === 'connected') ? 'healthy' : 'degraded'

  return res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    services: {
      server: 'running',
      database: dbStatus,
      keycloak: keycloakStatus
    },
    timestamp: new Date().toISOString()
  })
})

export default router
