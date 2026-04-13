import * as Minio from 'minio'
import { env } from '../config/env.js'

let minioClient = null

/**
 * Returns a singleton MinIO client instance.
 */
export function getMinioClient() {
  if (!minioClient) {
    if (!env.minioAccessKey || !env.minioSecretKey) {
      throw new Error('MinIO credentials are not configured. Set MINIO_ACCESS_KEY and MINIO_SECRET_KEY in .env')
    }

    minioClient = new Minio.Client({
      endPoint: env.minioEndpoint,
      port: env.minioPort,
      useSSL: env.minioUseSsl,
      accessKey: env.minioAccessKey,
      secretKey: env.minioSecretKey,
    })
  }
  return minioClient
}

/**
 * Ensure the configured bucket exists. Create it if missing.
 * Called once during server startup.
 */
export async function ensureBucketExists() {
  if (!env.minioAccessKey || !env.minioSecretKey) {
    console.warn('[minio] Skipping bucket check — credentials not configured.')
    return
  }

  const client = getMinioClient()
  const bucket = env.minioBucketName

  try {
    const exists = await client.bucketExists(bucket)
    if (!exists) {
      await client.makeBucket(bucket)
      console.log(`[minio] Created bucket: ${bucket}`)
    } else {
      console.log(`[minio] Bucket exists: ${bucket}`)
    }
  } catch (err) {
    console.error(`[minio] Failed to ensure bucket "${bucket}":`, err.message)
    throw err
  }
}

/**
 * Sanitize a filename to remove special characters.
 */
export function sanitizeFileName(fileName) {
  return fileName
    .replace(/\s+/g, '_')            // spaces → underscores
    .replace(/[^a-zA-Z0-9._-]/g, '') // strip anything not alphanumeric, dot, dash, underscore
}

/**
 * Build a structured object key.
 * @param {'global'|'faculty'|'student'} accessType
 * @param {string} ownerId – registrationNumber of the uploader
 * @param {string} originalFileName – raw file name from client
 * @returns {string} e.g. "student/23FE10CSE001/1713012345678-report.pdf"
 */
export function buildObjectKey(accessType, ownerId, originalFileName) {
  const safeName = sanitizeFileName(originalFileName)
  const timestamp = Date.now()

  if (accessType === 'global') {
    return `global/${timestamp}-${safeName}`
  }
  return `${accessType}/${ownerId}/${timestamp}-${safeName}`
}

/**
 * Generate a presigned PUT URL so the frontend can upload directly to MinIO.
 * @param {string} objectKey
 * @param {number} [expirySeconds=120] – default 2 minutes
 * @returns {Promise<string>}
 */
export async function generateUploadUrl(objectKey, expirySeconds = 120) {
  const client = getMinioClient()
  return await client.presignedPutObject(env.minioBucketName, objectKey, expirySeconds)
}

/**
 * Generate a presigned GET URL so the frontend can download from MinIO.
 * @param {string} objectKey
 * @param {number} [expirySeconds=300] – default 5 minutes
 * @returns {Promise<string>}
 */
export async function generateDownloadUrl(objectKey, expirySeconds = 300) {
  const client = getMinioClient()
  return await client.presignedGetObject(env.minioBucketName, objectKey, expirySeconds)
}
