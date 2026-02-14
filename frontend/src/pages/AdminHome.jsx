import React, { useEffect, useState } from 'react'

export default function AdminHome({ user }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        setError('')
        const response = await fetch('/api/admin/stats', { credentials: 'include' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to fetch stats')
        setStats(data)
      } catch (err) {
        setError(err.message)
      }
    }
    run()
  }, [])

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold text-slateish-700">
          Welcome, {user?.name || 'Master Admin'}
        </h1>
        <p className="mt-2 text-sm text-slateish-500">
          Manage users, roles, and academic metadata from one place.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slateish-200 bg-white p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wide text-slateish-500">Students</div>
          <div className="mt-2 text-3xl font-semibold text-slateish-800">{stats?.students ?? '-'}</div>
        </div>
        <div className="rounded-xl border border-slateish-200 bg-white p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wide text-slateish-500">Faculty</div>
          <div className="mt-2 text-3xl font-semibold text-slateish-800">{stats?.faculty ?? '-'}</div>
        </div>
        <div className="rounded-xl border border-slateish-200 bg-white p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wide text-slateish-500">Admins</div>
          <div className="mt-2 text-3xl font-semibold text-slateish-800">{stats?.admins ?? '-'}</div>
        </div>
        <div className="rounded-xl border border-slateish-200 bg-white p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wide text-slateish-500">Total Users</div>
          <div className="mt-2 text-3xl font-semibold text-slateish-800">{stats?.totalUsers ?? '-'}</div>
        </div>
      </div>
    </div>
  )
}
