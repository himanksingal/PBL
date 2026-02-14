import React, { useEffect, useState } from 'react'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Unable to load profile')
      }

      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  return (
    <div className="px-6 py-4">
      <div className="rounded-2xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slateish-700">Account Details</div>
          <button
            className="rounded-md border border-brand-500 px-4 py-2 text-xs font-semibold text-brand-600"
            onClick={loadProfile}
          >
            Refresh
          </button>
        </div>

        {loading && <div className="mt-4 text-sm text-slateish-500">Loading...</div>}
        {error && <div className="mt-4 text-sm text-red-500">{error}</div>}

        {profile && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4">
              <div className="text-xs text-slateish-500">Registration ID</div>
              <div className="text-sm font-semibold text-slateish-700">{profile.user.id}</div>
            </div>
            <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4">
              <div className="text-xs text-slateish-500">Name</div>
              <div className="text-sm font-semibold text-slateish-700">{profile.user.name}</div>
            </div>
            <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4">
              <div className="text-xs text-slateish-500">Role</div>
              <div className="text-sm font-semibold text-slateish-700">{profile.user.role}</div>
            </div>
            <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4">
              <div className="text-xs text-slateish-500">Department</div>
              <div className="text-sm font-semibold text-slateish-700">{profile.user.department || '-'}</div>
            </div>
            <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4">
              <div className="text-xs text-slateish-500">Semester</div>
              <div className="text-sm font-semibold text-slateish-700">{profile.user.semester || '-'}</div>
            </div>
            <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4">
              <div className="text-xs text-slateish-500">Year of Graduation</div>
              <div className="text-sm font-semibold text-slateish-700">{profile.user.graduationYear || '-'}</div>
            </div>
            <div className="rounded-lg border border-slateish-200 bg-slateish-50 p-4 sm:col-span-2">
              <div className="text-xs text-slateish-500">Contact Details</div>
              <div className="text-sm font-semibold text-slateish-700">{profile.user.contact || '-'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
