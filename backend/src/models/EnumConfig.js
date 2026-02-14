import mongoose from 'mongoose'

const EnumConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    options: {
      type: [String],
      default: [],
      validate: {
        validator(values) {
          return values.every((item) => typeof item === 'string' && item.trim().length > 0)
        },
        message: 'All enum options must be non-empty strings.',
      },
    },
  },
  { timestamps: true }
)

export const EnumConfig = mongoose.model('EnumConfig', EnumConfigSchema)
