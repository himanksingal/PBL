import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { env } from './config/env.js'
import { connectDatabase } from './config/db.js'
import { ensureBootstrapAdmin } from './services/bootstrapService.js'
import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use('/uploads', express.static(path.resolve(process.cwd(), 'backend', 'uploads')))

app.get('/', (req, res) => {
  res.json({
    message: 'MUJ Minor Project Portal API',
    endpoints: ['/api/health', '/api/auth/login', '/api/profile'],
  })
})

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/admin', adminRoutes)

app.use((error, req, res, next) => {
  if (error) {
    return res.status(400).json({ error: error.message || 'Request failed' })
  }
  return next()
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

async function startServer() {
  await connectDatabase()
  await ensureBootstrapAdmin()

  const server = app.listen(env.port, env.host, () => {
    console.log(`API listening on http://${env.host}:${env.port}`)
  })

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use. Set PORT in backend/.env and restart.`)
      process.exit(1)
    }
    throw error
  })
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message)
  process.exit(1)
})
