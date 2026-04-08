import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function StudentDashboard({ user }) {
  const semesterStr = user?.semester || '0'
  const isMajorProject = ['7', '8'].includes(semesterStr) || parseInt(semesterStr, 10) >= 7

  const [assignedFaculty, setAssignedFaculty] = useState(null)
  const [facultyLoading, setFacultyLoading] = useState(true)
  const [panelConfig, setPanelConfig] = useState({
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
  })

  const loadAssignedFaculty = async () => {
    setFacultyLoading(true)
    try {
      const response = await fetch('/api/student/assigned-faculty', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load assigned faculty')
      setAssignedFaculty(data.assignedFaculty || null)
    } catch {
      setAssignedFaculty(null)
    } finally {
      setFacultyLoading(false)
    }
  }

  useEffect(() => {
    loadAssignedFaculty()
  }, [])

  useEffect(() => {
    const loadPanelConfig = async () => {
      try {
        const response = await fetch('/api/student/dashboard-panel', { credentials: 'include' })
        const data = await response.json()
        if (!response.ok) return
        if (data?.config) setPanelConfig(data.config)
      } catch {
        // keep fallback defaults
      }
    }
    loadPanelConfig()
  }, [])

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold text-slateish-700">
          {isMajorProject ? 'Major Project & Internship Portal' : 'PBL Information Portal'}
        </h1>
        <p className="mt-1 text-sm text-slateish-500">
          {isMajorProject
            ? 'Central resource hub for Major Project & Internship evaluation.'
            : 'Central resource hub for PBL mid-term evaluation.'}
        </p>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft transition duration-300 hover:shadow-card">
        <div className="text-sm font-semibold text-slateish-700">Assigned Faculty</div>
        {facultyLoading && <div className="mt-2 text-sm text-slateish-500">Loading faculty details...</div>}
        {!facultyLoading && !assignedFaculty && (
          <div className="mt-2 text-sm text-slateish-500">
            Faculty is not assigned yet. Please contact the coordinator.
          </div>
        )}
        {!facultyLoading && assignedFaculty && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slateish-50 p-3">
              <div className="text-xs text-slateish-500">Name</div>
              <div className="text-sm font-semibold text-slateish-700">{assignedFaculty.name}</div>
            </div>
            <div className="rounded-lg bg-slateish-50 p-3">
              <div className="text-xs text-slateish-500">Registration No.</div>
              <div className="text-sm font-semibold text-slateish-700">
                {assignedFaculty.registrationNumber}
              </div>
            </div>
            <div className="rounded-lg bg-slateish-50 p-3">
              <div className="text-xs text-slateish-500">Email</div>
              <div className="text-sm font-semibold text-slateish-700">{assignedFaculty.email || '-'}</div>
            </div>
            <div className="rounded-lg bg-slateish-50 p-3">
              <div className="text-xs text-slateish-500">Phone</div>
              <div className="text-sm font-semibold text-slateish-700">{assignedFaculty.phone || '-'}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
          <div className="text-sm font-semibold text-slateish-700">{panelConfig.midTermScheduleTitle}</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(panelConfig.scheduleCards || []).map((card, index) => (
              <div key={`${card.label}-${index}`} className="rounded-lg bg-slateish-50 p-4">
                <div className="text-xs font-semibold text-brand-600">{card.label}</div>
                <div className="mt-2 text-3xl font-bold text-slateish-800">{card.dateText}</div>
                <div className="text-sm text-slateish-500">{card.timeText}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
          <div className="text-sm font-semibold text-slateish-700">{panelConfig.strictRulesTitle}</div>
          <ul className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slateish-600">
            {(panelConfig.strictRules || []).map((rule, index) => (
              <li key={`${rule}-${index}`} className={index === (panelConfig.strictRules.length - 1) ? 'font-semibold text-red-600' : ''}>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slateish-700">
            {isMajorProject ? 'Major Project / Internship Submission' : 'PBL Submission Actions'}
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="shadcn-button-outline"
              href="/templates/pbl-template.txt"
              download="pbl-template.txt"
            >
              Download Template
            </a>
            <Link className="shadcn-button" to="/pbl-presentation">
              {isMajorProject ? 'Open Submission Form' : 'Open PBL Presentation Form'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

