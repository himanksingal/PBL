import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/button.jsx'
import { Card } from '../components/ui/card.jsx'
import { Checkbox } from '../components/ui/checkbox.jsx'
import { Input } from '../components/ui/input.jsx'
import { Select } from '../components/ui/select.jsx'
import { Spinner } from '../components/ui/spinner.jsx'
import { Table, TableCell, TableHead, TableRow } from '../components/ui/table.jsx'

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
      <Card>
        <h1 className="text-xl font-semibold text-slateish-700">Manage Users</h1>

        <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
          <Input
            placeholder="User ID"
            value={form.id}
            onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
            disabled={Boolean(editingId)}
            required
          />
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            required
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
          <Select
            value={form.authSource}
            onChange={(e) => setForm((prev) => ({ ...prev, authSource: e.target.value }))}
            required
          >
            <option value="local">Local (Mongo)</option>
            <option value="keycloak">Keycloak</option>
          </Select>
          <Input
            placeholder="Username (local auth)"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required={form.authSource === 'local'}
            disabled={form.authSource !== 'local'}
          />
          <Input
            type="password"
            placeholder={editingId ? 'New Password (optional)' : 'Temporary Password (min 8 chars)'}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required={form.authSource === 'local' && !editingId}
            disabled={form.authSource !== 'local'}
          />
          <label className="flex items-center gap-2 rounded-md border border-slateish-200 px-3 py-2 text-sm text-slateish-600">
            <Checkbox
              checked={Boolean(form.forcePasswordReset)}
              onChange={(e) => setForm((prev) => ({ ...prev, forcePasswordReset: e.target.checked }))}
              disabled={form.authSource !== 'local'}
            />
            Force password reset on next login
          </label>
          <Input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
          />
          <Input
            placeholder="Semester"
            value={form.semester}
            onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
          />
          <Input
            placeholder="Graduation Year"
            value={form.graduationYear}
            onChange={(e) => setForm((prev) => ({ ...prev, graduationYear: e.target.value }))}
          />
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <div className="md:col-span-4 flex gap-3">
            <Button type="submit">
              {editingId ? 'Update User' : 'Add User'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId('')
                  setForm(initialForm)
                }}
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-6">
          <Input
            className="md:col-span-2"
            placeholder="Search by name/id/department..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <Input
            placeholder="Semester"
            value={filters.semester}
            onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
          />
          <Input
            placeholder="Year"
            value={filters.graduationYear}
            onChange={(e) => setFilters((prev) => ({ ...prev, graduationYear: e.target.value }))}
          />
          <Select
            value={filters.sortBy}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
          >
            <option value="name">Sort: Name</option>
            <option value="semester">Sort: Semester</option>
            <option value="graduationYear">Sort: Year</option>
            <option value="role">Sort: Role</option>
            <option value="externalId">Sort: ID</option>
          </Select>
          <Select
            value={filters.sortOrder}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortOrder: e.target.value }))}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </Select>
          <Select
            value={filters.role}
            onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option value="">All Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </div>

        {(searching || loading) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slateish-500">
            <Spinner />
            Searching users...
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}

        <div className="mt-4 overflow-auto">
          <Table>
            <thead>
              <tr className="bg-slateish-100 text-left text-slateish-600">
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Reset Required</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Actions</TableHead>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.authSource || '-'}</TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>{user.mustResetPassword ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{user.semester || '-'}</TableCell>
                  <TableCell>{user.graduationYear || '-'}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="subtle"
                        onClick={() => onEdit(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => onDelete(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !loading && !searching && (
                <tr>
                  <TableCell colSpan={10} className="py-4 text-center text-slateish-500">
                    No users found.
                  </TableCell>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
