import React from 'react'
import { Button } from '../ui/button.jsx'
import { Table, TableCell, TableHead, TableRow } from '../ui/table.jsx'

export default function UserTable({
  users,
  onEditClick,
  onDelete,
  pagination,
  setPagination,
  currentRole = 'student'
}) {
  const isStudent = currentRole === 'student';
  const isFaculty = currentRole === 'faculty';
  const isAdmin = currentRole === 'admin';

  return (
    <>
      <div className="mt-4 overflow-auto">
        <Table>
          <thead>
            <tr className="bg-slateish-100 text-left text-slateish-600">
              <TableHead>Registration Number</TableHead>
              <TableHead>Name</TableHead>
              {isAdmin && <TableHead>Role</TableHead>}

              {isStudent && <TableHead>Semester</TableHead>}
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              {isStudent && <TableHead>Assigned Faculty</TableHead>}
              {isFaculty && <TableHead>Coordinator</TableHead>}
              <TableHead>Actions</TableHead>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-slateish-700">{user.id || user.registrationNumber}</TableCell>
                <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</TableCell>
                {isAdmin && <TableCell className="capitalize">{user.role}</TableCell>}

                {isStudent && <TableCell>{user.semester || '-'}</TableCell>}
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                {isStudent && <TableCell>{user.assignedFacultyRegistrationNumber || '-'}</TableCell>}
                {isFaculty && (
                  <TableCell>
                    {user.isCoordinator ? (
                      <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slateish-400">No</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex gap-2 text-right">
                    <button 
                      onClick={() => onEditClick(user)}
                      className="text-brand-600 hover:text-brand-800 font-semibold text-sm transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDelete(user.id)}
                      className="text-red-500 hover:text-red-700 font-semibold text-sm transition"
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <tr>
                <TableCell colSpan={10} className="py-8 text-center text-slateish-500">
                  No {currentRole}s found.
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
