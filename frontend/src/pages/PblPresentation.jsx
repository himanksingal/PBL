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

export default function PblPresentation({ user }) {
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
      const sem = user?.semester || 8
      const isSem7 = sem === 7
      const isSem8 = sem >= 8
      const isSem3to6 = sem >= 1 && sem <= 6
      
      const getPblLabel = () => {
        switch (String(sem)) {
          case '3': return 'PBL 1'
          case '4': return 'PBL 2'
          case '5': return 'PBL 3'
          case '6': return 'PBL 4 / Minor Project'
          default: return 'Major Project'
        }
      }

      const finalType = isSem3to6 ? 'project' : isSem7 ? 'internship' : form.submissionType
      const finalPbl = isSem3to6 ? getPblLabel() : (isSem8 && form.submissionType === 'major-project') ? 'Major Project' : form.pbl

      const payload = new FormData()
      payload.append('submissionType', finalType)
      if (finalPbl) payload.append('pbl', finalPbl)

      Object.entries(form).forEach(([key, value]) => {
        if (key !== 'submissionType' && key !== 'pbl' && value !== null && value !== '') {
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

  const sem = user?.semester || 8
  const isSem7 = sem === 7
  const isSem8 = sem >= 8
  const isSem3to6 = sem >= 1 && sem <= 6

  const getPblMenuLabel = () => {
    switch (String(sem)) {
      case '3': return 'PBL 1 Details'
      case '4': return 'PBL 2 Details'
      case '5': return 'PBL 3 Details'
      case '6': return 'PBL 4 / Minor Project Details'
      case '7': return 'Internship Details'
      case '8': return 'Major Project / Internship Details'
      default: return 'Project/Internship Details'
    }
  }

  const isMajorProjectFlow = isSem3to6 || (isSem8 && form.submissionType === 'major-project')
  const isInternshipFlow = isSem7 || (isSem8 && form.submissionType === 'internship')
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
          <h1 className="text-xl font-semibold text-slateish-700">{getPblMenuLabel()} Form</h1>
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

        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5" onSubmit={onSubmit}>
          {isSem8 && (
            <fieldset className="col-span-1 md:col-span-2">
              <legend className="text-sm font-medium text-slateish-700">
                  What will you choose in 8th sem *
                </legend>
                <div className="mt-2 space-y-2 text-sm text-slateish-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="submissionType"
                      value="internship"
                      checked={form.submissionType === 'internship'}
                      onChange={(event) => updateField('submissionType', event.target.value)}
                      required={isSem8}
                      disabled={!showForm}
                    />
                    Internship
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="submissionType"
                      value="major-project"
                      checked={form.submissionType === 'major-project'}
                      onChange={(event) => updateField('submissionType', event.target.value)}
                      required={isSem8}
                      disabled={!showForm}
                    />
                    Major Project
                  </label>
                </div>
              </fieldset>
            )}

            <label className="block text-sm font-medium text-slateish-700 col-span-1">
              Registration ID *
              <input
                className="shadcn-input mt-2 h-9 text-sm px-3"
                value={form.registrationId}
                onChange={(event) => updateField('registrationId', event.target.value)}
                required
                disabled={!showForm}
                placeholder="Enter your answer"
              />
            </label>

            <label className="block text-sm font-medium text-slateish-700 col-span-1">
              Name *
              <input
                className="shadcn-input mt-2 h-9 text-sm px-3"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
                disabled={!showForm}
                placeholder="Enter your answer"
              />
            </label>

            {isMajorProjectFlow && (
              <>
                <label className="block text-sm font-medium text-slateish-700 col-span-1">
                  Online Webpage/PPT Link *
                  <input
                    type="url"
                    className="shadcn-input mt-2 h-9 text-sm px-3"
                    value={form.onlineLink}
                    onChange={(event) => updateField('onlineLink', event.target.value)}
                    required={isMajorProjectFlow}
                    disabled={!showForm}
                    placeholder="Enter your answer"
                  />
                </label>

                <label className="block text-sm font-medium text-slateish-700 col-span-1">
                  GitHub Repo Link (with at least one commit close to presentation) *
                  <input
                    type="url"
                    className="shadcn-input mt-2 h-9 text-sm px-3"
                    value={form.githubRepo}
                    onChange={(event) => updateField('githubRepo', event.target.value)}
                    required={isMajorProjectFlow}
                    disabled={!showForm}
                    placeholder="Enter your answer"
                  />
                </label>

                <label className="block text-sm font-medium text-slateish-700 col-span-1">
                  Project Name *
                  <input
                    className="shadcn-input mt-2 h-9 text-sm px-3"
                    value={form.projectName}
                    onChange={(event) => updateField('projectName', event.target.value)}
                    required={isMajorProjectFlow}
                    disabled={!showForm}
                    placeholder="Enter your answer"
                  />
                </label>
              </>
            )}

            {isInternshipFlow && (
              <>
                <label className="block text-sm font-medium text-slateish-700 col-span-1">
                  Company Name *
                  <input
                    className="shadcn-input mt-2 h-9 text-sm px-3"
                    value={form.companyName}
                    onChange={(event) => updateField('companyName', event.target.value)}
                    required={isInternshipFlow}
                    disabled={!showForm}
                    placeholder="Enter company name"
                  />
                </label>

                <label className="block text-sm font-medium text-slateish-700 col-span-1">
                  Domain / Job Profile *
                  <input
                    className="shadcn-input mt-2 h-9 text-sm px-3"
                    value={form.domainJobProfile}
                    onChange={(event) => updateField('domainJobProfile', event.target.value)}
                    required={isInternshipFlow}
                    disabled={!showForm}
                    placeholder="Enter domain or role"
                  />
                </label>

                  <label className="block text-sm font-medium text-slateish-700 col-span-1">
                    Start Date *
                    <input
                      type="date"
                      className="shadcn-input mt-2 h-9 text-sm px-3"
                      value={form.internshipStartDate}
                      onChange={(event) => updateField('internshipStartDate', event.target.value)}
                      required={isInternshipFlow}
                      disabled={!showForm}
                    />
                  </label>

                  <label className="block text-sm font-medium text-slateish-700 col-span-1">
                    End Date *
                    <input
                      type="date"
                      className="shadcn-input mt-2 h-9 text-sm px-3"
                      value={form.internshipEndDate}
                      onChange={(event) => updateField('internshipEndDate', event.target.value)}
                      required={isInternshipFlow}
                      disabled={!showForm}
                    />
                  </label>

                <label className="block text-sm font-medium text-slateish-700 col-span-1 md:col-span-2">
                  Offer Letter PDF {status.attemptCount === 1 ? '(optional if already uploaded)' : '*'}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="shadcn-input mt-2 h-9 text-sm py-1.5"
                    onChange={(event) => updateField('offerLetterPdf', event.target.files?.[0] || null)}
                    required={isInternshipFlow && status.attemptCount === 0}
                    disabled={!showForm}
                  />
                  {!showForm && status.latestSubmission?.offerLetterPath && (
                    <a href={`/${status.latestSubmission.offerLetterPath}`} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-brand-600 hover:underline">View Uploaded Offer Letter</a>
                  )}
                </label>
              </>
            )}

            <div className="col-span-1 md:col-span-2">
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              {success && <p className="text-sm text-emerald-700 mb-2">{success}</p>}

              {showForm && (
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
              )}
            </div>
          </form>
      </div>
    </div>
  )
}
