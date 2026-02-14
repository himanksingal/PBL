import { issueToken } from '../services/tokenService.js'
import { env } from '../config/env.js'
import { isDatabaseConnected } from '../config/db.js'
import { rolePermissions } from '../services/mockData.js'
import { UserProfile } from '../models/UserProfile.js'
import { LocalCredential } from '../models/LocalCredential.js'
import { hashPassword, verifyPassword } from '../services/passwordService.js'
import {
  buildAuthorizationUrl,
  buildLogoutUrl,
  consumeState,
  createLoginState,
  decodeJwtPayload,
  exchangeCodeForTokens,
  keycloakEnabled,
  registerState,
} from '../lib/keycloak.js'

function mapKeycloakRole(claims) {
  const roleList = claims?.realm_access?.roles || []
  console.log('[keycloak] realm roles received:', roleList)
  if (roleList.includes('master-admin')) return 'Master Admin'
  if (roleList.includes('faculty-coordinator')) return 'Faculty Coordinator'
  if (roleList.includes('faculty')) return 'Faculty'
  return 'Student'
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

function setKeycloakIdTokenCookie(res, idToken) {
  res.cookie('kc_id_token', idToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  })
}

function toUserPayload(profile) {
  return {
    id: profile.registrationNumber || profile.externalId,
    internalId: profile.externalId,
    registrationNumber: profile.registrationNumber || profile.externalId,
    role: profile.role,
    name: profile.name,
    email: profile.email || null,
    phone: profile.phone || null,
    department: profile.department || null,
    branch: profile.branch || null,
    semester: profile.semester || null,
    graduationYear: profile.graduationYear || null,
  }
}

async function upsertUserProfile(user, authSource) {
  if (!isDatabaseConnected()) return user

  const profile = await UserProfile.findOneAndUpdate(
    { externalId: user.id },
    {
      authSource,
      role: user.role,
      externalId: user.id,
      registrationNumber: user.registrationNumber || user.id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      department: user.department || null,
      branch: user.branch || null,
      semester: user.semester || null,
      graduationYear: user.graduationYear || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()

  return toUserPayload(profile)
}

export async function login(req, res) {
  if (!env.localLoginEnabled) {
    return res.status(403).json({ error: 'Local login disabled. Use Keycloak sign in.' })
  }

  if (!isDatabaseConnected()) {
    return res.status(503).json({
      error: 'Database unavailable. Local auth requires MongoDB. Use Keycloak or restore DB.',
    })
  }

  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  const credential = await LocalCredential.findOne({ username: String(username).trim() }).lean()
  if (!credential || !verifyPassword(password, credential.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  if (credential.mustResetPassword) {
    return res.status(428).json({
      error: 'Password reset required before first login.',
      requiresPasswordReset: true,
      username: credential.username,
    })
  }

  let profile = null
  if (credential.userId) {
    profile = await UserProfile.findById(credential.userId).lean()
  } else if (credential.userExternalId) {
    // legacy fallback path for old credential records
    profile = await UserProfile.findOne({ externalId: credential.userExternalId }).lean()
    if (profile) {
      await LocalCredential.updateOne(
        { username: credential.username },
        { $set: { userId: profile._id, userExternalId: profile.externalId } }
      )
    }
  }
  if (!profile) {
    return res.status(401).json({ error: 'User profile not found for this account.' })
  }

  const user = toUserPayload(profile)
  const token = issueToken({
    role: user.role,
    source: 'local',
    id: profile.externalId,
    registrationNumber: user.registrationNumber,
    name: user.name,
    email: user.email,
    department: user.department,
  })
  setSessionCookie(res, token)

  return res.json({
    user,
    permissions: rolePermissions[user.role] || [],
  })
}

export async function resetFirstLoginPassword(req, res) {
  if (!env.localLoginEnabled) {
    return res.status(403).json({ error: 'Local login disabled. Use Keycloak sign in.' })
  }

  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database unavailable.' })
  }

  const { username, currentPassword, newPassword } = req.body
  if (!username || !currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: 'username, currentPassword and newPassword are required.' })
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' })
  }

  const credential = await LocalCredential.findOne({ username: String(username).trim() })
  if (!credential || !verifyPassword(currentPassword, credential.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  credential.passwordHash = hashPassword(newPassword)
  credential.mustResetPassword = false
  credential.passwordUpdatedAt = new Date()
  await credential.save()

  let profile = null
  if (credential.userId) {
    profile = await UserProfile.findById(credential.userId).lean()
  } else if (credential.userExternalId) {
    profile = await UserProfile.findOne({ externalId: credential.userExternalId }).lean()
  }

  if (!profile) {
    return res.status(404).json({ error: 'User profile not found for this account.' })
  }

  const user = toUserPayload(profile)
  const token = issueToken({
    role: user.role,
    source: 'local',
    id: profile.externalId,
    registrationNumber: user.registrationNumber,
    name: user.name,
    email: user.email,
    department: user.department,
  })
  setSessionCookie(res, token)

  return res.json({
    user,
    permissions: rolePermissions[user.role] || [],
  })
}

export function keycloakLogin(req, res) {
  if (!keycloakEnabled()) {
    console.error('[keycloak] Login attempted but Keycloak is not configured. Check KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET in .env')
    return res.status(503).json({
      error: 'Keycloak is not configured. Set KEYCLOAK_* values in backend/.env.',
    })
  }

  const state = createLoginState()
  registerState(state)
  const url = buildAuthorizationUrl(state)


  return res.redirect(url)
}

export async function keycloakCallback(req, res) {
  try {
    if (!keycloakEnabled()) {
      console.error('[keycloak] Callback hit but Keycloak is not configured')
      return res.status(503).send('Keycloak not configured.')
    }

    const { code, state, error: kcError, error_description } = req.query

    // Keycloak can redirect back with an error instead of a code
    if (kcError) {
      console.error(`[keycloak] Auth error from Keycloak: ${kcError} - ${error_description || ''}`)
      return res.redirect(`${env.frontendUrl}/login?error=${encodeURIComponent(kcError)}`)
    }

    if (!code || !state) {
      console.error('[keycloak] Missing code or state in callback query:', req.query)
      return res.status(400).send('Invalid keycloak callback — missing code or state.')
    }

    if (!consumeState(state)) {
      console.error('[keycloak] Invalid or expired state:', state)
      return res.status(400).send('Invalid keycloak callback — state expired or unknown.')
    }


    const tokenData = await exchangeCodeForTokens(code)

    // Decode access_token for roles (realm_access lives here)
    // Decode id_token for profile info (name, email, etc.)
    const accessClaims = tokenData.access_token ? decodeJwtPayload(tokenData.access_token) : null
    const idClaims = tokenData.id_token ? decodeJwtPayload(tokenData.id_token) : null
    const claims = idClaims || accessClaims

    if (!claims) {
      console.error('[keycloak] Failed to decode any JWT payload')
      return res.status(400).send('Unable to decode keycloak token.')
    }


    // Use access_token for role mapping (Keycloak puts realm_access there, not in id_token)
    const role = mapKeycloakRole(accessClaims || claims)
    const user = {
      id: claims.sub,
      registrationNumber:
        claims.registration_number || claims.registrationNumber || claims.preferred_username || claims.sub,
      role,
      name: claims.name || claims.preferred_username || 'User',
      email: claims.email || null,
      phone: claims.phone_number || null,
      department: claims.department || null,
      branch: claims.branch || null,
      semester: claims.semester || null,
      graduationYear: claims.graduationYear || null,
    }

    const profile = await upsertUserProfile(user, 'keycloak')


    const appToken = issueToken({
      role,
      source: 'keycloak',
      id: profile.internalId || profile.id,
      registrationNumber: profile.registrationNumber || profile.id,
      name: profile.name,
      email: profile.email,
      department: profile.department,
    })

    setSessionCookie(res, appToken)
    if (tokenData.id_token) {
      setKeycloakIdTokenCookie(res, tokenData.id_token)
    }


    return res.redirect(new URL('/home', env.frontendUrl).toString())
  } catch (error) {
    console.error('[keycloak] Callback error:', error.message, error.stack)
    return res.redirect(`${env.frontendUrl}/login?error=${encodeURIComponent(error.message)}`)
  }
}

export function logout(req, res) {
  const idToken = req.cookies?.kc_id_token || ''
  res.clearCookie('app_session', { path: '/' })
  res.clearCookie('kc_id_token', { path: '/' })

  if (idToken && keycloakEnabled()) {
    return res.json({ logoutUrl: buildLogoutUrl(idToken) })
  }

  return res.status(204).send()
}
