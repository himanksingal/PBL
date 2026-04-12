import React from 'react'
import { Card } from '../../components/ui/card.jsx'
import { Spinner } from '../../components/ui/spinner.jsx'

export default function AssignedStudentsTable({
  selectedFaculty,
  selectedFacultyRegNo,
  assignedLoading,
  assignedStudents,
  handleRemoveStudent
}) {
  return (
    <Card className="flex flex-col border border-brand-200 bg-brand-50/10 shadow-sm transition duration-300">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-brand-700">Assigned Students</h2>
        <p className="text-xs text-slateish-500">
          {selectedFaculty ? `Assigned to ${selectedFaculty.firstName} ${selectedFaculty.lastName || ''}`.trim() : 'Select a faculty member'}
        </p>
      </div>

      <div className="flex-1 overflow-auto min-h-[460px] max-h-[560px] border border-brand-100 rounded-md bg-brand-50/10">
        <div className="sticky top-0 bg-brand-100 border-b border-brand-200 px-3 py-1.5 flex text-[10px] font-bold uppercase tracking-wider text-brand-600 whitespace-nowrap">
           <div className="w-44 shrink-0">Reg No</div>
           <div className="flex-1 min-w-0">Name</div>
           <div className="w-10 shrink-0 text-right">Action</div>
        </div>
        {!selectedFacultyRegNo && (
          <div className="h-full flex items-center justify-center text-sm text-slateish-400 py-20">
            Please select a faculty member above.
          </div>
        )}
        {selectedFacultyRegNo && assignedLoading && (
          <div className="py-8 flex justify-center"><Spinner /></div>
        )}
        {selectedFacultyRegNo && !assignedLoading && assignedStudents.length === 0 && (
          <p className="text-sm text-slateish-500 text-center py-20">No students currently assigned.</p>
        )}

        {assignedStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center px-3 py-2 border-b border-brand-100 text-xs bg-white hover:bg-brand-50/30 transition group"
          >
            <div className="w-44 shrink-0 font-medium text-brand-700 truncate pr-2">{student.registrationNumber}</div>
            <div className="flex-1 min-w-0 font-semibold text-slateish-800 truncate pr-2">{`${student.firstName} ${student.lastName || ''}`.trim()}</div>
            <div className="w-10 shrink-0 text-right">
              <button 
                onClick={() => handleRemoveStudent(student)}
                className="text-red-500 hover:text-red-700 font-bold p-1 transition-transform active:scale-125"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
