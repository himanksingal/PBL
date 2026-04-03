import mongoose from 'mongoose'

const PhaseEvaluationSchema = new mongoose.Schema(
  {
    studentRegistrationNumber: { type: String, required: true },
    phaseId: { type: Number, required: true }, // Usually 3 (Midterm) or 5 (Endterm)
    evaluatorRegistrationNumber: { type: String, required: true },
    marks: { type: Map, of: Number }, // Parameter Name -> Score
    totalScore: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// One evaluation per phase per student
PhaseEvaluationSchema.index({ studentRegistrationNumber: 1, phaseId: 1 }, { unique: true })

export const PhaseEvaluation = mongoose.model('PhaseEvaluation', PhaseEvaluationSchema)
