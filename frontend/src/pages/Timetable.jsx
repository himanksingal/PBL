import React from 'react'

const timetableEvents = [
  {
    day: 'Tue 2/3',
    time: '9:00 - 10:40',
    title: 'Weekly Guide Sync',
    color: 'bg-green-500',
  },
  {
    day: 'Tue 2/3',
    time: '10:40 - 11:30',
    title: 'Progress Review',
    color: 'bg-green-500',
  },
  {
    day: 'Wed 2/4',
    time: '11:30 - 12:20',
    title: 'Lab Consultation',
    color: 'bg-green-500',
  },
  {
    day: 'Thu 2/5',
    time: '9:00 - 9:50',
    title: 'Evaluation Prep',
    color: 'bg-gray-600',
  },
  {
    day: 'Fri 2/6',
    time: '10:40 - 12:20',
    title: 'Assessment Slot',
    color: 'bg-gray-600',
  },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Timetable({ showReportsMenu = false }) {
  return (
    <div className="relative px-6 py-4">
      <div className="rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">Student Time Table</div>
            <div className="mt-3 flex gap-4">
              <div>
                <label className="text-xs text-slateish-500">Month</label>
                <select className="shadcn-input mt-1 w-40">
                  <option>February</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slateish-500">Year</label>
                <select className="shadcn-input mt-1 w-32">
                  <option>2026</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slateish-500">
              <span className="rounded border border-slateish-200 px-3 py-2">≪</span>
              <span className="rounded border border-slateish-200 px-3 py-2">≫</span>
              <span className="rounded border border-slateish-200 px-3 py-2">
                Today
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-slateish-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-green-500" />
              Signifies the class attendance is marked
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-gray-600" />
              Signifies the class reschedule is marked
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm font-semibold">FEB 2 – 8, 2026</div>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-brand-500 px-4 py-2 text-xs font-semibold text-white">
              Week
            </button>
            <button className="rounded-md border border-slateish-200 px-4 py-2 text-xs">
              Day
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slateish-200">
          <div className="table-grid relative h-[600px]">
            <div className="grid h-full grid-cols-8 text-xs text-slateish-500">
              <div className="border-r border-slateish-200 p-2">8am</div>
              {['Mon 2/2', 'Tue 2/3', 'Wed 2/4', 'Thu 2/5', 'Fri 2/6', 'Sat 2/7', 'Sun 2/8'].map(
                (day) => (
                  <div key={day} className="border-r border-slateish-200 p-2">
                    {day}
                  </div>
                )
              )}
            </div>
            <div className="absolute inset-0 flex flex-wrap gap-4 p-4">
              {timetableEvents.map((event) => (
                <div
                  key={event.title}
                  className={classNames(
                    'w-[220px] rounded-xl p-3 text-[11px] text-white shadow-soft',
                    event.color
                  )}
                >
                  <div className="font-semibold">{event.time}</div>
                  <div className="mt-1 uppercase">{event.title}</div>
                  <div className="mt-1 text-[10px] opacity-80">
                    Minor Project Review
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showReportsMenu && (
        <div className="absolute left-16 top-4 z-10 w-[720px] rounded-2xl bg-white p-8 shadow-card">
          <div className="grid grid-cols-2 gap-10 text-sm text-slateish-600">
            <div>
              <div className="text-xs font-semibold uppercase text-slateish-400">
                Academics
              </div>
              <div className="mt-4 space-y-3">
                <div>Attendance Summary</div>
                <div>Internal Marks</div>
                <div>Grades</div>
                <div>CGPA / GPA & Credits</div>
                <div>Online Transcript</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slateish-400">
                Examination
              </div>
              <div className="mt-4 space-y-3">
                <div>Attendance Summary</div>
                <div>Internal Marks</div>
                <div>Grades</div>
                <div>CGPA / GPA & Credits</div>
                <div>Online Transcript</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
