import React, { useEffect, useState } from 'react'

const initialForm = {
  submissionType: '',
  registrationId: '',
  name: '',
  pbl: '',
  onlineLink: '',
  githubRepo: '',
  projectName: '',
  companyName: '',
  domainJobProfile: '',
  internshipStartDate: '',
  internshipEndDate: '',
  offerLetterPdf: null,
}

export default function PblPresentation() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({
    attemptCount: 0,
    canSubmit: true,
    canResubmit: false,
    isLocked: false,
    latestSubmission: null,
  })
  const [resubmitMode, setResubmitMode] = useState(false)

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const fillFromLatest = (latest) => {
    if (!latest) return
    setForm((prev) => ({
      ...prev,
      submissionType: latest.submissionType || '',
      registrationId: latest.registrationId || '',
      name: latest.name || '',
      pbl: latest.pbl || '',
      onlineLink: latest.onlineLink || '',
      githubRepo: latest.githubRepo || '',
      projectName: latest.projectName || '',
      companyName: latest.companyName || '',
      domainJobProfile: latest.domainJobProfile || '',
      internshipStartDate: latest.internshipStartDate
        ? String(latest.internshipStartDate).slice(0, 10)
        : '',
      internshipEndDate: latest.internshipEndDate ? String(latest.internshipEndDate).slice(0, 10) : '',
      offerLetterPdf: null,
    }))
  }

  const loadStatus = async () => {
    setError('')
    try {
      const response = await fetch('/api/student/pbl-presentations/status', {
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch submission status.')
      }
      setStatus(data)
      fillFromLatest(data.latestSubmission)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          payload.append(key, value)
        }
      })

      const response = await fetch('/api/student/pbl-presentations', {
        method: 'POST',
        credentials: 'include',
        body: payload,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed.')
      }

      setSuccess(status.attemptCount === 0 ? 'Project details submitted successfully.' : 'Final resubmission submitted successfully.')
      setResubmitMode(false)
      await loadStatus()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isMajorProject = form.submissionType === 'major-project'
  const isInternship = form.submissionType === 'internship'
  const showForm = status.attemptCount === 0 || resubmitMode

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slateish-700">PBL Presentation</h1>
          <div className="text-sm text-slateish-500">Attempts used: {status.attemptCount}/2</div>
        </div>

        {!showForm && status.canResubmit && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You have submitted once. You may resubmit one final time if corrections are needed.
            <div className="mt-3">
              <button
                type="button"
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  setResubmitMode(true)
                  fillFromLatest(status.latestSubmission)
                }}
              >
                Resubmit Form (Final Attempt)
              </button>
            </div>
          </div>
        )}

        {status.isLocked && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Submission locked. You have completed both allowed attempts.
          </div>
        )}

        {showForm && (
          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <fieldset>
              <legend className="text-sm font-medium text-slateish-700">
                1. What will you choose in 8th sem *
              </legend>
              <div className="mt-2 space-y-2 text-sm text-slateish-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="submissionType"
                    value="internship"
                    checked={isInternship}
                    onChange={(event) => updateField('submissionType', event.target.value)}
                    required
                  />
                  Internship
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="submissionType"
                    value="major-project"
                    checked={isMajorProject}
                    onChange={(event) => updateField('submissionType', event.target.value)}
                    required
                  />
                  Major Project
                </label>
              </div>
            </fieldset>

            <label className="block text-sm font-medium text-slateish-700">
              2. Registration ID *
              <input
                className="shadcn-input mt-2"
                value={form.registrationId}
                onChange={(event) => updateField('registrationId', event.target.value)}
                required
                placeholder="Enter your answer"
              />
            </label>

            <label className="block text-sm font-medium text-slateish-700">
              3. Name *
              <input
                className="shadcn-input mt-2"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
                placeholder="Enter your answer"
              />
            </label>

            {isMajorProject && (
              <>
                <fieldset>
                  <legend className="text-sm font-medium text-slateish-700">4. Select PBL *</legend>
                  <div className="mt-2 space-y-2 text-sm text-slateish-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="pbl"
                        value="PBL-2"
                        checked={form.pbl === 'PBL-2'}
                        onChange={(event) => updateField('pbl', event.target.value)}
                        required={isMajorProject}
                      />
                      PBL-2
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="pbl"
                        value="PBL-4"
                        checked={form.pbl === 'PBL-4'}
                        onChange={(event) => updateField('pbl', event.target.value)}
                        required={isMajorProject}
                      />
                      PBL-4
                    </label>
                  </div>
                </fieldset>

                <label className="block text-sm font-medium text-slateish-700">
                  5. Online Webpage/PPT Link *
                  <input
                    type="url"
                    className="shadcn-input mt-2"
                    value={form.onlineLink}
                    onChange={(event) => updateField('onlineLink', event.target.value)}
                    required={isMajorProject}
                    placeholder="Enter your answer"
                  />
                </label>

                <label className="block text-sm font-medium text-slateish-700">
                  6. GitHub Repo Link (with at least one commit close to presentation) *
                  <input
                    type="url"
                    className="shadcn-input mt-2"
                    value={form.githubRepo}
                    onChange={(event) => updateField('githubRepo', event.target.value)}
                    required={isMajorProject}
                    placeholder="Enter your answer"
                  />
                </label>

                <label className="block text-sm font-medium text-slateish-700">
                  7. Project Name *
                  <input
                    className="shadcn-input mt-2"
                    value={form.projectName}
                    onChange={(event) => updateField('projectName', event.target.value)}
                    required={isMajorProject}
                    placeholder="Enter your answer"
                  />
                </label>
              </>
            )}

            {isInternship && (
              <>
                <label className="block text-sm font-medium text-slateish-700">
                  4. Company Name *
                  <input
                    className="shadcn-input mt-2"
                    value={form.companyName}
                    onChange={(event) => updateField('companyName', event.target.value)}
                    required={isInternship}
                    placeholder="Enter company name"
                  />
                </label>

                <label className="block text-sm font-medium text-slateish-700">
                  5. Domain / Job Profile *
                  <input
                    className="shadcn-input mt-2"
                    value={form.domainJobProfile}
                    onChange={(event) => updateField('domainJobProfile', event.target.value)}
                    required={isInternship}
                    placeholder="Enter domain or role"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-slateish-700">
                    6. Start Date *
                    <input
                      type="date"
                      className="shadcn-input mt-2"
                      value={form.internshipStartDate}
                      onChange={(event) => updateField('internshipStartDate', event.target.value)}
                      required={isInternship}
                    />
                  </label>

                  <label className="block text-sm font-medium text-slateish-700">
                    7. End Date *
                    <input
                      type="date"
                      className="shadcn-input mt-2"
                      value={form.internshipEndDate}
                      onChange={(event) => updateField('internshipEndDate', event.target.value)}
                      required={isInternship}
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slateish-700">
                  8. Offer Letter PDF {status.attemptCount === 1 ? '(optional if already uploaded)' : '*'}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="shadcn-input mt-2 h-auto py-2"
                    onChange={(event) => updateField('offerLetterPdf', event.target.files?.[0] || null)}
                    required={isInternship && status.attemptCount === 0}
                  />
                </label>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-700">{success}</p>}

            <button
              type="submit"
              className="rounded-md bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
              disabled={submitting}
            >
              {submitting
                ? 'Submitting...'
                : status.attemptCount === 0
                  ? 'Submit'
                  : 'Submit Final Resubmission'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
