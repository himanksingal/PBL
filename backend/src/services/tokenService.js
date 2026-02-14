import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function issueToken(payload, expiresInSeconds = 8 * 60 * 60) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: expiresInSeconds })
}

export function decodeToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret)
  } catch {
    return null
  }
}
