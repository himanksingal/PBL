import crypto from 'node:crypto'
import { env } from '../config/env.js'

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf-8')
}

function sign(content) {
  return crypto.createHmac('sha256', env.jwtSecret).update(content).digest('base64url')
}

export function issueToken(payload, expiresInSeconds = 8 * 60 * 60) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const headerPart = toBase64Url(JSON.stringify(header))
  const payloadPart = toBase64Url(JSON.stringify(body))
  const unsignedToken = `${headerPart}.${payloadPart}`
  const signature = sign(unsignedToken)
  return `${unsignedToken}.${signature}`
}

export function decodeToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerPart, payloadPart, signaturePart] = parts
  const unsignedToken = `${headerPart}.${payloadPart}`
  const expectedSignature = sign(unsignedToken)

  const signatureBuffer = Buffer.from(signaturePart)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const header = JSON.parse(fromBase64Url(headerPart))
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null

    const payload = JSON.parse(fromBase64Url(payloadPart))
    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp !== 'number' || payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}
