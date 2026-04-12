import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // Limit each IP to 20 auth calls
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const adminBulkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 bulk upload attempts per hour
  message: { error: 'Too many bulk upload attempts from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})
