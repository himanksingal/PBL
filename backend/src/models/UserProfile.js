import mongoose from 'mongoose'

const UserProfileSchema = new mongoose.Schema(
  {
    //  Role
    role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },

    //  Identity
    registrationNumber: { type: String, required: true, unique: true, index: true },

    //  Auth Linking
    keycloakId: { type: String, unique: true, sparse: true },

    //  Common Info
    firstName: { type: String, required: true },
    lastName: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },

    //  Academic / Organization
    department: { type: String, default: null },
    branch: { type: String, default: null },

    //  Student Fields
    semester: { type: String, default: null },
    graduationYear: { type: String, default: null },

    //  Faculty Fields
    dateOfJoining: { type: Date, default: null },
    isCoordinator: { type: Boolean, default: false },

    //  Relationships
    assignedFacultyRegistrationNumber: { type: String, default: null },

    //  Metadata
    enrollmentDate: { type: Date, default: null },
    coordinatorSince: { type: Date, default: null },
    adminSince: { type: Date, default: null }
  },
  {
    timestamps: true
  }
)

export const UserProfile = mongoose.model('UserProfile', UserProfileSchema)