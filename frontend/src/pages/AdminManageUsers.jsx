import React, { useEffect, useMemo, useState } from 'react'

const roleOptions = ['Student', 'Faculty Coordinator', 'Master Admin']

const initialForm = {
  id: '',
  name: '',
  role: 'Student',
  authSource: 'local',
  username: '',
  password: '',
  forcePasswordReset: true,
  department: '',
  semester: '',
  graduationYear: '',
  email: '',
  phone: '',
}

export default function AdminManageUsers() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    semester: '',
    graduationYear: '',
    role: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return params.toString()
  }, [filters])

  const loadUsers = async (query) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/users?${query}`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load users')
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const payload = {
      ...form,
      semester: form.semester || null,
      graduationYear: form.graduationYear || null,
      department: form.department || null,
      email: form.email || null,
      phone: form.phone || null,
    }

    const endpoint = editingId
      ? `/api/admin/users/${encodeURIComponent(editingId)}`
      : '/api/admin/users'

    const method = editingId ? 'PUT' : 'POST'

    const response = await fetch(endpoint, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || 'Operation failed')
      return
    }

    setSuccess(editingId ? 'User updated.' : 'User created.')
    setForm(initialForm)
    setEditingId('')
    setSearching(true)
    await loadUsers(queryString)
  }

  const onEdit = (user) => {
    setEditingId(user.id)
    setForm({
      id: user.id,
      name: user.name || '',
      role: user.role || 'Student',
      authSource: user.authSource || 'local',
      username: user.username || '',
      password: '',
      forcePasswordReset: Boolean(user.mustResetPassword),
      department: user.department || '',
      semester: user.semester || '',
      graduationYear: user.graduationYear || '',
      email: user.email || '',
      phone: user.phone || '',
    })
  }

  const onDelete = async (id) => {
    setError('')
    setSuccess('')

    const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Delete failed')
      return
    }

    setSuccess('User deleted.')
    setSearching(true)
    await loadUsers(queryString)
  }

  useEffect(() => {
    setSearching(true)
    const timer = setTimeout(() => {
      loadUsers(queryString)
    }, 1000)

    return () => clearTimeout(timer)
  }, [queryString])

  return (
    <div className="space-y-6 px-6 py-4">
      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <h1 className="text-xl font-semibold text-slateish-700">Manage Users</h1>

        <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
          <input
            className="shadcn-input"
            placeholder="User ID"
            value={form.id}
            onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
            disabled={Boolean(editingId)}
            required
          />
          <input
            className="shadcn-input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <select
            className="shadcn-input"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            required
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            className="shadcn-input"
            value={form.authSource}
            onChange={(e) => setForm((prev) => ({ ...prev, authSource: e.target.value }))}
            required
          >
            <option value="local">Local (Mongo)</option>
            <option value="keycloak">Keycloak</option>
          </select>
          <input
            className="shadcn-input"
            placeholder="Username (local auth)"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required={form.authSource === 'local'}
            disabled={form.authSource !== 'local'}
          />
          <input
            className="shadcn-input"
            type="password"
            placeholder={editingId ? 'New Password (optional)' : 'Temporary Password (min 8 chars)'}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required={form.authSource === 'local' && !editingId}
            disabled={form.authSource !== 'local'}
          />
          <label className="flex items-center gap-2 rounded-md border border-slateish-200 px-3 py-2 text-sm text-slateish-600">
            <input
              type="checkbox"
              checked={Boolean(form.forcePasswordReset)}
              onChange={(e) => setForm((prev) => ({ ...prev, forcePasswordReset: e.target.checked }))}
              disabled={form.authSource !== 'local'}
            />
            Force password reset on next login
          </label>
          <input
            className="shadcn-input"
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
          />
          <input
            className="shadcn-input"
            placeholder="Semester"
            value={form.semester}
            onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
          />
          <input
            className="shadcn-input"
            placeholder="Graduation Year"
            value={form.graduationYear}
            onChange={(e) => setForm((prev) => ({ ...prev, graduationYear: e.target.value }))}
          />
          <input
            className="shadcn-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            className="shadcn-input"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <div className="md:col-span-4 flex gap-3">
            <button className="shadcn-button" type="submit">
              {editingId ? 'Update User' : 'Add User'}
            </button>
            {editingId && (
              <button
                type="button"
                className="shadcn-button-outline"
                onClick={() => {
                  setEditingId('')
                  setForm(initialForm)
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slateish-200 bg-white p-6 shadow-soft">
        <div className="grid gap-3 md:grid-cols-6">
          <input
            className="shadcn-input md:col-span-2"
            placeholder="Search by name/id/department..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <input
            className="shadcn-input"
            placeholder="Semester"
            value={filters.semester}
            onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
          />
          <input
            className="shadcn-input"
            placeholder="Year"
            value={filters.graduationYear}
            onChange={(e) => setFilters((prev) => ({ ...prev, graduationYear: e.target.value }))}
          />
          <select
            className="shadcn-input"
            value={filters.sortBy}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
          >
            <option value="name">Sort: Name</option>
            <option value="semester">Sort: Semester</option>
            <option value="graduationYear">Sort: Year</option>
            <option value="role">Sort: Role</option>
            <option value="externalId">Sort: ID</option>
          </select>
          <select
            className="shadcn-input"
            value={filters.sortOrder}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortOrder: e.target.value }))}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
          <select
            className="shadcn-input"
            value={filters.role}
            onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option value="">All Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {(searching || loading) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slateish-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Searching users...
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}

        <div className="mt-4 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slateish-100 text-left text-slateish-600">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Auth</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Reset Required</th>
                <th className="px-3 py-2">Semester</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slateish-200">
                  <td className="px-3 py-2">{user.id}</td>
                  <td className="px-3 py-2">{user.name}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{user.authSource || '-'}</td>
                  <td className="px-3 py-2">{user.username || '-'}</td>
                  <td className="px-3 py-2">{user.mustResetPassword ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{user.semester || '-'}</td>
                  <td className="px-3 py-2">{user.graduationYear || '-'}</td>
                  <td className="px-3 py-2">{user.department || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="rounded-md border border-brand-400 px-2 py-1 text-brand-600"
                        onClick={() => onEdit(user)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md border border-red-300 px-2 py-1 text-red-600"
                        onClick={() => onDelete(user.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && !searching && (
                <tr>
                  <td colSpan={10} className="px-3 py-4 text-center text-slateish-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
