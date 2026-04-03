import React from 'react'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Checkbox } from '../ui/checkbox.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.jsx'

export default function UserDialog({
  dialogOpen,
  setDialogOpen,
  dialogMode,
  isEditingFields,
  setIsEditingFields,
  searchRegNo,
  setSearchRegNo,
  handleSearchUser,
  searchError,
  error,
  success,
  form,
  setForm,
  editingId,
  onSubmit,
  roleOptions,
  authSourceOptions,
  departmentOptions,
  branchOptions,
  semesterOptions,
  graduationYearOptions
}) {
  if (!dialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slateish-800">
              {dialogMode === 'add' ? 'Add New User' : 'Manage User'}
            </h2>
            <p className="mt-1 text-sm text-slateish-500">
              {dialogMode === 'add' ? 'Fill in the details below to add a new user.' : 'Search for a user by registration number to view or edit.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
        </div>

        {dialogMode === 'manage' && (
          <div className="mb-6 rounded-lg border border-slateish-200 bg-slateish-50 p-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slateish-600 mb-1 block">Registration Number</label>
              <Input 
                placeholder="Enter Reg No..." 
                value={searchRegNo}
                onChange={(e) => setSearchRegNo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
              />
            </div>
            <Button onClick={handleSearchUser}>Search</Button>
          </div>
        )}

        {searchError && <p className="mb-4 text-sm text-red-600">{searchError}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-4 text-sm text-emerald-600 font-semibold">{success}</p>}

        {(dialogMode === 'add' || editingId) && (
          <form className="grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
            <Input
              placeholder="Registration Number"
              value={form.id}
              onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
              disabled={!isEditingFields || Boolean(editingId)}
              required
            />
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={!isEditingFields}
              required
            />
            <Select
              value={form.role}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
              disabled={!isEditingFields}
            >
              <SelectTrigger className="border-slateish-200 disabled:opacity-50">
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
            {form.role === 'Faculty' && (
              <label className={`flex items-center gap-2 rounded-md border border-slateish-200 px-3 py-2 text-sm text-slateish-600 ${!isEditingFields ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slateish-50'}`}>
                <Checkbox
                  checked={Boolean(form.isCoordinator)}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isCoordinator: Boolean(checked) }))
                  }
                  disabled={!isEditingFields}
                />
                Is Faculty Coordinator?
              </label>
            )}
            <Select
              value={form.authSource}
              onValueChange={(value) => setForm((prev) => ({ ...prev, authSource: value }))}
              disabled={!isEditingFields}
            >
              <SelectTrigger className="border-slateish-200 disabled:opacity-50">
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
              disabled={!isEditingFields || form.authSource !== 'local'}
            />
            <Input
              type="password"
              placeholder={editingId ? 'New Password (optional)' : 'Temporary Password (min 8 chars)'}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required={form.authSource === 'local' && !editingId}
              disabled={!isEditingFields || form.authSource !== 'local'}
            />
            <label className={`flex items-center gap-2 rounded-md border border-slateish-200 px-3 py-2 text-sm text-slateish-600 ${(!isEditingFields || form.authSource !== 'local') ? 'opacity-50' : ''}`}>
              <Checkbox
                checked={Boolean(form.forcePasswordReset)}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, forcePasswordReset: Boolean(checked) }))
                }
                disabled={!isEditingFields || form.authSource !== 'local'}
              />
              Force password reset on next login
            </label>
            <Select
              value={form.department || '__empty__'}
              onValueChange={(value) => setForm((prev) => ({ ...prev, department: value === '__empty__' ? '' : value }))}
              disabled={!isEditingFields}
            >
              <SelectTrigger className="border-slateish-200 disabled:opacity-50">
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
              disabled={!isEditingFields}
            >
              <SelectTrigger className="border-slateish-200 disabled:opacity-50">
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
              placeholder="Assigned Faculty Reg No."
              value={form.assignedFacultyRegistrationNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, assignedFacultyRegistrationNumber: e.target.value }))
              }
              disabled={!isEditingFields}
            />
            <Select
              value={form.semester || '__empty__'}
              onValueChange={(value) => setForm((prev) => ({ ...prev, semester: value === '__empty__' ? '' : value }))}
              disabled={!isEditingFields}
            >
              <SelectTrigger className="border-slateish-200 disabled:opacity-50">
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
              disabled={!isEditingFields}
            >
              <SelectTrigger className="border-slateish-200 disabled:opacity-50">
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
              disabled={!isEditingFields}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditingFields}
            />
            <div className="md:col-span-3 flex gap-3 mt-4 pt-4 border-t border-slateish-200">
               {!isEditingFields ? (
                  <Button key="edit-btn" type="button" onClick={(e) => { e.preventDefault(); setIsEditingFields(true); }}>
                    Edit Details
                  </Button>
               ) : (
                  <Button key="submit-btn" type="submit">{editingId ? 'Save Changes' : 'Create User'}</Button>
               )}
               <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                 Done
               </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
