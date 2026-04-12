import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function PhaseEvaluate({ user }) {
  const { phaseId } = useParams()
  const [config, setConfig] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingEval, setEditingEval] = useState(null)
  const [marksForm, setMarksForm] = useState({})

  const [assignedStudents, setAssignedStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')

  const [allConfigs, setAllConfigs] = useState([])
  const [viewingFormsFor, setViewingFormsFor] = useState(null)
  const [studentSubmissions, setStudentSubmissions] = useState([])
  const [loadingForms, setLoadingForms] = useState(false)
  const [formsEditData, setFormsEditData] = useState({})
  
  const isCoordinator = user?.role === 'Faculty Coordinator' || user?.role === 'admin'

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const confRes = await fetch('/api/phases/config', { credentials: 'include' })
        const confData = await confRes.json()
        setAllConfigs(confData.configs || [])
        const currentConfig = confData.configs?.find(c => c.phaseId === Number(phaseId))
        setConfig(currentConfig)

        const subRes = await fetch(`/api/phases/submissions?phaseId=${phaseId}`, { credentials: 'include' })
        const subData = await subRes.json()
        setEvaluations(subData.evaluations || [])

        // Fetch assigned students
        const studentsRes = await fetch('/api/faculty/students?pageSize=500', { credentials: 'include' })
        const studentsData = await studentsRes.json()
        setAssignedStudents(studentsData.rows || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [phaseId])

  const handleSaveMarks = async (studentReg) => {
    try {
      const res = await fetch('/api/phases/evaluate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentRegistrationNumber: studentReg,
          phaseId: Number(phaseId),
          marks: marksForm[studentReg] || {}
        })
      })

      const d = await res.json()
      if (!res.ok) throw new Error(d.error)

      const existing = evaluations.find(e => e.studentRegistrationNumber === studentReg)
      if (existing) {
        setEvaluations(evaluations.map(e => e.studentRegistrationNumber === studentReg ? d.evaluation : e))
      } else {
        setEvaluations([...evaluations, d.evaluation])
      }
      setEditingEval(null)
      alert('Evaluation saved')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUnlockMarks = async (studentReg) => {
    try {
      const res = await fetch('/api/phases/evaluate/unlock', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId: Number(phaseId), studentRegistrationNumbers: [studentReg] })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to unlock')
      }

      setEvaluations(evaluations.map(e => e.studentRegistrationNumber === studentReg ? { ...e, isLocked: false } : e))
      alert('Marks unlocked successfully')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleViewForms = async (studentReg) => {
    setViewingFormsFor(studentReg)
    setLoadingForms(true)
    try {
      const res = await fetch(`/api/phases/student-submissions/${studentReg}`, { credentials: 'include' })
      const data = await res.json()
      setStudentSubmissions(data.submissions || [])
      const initialEditData = {}
      ;(data.submissions || []).forEach(sub => {
        initialEditData[sub._id] = sub.formData || {}
      })
      setFormsEditData(initialEditData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingForms(false)
    }
  }

  const handleSaveFormEdit = async (subId) => {
    try {
      const res = await fetch(`/api/phases/edit-submission/${subId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: formsEditData[subId] })
      })
      if (!res.ok) throw new Error('Failed to save')
      alert('Changes saved')
    } catch(err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-6">Loading evaluations...</div>

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold text-slateish-700">Evaluate {config?.title || `Phase ${phaseId}`}</h1>
        <p className="mt-1 text-sm text-slateish-500">Assign marks based on predefined parameters for this evaluation.</p>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white shadow-soft p-6">
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <input 
            type="text" 
            placeholder="Search by student name or reg. no..."
            className="shadcn-input w-full md:w-96"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="shadcn-input w-40"
            value={semesterFilter}
            onChange={e => setSemesterFilter(e.target.value)}
          >
            <option value="">All Semesters</option>
            {[...Array(8)].map((_, i) => (
              <option key={i+1} value={i+1}>Semester {i+1}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slateish-50 border-b">
              <tr>
                <th className="p-3 font-semibold">Student Name / Reg No.</th>
                <th className="p-3 font-semibold">Sem</th>
                {config?.evaluationParams?.map(p => (
                  <th key={p.name} className="p-3 font-semibold">{p.label} (Max {p.weightage})</th>
                ))}
                <th className="p-3 font-semibold">Total</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slateish-200">
              {assignedStudents
                .filter(row => {
                  const studentName = row.student?.name || 'N/A'
                  const studentId = row.student?.id || 'Unknown'
                  const matchSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      String(studentId).toLowerCase().includes(searchQuery.toLowerCase())
                  const matchSem = semesterFilter === '' || String(row.student?.semester) === semesterFilter
                  return matchSearch && matchSem
                })
                .map(row => {
                const stuReg = row.student.id
                const ev = evaluations.find(e => e.studentRegistrationNumber === stuReg) || { studentRegistrationNumber: stuReg, marks: {}, totalScore: 0, isLocked: false }
                const isEditing = editingEval === stuReg
                const currentMarks = isEditing ? (marksForm[stuReg] || {}) : ev.marks || {}
                
                return (
                  <tr key={stuReg}>
                    <td className="p-3 font-medium">
                      {row.student?.name || 'N/A'}
                      <div className="text-xs text-slateish-500 font-normal mt-0.5">{stuReg}</div>
                    </td>
                    <td className="p-3 text-slateish-600">{row.student.semester}</td>
                    {config?.evaluationParams?.map(p => (
                      <td key={p.name} className="p-3">
                        {isEditing ? (
                          <input 
                            type="number"
                            min="0"
                            max={p.weightage}
                            className="shadcn-input w-20 px-2 py-1 h-8"
                            value={currentMarks[p.name] !== undefined ? currentMarks[p.name] : ''}
                            onChange={e => {
                               setMarksForm({
                                 ...marksForm,
                                 [stuReg]: {
                                    ...currentMarks,
                                    [p.name]: Number(e.target.value)
                                 }
                               })
                            }}
                          />
                        ) : (
                          <span>{currentMarks[p.name] !== undefined ? currentMarks[p.name] : '-'}</span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 font-semibold text-brand-600">
                      {isEditing 
                         ? Object.values(currentMarks).reduce((a, b) => a + Number(b), 0)
                         : (ev.totalScore > 0 ? ev.totalScore : '-')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-4">
                        {ev.isLocked ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Locked</span>
                            {isCoordinator && (
                              <button onClick={() => handleUnlockMarks(stuReg)} className="text-xs px-2 py-1 text-slateish-500 hover:text-brand-600 underline">Unlock</button>
                            )}
                          </div>
                        ) : isEditing ? (
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleSaveMarks(stuReg)} className="text-brand-600 font-semibold hover:underline">Save</button>
                            <button onClick={() => setEditingEval(null)} className="text-slateish-500 font-semibold hover:underline border-l border-slateish-300 pl-3">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => {
                            setEditingEval(stuReg)
                            setMarksForm({ ...marksForm, [stuReg]: ev.marks || {} })
                          }} className="text-brand-600 font-semibold hover:underline">Evaluate</button>
                        )}
                        <button 
                          onClick={() => handleViewForms(stuReg)} 
                          className="text-brand-700 font-semibold hover:underline border-l border-slateish-300 pl-4"
                        >
                          View Forms
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {assignedStudents.length === 0 && (
                <tr><td colSpan={10} className="p-6 text-center text-slateish-500">No evaluations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingFormsFor && (
        <div className="fixed inset-0 z-50 flex py-10 justify-center bg-black/50 overflow-y-auto">
          <div className="bg-slateish-50 rounded-xl shadow-card w-full max-w-4xl p-6 relative my-auto border border-slateish-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slateish-700">Student Forms: {viewingFormsFor}</h2>
              <button onClick={() => setViewingFormsFor(null)} className="text-slateish-500 hover:text-red-600 font-bold text-lg">✕</button>
            </div>
            {loadingForms ? (
              <p>Loading...</p>
            ) : (
              <div className="space-y-6">
                {studentSubmissions.map(sub => {
                  const phaseConfig = allConfigs.find(c => c.phaseId === sub.phaseId)
                  return (
                    <div key={sub._id} className="bg-white p-5 rounded-lg border shadow-sm">
                      <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h3 className="font-semibold text-lg text-brand-700">{phaseConfig?.title || `Phase ${sub.phaseId}`}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${sub.status === 'Approved' ? 'bg-green-100 text-green-700' : sub.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{sub.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(sub.formData || {}).map(([key, val]) => {
                          const fConf = phaseConfig?.fields?.find(f => f.name === key)
                          return (
                            <div key={key} className="bg-slateish-50 p-3 rounded">
                              <span className="block text-xs text-slateish-500 mb-1">{fConf?.label || key}</span>
                              {isCoordinator ? (
                                <input
                                  className="shadcn-input w-full text-sm h-8"
                                  value={formsEditData[sub._id]?.[key] !== undefined ? formsEditData[sub._id][key] : val}
                                  onChange={e => setFormsEditData(prev => ({
                                    ...prev,
                                    [sub._id]: { ...prev[sub._id], [key]: e.target.value }
                                  }))}
                                />
                              ) : (
                                <span className="font-medium text-sm">{String(val)}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      
                      {sub.documents?.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-slateish-500 mb-2">Documents</h4>
                          <div className="flex gap-2 flex-wrap">
                            {sub.documents.map(doc => (
                              <a key={doc._id} href={doc.url} target="_blank" rel="noreferrer" className="text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-full hover:bg-brand-200">
                                {phaseConfig?.fields?.find(f => f.name === doc.label)?.label || doc.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {isCoordinator && (
                        <div className="mt-4 text-right border-t pt-3">
                          <button onClick={() => handleSaveFormEdit(sub._id)} className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-brand-700">Save Edits</button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {studentSubmissions.length === 0 && <div className="text-slateish-500 italic">No forms submitted by this student.</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
