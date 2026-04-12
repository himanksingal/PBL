import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { env } from '../config/env.js'

let client = null

function getJwksClient() {
  if (!client && env.keycloakUrl && env.keycloakRealm) {
    const baseUrl = `${env.keycloakUrl.replace(/\/$/, '')}/realms/${env.keycloakRealm}/protocol/openid-connect`
    client = jwksClient({
      jwksUri: `${baseUrl}/certs`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 100
    })
  }
  return client
}

function getKey(header, callback) {
  const c = getJwksClient()
  if (!c) {
    return callback(new Error('JWKS client not configured'))
  }
  c.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    const signingKey = key.getPublicKey()
    callback(null, signingKey)
  })
}

export function issueToken(payload, expiresInSeconds = 8 * 60 * 60) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: expiresInSeconds })
}

export function verifyLocalToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret)
  } catch (err) {
    throw new Error(`Local JWT verification failed: ${err.message}`)
  }
}

export function verifyKeycloakToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      issuer: `${env.keycloakUrl.replace(/\/$/, '')}/realms/${env.keycloakRealm}`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) return reject(new Error(`Keycloak JWT verification failed: ${err.message}`))
      resolve(decoded)
    })
  })
}

// Added an export for parsing the unverified token safely to check 'iss'
export function decodeTokenUnsafe(token) {
  return jwt.decode(token)
}
