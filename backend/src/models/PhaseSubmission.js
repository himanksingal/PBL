import mongoose from 'mongoose'

const PhaseSubmissionSchema = new mongoose.Schema(
  {
    studentRegistrationNumber: { type: String, required: true },
    phaseId: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    formData: { type: mongoose.Schema.Types.Mixed, default: {} }, // Dynamic fields payload
    documents: [{
      label: String,
      url: String,
    }],
    feedback: { type: String, default: null },
    reviewedBy: { type: String, default: null }, // faculty registration number
  },
  { timestamps: true }
)

// One submission per phase per student
PhaseSubmissionSchema.index({ studentRegistrationNumber: 1, phaseId: 1 }, { unique: true })

export const PhaseSubmission = mongoose.model('PhaseSubmission', PhaseSubmissionSchema)
