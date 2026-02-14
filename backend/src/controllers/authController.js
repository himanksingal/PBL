import { issueToken } from '../services/tokenService.js'
import { env } from '../config/env.js'
import { isDatabaseConnected } from '../config/db.js'
import { rolePermissions } from '../services/mockData.js'
import { UserProfile } from '../models/UserProfile.js'
import { LocalCredential } from '../models/LocalCredential.js'
import { verifyPassword } from '../services/passwordService.js'
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
  if (roleList.includes('master-admin')) return 'Master Admin'
  if (roleList.includes('faculty-coordinator')) return 'Faculty Coordinator'
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
    id: profile.externalId,
    role: profile.role,
    name: profile.name,
    email: profile.email || null,
    phone: profile.phone || null,
    department: profile.department || null,
    semester: profile.semester || null,
    graduationYear: profile.graduationYear || null,
    contact: profile.contact || null,
    isMainCoordinator: profile.isMainCoordinator || false,
    mainCoordinatorAssignedBy: profile.mainCoordinatorAssignedBy || null,
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
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      department: user.department || null,
      semester: user.semester || null,
      graduationYear: user.graduationYear || null,
      contact: user.contact || null,
      isMainCoordinator: user.isMainCoordinator || false,
      mainCoordinatorAssignedBy: user.mainCoordinatorAssignedBy || null,
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
    id: user.id,
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
    return res.status(503).json({
      error: 'Keycloak is not configured. Set KEYCLOAK_* values in backend/.env.',
    })
  }

  const state = createLoginState()
  registerState(state)

  return res.redirect(buildAuthorizationUrl(state))
}

export async function keycloakCallback(req, res) {
  try {
    if (!keycloakEnabled()) {
      return res.status(503).send('Keycloak not configured.')
    }

    const { code, state } = req.query
    if (!code || !state || !consumeState(state)) {
      return res.status(400).send('Invalid keycloak callback state.')
    }

    const tokenData = await exchangeCodeForTokens(code)
    const claims = decodeJwtPayload(tokenData.id_token)
    if (!claims) {
      return res.status(400).send('Unable to decode keycloak token.')
    }

    const role = mapKeycloakRole(claims)
    const user = {
      id: claims.sub,
      role,
      name: claims.name || claims.preferred_username || 'User',
      email: claims.email || null,
      phone: claims.phone_number || null,
      contact: [claims.email, claims.phone_number].filter(Boolean).join(' | ') || null,
      department: claims.department || null,
      semester: claims.semester || null,
      graduationYear: claims.graduationYear || null,
    }

    const profile = await upsertUserProfile(user, 'keycloak')

    const appToken = issueToken({
      role,
      source: 'keycloak',
      id: profile.id,
      name: profile.name,
      email: profile.email,
      department: profile.department,
    })

    setSessionCookie(res, appToken)
    setKeycloakIdTokenCookie(res, tokenData.id_token)
    return res.redirect(new URL('/home', env.frontendUrl).toString())
  } catch (error) {
    return res.status(500).send(error.message)
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
