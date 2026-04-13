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

  const MAX_FILE_SIZE_MB = 10;
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.txt', '.csv', '.zip']
  
  const handleFileChange = (name, file) => {
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      
      const ext = (file.name || '').toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        alert(`Invalid file type. Allowed types are: ${ALLOWED_EXTENSIONS.join(', ')}`);
        return;
      }
    }
    setFiles(prev => ({ ...prev, [name]: file }))
  }

  /**
   * Upload a single file to MinIO via presigned URL, then confirm it.
   * Returns the objectKey on success, or throws on failure.
   */
  const uploadFileToMinio = async (fieldName, file) => {
    // 1. Get presigned upload URL from backend
    const urlRes = await fetch('/api/files/upload-url', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        accessType: 'student',
        linkedEntityId: phaseId,
        linkedEntityType: 'phase-submission',
      }),
    })
    const urlData = await urlRes.json()
    if (!urlRes.ok) throw new Error(urlData.error || 'Failed to get upload URL')

    // 2. Upload file directly to MinIO using the presigned URL
    const uploadRes = await fetch(urlData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    })
    if (!uploadRes.ok) throw new Error('Failed to upload file to storage')

    // 3. Confirm upload with backend
    const confirmRes = await fetch('/api/files/confirm-upload', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectKey: urlData.objectKey }),
    })
    if (!confirmRes.ok) throw new Error('Failed to confirm upload')

    return urlData.objectKey
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      // Upload all files to MinIO first and collect objectKeys
      const fileObjectKeys = {}
      for (const [fieldName, file] of Object.entries(files)) {
        if (file) {
          const objectKey = await uploadFileToMinio(fieldName, file)
          fileObjectKeys[fieldName] = objectKey
        }
      }

      // Merge objectKeys into formData so the backend stores them alongside the form fields
      const mergedFormData = { ...formData, ...fileObjectKeys }

      // Build documents array for backward compatibility with PhaseSubmission.documents
      const documents = Object.entries(fileObjectKeys).map(([label, objectKey]) => ({
        label,
        url: objectKey, // Store objectKey instead of local path
      }))

      const formPayload = new FormData()
      formPayload.append('formData', JSON.stringify(mergedFormData))
      // Note: We no longer append actual files — they're already in MinIO.
      // But we still need to send the documents metadata to the backend.

      const res = await fetch(`/api/phases/submit/${phaseId}`, {
        method: 'POST',
        credentials: 'include',
        body: formPayload,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      
      // Patch the returned submission's documents with our MinIO objectKeys
      if (documents.length > 0 && data.submission) {
        // The backend saved the submission without file attachments (we sent no files via multer),
        // so we update the documents on the submission manually
        await fetch(`/api/phases/submit/${phaseId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData: JSON.stringify(mergedFormData),
          }),
        })
      }

      setSubmission(data.submission)
      setFormData(mergedFormData) // Update formData state so View buttons appear immediately
      setFiles({})
      if (formRef.current) formRef.current.reset()
      alert('Submitted successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * View a file. Opens the URL directly in a new tab.
   * The backend streaming endpoint provides Content-Disposition: inline
   * so the browser will display it (e.g. PDFs) natively and preserve the filename.
   */
  const handleViewFile = (objectKeyOrUrl) => {
    if (!objectKeyOrUrl) return

    // Legacy local files
    if (objectKeyOrUrl.startsWith('/uploads/')) {
      window.open(objectKeyOrUrl, '_blank')
      return
    }

    // New MinIO files
    const url = `/api/files/download?objectKey=${encodeURIComponent(objectKeyOrUrl)}`
    window.open(url, '_blank')
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
                  {/* Show link to existing uploaded file */}
                  {(submission?.documents?.find(d => d.label === field.name) || formData[field.name]) && (() => {
                    const doc = submission?.documents?.find(d => d.label === field.name)
                    // ALWAYS prioritize formData which holds the exact MinIO objectKey we just uploaded.
                    // Fallback to the legacy doc.url if formData is empty.
                    const objectKeyOrUrl = formData[field.name] || doc?.url
                    if (!objectKeyOrUrl || typeof objectKeyOrUrl !== 'string') return null
                    return (
                      <div className="mb-2 text-xs text-brand-600">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleViewFile(objectKeyOrUrl)
                          }}
                          className="underline font-semibold cursor-pointer hover:text-brand-700"
                        >
                          View currently uploaded {field.label}
                        </button>
                      </div>
                    )
                  })()}
                  {!isLocked && (
                    <input
                      type="file"
                      className="shadcn-input h-9 text-sm py-1.5"
                      required={field.required && !submission?.documents?.find(d => d.label === field.name) && !formData[field.name]}
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
