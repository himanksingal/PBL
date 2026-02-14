import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function StudentDashboard() {
  const [guideName, setGuideName] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const findExaminer = async () => {
    if (!guideName.trim()) {
      setError('Please enter guide name.')
      setResult(null)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(
        `/api/student/examiner?guideName=${encodeURIComponent(guideName.trim())}`,
        {
          credentials: 'include',
        }
      )

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Examiner not found.')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold text-slateish-700">PBL Information Portal</h1>
        <p className="mt-1 text-sm text-slateish-500">
          Central resource hub for PBL mid-term evaluation.
        </p>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <div>
            <div className="text-sm font-semibold text-slateish-700">Venue & Panel Finder</div>
            <div className="text-xs text-slateish-500">Search by guide/faculty name</div>
          </div>
          <input
            className="shadcn-input"
            placeholder="Type guide name (Ex: Neha, Ashish, Ajay)"
            value={guideName}
            onChange={(event) => setGuideName(event.target.value)}
          />
          <button className="shadcn-button" onClick={findExaminer} disabled={loading}>
            {loading ? 'Finding...' : 'Find'}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-4 rounded-lg border border-slateish-200 bg-slateish-50 p-4 text-sm text-slateish-700">
            <div><strong>Guide:</strong> {result.guideName}</div>
            <div><strong>External Examiner:</strong> {result.externalExaminer}</div>
            <div><strong>Panel:</strong> {result.panel}</div>
            <div><strong>Venue:</strong> {result.venue}</div>
            <div><strong>Date:</strong> {result.date}</div>
            <div><strong>Slot:</strong> {result.slot}</div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
          <div className="text-sm font-semibold text-slateish-700">Mid Term Evaluation Schedule</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slateish-50 p-4">
              <div className="text-xs font-semibold text-brand-600">6TH SEM | PBL-4</div>
              <div className="mt-2 text-3xl font-bold text-slateish-800">FEB 18</div>
              <div className="text-sm text-slateish-500">09:30 AM - 05:00 PM</div>
            </div>
            <div className="rounded-lg bg-slateish-50 p-4">
              <div className="text-xs font-semibold text-brand-600">4TH SEM | PBL-2</div>
              <div className="mt-2 text-3xl font-bold text-slateish-800">FEB 19</div>
              <div className="text-sm text-slateish-500">09:30 AM - 05:00 PM</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
          <div className="text-sm font-semibold text-slateish-700">Strict Rules</div>
          <ul className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slateish-600">
            <li>Hosting via live page (GitHub) only.</li>
            <li>Use full registration ID in form.</li>
            <li>7-8 mins presentation + 2 mins Q&A.</li>
            <li className="font-semibold text-red-600">No entry in form = no presentation.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slateish-700">PBL Submission Actions</div>
          <div className="flex flex-wrap gap-3">
            <a
              className="shadcn-button-outline"
              href="/templates/pbl-template.txt"
              download="pbl-template.txt"
            >
              Download Template
            </a>
            <Link className="shadcn-button" to="/pbl-presentation">
              Open PBL Presentation Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
