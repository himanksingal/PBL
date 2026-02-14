import { EnumConfig } from '../models/EnumConfig.js'
import { enumDefaults, enumLabels } from '../services/enumDefaults.js'
import { isDatabaseConnected } from '../config/db.js'

async function getConfigsByKeys(keys) {
  const docs = await EnumConfig.find({ key: { $in: keys } }).lean()
  const byKey = new Map(docs.map((doc) => [doc.key, doc]))

  return keys.reduce((acc, key) => {
    const stored = byKey.get(key)
    acc[key] = {
      key,
      label: stored?.label || enumLabels[key] || key,
      options: stored?.options?.length ? stored.options : enumDefaults[key] || [],
    }
    return acc
  }, {})
}

export async function getEnums(req, res) {
  const keys = Object.keys(enumDefaults)

  if (!isDatabaseConnected()) {
    return res.json({ enums: keys.reduce((acc, key) => ({ ...acc, [key]: { key, label: enumLabels[key], options: enumDefaults[key] } }), {}) })
  }

  const enums = await getConfigsByKeys(keys)
  return res.json({ enums })
}

export async function updateEnums(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database unavailable.' })
  }

  const updates = req.body?.enums
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid payload. Expected { enums: { key: options[] } }' })
  }

  const keys = Object.keys(enumDefaults)
  const operations = []

  for (const key of keys) {
    if (!(key in updates)) continue
    const options = updates[key]
    if (!Array.isArray(options)) {
      return res.status(400).json({ error: `Enum ${key} must be an array.` })
    }

    const cleaned = [...new Set(options.map((item) => String(item).trim()).filter(Boolean))]
    operations.push(
      EnumConfig.updateOne(
        { key },
        {
          $set: {
            key,
            label: enumLabels[key] || key,
            options: cleaned,
          },
        },
        { upsert: true }
      )
    )
  }

  await Promise.all(operations)
  const enums = await getConfigsByKeys(keys)
  return res.json({ message: 'Enums updated.', enums })
}
