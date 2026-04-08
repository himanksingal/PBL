import mongoose from 'mongoose'

const UserProfileSchema = new mongoose.Schema(
  {
    //  Role
    role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },

    //  Identity
    registrationNumber: { type: String, required: true, unique: true, index: true },

    //  Auth Linking
    keycloakId: { type: String, unique: true, sparse: true },
    localAuth: { type: Boolean, default: false },

    //  Common Info
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },

    //  Academic / Organization
    department: { type: String, default: null },
    branch: { type: String, default: null },

    //  Student Fields
    semester: { type: String, default: null },
    graduationYear: { type: String, default: null },
    section: { type: String, default: null },
    cgpa: { type: Number, default: null },

    //  Faculty Fields
    designation: { type: String, default: null },
    dateOfJoining: { type: Date, default: null },
    isCoordinator: { type: Boolean, default: false },

    //  Relationships
    assignedFacultyRegistrationNumber: { type: String, default: null },

    //  Profile Enhancements
    profilePicture: { type: String, default: null },
    bio: { type: String, default: null },

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