import React, { useEffect, useState } from 'react'

export default function PhaseConfigPage({ user }) {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/phases/config', { credentials: 'include' })
        const data = await res.json()
        let loadedConfigs = data.configs || []
        
        // Enforce exactly 4 parameters for evaluation phases
        loadedConfigs = loadedConfigs.map(c => {
          if (c.isEvaluationPhase) {
            let params = c.evaluationParams || []
            while (params.length < 4) {
              params.push({ name: `p_${Date.now()}_${params.length}`, label: `Parameter ${params.length + 1}`, weightage: 25 })
            }
            if (params.length > 4) params.length = 4 // truncate
            c.evaluationParams = params
          }
          return c
        })
        
        setConfigs(loadedConfigs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCreateNewPhase = async () => {
    const newPhaseId = configs.length ? Math.max(...configs.map(c => c.phaseId)) + 1 : 1
    const newPhase = {
      phaseId: newPhaseId,
      title: `Phase ${newPhaseId}`,
      enabled: false,
      fields: [],
      evaluationParams: [],
      isEvaluationPhase: false
    }
    try {
      const res = await fetch(`/api/phases/config/${newPhaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPhase)
      })
      if (res.ok) setConfigs([...configs, newPhase])
    } catch (err) {}
  }

  const handleUpdate = async (phase) => {
    try {
      const res = await fetch(`/api/phases/config/${phase.phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(phase)
      })
      if (res.ok) alert('Saved successfully')
    } catch (err) {}
  }

  const handleDeletePhase = async (phaseId) => {
    if (!window.confirm(`Are you sure you want to delete Phase ${phaseId}? This will permanently delete all submissions and evaluations for this phase.`)) return
    try {
      const res = await fetch(`/api/phases/config/${phaseId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        setConfigs(prev => prev.filter(c => c.phaseId !== phaseId))
        alert('Phase deleted successfully')
      }
    } catch (err) {
      alert('Failed to delete phase')
    }
  }

  const handleSwapOrder = async (idxA, idxB) => {
    const newConfigs = [...configs]
    const phaseA = { ...newConfigs[idxA] }
    const phaseB = { ...newConfigs[idxB] }
    // Swap phaseIds
    const tempId = phaseA.phaseId
    phaseA.phaseId = phaseB.phaseId
    phaseB.phaseId = tempId
    // Save both to backend
    try {
      await Promise.all([
        fetch(`/api/phases/config/${phaseA.phaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(phaseA)
        }),
        fetch(`/api/phases/config/${phaseB.phaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(phaseB)
        })
      ])
      newConfigs[idxA] = phaseB
      newConfigs[idxB] = phaseA
      // Re-sort by phaseId
      newConfigs.sort((a, b) => a.phaseId - b.phaseId)
      setConfigs(newConfigs)
    } catch (err) {
      alert('Failed to reorder phases')
    }
  }

  const handleLockPhase = async (phaseId) => {
    const regNums = prompt('Enter a comma separated list of student registration numbers to lock marks for, or "ALL" for all currently evaluated students:')
    if (!regNums) return
    
    let studentRegs = []
    if (regNums.trim().toUpperCase() === 'ALL') {
      const s = await fetch(`/api/phases/submissions?phaseId=${phaseId}`, { credentials: 'include' })
      const sd = await s.json()
      studentRegs = (sd.evaluations || []).map(e => e.studentRegistrationNumber)
    } else {
      studentRegs = regNums.split(',').map(s => s.trim())
    }

    if (studentRegs.length > 0) {
      await fetch('/api/phases/evaluate/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phaseId, studentRegistrationNumbers: studentRegs })
      })
      alert(`Locked evaluations for ${studentRegs.length} students`)
    }
  }

  if (loading) return <div className="p-6">Loading configs...</div>

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="flex justify-between items-center rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div>
          <h1 className="text-2xl font-semibold text-slateish-700">Phase Configuration</h1>
          <p className="mt-1 text-sm text-slateish-500">Enable/disable phases, define forms and evaluation parameters dynamically.</p>
        </div>
        {isAdmin && <button onClick={handleCreateNewPhase} className="shadcn-button">Add Phase</button>}
      </div>

      <div className="space-y-6">
        {configs.map((phase, idx) => (
          <div key={phase.phaseId} className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <input 
                value={phase.title} 
                onChange={e => {
                  if (!isAdmin) return;
                  const newConfigs = [...configs]; newConfigs[idx].title = e.target.value; setConfigs(newConfigs)
                }} 
                disabled={!isAdmin}
                className={`shadcn-input font-bold text-lg max-w-xs ${!isAdmin ? 'bg-slateish-100 cursor-not-allowed' : ''}`} 
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-slateish-700">
                <input 
                  type="checkbox" 
                  checked={phase.enabled} 
                  onChange={e => {
                    const newConfigs = [...configs]; newConfigs[idx].enabled = e.target.checked; setConfigs(newConfigs)
                  }}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                {phase.isEvaluationPhase ? 'Enable Evaluation Phase' : 'Show Phase to Students'}
              </label>
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slateish-700">
                  <input 
                    type="checkbox" 
                    checked={phase.isEvaluationPhase} 
                    onChange={e => {
                      const newConfigs = [...configs]; newConfigs[idx].isEvaluationPhase = e.target.checked; setConfigs(newConfigs)
                    }}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  Is Evaluation Phase
                </label>
              )}
              
              <div className="ml-auto flex gap-2">
                {isAdmin && idx > 0 && (
                  <button onClick={() => handleSwapOrder(idx, idx - 1)} className="shadcn-button-outline text-xs px-2 py-1" title="Move Up">
                    ↑
                  </button>
                )}
                {isAdmin && idx < configs.length - 1 && (
                  <button onClick={() => handleSwapOrder(idx, idx + 1)} className="shadcn-button-outline text-xs px-2 py-1" title="Move Down">
                    ↓
                  </button>
                )}
                {phase.isEvaluationPhase && (
                  <button onClick={() => handleLockPhase(phase.phaseId)} className="shadcn-button-outline text-red-600 border-red-600">
                    Lock Marks
                  </button>
                )}
                <button onClick={() => handleUpdate(phase)} className="shadcn-button">Save Config</button>
                {isAdmin && (
                  <button onClick={() => handleDeletePhase(phase.phaseId)} className="shadcn-button-outline text-red-600 border-red-600">
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {!phase.isEvaluationPhase ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">Form Fields</h3>
                    <button 
                      onClick={() => {
                        const newConfigs = [...configs]; 
                        newConfigs[idx].fields.push({ name: `field_${Date.now()}`, label: 'New Field', type: 'text', required: true })
                        setConfigs(newConfigs)
                      }}
                      className="text-brand-600 text-xs font-semibold hover:underline"
                    >
                      + Add Field
                    </button>
                  </div>
                  <div className="space-y-3">
                    {phase.fields?.map((field, fIdx) => (
                      <div key={fIdx} className="bg-slateish-50 p-3 rounded-lg border grid grid-cols-2 gap-2 relative">
                        <input className="shadcn-input text-sm h-8" value={field.name} onChange={e => { const nc = [...configs]; nc[idx].fields[fIdx].name = e.target.value; setConfigs(nc) }} placeholder="Internal Name (no spaces)" />
                        <input className="shadcn-input text-sm h-8" value={field.label} onChange={e => { const nc = [...configs]; nc[idx].fields[fIdx].label = e.target.value; setConfigs(nc) }} placeholder="Display Label" />
                        <select className="shadcn-input text-sm h-8" value={field.type} onChange={e => { const nc = [...configs]; nc[idx].fields[fIdx].type = e.target.value; setConfigs(nc) }}>
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="file">File Upload</option>
                          <option value="date">Date</option>
                          <option value="url">URL</option>
                        </select>
                        <label className="flex items-center gap-2 text-xs font-semibold">
                          <input type="checkbox" checked={field.required} onChange={e => { const nc = [...configs]; nc[idx].fields[fIdx].required = e.target.checked; setConfigs(nc) }} /> Required
                        </label>
                        {field.type === 'dropdown' && (
                          <input className="shadcn-input text-sm h-8 col-span-2 mt-1" placeholder="Options (comma separated)" value={field.options?.join(', ') || ''} onChange={e => { const nc = [...configs]; nc[idx].fields[fIdx].options = e.target.value.split(',').map(s=>s.trim()); setConfigs(nc) }} />
                        )}
                        <button onClick={() => { const nc = [...configs]; nc[idx].fields.splice(fIdx, 1); setConfigs(nc) }} className="absolute -right-2 -top-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200">
                          X
                        </button>
                      </div>
                    ))}
                    {phase.fields?.length === 0 && <div className="text-xs text-slateish-500">No fields defined. Students will just submit an empty form.</div>}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">Evaluation Parameters (Fixed to 4)</h3>
                  </div>
                  <div className="space-y-3">
                    {phase.evaluationParams?.map((param, pIdx) => (
                      <div key={pIdx} className="bg-slateish-50 p-3 rounded-lg border grid grid-cols-[1fr,1fr,80px] gap-2">
                        <input className="shadcn-input text-sm h-8 bg-slateish-100 cursor-not-allowed" value={param.name || `param_${pIdx+1}`} disabled placeholder="Internal Name" />
                        <input className="shadcn-input text-sm h-8" value={param.label} onChange={e => { const nc = [...configs]; nc[idx].evaluationParams[pIdx].label = e.target.value; setConfigs(nc) }} placeholder="Label (e.g. P1 - Idea)" />
                        <input type="number" className="shadcn-input text-sm h-8" value={param.weightage} onChange={e => { const nc = [...configs]; nc[idx].evaluationParams[pIdx].weightage = Number(e.target.value); setConfigs(nc) }} placeholder="Max" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
