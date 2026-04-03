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
import UserTable from '../components/admin/UserTable.jsx'
import UserDialog from '../components/admin/UserDialog.jsx'

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
  isCoordinator: false,
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
    role: 'Student',
    sortBy: 'registrationNumber',
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

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('add') // 'add' or 'manage'
  const [isEditingFields, setIsEditingFields] = useState(false)
  const [searchRegNo, setSearchRegNo] = useState('')
  const [searchError, setSearchError] = useState('')

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

  const openAddDialog = () => {
    setForm({ ...initialForm, role: enums?.roles?.options?.[0] || 'Student', authSource: enums?.authSources?.options?.[0] || 'local' })
    setEditingId('')
    setDialogMode('add')
    setIsEditingFields(true)
    setDialogOpen(true)
    setError('')
    setSuccess('')
    setSearchError('')
  }

  const openManageDialog = () => {
    setForm(initialForm)
    setEditingId('')
    setDialogMode('manage')
    setIsEditingFields(false)
    setSearchRegNo('')
    setDialogOpen(true)
    setError('')
    setSuccess('')
    setSearchError('')
  }

  const handleSearchUser = async () => {
    if (!searchRegNo.trim()) return
    setSearchError('')
    setSuccess('')
    setError('')
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchRegNo)}`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'User not found')
      const user = (data.users || []).find((u) => u.id === searchRegNo.trim())
      
      if (user) {
        onEdit(user) // populates form and sets editingId
        setIsEditingFields(false)
      } else {
        setSearchError('User not found.')
        setForm(initialForm)
        setEditingId('')
      }
    } catch (err) {
      setSearchError(err.message)
    }
  }

  const onEditClick = (user) => {
    onEdit(user)
    setDialogMode('manage')
    setIsEditingFields(false)
    setSearchRegNo(user.id)
    setDialogOpen(true)
    setError('')
    setSuccess('')
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
      isCoordinator: form.isCoordinator || false,
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

    setSuccess(editingId ? 'User updated successfully.' : 'User created successfully.')
    setIsEditingFields(false)
    if (!editingId && data.user) {
      setEditingId(data.user.internalId || data.user.id)
    }
    
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
      isCoordinator: Boolean(user.isCoordinator),
    })
  }

  const onDelete = async (id) => {
    // Only used directly in the table currently
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
      {/* Top action bar */}
      <Card className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slateish-700">Manage Users Dashboard</h1>
          <p className="mt-1 text-sm text-slateish-500">
            View, search, edit and add members of the institution.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={openAddDialog}>Add User</Button>
          <Button variant="outline" onClick={openManageDialog}>Manage Users</Button>
        </div>
      </Card>

      <Card>
        {/* Role Tabs */}
        <div className="mb-6 flex overflow-hidden rounded-lg border border-slateish-200 bg-slateish-50 w-fit">
          {['Student', 'Faculty', 'Master Admin'].map((r) => {
            const isActive = filters.role === r
            return (
              <button
                type="button"
                key={r}
                onClick={() => {
                  setPagination((prev) => ({ ...prev, page: 1 }))
                  setFilters((prev) => ({ ...prev, role: r }))
                }}
                className={[
                  'px-6 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slateish-600 hover:bg-slateish-100/50 hover:text-slateish-800'
                ].join(' ')}
              >
                {r === 'Master Admin' ? 'Admin' : r}
              </button>
            )
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-5">
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
            value={filters.sortOrder}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, sortOrder: value }))}
          >
            <SelectTrigger className="h-11 border-slateish-200"><SelectValue placeholder="Sort order" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(searching || loading) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slateish-500">
            <Spinner />
            Searching users...
          </div>
        )}

        <UserTable 
          users={users}
          loading={loading}
          searching={searching}
          onEditClick={onEditClick}
          onDelete={onDelete}
          pagination={pagination}
          setPagination={setPagination}
        />
      </Card>

      <UserDialog 
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        dialogMode={dialogMode}
        isEditingFields={isEditingFields}
        setIsEditingFields={setIsEditingFields}
        searchRegNo={searchRegNo}
        setSearchRegNo={setSearchRegNo}
        handleSearchUser={handleSearchUser}
        searchError={searchError}
        error={error}
        success={success}
        form={form}
        setForm={setForm}
        editingId={editingId}
        onSubmit={onSubmit}
        roleOptions={roleOptions}
        authSourceOptions={authSourceOptions}
        departmentOptions={departmentOptions}
        branchOptions={branchOptions}
        semesterOptions={semesterOptions}
        graduationYearOptions={graduationYearOptions}
      />
    </div>
  )
}
