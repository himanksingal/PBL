import mongoose from 'mongoose'

const UserProfileSchema = new mongoose.Schema(
  {
    authSource: { type: String, enum: ['local', 'keycloak'], default: 'local' },
    role: { type: String, required: true },
    externalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    department: { type: String, default: null },
    semester: { type: String, default: null },
    graduationYear: { type: String, default: null },
    contact: { type: String, default: null },
    isMainCoordinator: { type: Boolean, default: false },
    mainCoordinatorAssignedBy: { type: String, default: null },
  },
  {
    timestamps: true,
  }
)

export const UserProfile = mongoose.model('UserProfile', UserProfileSchema)
