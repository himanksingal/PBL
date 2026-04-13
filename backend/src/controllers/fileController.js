import { FileMetadata } from '../models/FileMetadata.js'
import { UserProfile } from '../models/UserProfile.js'
import { env } from '../config/env.js'
import {
  buildObjectKey,
  generateUploadUrl,
  generateDownloadUrl,
  getMinioClient,
} from '../services/minioService.js'

// ─────────────────────────────────────────────
// POST /api/files/upload-url
// ─────────────────────────────────────────────

export async function getUploadUrl(req, res) {
  try {
    const { fileName, accessType, linkedEntityId, linkedEntityType } = req.body

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'fileName is required.' })
    }

    // --- FILE TYPE VALIDATION ---
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.txt', '.csv', '.zip']
    const ext = (fileName || '').toLowerCase().match(/\.[a-z0-9]+$/)?.[0]
    
    if (!ext || !allowedExtensions.includes(ext)) {
      return res.status(400).json({ 
        error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}` 
      })
    }
    // ----------------------------

    // Determine access type with sensible defaults
    const userRole = req.user.role
    let resolvedAccessType = accessType

    if (!resolvedAccessType) {
      if (userRole === 'admin' || req.user.isCoordinator) {
        resolvedAccessType = 'global'
      } else {
        resolvedAccessType = userRole // 'student' or 'faculty'
      }
    }

    const validAccessTypes = ['global', 'faculty', 'student']
    if (!validAccessTypes.includes(resolvedAccessType)) {
      return res.status(400).json({ error: `Invalid accessType. Must be one of: ${validAccessTypes.join(', ')}` })
    }

    // Students can only upload as 'student', faculty as 'faculty' or 'global' (if coordinator)
    if (userRole === 'student' && resolvedAccessType !== 'student') {
      return res.status(403).json({ error: 'Students can only upload files with accessType "student".' })
    }
    if (userRole === 'faculty' && resolvedAccessType === 'student') {
      return res.status(403).json({ error: 'Faculty cannot upload files with accessType "student".' })
    }

    const ownerId = req.user.registrationNumber
    const objectKey = buildObjectKey(resolvedAccessType, ownerId, fileName)

    // Generate the presigned upload URL
    const uploadUrl = await generateUploadUrl(objectKey)

    // Store metadata with pending status
    const metadata = await FileMetadata.create({
      objectKey,
      originalFileName: fileName,
      uploadedBy: ownerId,
      uploaderRole: userRole === 'admin' || req.user.isCoordinator ? 'admin' : userRole,
      accessType: resolvedAccessType,
      assignedFacultyId: userRole === 'student' ? (req.user.assignedFacultyRegistrationNumber || null) : null,
      linkedEntityId: linkedEntityId || null,
      linkedEntityType: linkedEntityType || null,
      status: 'pending',
    })

    return res.json({
      uploadUrl,
      objectKey: metadata.objectKey,
      fileId: metadata._id,
    })
  } catch (err) {
    console.error('[files] Failed to generate upload URL:', err.message)
    return res.status(500).json({ error: 'Failed to generate upload URL.' })
  }
}

// ─────────────────────────────────────────────
// POST /api/files/confirm-upload
// ─────────────────────────────────────────────

export async function confirmUpload(req, res) {
  try {
    const { objectKey } = req.body

    if (!objectKey) {
      return res.status(400).json({ error: 'objectKey is required.' })
    }

    const file = await FileMetadata.findOne({ objectKey })
    if (!file) {
      return res.status(404).json({ error: 'File metadata not found.' })
    }

    // Only the uploader can confirm their own upload
    if (file.uploadedBy !== req.user.registrationNumber) {
      return res.status(403).json({ error: 'You can only confirm your own uploads.' })
    }

    if (file.status === 'uploaded') {
      return res.json({ message: 'File already confirmed.', fileId: file._id })
    }

    file.status = 'uploaded'
    await file.save()

    return res.json({ message: 'Upload confirmed.', fileId: file._id })
  } catch (err) {
    console.error('[files] Failed to confirm upload:', err.message)
    return res.status(500).json({ error: 'Failed to confirm upload.' })
  }
}

// ─────────────────────────────────────────────
// GET /api/files/download-url?objectKey=...
// ─────────────────────────────────────────────

export async function getDownloadUrl(req, res) {
  try {
    const { objectKey } = req.query

    if (!objectKey) {
      return res.status(400).json({ error: 'objectKey query parameter is required.' })
    }

    // 1. File existence check
    const file = await FileMetadata.findOne({ objectKey })
    if (!file) {
      return res.status(404).json({ error: 'File not found.' })
    }

    // 2. Enforce uploaded status
    if (file.status !== 'uploaded') {
      return res.status(404).json({ error: 'File upload is not complete.' })
    }

    // 3. RBAC access check
    const allowed = await checkFileAccess(req.user, file)
    if (!allowed) {
      return res.status(403).json({ error: 'You do not have permission to access this file.' })
    }

    // 4. Generate short-lived download URL
    const downloadUrl = await generateDownloadUrl(objectKey)

    return res.json({
      downloadUrl,
      originalFileName: file.originalFileName,
    })
  } catch (err) {
    console.error('[files] Failed to generate download URL:', err.message)
    return res.status(500).json({ error: 'Failed to generate download URL.' })
  }
}

// ─────────────────────────────────────────────
// GET /api/files/download?objectKey=...
// Streams the file directly from MinIO to the browser
// ─────────────────────────────────────────────

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
}

function getMimeType(fileName) {
  const ext = (fileName || '').toLowerCase().match(/\.[a-z0-9]+$/)?.[0]
  return MIME_TYPES[ext] || 'application/octet-stream'
}

export async function downloadFile(req, res) {
  try {
    const { objectKey } = req.query

    if (!objectKey) {
      return res.status(400).json({ error: 'objectKey query parameter is required.' })
    }

    const file = await FileMetadata.findOne({ objectKey })
    if (!file) {
      return res.status(404).json({ error: 'File not found.' })
    }

    if (file.status !== 'uploaded') {
      return res.status(404).json({ error: 'File upload is not complete.' })
    }

    const allowed = await checkFileAccess(req.user, file)
    if (!allowed) {
      return res.status(403).json({ error: 'You do not have permission to access this file.' })
    }

    // Stream the file from MinIO directly to the response
    const client = getMinioClient()
    const dataStream = await client.getObject(env.minioBucketName, objectKey)

    const contentType = getMimeType(file.originalFileName)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `inline; filename="${file.originalFileName.replace(/"/g, '\\"')}"`)

    dataStream.pipe(res)

    dataStream.on('error', (err) => {
      console.error('[files] MinIO stream error:', err.message)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file.' })
      }
    })
  } catch (err) {
    console.error('[files] Failed to download file:', err.message)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to download file.' })
    }
  }
}

// ─────────────────────────────────────────────
// GET /api/files/list?linkedEntityId=...&linkedEntityType=...
// ─────────────────────────────────────────────

export async function listFiles(req, res) {
  try {
    const { linkedEntityId, linkedEntityType, uploadedBy } = req.query

    const filter = { status: 'uploaded' }
    if (linkedEntityId) filter.linkedEntityId = linkedEntityId
    if (linkedEntityType) filter.linkedEntityType = linkedEntityType
    if (uploadedBy) filter.uploadedBy = uploadedBy

    const files = await FileMetadata.find(filter)
      .select('objectKey originalFileName uploadedBy uploaderRole accessType createdAt')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({ files })
  } catch (err) {
    console.error('[files] Failed to list files:', err.message)
    return res.status(500).json({ error: 'Failed to list files.' })
  }
}

// ─────────────────────────────────────────────
// RBAC Helper
// ─────────────────────────────────────────────

async function checkFileAccess(user, file) {
  const userId = user.registrationNumber
  const userRole = user.role
  const isCoordinator = user.isCoordinator

  // Admin and coordinators can access everything
  if (userRole === 'admin' || isCoordinator) {
    return true
  }

  // Global files are accessible to everyone
  if (file.accessType === 'global') {
    return true
  }

  // Owner always has access
  if (file.uploadedBy === userId) {
    return true
  }

  // Faculty files: students assigned to that faculty can access
  if (file.accessType === 'faculty') {
    if (userRole === 'student') {
      return user.assignedFacultyRegistrationNumber === file.uploadedBy
    }
    // Other faculty cannot see each other's files
    return false
  }

  // Student files: assigned faculty can access (zero-lookup using stored assignedFacultyId)
  if (file.accessType === 'student') {
    if (userRole === 'faculty') {
      // Use the pre-stamped assignedFacultyId for zero-lookup
      if (file.assignedFacultyId) {
        return file.assignedFacultyId === userId
      }
      // Fallback: DB lookup if assignedFacultyId was not stamped (legacy files)
      const student = await UserProfile.findOne({ registrationNumber: file.uploadedBy }).select('assignedFacultyRegistrationNumber').lean()
      return student?.assignedFacultyRegistrationNumber === userId
    }
    return false
  }

  return false
}
