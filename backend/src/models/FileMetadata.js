import mongoose from 'mongoose'

const FileMetadataSchema = new mongoose.Schema(
  {
    objectKey: { type: String, required: true, unique: true },
    originalFileName: { type: String, required: true },
    uploadedBy: { type: String, required: true }, // registrationNumber of uploader
    uploaderRole: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
    accessType: { type: String, enum: ['global', 'faculty', 'student'], required: true },
    assignedFacultyId: { type: String, default: null }, // for zero-lookup RBAC on student files
    linkedEntityId: { type: String, default: null }, // optional: phaseId, submissionId, etc.
    linkedEntityType: { type: String, default: null }, // optional: 'phase-submission', 'pbl', etc.
    status: { type: String, enum: ['pending', 'uploaded'], default: 'pending' },
  },
  { timestamps: true }
)

FileMetadataSchema.index({ uploadedBy: 1 })
FileMetadataSchema.index({ accessType: 1 })
FileMetadataSchema.index({ linkedEntityId: 1, linkedEntityType: 1 })

export const FileMetadata = mongoose.model('FileMetadata', FileMetadataSchema)
