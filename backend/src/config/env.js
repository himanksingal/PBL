import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT) || 5001,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5001',
  mongodbUri: process.env.MONGODB_URI || '',
  mongodbDbName: process.env.MONGODB_DB_NAME || 'muj_portal',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  keycloakUrl: process.env.KEYCLOAK_URL || '',
  keycloakRealm: process.env.KEYCLOAK_REALM || '',
  keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || '',
  keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  localLoginEnabled: process.env.LOCAL_LOGIN_ENABLED !== 'false',
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  bootstrapAdminId: process.env.LOCAL_BOOTSTRAP_ADMIN_ID || '',
  bootstrapAdminName: process.env.LOCAL_BOOTSTRAP_ADMIN_NAME || '',
  bootstrapAdminEmail: process.env.LOCAL_BOOTSTRAP_ADMIN_EMAIL || '',
  bootstrapAdminPhone: process.env.LOCAL_BOOTSTRAP_ADMIN_PHONE || '',
  bootstrapAdminUsername: process.env.LOCAL_BOOTSTRAP_ADMIN_USERNAME || '',
  bootstrapAdminPassword: process.env.LOCAL_BOOTSTRAP_ADMIN_PASSWORD || '',
}
