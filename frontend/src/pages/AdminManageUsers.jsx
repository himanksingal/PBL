import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/button.jsx'
import { Card } from '../components/ui/card.jsx'
import { Checkbox } from '../components/ui/checkbox.jsx'
import { Input } from '../components/ui/input.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx'
import { Spinner } from '../components/ui/spinner.jsx'
import { Table, TableCell, TableHead, TableRow } from '../components/ui/table.jsx'

const initialForm = {
  id: '',
  name: '',
  role: 'Student',
  authSource: 'local',
  username: '',
  password: '',
  forcePasswordReset: true,
  department: '',
  branch: '',
  assignedFacultyRegistrationNumber: '',
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
    department: '',
    branch: '',
    role: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [enums, setEnums] = useState({
    roles: { options: ['Student', 'Faculty', 'Faculty Coordinator', 'Master Admin'] },
    authSources: { options: ['local', 'keycloak'] },
    departments: { options: [] },
    branches: { options: [] },
    semesters: { options: [] },
    graduationYears: { options: [] },
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !(key === 'role' && value === 'all')) params.set(key, value)
    })
    params.set('page', String(pagination.page))
    params.set('pageSize', String(pagination.pageSize))
    return params.toString()
  }, [filters, pagination.page, pagination.pageSize])

  const loadEnums = async () => {
    try {
      const response = await fetch('/api/meta/enums', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load enums')
      setEnums(data.enums || {})
      setForm((prev) => ({
        ...prev,
        role: data.enums?.roles?.options?.[0] || prev.role,
        authSource: data.enums?.authSources?.options?.[0] || prev.authSource,
      }))
    } catch {
      // fallback is already set in initial state
    }
  }

  const loadUsers = async (query) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/users?${query}`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load users')
      setUsers(data.users || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }))
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
      branch: form.branch || null,
      assignedFacultyRegistrationNumber: form.assignedFacultyRegistrationNumber || null,
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
    setForm({ ...initialForm, role: enums?.roles?.options?.[0] || 'Student', authSource: enums?.authSources?.options?.[0] || 'local' })
    setEditingId('')
    setSearching(true)
    await loadUsers(queryString)
  }

  const onEdit = (user) => {
    setEditingId(user.internalId || user.id)
    setForm({
      id: user.id,
      name: user.name || '',
      role: user.role || (enums?.roles?.options?.[0] || 'Student'),
      authSource: user.authSource || (enums?.authSources?.options?.[0] || 'local'),
      username: user.username || '',
      password: '',
      forcePasswordReset: Boolean(user.mustResetPassword),
      department: user.department || '',
      branch: user.branch || '',
      assignedFacultyRegistrationNumber: user.assignedFacultyRegistrationNumber || '',
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
    loadEnums()
  }, [])

  useEffect(() => {
    setSearching(true)
    const timer = setTimeout(() => {
      loadUsers(queryString)
    }, 400)

    return () => clearTimeout(timer)
  }, [queryString])

  const roleOptions = enums?.roles?.options || []
  const authSourceOptions = enums?.authSources?.options || []
  const departmentOptions = enums?.departments?.options || []
  const branchOptions = enums?.branches?.options || []
  const semesterOptions = enums?.semesters?.options || []
  const graduationYearOptions = enums?.graduationYears?.options || []

  return (
    <div className="space-y-6 px-6 py-4">
      <Card>
        <h1 className="text-xl font-semibold text-slateish-700">Manage Users</h1>

        <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
          <Input
            placeholder="Registration Number"
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
            onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.authSource}
            onValueChange={(value) => setForm((prev) => ({ ...prev, authSource: value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200">
              <SelectValue placeholder="Select auth source" />
            </SelectTrigger>
            <SelectContent>
              {authSourceOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {source === 'local' ? 'Local (Mongo)' : 'Keycloak'}
                </SelectItem>
              ))}
            </SelectContent>
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
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, forcePasswordReset: Boolean(checked) }))
              }
              disabled={form.authSource !== 'local'}
            />
            Force password reset on next login
          </label>
          <Select
            value={form.department || '__empty__'}
            onValueChange={(value) => setForm((prev) => ({ ...prev, department: value === '__empty__' ? '' : value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">None</SelectItem>
              {departmentOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.branch || '__empty__'}
            onValueChange={(value) => setForm((prev) => ({ ...prev, branch: value === '__empty__' ? '' : value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">None</SelectItem>
              {branchOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Assigned Faculty Registration No. (students)"
            value={form.assignedFacultyRegistrationNumber}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, assignedFacultyRegistrationNumber: e.target.value }))
            }
          />
          <Select
            value={form.semester || '__empty__'}
            onValueChange={(value) => setForm((prev) => ({ ...prev, semester: value === '__empty__' ? '' : value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">None</SelectItem>
              {semesterOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.graduationYear || '__empty__'}
            onValueChange={(value) => setForm((prev) => ({ ...prev, graduationYear: value === '__empty__' ? '' : value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200">
              <SelectValue placeholder="Graduation Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">None</SelectItem>
              {graduationYearOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <Button type="submit">{editingId ? 'Update User' : 'Add User'}</Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId('')
                  setForm({ ...initialForm, role: roleOptions[0] || 'Student', authSource: authSourceOptions[0] || 'local' })
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
            onChange={(e) => {
              setPagination((prev) => ({ ...prev, page: 1 }))
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }}
          />
          <Select
            value={filters.semester || '__all__'}
            onValueChange={(value) => {
              setPagination((prev) => ({ ...prev, page: 1 }))
              setFilters((prev) => ({ ...prev, semester: value === '__all__' ? '' : value }))
            }}
          >
            <SelectTrigger className="h-11 border-slateish-200"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Semesters</SelectItem>
              {semesterOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.graduationYear || '__all__'}
            onValueChange={(value) => {
              setPagination((prev) => ({ ...prev, page: 1 }))
              setFilters((prev) => ({ ...prev, graduationYear: value === '__all__' ? '' : value }))
            }}
          >
            <SelectTrigger className="h-11 border-slateish-200"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Years</SelectItem>
              {graduationYearOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="semester">Sort: Semester</SelectItem>
              <SelectItem value="graduationYear">Sort: Year</SelectItem>
              <SelectItem value="role">Sort: Role</SelectItem>
              <SelectItem value="registrationNumber">Sort: ID</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, sortOrder: value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200"><SelectValue placeholder="Sort order" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.role}
            onValueChange={(value) => {
              setPagination((prev) => ({ ...prev, page: 1 }))
              setFilters((prev) => ({ ...prev, role: value }))
            }}
          >
            <SelectTrigger className="h-11 border-slateish-200"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roleOptions.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
            </SelectContent>
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
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned Faculty</TableHead>
                <TableHead>Actions</TableHead>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <TableRow key={user.internalId || user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.authSource || '-'}</TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>{user.mustResetPassword ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{user.semester || '-'}</TableCell>
                  <TableCell>{user.graduationYear || '-'}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.assignedFacultyRegistrationNumber || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="subtle" onClick={() => onEdit(user)}>Edit</Button>
                      <Button variant="destructive" onClick={() => onDelete(user.internalId || user.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !loading && !searching && (
                <tr>
                  <TableCell colSpan={13} className="py-4 text-center text-slateish-500">
                    No users found.
                  </TableCell>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slateish-600">
          <div>
            Page {pagination.page} of {pagination.totalPages} • Total {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
              }
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
