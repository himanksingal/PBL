import { StudentDashboardConfig } from '../models/StudentDashboardConfig.js'
import { isDatabaseConnected } from '../config/db.js'

const DEFAULT_KEY = 'default'

function fallbackConfig() {
  return {
    key: DEFAULT_KEY,
    midTermScheduleTitle: 'Mid Term Evaluation Schedule',
    scheduleCards: [
      { label: '6TH SEM | PBL-4', dateText: 'FEB 18', timeText: '09:30 AM - 05:00 PM' },
      { label: '4TH SEM | PBL-2', dateText: 'FEB 19', timeText: '09:30 AM - 05:00 PM' },
    ],
    strictRulesTitle: 'Strict Rules',
    strictRules: [
      'Hosting via live page (GitHub) only.',
      'Use full registration ID in form.',
      '7-8 mins presentation + 2 mins Q&A.',
      'No entry in form = no presentation.',
    ],
  }
}

async function getOrCreateConfig() {
  let doc = await StudentDashboardConfig.findOne({ key: DEFAULT_KEY }).lean()
  if (!doc) {
    const created = await StudentDashboardConfig.create(fallbackConfig())
    doc = created.toObject()
  }
  return doc
}

export async function getStudentDashboardPanelConfig(req, res) {
  if (!isDatabaseConnected()) {
    return res.json({ config: fallbackConfig(), source: 'fallback' })
  }

  const config = await getOrCreateConfig()
  return res.json({ config, source: 'database' })
}

export async function updateStudentDashboardPanelConfig(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database unavailable.' })
  }

  if (req.user?.role !== 'Faculty Coordinator') {
    return res.status(403).json({ error: 'Only faculty coordinator can edit this panel.' })
  }

  const payload = req.body || {}

  const scheduleCards = Array.isArray(payload.scheduleCards)
    ? payload.scheduleCards
        .map((card) => ({
          label: String(card?.label || '').trim(),
          dateText: String(card?.dateText || '').trim(),
          timeText: String(card?.timeText || '').trim(),
        }))
        .filter((card) => card.label && card.dateText && card.timeText)
    : []

  const strictRules = Array.isArray(payload.strictRules)
    ? payload.strictRules.map((item) => String(item || '').trim()).filter(Boolean)
    : []

  if (scheduleCards.length === 0) {
    return res.status(400).json({ error: 'At least one schedule card is required.' })
  }

  if (strictRules.length === 0) {
    return res.status(400).json({ error: 'At least one strict rule is required.' })
  }

  const updated = await StudentDashboardConfig.findOneAndUpdate(
    { key: DEFAULT_KEY },
    {
      key: DEFAULT_KEY,
      midTermScheduleTitle: String(payload.midTermScheduleTitle || 'Mid Term Evaluation Schedule').trim(),
      scheduleCards,
      strictRulesTitle: String(payload.strictRulesTitle || 'Strict Rules').trim(),
      strictRules,
      updatedBy: req.user.registrationNumber || req.user.id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()

  return res.json({ message: 'Student dashboard panel updated.', config: updated })
}
