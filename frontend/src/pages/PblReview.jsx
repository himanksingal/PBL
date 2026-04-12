import React, { useEffect, useState } from 'react'

export default function PblReview({ user }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list')
  const [selectedSub, setSelectedSub] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/faculty/students?pageSize=500', { credentials: 'include' })
        const data = await res.json()
        setStudents(data.rows || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const openDetail = (row) => {
    setSelectedStudent(row.student)
    setSelectedSub(row.latestSubmission)
    setViewMode('detail')
  }

  const val = (k) => selectedSub?.[k] || ''

  const handleAskToResubmit = async (studentId) => {
    if (!window.confirm('Are you sure you want to unlock resubmission for this student?')) return
    try {
      const res = await fetch('/api/faculty/responses/resubmit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to grant resubmit')
      alert(d.message)
      setSelectedSub(prev => ({ ...prev, resubmitGranted: true }))
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-6">Loading submissions...</div>

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 px-6 py-4">
        <div className="flex justify-between items-center rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-semibold text-slateish-700">Project & Internship Responses</h1>
          <p className="mt-1 text-sm text-slateish-500">View latest forms filled by your assigned students.</p>
        </div>

        <div className="rounded-xl border border-slateish-200 bg-white shadow-soft overflow-hidden">
          {students.length === 0 ? (
            <div className="p-8 text-center text-sm text-slateish-500">No students assigned to you yet.</div>
          ) : (
            <div className="divide-y divide-slateish-200">
              <div className="grid grid-cols-4 px-6 py-3 bg-slateish-50 text-[10px] font-bold uppercase tracking-wider text-slateish-500">
                 <div className="col-span-2">Student Name / Reg No</div>
                 <div>Submission Type</div>
                 <div className="text-right">Action</div>
              </div>
              {students.map((row, idx) => (
                <div key={idx} className="grid grid-cols-4 items-center px-6 py-4 hover:bg-brand-50/30 transition">
                  <div className="col-span-2 font-semibold text-sm text-slateish-800">
                    {row.student?.name || 'N/A'} <span className="text-slateish-500 text-xs ml-2">({row.student?.id || 'Unknown'})</span>
                  </div>
                  <div className="text-sm text-slateish-600">
                    {row.latestSubmission ? (
                      <span className="capitalize px-2 py-1 bg-slateish-100 rounded-lg text-xs font-semibold">
                        {row.latestSubmission.submissionType.replace('-', ' ')}
                      </span>
                    ) : 'Pending'}
                  </div>
                  <div className="text-right">
                    <button 
                      onClick={() => openDetail(row)} 
                      disabled={!row.latestSubmission}
                      className="text-sm font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {row.latestSubmission ? 'View Form \u2192' : 'Not Submitted'}
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

  return (
    <div className="px-6 py-4 space-y-6">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div>
          <button 
            onClick={() => { setViewMode('list'); setSelectedSub(null); setSelectedStudent(null) }} 
            className="text-brand-600 hover:underline font-semibold text-sm mb-2 block"
          >
            &larr; Back to List
          </button>
          <div className="flex justify-between items-center w-full">
            <h1 className="text-xl font-semibold text-slateish-700">
              Form Details: {selectedStudent?.name || 'N/A'} ({selectedStudent?.id || 'Unknown'})
            </h1>
            <div className="flex gap-3">
              <button 
                 className="shadcn-button-outline text-brand-600 text-sm font-semibold h-9 px-4 rounded-lg"
                 onClick={() => handleAskToResubmit(selectedStudent.id)}
                 disabled={!selectedSub || selectedSub.resubmitGranted}
              >
                 {selectedSub?.resubmitGranted ? 'Resubmit Granted' : 'Ask to Resubmit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft space-y-4">
         <h2 className="text-lg font-semibold text-slateish-700 border-b pb-2 mb-4">Submitted Form</h2>
         
        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5" onSubmit={e => e.preventDefault()}>
          <fieldset className="col-span-1 md:col-span-2">
            <legend className="text-sm font-medium text-slateish-700">
                1. What will you choose in 8th sem *
              </legend>
              <div className="mt-2 space-y-2 text-sm text-slateish-700">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={val('submissionType') === 'internship'} disabled />
                  Internship
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={val('submissionType') === 'major-project'} disabled />
                  Major Project
                </label>
              </div>
          </fieldset>

          <label className="block text-sm font-medium text-slateish-700 col-span-1">
            2. Registration ID *
            <input className="shadcn-input mt-2 h-9 text-sm px-3" value={val('registrationId')} disabled />
          </label>

          <label className="block text-sm font-medium text-slateish-700 col-span-1">
            3. Name *
            <input className="shadcn-input mt-2 h-9 text-sm px-3" value={val('name')} disabled />
          </label>

          {(val('submissionType') === 'major-project' || val('submissionType') === 'project') && (
            <>
              <fieldset className="col-span-1 md:col-span-2">
                <legend className="text-sm font-medium text-slateish-700">4. Select PBL *</legend>
                <div className="mt-2 space-y-2 text-sm text-slateish-700">
                  {['PBL-1','PBL-2','PBL-3','PBL-4','Minor Project','Major Project'].map(opt => (
                    <label key={opt} className="flex items-center gap-2">
                      <input type="radio" checked={val('pbl') === opt} disabled />
                      {opt}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-slateish-700 col-span-1">
                5. Online Webpage/PPT Link *
                <input className="shadcn-input mt-2 h-9 text-sm px-3" value={val('onlineLink')} disabled />
              </label>

              <label className="block text-sm font-medium text-slateish-700 col-span-1">
                6. GitHub Repo Link *
                <input className="shadcn-input mt-2 h-9 text-sm px-3" value={val('githubRepo')} disabled />
              </label>

              <label className="block text-sm font-medium text-slateish-700 col-span-1">
                7. Project Name *
                <input className="shadcn-input mt-2 h-9 text-sm px-3" value={val('projectName')} disabled />
              </label>
            </>
          )}

          {val('submissionType') === 'internship' && (
            <>
              <label className="block text-sm font-medium text-slateish-700 col-span-1">
                4. Company Name *
                <input className="shadcn-input mt-2 h-9 text-sm px-3" value={val('companyName')} disabled />
              </label>

              <label className="block text-sm font-medium text-slateish-700 col-span-1">
                5. Domain / Job Profile *
                <input className="shadcn-input mt-2 h-9 text-sm px-3" value={val('domainJobProfile')} disabled />
              </label>

              <label className="block text-sm font-medium text-slateish-700 col-span-1">
                6. Start Date *
                <input type="date" className="shadcn-input mt-2 h-9 text-sm px-3" value={val('internshipStartDate') ? String(val('internshipStartDate')).slice(0, 10) : ''} disabled />
              </label>

              <label className="block text-sm font-medium text-slateish-700 col-span-1">
                7. End Date *
                <input type="date" className="shadcn-input mt-2 h-9 text-sm px-3" value={val('internshipEndDate') ? String(val('internshipEndDate')).slice(0, 10) : ''} disabled />
              </label>

              <label className="block text-sm font-medium text-slateish-700 col-span-1 md:col-span-2">
                8. Offer Letter PDF *
                <input type="file" className="shadcn-input mt-2 h-9 text-sm py-1.5" disabled />
                {selectedSub?.offerLetterPath && (
                  <a href={`/${selectedSub.offerLetterPath}`} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-brand-600 hover:underline">View Uploaded Offer Letter</a>
                )}
              </label>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
