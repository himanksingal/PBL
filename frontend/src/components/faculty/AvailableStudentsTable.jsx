import React from 'react'
import { Card } from '../../components/ui/card.jsx'
import { Input } from '../../components/ui/input.jsx'
import { Spinner } from '../../components/ui/spinner.jsx'

export default function AvailableStudentsTable({
  studentPagination,
  setStudentPagination,
  studentSearch,
  setStudentSearch,
  selectedSemester,
  availableLoading,
  availableStudents,
  assignedStudents,
  selectedFacultyRegNo,
  handleAddStudent
}) {
  return (
    <Card className="flex flex-col border border-slateish-200 shadow-sm transition duration-300">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slateish-700">Available Students</h2>
        <p className="text-xs text-slateish-400">Total: {studentPagination.total} Students</p>
      </div>

      <div className="mb-3">
         <Input
            value={studentSearch}
            onChange={(e) => {
              setStudentPagination((prev) => ({ ...prev, page: 1 }))
              setStudentSearch(e.target.value)
            }}
            placeholder="Search by name or reg no."
            disabled={!selectedSemester}
         />
      </div>

      <div className="flex-1 overflow-auto min-h-[400px] max-h-[500px] border border-slateish-100 rounded-md bg-slateish-50/30">
        <div className="sticky top-0 bg-slateish-100 border-b border-slateish-200 px-3 py-1.5 flex text-[10px] font-bold uppercase tracking-wider text-slateish-500 whitespace-nowrap">
           <div className="w-44 shrink-0">Reg No</div>
           <div className="flex-1 min-w-0">Name</div>
           <div className="w-10 shrink-0 text-center">Sem</div>
           <div className="w-10 shrink-0 text-right">Action</div>
        </div>
        {!selectedSemester && (
          <div className="h-full flex items-center justify-center text-sm text-slateish-400">
            Please select a semester above.
          </div>
        )}
        {selectedSemester && availableLoading && (
          <div className="py-8 flex justify-center"><Spinner /></div>
        )}
        {selectedSemester && !availableLoading && availableStudents.length === 0 && (
          <p className="text-sm text-slateish-500 text-center mt-4">No available students found.</p>
        )}

        {availableStudents.map((student) => {
          if (assignedStudents.some(s => s.id === student.id)) return null;
          const isAssignedToOther = student.assignedFacultyRegistrationNumber && student.assignedFacultyRegistrationNumber !== selectedFacultyRegNo;

          return (
            <div
              key={student.id}
              className={['flex items-center px-3 py-2 border-b border-slateish-100 text-xs transition group cursor-default',
                isAssignedToOther ? 'bg-amber-50/40 opacity-80' : 'bg-white hover:bg-brand-50/50'
              ].join(' ')}
            >
              <div className="w-44 shrink-0 font-medium text-slateish-600 truncate pr-2">{student.registrationNumber}</div>
              <div className="flex-1 min-w-0 font-semibold text-slateish-800 truncate pr-2">
                {student.name}
                {isAssignedToOther && (
                  <span className="block text-[9px] font-normal text-amber-600 line-clamp-1">
                    Assigned: {student.assignedFacultyName || student.assignedFacultyRegistrationNumber}
                  </span>
                )}
              </div>
              <div className="w-10 shrink-0 text-center text-slateish-500">{student.semester || '-'}</div>
              <div className="w-10 shrink-0 text-right">
                <button 
                  disabled={Boolean(isAssignedToOther) || !selectedFacultyRegNo}
                  onClick={() => handleAddStudent(student)}
                  className="text-brand-600 hover:text-brand-800 font-bold p-1 disabled:opacity-0 transition-transform active:scale-125"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slateish-100 flex items-center justify-between text-xs text-slateish-500">
        <span>Page {studentPagination.page} of {studentPagination.totalPages}</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-slateish-200 px-2 py-1 disabled:opacity-50"
            disabled={studentPagination.page <= 1}
            onClick={() => setStudentPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded border border-slateish-200 px-2 py-1 disabled:opacity-50"
            disabled={studentPagination.page >= studentPagination.totalPages}
            onClick={() => setStudentPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}
