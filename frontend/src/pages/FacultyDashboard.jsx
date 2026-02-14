import React, { useEffect, useState } from 'react'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function FacultyDashboard({ role, user }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })

  const loadAssigned = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `/api/faculty/students?page=${pagination.page}&pageSize=${pagination.pageSize}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load assigned students.')
      setRows(data.rows || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportAssigned = async () => {
    setError('')
    try {
      const response = await fetch('/api/faculty/responses/export', { credentials: 'include' })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Export failed')
      }
      const blob = await response.blob()
      downloadBlob(blob, 'assigned-student-responses.csv')
    } catch (err) {
      setError(err.message)
    }
  }

  const exportAll = async () => {
    setError('')
    try {
      const response = await fetch('/api/faculty/responses/export-all', { credentials: 'include' })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Export all failed')
      }
      const blob = await response.blob()
      downloadBlob(blob, 'all-student-responses.csv')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadAssigned()
  }, [pagination.page, pagination.pageSize])

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slateish-700">Welcome, {user?.name || 'Faculty'}</h1>
            <p className="mt-1 text-sm text-slateish-500">
              Assigned students: {rows.length}. Track form completion and review submissions.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="shadcn-button-outline" onClick={exportAssigned}>
              Export Assigned Responses
            </button>
            {role === 'Faculty Coordinator' && (
              <button className="shadcn-button" onClick={exportAll}>
                Export All Student Responses
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="mb-3 text-sm font-semibold text-slateish-700">Task Completion (PBL Form)</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const completed = row.submissionCount > 0
            return (
              <div
                key={`status-${row.student.id}`}
                className="rounded-lg border border-slateish-200 bg-slateish-50 px-3 py-3 transition hover:border-brand-300"
              >
                <div className="text-sm font-semibold text-slateish-700">{row.student.name}</div>
                <div className="text-xs text-slateish-500">{row.student.id}</div>
                <div className="mt-2">
                  <span
                    className={[
                      'rounded-full px-2 py-1 text-xs font-semibold',
                      completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                    ].join(' ')}
                  >
                    {completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            )
          })}
          {rows.length === 0 && <p className="text-sm text-slateish-500">No students assigned yet.</p>}
        </div>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        {loading && <p className="text-sm text-slateish-500">Loading assigned students...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slateish-100 text-left text-slateish-600">
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Semester</th>
                  <th className="px-3 py-2">Project / Company</th>
                  <th className="px-3 py-2">Form Type</th>
                  <th className="px-3 py-2">Attempts</th>
                  <th className="px-3 py-2">PPT/Web Link</th>
                  <th className="px-3 py-2">GitHub</th>
                  <th className="px-3 py-2">Report</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.student.id} className="border-b border-slateish-200">
                    <td className="px-3 py-2">{row.student.id}</td>
                    <td className="px-3 py-2">{row.student.name}</td>
                    <td className="px-3 py-2">{row.student.semester || '-'}</td>
                    <td className="px-3 py-2">
                      {row.latestSubmission?.projectName || row.latestSubmission?.companyName || '-'}
                    </td>
                    <td className="px-3 py-2">{row.latestSubmission?.submissionType || '-'}</td>
                    <td className="px-3 py-2">{row.submissionCount || 0}</td>
                    <td className="px-3 py-2">
                      {row.latestSubmission?.onlineLink ? (
                        <a
                          href={row.latestSubmission.onlineLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 underline"
                        >
                          Open
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.latestSubmission?.githubRepo ? (
                        <a
                          href={row.latestSubmission.githubRepo}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 underline"
                        >
                          Repo
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.latestSubmission?.offerLetterPath ? (
                        <a
                          href={`http://localhost:5001/${row.latestSubmission.offerLetterPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 underline"
                        >
                          View Upload
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-slateish-500">
                      No assigned students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <div className="mt-4 flex items-center justify-between text-sm text-slateish-600">
            <div>
              Page {pagination.page} of {pagination.totalPages} • Total {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-slateish-200 px-3 py-1 disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded border border-slateish-200 px-3 py-1 disabled:opacity-50"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
