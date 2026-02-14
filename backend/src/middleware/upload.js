import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'

const uploadRoot = path.resolve(process.cwd(), 'backend', 'uploads', 'offer-letters')
fs.mkdirSync(uploadRoot, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadRoot)
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
    cb(null, `${Date.now()}-${safeName}`)
  },
})

function fileFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') {
    cb(new Error('Only PDF files are allowed.'))
    return
  }
  cb(null, true)
}

export const uploadOfferLetter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})
