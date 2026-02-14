import mongoose from 'mongoose'

const LocalCredentialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile',
      required: true,
      unique: true,
      index: true,
      sparse: true,
    },
    // legacy field kept optional for backward compatibility during migration
    userExternalId: { type: String, required: false },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    mustResetPassword: { type: Boolean, default: true },
    passwordUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const LocalCredential = mongoose.model('LocalCredential', LocalCredentialSchema)
