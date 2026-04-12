import { env } from '../config/env.js'
import { isDatabaseConnected } from '../config/db.js'
import { UserProfile } from '../models/UserProfile.js'
import {
  buildAuthorizationUrl,
  buildLogoutUrl,
  consumeState,
  createLoginState,
  exchangeCodeForTokens,
  keycloakEnabled,
  refreshAccessToken,
  registerState,
} from '../lib/keycloak.js'
import { decodeTokenUnsafe } from '../services/tokenService.js'

function setSessionCookie(res, token) {
  res.cookie('app_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  })
}

function setKeycloakIdTokenCookie(res, idToken) {
  res.cookie('kc_id_token', idToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  })
}

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('kc_refresh', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  })
}

function toUserPayload(profile) {
  return {
    id: profile.registrationNumber,
    registrationNumber: profile.registrationNumber,
    role: profile.role,
    firstName: profile.firstName,
    lastName: profile.lastName || null,
    email: profile.email || null,
    phone: profile.phone || null,
    department: profile.department || null,
    branch: profile.branch || null,
    semester: profile.semester || null,
    graduationYear: profile.graduationYear || null,
    isCoordinator: profile.isCoordinator || false,
  }
}

// ─────────────────────────────────────────────
// LOCAL AUTHENTICATION (DISABLED)
// ─────────────────────────────────────────────

export async function login(req, res) {
  return res.status(403).json({
    error: 'Local login is disabled. Please use Keycloak to continue.',
  })
}

export async function resetFirstLoginPassword(req, res) {
  return res.status(403).json({
    error: 'Local login is disabled. Please use Keycloak to continue.',
  })
}

// ─────────────────────────────────────────────
// KEYCLOAK AUTHENTICATION
// ─────────────────────────────────────────────

export function keycloakLogin(req, res) {
  if (!keycloakEnabled()) {
    return res.status(503).json({
      error: 'Keycloak is not configured.',
    })
  }

  const state = createLoginState()
  registerState(state)
  const url = buildAuthorizationUrl(state)
  return res.redirect(url)
}

function mapKeycloakGroupsToRole(groups) {
  if (!groups || !Array.isArray(groups) || groups.length === 0) return null
  if (groups.some(g => g.startsWith('/admin'))) return 'admin'
  if (groups.some(g => g.startsWith('/faculties'))) return 'faculty'
  if (groups.some(g => g.startsWith('/students'))) return 'student'
  return null
}

export async function keycloakCallback(req, res) {
  try {
    if (!keycloakEnabled()) return res.status(503).send('Keycloak not configured.')

    const { code, state, error: kcError, error_description } = req.query

    if (kcError) {
      console.error(`[keycloak] Auth error: ${kcError} - ${error_description || ''}`)
      return res.redirect(`${env.frontendUrl}/login?error=${encodeURIComponent(kcError)}`)
    }

    if (!code || !state || !consumeState(state)) {
      return res.status(400).send('Invalid keycloak callback — missing or expired state/code.')
    }

    const tokenData = await exchangeCodeForTokens(code)

    const accessClaims = tokenData.access_token ? decodeTokenUnsafe(tokenData.access_token) : null
    const idClaims = tokenData.id_token ? decodeTokenUnsafe(tokenData.id_token) : null
    const claims = idClaims || accessClaims

    if (!claims) return res.status(400).send('Unable to parse keycloak token.')

    const keycloakId = claims.sub
    const registrationNumber = claims.registration_number || claims.registrationNumber || claims.preferred_username || keycloakId

    // Resolve role from Keycloak groups (returns null if no groups match)
    const groupRole = mapKeycloakGroupsToRole(accessClaims?.groups || claims.groups)

    if (isDatabaseConnected()) {
      // Build lookup conditions — only include keycloakId when it's valid
      const lookupConditions = []
      if (keycloakId) lookupConditions.push({ keycloakId })
      lookupConditions.push({ registrationNumber: new RegExp(`^${registrationNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })

      const existingProfile = await UserProfile.findOne({
        $or: lookupConditions
      }).lean()

      // Diagnostic logging
      console.log(`[keycloak] Callback lookup: keycloakId=${keycloakId}, registrationNumber=${registrationNumber}`)
      if (existingProfile) {
        console.log(`[keycloak] Matched profile: registrationNumber=${existingProfile.registrationNumber}, role=${existingProfile.role}, keycloakId=${existingProfile.keycloakId || 'NOT SET'}`)
      }

      if (!existingProfile) {
        console.warn(`[keycloak] Callback: user not found for keycloakId=${keycloakId} registrationNumber=${registrationNumber}`)
        return res.redirect(`${env.frontendUrl}/login?error=${encodeURIComponent('user_not_found')}`)
      }

      // Safety check: if this keycloakId is already linked to a DIFFERENT profile, don't overwrite
      if (existingProfile.keycloakId && existingProfile.keycloakId !== keycloakId) {
        console.warn(`[keycloak] Profile ${existingProfile.registrationNumber} is linked to a different keycloakId (${existingProfile.keycloakId}), not linking ${keycloakId}`)
      }

      // Lazy-link keycloakId if missing (only if we have a valid keycloakId)
      const updates = {}
      if (keycloakId && !existingProfile.keycloakId) {
        updates.keycloakId = keycloakId
        console.log(`[keycloak] Lazy-linked keycloakId=${keycloakId} to registrationNumber=${existingProfile.registrationNumber}`)
      }

      // Override role only if Keycloak groups explicitly resolve one
      if (groupRole) {
        updates.role = groupRole
      }

      if (Object.keys(updates).length > 0) {
        await UserProfile.updateOne({ _id: existingProfile._id }, { $set: updates })
      }
    }

    // Set Keycloak tokens directly — no custom JWT duplication
    setSessionCookie(res, tokenData.access_token)
    if (tokenData.refresh_token) {
      setRefreshTokenCookie(res, tokenData.refresh_token)
    }
    if (tokenData.id_token) {
      setKeycloakIdTokenCookie(res, tokenData.id_token)
    }

    return res.redirect(new URL('/home', env.frontendUrl).toString())
  } catch (error) {
    console.error('[keycloak] Callback error:', error.message)
    return res.redirect(`${env.frontendUrl}/login?error=${encodeURIComponent(error.message)}`)
  }
}

export function logout(req, res) {
  const idToken = req.cookies?.kc_id_token || ''
  res.clearCookie('app_session', { path: '/' })
  res.clearCookie('kc_id_token', { path: '/' })
  res.clearCookie('kc_refresh', { path: '/' })

  if (idToken && keycloakEnabled()) {
    return res.json({ logoutUrl: buildLogoutUrl(idToken) })
  }

  return res.status(204).send()
}

// Called by middleware for silent refresh — also exported for manual refresh endpoint
export async function refreshSession(req, res) {
  const refreshToken = req.cookies?.kc_refresh
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token available' })
  }

  try {
    const tokenData = await refreshAccessToken(refreshToken)
    setSessionCookie(res, tokenData.access_token)
    if (tokenData.refresh_token) {
      setRefreshTokenCookie(res, tokenData.refresh_token)
    }
    if (tokenData.id_token) {
      setKeycloakIdTokenCookie(res, tokenData.id_token)
    }
    return res.json({ refreshed: true })
  } catch (err) {
    console.warn('[auth] Session refresh failed:', err.message)
    res.clearCookie('app_session', { path: '/' })
    res.clearCookie('kc_refresh', { path: '/' })
    res.clearCookie('kc_id_token', { path: '/' })
    return res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
}
