import mongoose from 'mongoose'

const ScheduleCardSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    dateText: { type: String, required: true, trim: true },
    timeText: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const StudentDashboardConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    midTermScheduleTitle: { type: String, default: 'Mid Term Evaluation Schedule' },
    scheduleCards: {
      type: [ScheduleCardSchema],
      default: [
        { label: '6TH SEM | PBL-4', dateText: 'FEB 18', timeText: '09:30 AM - 05:00 PM' },
        { label: '4TH SEM | PBL-2', dateText: 'FEB 19', timeText: '09:30 AM - 05:00 PM' },
      ],
    },
    strictRulesTitle: { type: String, default: 'Strict Rules' },
    strictRules: {
      type: [String],
      default: [
        'Hosting via live page (GitHub) only.',
        'Use full registration ID in form.',
        '7-8 mins presentation + 2 mins Q&A.',
        'No entry in form = no presentation.',
      ],
    },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
)

export const StudentDashboardConfig = mongoose.model('StudentDashboardConfig', StudentDashboardConfigSchema)
