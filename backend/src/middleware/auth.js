import { verifyKeycloakToken, decodeTokenUnsafe } from '../services/tokenService.js'
import { refreshAccessToken } from '../lib/keycloak.js'
import { env } from '../config/env.js'
import { UserProfile } from '../models/UserProfile.js'

function mapKeycloakGroupsToRole(groups) {
  if (!groups || !Array.isArray(groups)) return null

  if (groups.some(g => g.startsWith('/admin'))) return 'admin'
  if (groups.some(g => g.startsWith('/faculties'))) return 'faculty'
  if (groups.some(g => g.startsWith('/students'))) return 'student'

  return null
}

function setSessionCookie(res, token) {
  res.cookie('app_session', token, {
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

export async function authenticate(req, res, next) {
  try {
    // 1. Extract token from Bearer header or cookie
    const header = req.headers.authorization || ''
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
    const cookieToken = req.cookies?.app_session || ''
    let token = bearer || cookieToken

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }

    // 2. Verify token via JWKS — if expired, attempt silent refresh
    try {
      await verifyKeycloakToken(token)
    } catch (err) {
      // Check if the error is specifically an expiration
      if (err.message.includes('expired') || err.message.includes('jwt expired')) {
        const refreshToken = req.cookies?.kc_refresh
        if (refreshToken) {
          try {
            const tokenData = await refreshAccessToken(refreshToken)
            // Set new cookies on the response
            setSessionCookie(res, tokenData.access_token)
            if (tokenData.refresh_token) {
              setRefreshTokenCookie(res, tokenData.refresh_token)
            }
            // Use the new access token for this request
            token = tokenData.access_token
            console.log('[auth] Access token refreshed silently')
          } catch (refreshErr) {
            console.warn('[auth] Silent refresh failed:', refreshErr.message)
            return res.status(401).json({ error: 'Session expired. Please log in again.' })
          }
        } else {
          return res.status(401).json({ error: 'Session expired. Please log in again.' })
        }
      } else {
        console.error('[auth] Token verification failed:', err.message)
        return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' })
      }
    }

    // 3. Decode full payload (signature already verified above)
    //    jwt.verify() strips `sub` in some jsonwebtoken versions — jwt.decode() returns the complete payload
    const decoded = decodeTokenUnsafe(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized: Unable to decode token' })
    }

    const keycloakId = decoded.sub || null
    const username = decoded.preferred_username || keycloakId
    const roles = decoded.realm_access?.roles || []
    const groups = Array.isArray(decoded.groups) ? decoded.groups : []

    if (!keycloakId && !username) {
      console.error('[auth] Token has no sub or preferred_username')
      return res.status(401).json({ error: 'Unauthorized: Token missing identity claims' })
    }

    // 4. User lookup: keycloakId first (only if set), registrationNumber fallback (case-insensitive)
    let profile = null
    if (keycloakId) {
      profile = await UserProfile.findOne({ keycloakId }).lean()
    }
    if (!profile && username) {
      profile = await UserProfile.findOne({
        registrationNumber: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      }).lean()
    }

    if (!profile) {
      console.warn(`[auth] User not found for keycloakId=${keycloakId} username=${username}`)
      return res.status(401).json({ error: 'Unauthorized: User not found in system' })
    }

    // 5. Lazy-link: store keycloakId if missing (only if we have a valid keycloakId)
    if (keycloakId && !profile.keycloakId) {
      await UserProfile.updateOne({ _id: profile._id }, { $set: { keycloakId } })
      profile.keycloakId = keycloakId
      console.log(`[auth] Lazy-linked keycloakId=${keycloakId} to registrationNumber=${profile.registrationNumber}`)
    }

    // 6. Role resolution — Keycloak groups override DB if they match
    let finalRole = profile.role
    const groupRole = mapKeycloakGroupsToRole(groups)
    if (groupRole) finalRole = groupRole
    if (!finalRole) finalRole = 'student'

    // 7. Build req.user
    req.user = {
      id: profile.registrationNumber,
      registrationNumber: profile.registrationNumber,
      keycloakId: profile.keycloakId,
      firstName: profile.firstName || null,
      lastName: profile.lastName || null,
      role: finalRole,
      email: profile.email || null,
      phone: profile.phone || null,
      department: profile.department || null,
      branch: profile.branch || null,
      semester: profile.semester || null,
      graduationYear: profile.graduationYear || null,
      isCoordinator: profile.isCoordinator || false,
      assignedFacultyRegistrationNumber: profile.assignedFacultyRegistrationNumber || null,
      roles,
      groups,
    }

    return next()
  } catch (err) {
    console.error('[auth middleware] Unexpected error:', err)
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' })
  }
}
