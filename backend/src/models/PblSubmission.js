import mongoose from 'mongoose'

const PblSubmissionSchema = new mongoose.Schema(
  {
    submissionType: {
      type: String,
      enum: ['major-project', 'internship', 'project'],
      required: true,
    },
    registrationId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    pbl: { type: String, default: null },
    onlineLink: { type: String, default: null },
    githubRepo: { type: String, default: null },
    projectName: { type: String, default: null },
    companyName: { type: String, default: null },
    domainJobProfile: { type: String, default: null },
    internshipStartDate: { type: Date, default: null },
    internshipEndDate: { type: Date, default: null },
    offerLetterPath: { type: String, default: null },
    submittedBy: { type: String, required: true },
    submittedByRole: { type: String, required: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    resubmitGranted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

export const PblSubmission = mongoose.model('PblSubmission', PblSubmissionSchema)
