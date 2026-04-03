import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function PhaseSubmit({ user }) {
  const { phaseId } = useParams()
  const [config, setConfig] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [formData, setFormData] = useState({})
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [progressionLockedInfo, setProgressionLockedInfo] = useState(null)
  
  const formRef = useRef(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Fetch config
        const confRes = await fetch('/api/phases/config', { credentials: 'include' })
        const confData = await confRes.json()
        const phaseConf = confData.configs?.find(c => c.phaseId === Number(phaseId))
        setConfig(phaseConf || null)

        // Fetch my submission securely
        const subRes = await fetch(`/api/phases/my-submissions/${phaseId}`, { credentials: 'include' })
        if (subRes.ok) {
          const subData = await subRes.json()
          if (subData.isProgressionLocked) {
            setProgressionLockedInfo(subData.progressionMessage)
          } else {
            setProgressionLockedInfo(null)
          }

          if (subData.submission) {
            setSubmission(subData.submission)
            setFormData(subData.submission.formData || {})
          } else {
            setSubmission(null)
            setFormData({})
          }
        } else {
          setProgressionLockedInfo(null)
          setSubmission(null)
          setFormData({})
        }
      } catch (err) {
        setError('Failed to load phase data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [phaseId, user.registrationNumber])

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (name, file) => {
    setFiles(prev => ({ ...prev, [name]: file }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const formPayload = new FormData()
      formPayload.append('formData', JSON.stringify(formData))
      
      // Append files
      Object.entries(files).forEach(([name, file]) => {
        if (file) {
          formPayload.append(name, file)
        }
      })

      const res = await fetch(`/api/phases/submit/${phaseId}`, {
        method: 'POST',
        credentials: 'include',
        body: formPayload
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      
      setSubmission(data.submission)
      // Clear files
      setFiles({})
      if (formRef.current) formRef.current.reset()
      alert('Submitted successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Loading phase details...</div>

  if (!config || !config.enabled) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          This phase is currently locked or disabled by the coordinator.
        </div>
      </div>
    )
  }

  const isLocked = submission && submission.status !== 'Rejected'

  return (
    <div className="px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slateish-700">{config.title || `Phase ${phaseId}`} Form</h1>
        </div>

        {submission && (
          <div className={`mt-4 rounded-md border p-4 text-sm ${
            submission.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            submission.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="font-semibold">Status: {submission.status}</div>
            {submission.feedback && (
              <div className="mt-2 italic">
                Feedback: {submission.feedback}
              </div>
            )}
          </div>
        )}

        {error && <div className="mt-4 text-sm text-red-600 font-semibold">{error}</div>}

        {progressionLockedInfo ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800 flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div className="font-medium text-sm">{progressionLockedInfo}</div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {config.fields?.map((field, idx) => (
            <div key={field.name} className={field.type === 'textarea' ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
              <label className="block text-sm font-medium text-slateish-700">
                {idx + 1}. {field.label} {field.required && '*'}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="shadcn-input mt-2 min-h-[60px] text-sm py-2"
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  disabled={isLocked}
                  placeholder="Enter your answer"
                />
              ) : field.type === 'dropdown' ? (
                <select
                  className="shadcn-input mt-2 h-9 text-sm py-1"
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  disabled={isLocked}
                >
                <option value="">Select an option</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              ) : field.type === 'file' ? (
                <div className="mt-2">
                  {submission?.documents?.find(d => d.label === field.name) && (
                    <div className="mb-2 text-xs text-brand-600">
                      <a href={submission.documents.find(d => d.label === field.name).url} target="_blank" rel="noreferrer" className="underline font-semibold">
                        View currently uploaded {field.label}
                      </a>
                    </div>
                  )}
                  {!isLocked && (
                    <input
                      type="file"
                      className="shadcn-input h-9 text-sm py-1.5"
                      required={field.required && !submission?.documents?.find(d => d.label === field.name)}
                      onChange={e => handleFileChange(field.name, e.target.files[0])}
                    />
                  )}
                </div>
              ) : (
                <input
                  type={field.type === 'date' ? 'date' : 'text'}
                  className="shadcn-input mt-2 h-9 text-sm px-3"
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  disabled={isLocked}
                  placeholder={field.type === 'date' ? '' : 'Enter your answer'}
                />
              )}
            </div>
        ))}

          {!isLocked && (
            <div className="col-span-1 md:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 mt-2"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  )
}
