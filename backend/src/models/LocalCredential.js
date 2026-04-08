import mongoose from 'mongoose'

const LocalCredentialSchema = new mongoose.Schema(
  {
    // 🔗 Link to UserProfile
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile',
      required: true,
      unique: true,
      index: true,
    },

    // 🔑 Login Credentials
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // 🔄 Security
    mustResetPassword: {
      type: Boolean,
      default: true,
    },
    passwordUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

export const LocalCredential = mongoose.model('LocalCredential', LocalCredentialSchema)