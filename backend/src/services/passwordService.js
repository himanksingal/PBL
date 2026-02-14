import bcrypt from 'bcrypt'

// 10-12 rounds is a practical default for most app backends.
const HASH_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12)

export function hashPassword(password) {
  return bcrypt.hashSync(password, HASH_ROUNDS)
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false
  return bcrypt.compareSync(password, storedHash)
}
