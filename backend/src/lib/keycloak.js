import crypto from 'node:crypto'
import { env } from '../config/env.js'

const stateStore = new Map()

// Clean up expired states every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, expiresAt] of stateStore) {
    if (now > expiresAt) stateStore.delete(key)
  }
}, 5 * 60 * 1000).unref()

function baseUrl() {
  return `${env.keycloakUrl.replace(/\/$/, '')}/realms/${env.keycloakRealm}/protocol/openid-connect`
}

export function keycloakEnabled() {
  const enabled = Boolean(
    env.keycloakUrl && env.keycloakRealm && env.keycloakClientId && env.keycloakClientSecret
  )
  return enabled
}

export function callbackUrl() {
  return `${env.backendUrl.replace(/\/$/, '')}/api/auth/keycloak/callback`
}

export function createLoginState() {
  return crypto.randomBytes(24).toString('hex')
}

export function registerState(state) {
  stateStore.set(state, Date.now() + 10 * 60 * 1000)
}

export function consumeState(state) {
  const expiresAt = stateStore.get(state)
  if (!expiresAt) return false
  stateStore.delete(state)
  return Date.now() <= expiresAt
}

export function buildAuthorizationUrl(state) {
  const url = new URL(`${baseUrl()}/auth`)
  url.searchParams.set('client_id', env.keycloakClientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid profile email')
  url.searchParams.set('redirect_uri', callbackUrl())
  url.searchParams.set('state', state)
  const authUrl = url.toString()

  return authUrl
}

export function buildLogoutUrl(idTokenHint) {
  const url = new URL(`${baseUrl()}/logout`)
  url.searchParams.set('post_logout_redirect_uri', `${env.frontendUrl.replace(/\/$/, '')}/login`)
  url.searchParams.set('client_id', env.keycloakClientId)
  if (idTokenHint) {
    url.searchParams.set('id_token_hint', idTokenHint)
  }
  return url.toString()
}

export async function exchangeCodeForTokens(code) {
  const response = await fetch(`${baseUrl()}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.keycloakClientId,
      client_secret: env.keycloakClientSecret,
      redirect_uri: callbackUrl(),
      code,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Keycloak token exchange failed: ${body}`)
  }

  return response.json()
}

export function decodeJwtPayload(token) {
  const payload = token.split('.')[1]
  if (!payload) return null
  const json = Buffer.from(payload, 'base64url').toString('utf-8')
  return JSON.parse(json)
}
