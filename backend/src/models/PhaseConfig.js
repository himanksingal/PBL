import mongoose from 'mongoose'

const PhaseConfigSchema = new mongoose.Schema(
  {
    phaseId: { type: Number, required: true, unique: true }, // 1 (Proposal), 2 (Docs), 3 (MidTerm), 4 (FinalDocs), 5 (EndTerm)
    title: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    fields: [{
      name: String,
      label: String,
      type: { type: String, enum: ['text', 'textarea', 'dropdown', 'file', 'date', 'url'] },
      required: Boolean,
      options: [String], // for dropdowns
    }],
    evaluationParams: [{
      name: String,
      label: String,
      weightage: Number,
    }],
    isEvaluationPhase: { type: Boolean, default: false }, // Phase 3 (Midterm) and 5 (Endterm)
  },
  { timestamps: true }
)

export const PhaseConfig = mongoose.model('PhaseConfig', PhaseConfigSchema)
