import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'
import { Button } from '../components/ui/button.jsx'
import { Checkbox } from '../components/ui/checkbox.jsx'
import { Spinner } from '../components/ui/spinner.jsx'

export default function FacultyAssignments() {
  const [faculties, setFaculties] = useState([])
  const [facultySearch, setFacultySearch] = useState('')
  const [facultyQuery, setFacultyQuery] = useState('')
  const [facultyLoading, setFacultyLoading] = useState(false)
  const [selectedFacultyRegNo, setSelectedFacultyRegNo] = useState('')
  const [facultyPagination, setFacultyPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 1 })

  const [students, setStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [studentQuery, setStudentQuery] = useState('')
  const [studentLoading, setStudentLoading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState(new Set())
  const [studentPagination, setStudentPagination] = useState({ page: 1, pageSize: 12, total: 0, totalPages: 1 })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedFaculty = useMemo(
    () => faculties.find((item) => item.registrationNumber === selectedFacultyRegNo) || null,
    [faculties, selectedFacultyRegNo]
  )

  useEffect(() => {
    const timer = setTimeout(() => setFacultyQuery(facultySearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [facultySearch])

  useEffect(() => {
    const timer = setTimeout(() => setStudentQuery(studentSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [studentSearch])

  const loadFaculties = async () => {
    setFacultyLoading(true)
    setError('')
    try {
      const response = await fetch(
        `/api/assignments/faculties?search=${encodeURIComponent(facultyQuery)}&page=${facultyPagination.page}&pageSize=${facultyPagination.pageSize}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load faculties')
      setFaculties(data.faculties || [])
      setFacultyPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setFacultyLoading(false)
    }
  }

  const loadStudents = async () => {
    if (!selectedFacultyRegNo) {
      setStudents([])
      setSelectedStudents(new Set())
      return
    }

    setStudentLoading(true)
    setError('')
    try {
      const response = await fetch(
        `/api/assignments/students?search=${encodeURIComponent(studentQuery)}&facultyRegistrationNumber=${encodeURIComponent(selectedFacultyRegNo)}&page=${studentPagination.page}&pageSize=${studentPagination.pageSize}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load students')
      const rows = data.students || []
      setStudents(rows)
      setSelectedStudents(new Set(rows.filter((item) => item.selected).map((item) => item.id)))
      setStudentPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setStudentLoading(false)
    }
  }

  useEffect(() => {
    loadFaculties()
  }, [facultyQuery, facultyPagination.page, facultyPagination.pageSize])

  useEffect(() => {
    loadStudents()
  }, [studentQuery, selectedFacultyRegNo, studentPagination.page, studentPagination.pageSize])

  const toggleStudent = (studentId, checked) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (checked) next.add(studentId)
      else next.delete(studentId)
      return next
    })
  }

  const saveAssignments = async () => {
    if (!selectedFacultyRegNo) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/assignments/link', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyRegistrationNumber: selectedFacultyRegNo,
          studentIds: Array.from(selectedStudents),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to save assignments')

      setSuccess(`Assigned ${data.assignedCount || 0} students to ${selectedFacultyRegNo}.`)
      await loadStudents()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 px-6 py-4">
      <Card>
        <h1 className="text-xl font-semibold text-slateish-700">Assign Faculty to Students</h1>
        <p className="mt-1 text-sm text-slateish-500">
          Select a faculty member, then choose students to assign in a single save action.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="transition duration-300 hover:shadow-card">
          <div className="mb-3 text-sm font-semibold text-slateish-700">Select Faculty</div>
          <Input
            value={facultySearch}
            onChange={(event) => {
              setFacultyPagination((prev) => ({ ...prev, page: 1 }))
              setFacultySearch(event.target.value)
            }}
            placeholder="Search by faculty name or registration number"
          />

          {facultyLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slateish-500">
              <Spinner />
              Loading faculty list...
            </div>
          )}

          <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
            {faculties.map((faculty) => {
              const active = selectedFacultyRegNo === faculty.registrationNumber
              return (
                <button
                  key={faculty.registrationNumber}
                  type="button"
                  onClick={() => {
                    setSelectedFacultyRegNo(faculty.registrationNumber)
                    setStudentPagination((prev) => ({ ...prev, page: 1 }))
                    setSuccess('')
                    setError('')
                  }}
                  className={[
                    'w-full rounded-lg border px-4 py-3 text-left transition',
                    active
                      ? 'border-brand-500 bg-brand-50 shadow-soft'
                      : 'border-slateish-200 bg-white hover:border-brand-300 hover:bg-slateish-50',
                  ].join(' ')}
                >
                  <div className="font-semibold text-slateish-700">{faculty.name}</div>
                  <div className="text-xs text-slateish-500">{faculty.registrationNumber} • {faculty.role}</div>
                </button>
              )
            })}
            {!facultyLoading && faculties.length === 0 && (
              <p className="text-sm text-slateish-500">No faculty found.</p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slateish-500">
            <span>Page {facultyPagination.page} of {facultyPagination.totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-slateish-200 px-2 py-1 disabled:opacity-50"
                disabled={facultyPagination.page <= 1}
                onClick={() =>
                  setFacultyPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded border border-slateish-200 px-2 py-1 disabled:opacity-50"
                disabled={facultyPagination.page >= facultyPagination.totalPages}
                onClick={() =>
                  setFacultyPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                }
              >
                Next
              </button>
            </div>
          </div>
        </Card>

        <Card
          className={[
            'transition duration-300',
            selectedFacultyRegNo ? 'opacity-100 hover:shadow-card' : 'pointer-events-none opacity-60',
          ].join(' ')}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slateish-700">Assign Students</div>
              <div className="text-xs text-slateish-500">
                {selectedFaculty
                  ? `Selected: ${selectedFaculty.name} (${selectedFaculty.registrationNumber})`
                  : 'Select faculty to unlock this section'}
              </div>
            </div>
            <Button onClick={saveAssignments} disabled={!selectedFacultyRegNo || saving}>
              {saving ? 'Saving...' : 'Save Assignment'}
            </Button>
          </div>

          <Input
            value={studentSearch}
            onChange={(event) => {
              setStudentPagination((prev) => ({ ...prev, page: 1 }))
              setStudentSearch(event.target.value)
            }}
            placeholder="Search students by name or registration number"
            disabled={!selectedFacultyRegNo}
          />

          {studentLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slateish-500">
              <Spinner />
              Loading students...
            </div>
          )}

          <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
            {students.map((student) => (
              <label
                key={student.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slateish-200 bg-white px-3 py-3 transition hover:border-brand-300"
              >
                <div>
                  <div className="text-sm font-semibold text-slateish-700">{student.name}</div>
                  <div className="text-xs text-slateish-500">
                    {student.registrationNumber} • Sem {student.semester || '-'} • {student.department || '-'}
                  </div>
                </div>
                <Checkbox
                  checked={selectedStudents.has(student.id)}
                  onCheckedChange={(checked) =>
                    toggleStudent(student.id, Boolean(checked))
                  }
                />
              </label>
            ))}
            {!studentLoading && students.length === 0 && selectedFacultyRegNo && (
              <p className="text-sm text-slateish-500">No students found.</p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slateish-500">
            <span>Page {studentPagination.page} of {studentPagination.totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-slateish-200 px-2 py-1 disabled:opacity-50"
                disabled={studentPagination.page <= 1}
                onClick={() =>
                  setStudentPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded border border-slateish-200 px-2 py-1 disabled:opacity-50"
                disabled={studentPagination.page >= studentPagination.totalPages}
                onClick={() =>
                  setStudentPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                }
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
    </div>
  )
}
