import React, { useEffect, useState } from 'react'
import { Card } from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'
import { Button } from '../components/ui/button.jsx'

const defaultConfig = {
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

export default function StudentPanelConfig({ role }) {
  const [config, setConfig] = useState(defaultConfig)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canEdit = role === 'Faculty Coordinator'

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/faculty/student-dashboard-panel', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load panel config.')
      if (data?.config) setConfig(data.config)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateCard = (index, key, value) => {
    setConfig((prev) => ({
      ...prev,
      scheduleCards: prev.scheduleCards.map((card, i) => (i === index ? { ...card, [key]: value } : card)),
    }))
  }

  const updateRule = (index, value) => {
    setConfig((prev) => ({
      ...prev,
      strictRules: prev.strictRules.map((rule, i) => (i === index ? value : rule)),
    }))
  }

  const addCard = () => {
    setConfig((prev) => ({
      ...prev,
      scheduleCards: [...prev.scheduleCards, { label: '', dateText: '', timeText: '' }],
    }))
  }

  const addRule = () => {
    setConfig((prev) => ({
      ...prev,
      strictRules: [...prev.strictRules, ''],
    }))
  }

  const save = async () => {
    if (!canEdit) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/faculty/student-dashboard-panel', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to save panel config.')
      setSuccess('Student dashboard panel updated successfully.')
      if (data?.config) setConfig(data.config)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 px-6 py-4">
      <Card>
        <h1 className="text-xl font-semibold text-slateish-700">Student Dashboard Panel</h1>
        <p className="mt-1 text-sm text-slateish-500">
          Manage Mid Term Evaluation Schedule and Strict Rules shown on student home page.
        </p>
        {!canEdit && (
          <p className="mt-2 text-sm font-semibold text-amber-700">
            View-only mode: only Faculty Coordinator can edit this panel.
          </p>
        )}
      </Card>

      {loading && <p className="text-sm text-slateish-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      {!loading && (
        <Card className="space-y-4">
          <label className="block text-sm font-medium text-slateish-700">
            Schedule Section Title
            <Input
              className="mt-2"
              value={config.midTermScheduleTitle || ''}
              onChange={(event) => setConfig((prev) => ({ ...prev, midTermScheduleTitle: event.target.value }))}
              disabled={!canEdit}
            />
          </label>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slateish-700">Schedule Cards</div>
            {config.scheduleCards.map((card, index) => (
              <div key={`card-${index}`} className="grid gap-2 rounded-lg border border-slateish-200 p-3 md:grid-cols-3">
                <Input
                  value={card.label}
                  onChange={(event) => updateCard(index, 'label', event.target.value)}
                  placeholder="Label"
                  disabled={!canEdit}
                />
                <Input
                  value={card.dateText}
                  onChange={(event) => updateCard(index, 'dateText', event.target.value)}
                  placeholder="Date Text"
                  disabled={!canEdit}
                />
                <Input
                  value={card.timeText}
                  onChange={(event) => updateCard(index, 'timeText', event.target.value)}
                  placeholder="Time Text"
                  disabled={!canEdit}
                />
              </div>
            ))}
            {canEdit && (
              <Button variant="outline" type="button" onClick={addCard}>
                Add Schedule Card
              </Button>
            )}
          </div>

          <label className="block text-sm font-medium text-slateish-700">
            Rules Section Title
            <Input
              className="mt-2"
              value={config.strictRulesTitle || ''}
              onChange={(event) => setConfig((prev) => ({ ...prev, strictRulesTitle: event.target.value }))}
              disabled={!canEdit}
            />
          </label>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slateish-700">Strict Rules</div>
            {config.strictRules.map((rule, index) => (
              <Input
                key={`rule-${index}`}
                value={rule}
                onChange={(event) => updateRule(index, event.target.value)}
                placeholder={`Rule ${index + 1}`}
                disabled={!canEdit}
              />
            ))}
            {canEdit && (
              <Button variant="outline" type="button" onClick={addRule}>
                Add Rule
              </Button>
            )}
          </div>

          {canEdit && (
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Panel Config'}
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
