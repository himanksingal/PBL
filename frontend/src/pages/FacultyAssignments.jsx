import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'
import { Button } from '../components/ui/button.jsx'
import { Spinner } from '../components/ui/spinner.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx'
import AvailableStudentsTable from '../components/faculty/AvailableStudentsTable.jsx'
import AssignedStudentsTable from '../components/faculty/AssignedStudentsTable.jsx'

export default function FacultyAssignments() {
  const [faculties, setFaculties] = useState([])
  const semesterOptions = ['All','1','2','3','4','5','6','7','8']
  const [facultyLoading, setFacultyLoading] = useState(false)

  const [selectedFacultyRegNo, setSelectedFacultyRegNo] = useState('')
  const [facultyInputText, setFacultyInputText] = useState('')
  const [facultyOpen, setFacultyOpen] = useState(false)
  const [semesterInputText, setSemesterInputText] = useState('')
  const [semesterOpen, setSemesterOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState('')

  // Left Column (Available Students)
  const [availableStudents, setAvailableStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [studentQuery, setStudentQuery] = useState('')
  const [availableLoading, setAvailableLoading] = useState(false)
  const [studentPagination, setStudentPagination] = useState({ page: 1, pageSize: 12, total: 0, totalPages: 1 })

  // Right Column (Assigned Students)
  const [assignedStudents, setAssignedStudents] = useState([])
  const [assignedLoading, setAssignedLoading] = useState(false)

  // Local state changes before save
  const [pendingAdditions, setPendingAdditions] = useState(new Set())
  const [pendingRemovals, setPendingRemovals] = useState(new Set())

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedFaculty = useMemo(
    () => faculties.find((item) => item.registrationNumber === selectedFacultyRegNo) || null,
    [faculties, selectedFacultyRegNo]
  )

  useEffect(() => {
    const timer = setTimeout(() => setStudentQuery(studentSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [studentSearch])



  const loadFaculties = async () => {
    setFacultyLoading(true)
    setError('')
    try {
      const response = await fetch('/api/assignments/faculties?pageSize=1000', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load faculties')
      setFaculties(data.faculties || [])
    } catch (err) {
      console.error(err)
    } finally {
      setFacultyLoading(false)
    }
  }

  useEffect(() => {
    loadFaculties()
  }, [])

  const loadAvailableStudents = async () => {
    if (!selectedSemester) {
      setAvailableStudents([])
      return
    }

    const semesterParam = selectedSemester === 'All' ? '' : selectedSemester;
    setAvailableLoading(true)
    try {
      const response = await fetch(
        `/api/assignments/students?semester=${encodeURIComponent(semesterParam)}&search=${encodeURIComponent(studentQuery)}&page=${studentPagination.page}&pageSize=${studentPagination.pageSize}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load students')
      setAvailableStudents(data.students || [])
      setStudentPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setAvailableLoading(false)
    }
  }

  const loadAssignedStudents = async () => {
    if (!selectedFacultyRegNo) {
      setAssignedStudents([])
      return
    }

    setAssignedLoading(true)
    try {
      const response = await fetch(
        `/api/assignments/students?onlyAssignedTo=${encodeURIComponent(selectedFacultyRegNo)}&pageSize=1000`,
        { credentials: 'include' }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load assigned students')
      setAssignedStudents(data.students || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setAssignedLoading(false)
    }
  }

  useEffect(() => {
    loadAvailableStudents()
  }, [selectedSemester, studentQuery, studentPagination.page, studentPagination.pageSize])

  useEffect(() => {
    setPendingAdditions(new Set())
    setPendingRemovals(new Set())
    loadAssignedStudents()
  }, [selectedFacultyRegNo])

  const handleAddStudent = (student) => {
    setPendingRemovals((prev) => {
      const next = new Set(prev)
      next.delete(student.id)
      return next
    })
    setPendingAdditions((prev) => {
      const next = new Set(prev)
      next.add(student.id)
      return next
    })
    
    setAvailableStudents(prev => prev.filter(s => s.id !== student.id))
    setAssignedStudents(prev => [...prev, student])
  }

  const handleRemoveStudent = (student) => {
    setPendingAdditions((prev) => {
      const next = new Set(prev)
      next.delete(student.id)
      return next
    })
    setPendingRemovals((prev) => {
      const next = new Set(prev)
      next.add(student.id)
      return next
    })

    setAssignedStudents(prev => prev.filter(s => s.id !== student.id))
    
    // If they match the current semester filter, put them back
    if (student.semester === selectedSemester) {
      setAvailableStudents(prev => [student, ...prev])
    }
  }

  const saveAssignments = async () => {
    if (!selectedFacultyRegNo) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const finalStudentIds = assignedStudents.map(s => s.id)
      const response = await fetch('/api/assignments/link', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyRegistrationNumber: selectedFacultyRegNo,
          studentIds: finalStudentIds,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to save assignments')

      setSuccess(`Assignments updated. ${data.assignedCount || 0} students assigned to ${selectedFacultyRegNo}.`)
      setPendingAdditions(new Set())
      setPendingRemovals(new Set())
      await Promise.all([loadAvailableStudents(), loadAssignedStudents()])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const hasUnsavedChanges = pendingAdditions.size > 0 || pendingRemovals.size > 0

  return (
    <div className="space-y-6 px-6 py-4">
      <Card>
        <h1 className="text-xl font-semibold text-slateish-700">Assign Faculty to Students</h1>
        <p className="mt-1 text-sm text-slateish-500">
          Select a semester and a faculty member. Move students to assign or unassign them.
        </p>
      </Card>

      <Card className="grid gap-4 sm:grid-cols-2">
        <div className="relative">
          <label className="mb-1 block text-sm font-semibold text-slateish-700">1. Select Semester</label>
          <div className="relative">
            <Input 
              placeholder="Type or select a semester..."
              value={semesterInputText}
              onChange={(e) => {
                 setSemesterInputText(e.target.value)
                 setSemesterOpen(true)
                 const match = semesterOptions.find(o => o === e.target.value.trim())
                 if (match) {
                   setSelectedSemester(match)
                   setStudentPagination(prev => ({ ...prev, page: 1 }))
                 } else {
                   setSelectedSemester('')
                 }
              }}
              onFocus={() => setSemesterOpen(true)}
              onBlur={() => setTimeout(() => setSemesterOpen(false), 200)}
              className="pr-10"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none text-slateish-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {semesterOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slateish-200 rounded-md shadow-lg overflow-hidden">
              {semesterOptions.filter(o => o.includes(semesterInputText)).map(opt => (
                <div 
                  key={opt}
                  className="px-3 py-2 text-sm hover:bg-slateish-100 cursor-pointer text-slateish-700"
                  onClick={() => {
                    setSemesterInputText(opt)
                    setSelectedSemester(opt)
                    setStudentPagination(prev => ({ ...prev, page: 1 }))
                    setSemesterOpen(false)
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="mb-1 block text-sm font-semibold text-slateish-700">2. Select Faculty</label>
          <div className="relative">
            <Input 
               placeholder="Type to search faculty..."
               value={facultyInputText}
               disabled={facultyLoading}
               onChange={(e) => {
                 const val = e.target.value
                 setFacultyInputText(val)
                 setFacultyOpen(true)
               }}
               onFocus={() => setFacultyOpen(true)}
               onBlur={() => setTimeout(() => setFacultyOpen(false), 200)}
               className="pr-10"
             />
             <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none text-slateish-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             {facultyLoading && <Spinner className="absolute right-8 top-3 h-4 w-4" />}
          </div>
          
           {facultyOpen && (
              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slateish-200 rounded-md shadow-lg">
                {faculties.filter(fac => 
                  fac.name.toLowerCase().includes(facultyInputText.toLowerCase()) || 
                  fac.registrationNumber.toLowerCase().includes(facultyInputText.toLowerCase())
                ).map(fac => (
                  <div 
                    key={fac.registrationNumber}
                    className="px-3 py-2 text-sm hover:bg-slateish-100 cursor-pointer"
                    onClick={() => {
                      setFacultyInputText(`${fac.name} (${fac.registrationNumber})`)
                      setSelectedFacultyRegNo(fac.registrationNumber)
                      setSuccess('')
                      setFacultyOpen(false)
                    }}
                  >
                    <div className="font-medium text-slateish-700">{fac.name}</div>
                    <div className="text-xs text-slateish-500">{fac.registrationNumber}</div>
                  </div>
                ))}
                {faculties.filter(fac => 
                  fac.name.toLowerCase().includes(facultyInputText.toLowerCase()) || 
                  fac.registrationNumber.toLowerCase().includes(facultyInputText.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-sm text-slateish-500">No faculty found.</div>
                )}
              </div>
           )}
        </div>
      </Card>

      <div className="flex justify-between items-center">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}
        {!error && !success && <div></div>}

        <Button 
          onClick={saveAssignments} 
          disabled={!selectedFacultyRegNo || saving || !hasUnsavedChanges}
          className={hasUnsavedChanges ? "animate-pulse shadow-brand-500/50" : ""}
        >
          {saving ? 'Saving...' : 'Save Assignments'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Left Column: Available Students */}
        <AvailableStudentsTable 
          studentPagination={studentPagination}
          setStudentPagination={setStudentPagination}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          selectedSemester={selectedSemester}
          availableLoading={availableLoading}
          availableStudents={availableStudents}
          assignedStudents={assignedStudents}
          selectedFacultyRegNo={selectedFacultyRegNo}
          handleAddStudent={handleAddStudent}
        />

        {/* Right Column: Assigned Students */}
        <AssignedStudentsTable 
          selectedFaculty={selectedFaculty}
          selectedFacultyRegNo={selectedFacultyRegNo}
          assignedLoading={assignedLoading}
          assignedStudents={assignedStudents}
          handleRemoveStudent={handleRemoveStudent}
        />
      </div>
    </div>
  )
}
