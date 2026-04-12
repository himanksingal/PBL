import React, { useEffect, useState } from 'react'

function formatDate(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4">
      <div className="text-xs text-slateish-500">{label}</div>
      <div className="text-sm font-semibold text-slateish-700">{value || '-'}</div>
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/profile', { credentials: 'include' })
      if (!response.ok) throw new Error('Unable to load profile')
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  const u = profile?.user

  return (
    <div className="px-6 py-4">
      <div className="rounded-2xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="text-sm font-semibold text-slateish-700">Account Details</div>

        {loading && <div className="mt-4 text-sm text-slateish-500">Loading...</div>}
        {error && <div className="mt-4 text-sm text-red-500">{error}</div>}

        {u && (
          <div className="mt-6 space-y-6">
            {/* Identity */}
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slateish-400">Identity</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Registration ID" value={u.id} />
                <Field label="Role" value={u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : null} />
              </div>
            </div>

            {/* Name */}
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slateish-400">Name</div>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Full Name" value={`${u.firstName} ${u.lastName || ''}`.trim()} />
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slateish-400">Contact</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email" value={u.email} />
                <Field label="Phone" value={u.phone} />
              </div>
            </div>

            {/* Academic */}
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slateish-400">Academic Info</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Department" value={u.department} />
                <Field label="Branch" value={u.branch} />
                <Field label="Semester" value={u.semester} />

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
