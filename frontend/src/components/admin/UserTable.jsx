import React from 'react'
import { Button } from '../ui/button.jsx'
import { Spinner } from '../ui/spinner.jsx'
import { Table, TableCell, TableHead, TableRow } from '../ui/table.jsx'

export default function UserTable({
  users,
  loading,
  searching,
  onEditClick,
  onDelete,
  pagination,
  setPagination
}) {
  return (
    <>
      {(searching || loading) && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slateish-500">
          <Spinner />
          Searching users...
        </div>
      )}

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
                <TableCell>
                  <div className="flex items-center gap-2">
                     {user.role}
                     {user.role === 'Faculty' && user.isCoordinator && (
                       <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                         Coordinator
                       </span>
                     )}
                  </div>
                </TableCell>
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
                    <Button variant="subtle" onClick={() => onEditClick(user)}>Edit</Button>
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
    </>
  )
}
