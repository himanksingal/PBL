import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function PhaseReview({ user }) {
  const { phaseId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [viewMode, setViewMode] = useState('list') // 'list', 'detail', 'template'
  const [selectedSub, setSelectedSub] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [editData, setEditData] = useState({})
  
  const isCoordinator = user?.role === 'Faculty Coordinator' || user?.role === 'Master Admin'

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const confRes = await fetch('/api/phases/config', { credentials: 'include' })
        const confData = await confRes.json()
        setConfig(confData.configs?.find(c => c.phaseId === Number(phaseId)))

        const subRes = await fetch(`/api/phases/submissions?phaseId=${phaseId}`, { credentials: 'include' })
        const subData = await subRes.json()
        setSubmissions(subData.submissions || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [phaseId])

  const handleReview = async (status) => {
    if (!selectedSub) return
    if (status === 'Rejected' && !feedback.trim()) {
      alert('Feedback is required for rejection')
      return
    }

    try {
      const res = await fetch(`/api/phases/review/${selectedSub._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          feedback, 
          formData: (isCoordinator && status === 'Approved') ? editData : undefined 
        })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }

      setSubmissions(prev => prev.map(s => s._id === selectedSub._id ? { ...s, status, feedback, formData: isCoordinator ? editData : s.formData } : s))
      alert(`Submission ${status.toLowerCase()} successfully.`)
      setViewMode('list')
      setSelectedSub(null)
      setFeedback('')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSaveEditsOnly = async () => {
    if (!selectedSub) return
    try {
      const res = await fetch(`/api/phases/edit-submission/${selectedSub._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: editData })
      })
      if (!res.ok) throw new Error('Failed to save edits')
      setSubmissions(prev => prev.map(s => s._id === selectedSub._id ? { ...s, formData: editData } : s))
      alert('Edits saved successfully.')
    } catch (err) {
      alert(err.message)
    }
  }

  const openDetail = (sub) => {
    setSelectedSub(sub)
    setFeedback(sub.feedback || '')
    setEditData(sub.formData || {})
    setViewMode('detail')
  }

  if (loading) return <div className="p-6">Loading submissions...</div>

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 px-6 py-4">
        <div className="flex flex-wrap justify-between items-center rounded-xl border border-slateish-200 bg-white p-6 shadow-soft gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slateish-700">Review {config?.title || `Phase ${phaseId}`}</h1>
            <p className="mt-1 text-sm text-slateish-500">Select a student submission to view or evaluate.</p>
          </div>
          <button onClick={() => setViewMode('template')} className="shadcn-button-outline">
            View Empty Form Template
          </button>
        </div>

        <div className="rounded-xl border border-slateish-200 bg-white shadow-soft overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slateish-500">No submissions available for review yet.</div>
          ) : (
            <div className="divide-y divide-slateish-200">
              <div className="grid grid-cols-4 px-6 py-3 bg-slateish-50 text-[10px] font-bold uppercase tracking-wider text-slateish-500">
                 <div className="col-span-2">Student Reg No</div>
                 <div>Status</div>
                 <div className="text-right">Action</div>
              </div>
              {submissions.map(sub => (
                <div key={sub._id} className="grid grid-cols-4 items-center px-6 py-4 hover:bg-brand-50/30 transition">
                  <div className="col-span-2 font-semibold text-sm text-slateish-800">{sub.studentRegistrationNumber}</div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      sub.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <button onClick={() => openDetail(sub)} className="text-sm font-semibold text-brand-600 hover:text-brand-800">
                      View Form &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const isTemplate = viewMode === 'template'
  const isApproved = selectedSub?.status === 'Approved'

  return (
    <div className="px-6 py-4 space-y-6">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => { setViewMode('list'); setSelectedSub(null) }} 
            className="text-brand-600 hover:text-brand-800 font-semibold text-sm mb-2 inline-flex items-center"
          >
            &larr; Back to List
          </button>
          <h1 className="text-xl font-semibold text-slateish-700">
            {isTemplate ? `Form Template: ${config?.title}` : `Reviewing Student: ${selectedSub?.studentRegistrationNumber}`}
          </h1>
        </div>
        
        {!isTemplate && (
          <div className="flex gap-3">
            <button onClick={() => handleReview('Approved')} className="bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 text-sm font-semibold transition">
              Approve
            </button>
            <button onClick={() => handleReview('Rejected')} className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 text-sm font-semibold transition">
              Reject
            </button>
          </div>
        )}
      </div>

      {!isTemplate && selectedSub && (
        <div className={`rounded-md border p-4 text-sm ${
          selectedSub.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          selectedSub.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="font-semibold">Current Status: {selectedSub.status}</div>
          {selectedSub.feedback && (
            <div className="mt-2 italic">
              Previous Feedback: {selectedSub.feedback}
            </div>
          )}
        </div>
      )}

      {/* Exactly mimic the student's PhaseSubmit UI */}
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-slateish-700 border-b pb-2 mb-4">Submitted Form</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {config?.fields?.map((field, idx) => {
            const val = isTemplate ? '' : (editData[field.name] !== undefined ? editData[field.name] : selectedSub?.formData?.[field.name])
            
            return (
              <div key={field.name} className={field.type === 'textarea' ? 'col-span-1 md:col-span-2' : 'col-span-1'}>
                <label className="block text-sm font-medium text-slateish-700">
                  {idx + 1}. {field.label} {field.required && '*'}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    className="shadcn-input mt-2 min-h-[60px] text-sm py-2"
                  value={val || ''}
                  onChange={e => isCoordinator ? setEditData({...editData, [field.name]: e.target.value}) : null}
                  disabled={isTemplate || (!isCoordinator)}
                  placeholder="Student answer"
                />
              ) : field.type === 'dropdown' ? (
                <select
                  className="shadcn-input mt-2 h-9 text-sm py-1"
                  value={val || ''}
                  onChange={e => isCoordinator ? setEditData({...editData, [field.name]: e.target.value}) : null}
                  disabled={isTemplate || (!isCoordinator)}
                >
                  <option value="">Select an option</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.type === 'file' ? (
                <div className="mt-2 text-sm">
                  {isTemplate ? (
                    <span className="text-slateish-400 italic">File upload input rendered here for students.</span>
                  ) : selectedSub?.documents?.find(d => d.label === field.name) ? (
                    <a href={selectedSub.documents.find(d => d.label === field.name).url} target="_blank" rel="noreferrer" className="text-brand-600 font-semibold hover:underline">
                      View Uploaded Document
                    </a>
                  ) : (
                    <span className="text-slateish-500 italic">No document uploaded.</span>
                  )}
                </div>
              ) : (
                <input
                  type={field.type === 'date' ? 'date' : 'text'}
                  className="shadcn-input mt-2 h-9 text-sm px-3"
                  value={val || ''}
                  onChange={e => isCoordinator ? setEditData({...editData, [field.name]: e.target.value}) : null}
                  disabled={isTemplate || (!isCoordinator)}
                  placeholder={field.type === 'date' ? '' : 'Student answer'}
                />
              )}
            </div>
          )
        })}
        {config?.fields?.length === 0 && (
           <p className="text-sm text-slateish-500 italic col-span-1 md:col-span-2">No form fields defined for this phase.</p>
        )}
        </div>
      </div>

      {!isTemplate && (
        <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slateish-700 mb-2">Evaluation Feedback (Visible to Student)</label>
            <textarea
              className="shadcn-input min-h-[100px]"
              placeholder="Leave feedback here (required for rejection)"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slateish-100">
            <button onClick={() => handleReview('Approved')} className="bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 text-sm font-semibold transition">
              Approve Submission
            </button>
            <button onClick={() => handleReview('Rejected')} className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 text-sm font-semibold transition">
              Reject with Feedback
            </button>
            {isCoordinator && (
              <button onClick={handleSaveEditsOnly} className="bg-slateish-800 text-white px-5 py-2 rounded-md hover:bg-slateish-900 text-sm font-semibold transition ml-auto">
                Save Coordinator Edits (Without Approving yet)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
