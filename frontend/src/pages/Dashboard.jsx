import React from 'react'
import PermissionCard from '../components/PermissionCard.jsx'
import StudentDashboard from './StudentDashboard.jsx'

const events = [
  'Weekly Review - Minor Project (Sem 4)',
  'Mid-Term Evaluation Window Opens',
  'Guide Assignment Lock Date',
]

const notifications = [
  {
    title: 'Broadcast: Progress Update Format',
    detail: 'Submit weekly updates by Friday 6 PM.',
    time: '2 hours ago',
  },
  {
    title: 'Assessment Date Published',
    detail: 'Mid-term evaluation on March 12, 2026.',
    time: 'Yesterday',
  },
]

const assignments = [
  {
    label: 'Guide Assignment',
    value: '10 students / guide',
    meta: 'DOCSE Department',
  },
  {
    label: 'Project Assignment',
    value: '4 semesters duration',
    meta: 'Sem 3 - Sem 6',
  },
  {
    label: 'Assessments',
    value: 'Mid + End term each sem',
    meta: 'Dates controlled by guide',
  },
]

function CoordinatorDashboard({ role, permissions }) {
  return (
    <div className="px-6 py-4">
      <div className="mb-4 rounded-xl border border-slateish-200 bg-white px-6 py-4 text-sm">
        <div className="font-semibold text-slateish-600">Coordinator Overview</div>
        <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-slateish-500">
          <div>
            <div>Assigned Department:</div>
            <div className="text-brand-600">DOCSE</div>
          </div>
          <div>
            <div>Active Guides:</div>
            <div className="text-brand-600">12 Guides</div>
          </div>
          <div>
            <div>Open Reviews:</div>
            <div className="text-brand-600">4 This Week</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-6">
        <div className="rounded-xl border border-slateish-200 bg-white p-6">
          <div className="border-l-4 border-brand-500 pl-3 text-sm font-semibold">Notifications</div>
          <div className="mt-4 space-y-4">
            {notifications.map((note) => (
              <div key={note.title} className="rounded-lg bg-slateish-50 p-3">
                <div className="text-sm font-semibold text-slateish-700">{note.title}</div>
                <div className="text-xs text-slateish-500">{note.detail}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-slateish-400">{note.time}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slateish-200 bg-white p-6">
          <div className="border-l-4 border-brand-500 pl-3 text-sm font-semibold">List of Events</div>
          <ul className="mt-4 space-y-3 text-sm text-slateish-600">
            {events.map((event) => (
              <li key={event} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                {event}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {assignments.map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-4 shadow-soft">
            <div className="text-xs font-semibold uppercase text-slateish-400">{card.label}</div>
            <div className="mt-2 text-sm font-semibold text-slateish-700">{card.value}</div>
            <div className="text-xs text-slateish-500">{card.meta}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slateish-700">Role Based Access Control (RBAC)</div>
          <span className="text-xs font-semibold uppercase text-slateish-400">{role}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <PermissionCard title="Guide + Student Assignment" description="Assign guides to 10 students" enabled={permissions.includes('assign-guide')} />
          <PermissionCard title="Project Assignment" description="Allocate long-term projects" enabled={permissions.includes('assign-project')} />
          <PermissionCard title="Broadcast Updates" description="Share weekly announcements" enabled={permissions.includes('broadcast')} />
          <PermissionCard title="Assessment Dates" description="Set mid/end term evaluations" enabled={permissions.includes('set-assessments')} />
          <PermissionCard title="Student Details + Remarks" description="Track progress and feedback" enabled={permissions.includes('remark')} />
          <PermissionCard title="Department Analytics" description="Coordinator overview" enabled={permissions.includes('dept-analytics')} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ role, permissions }) {
  if (role === 'Student') {
    return <StudentDashboard />
  }

  return <CoordinatorDashboard role={role} permissions={permissions} />
}
