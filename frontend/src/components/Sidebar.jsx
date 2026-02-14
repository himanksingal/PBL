import React from 'react'
import { NavLink } from 'react-router-dom'

const studentMenuItems = [
  { label: 'Home', path: '/home' },
  { label: 'PBL Presentation', path: '/pbl-presentation' },
  { label: 'Profile', path: '/profile' },
]

const defaultMenuItems = [
  { label: 'Home', path: '/home' },
  { label: 'Academics', path: '/timetable' },
  { label: 'Finance', path: '/marks' },
  { label: 'Examination', path: '/reports' },
  { label: 'Profile', path: '/profile' },
]

const adminMenuItems = [
  { label: 'Home', path: '/home' },
  { label: 'Manage', path: '/admin/manage' },
  { label: 'Profile', path: '/profile' },
]

export default function Sidebar({ role }) {
  const menuItems =
    role === 'Student' ? studentMenuItems : role === 'Master Admin' ? adminMenuItems : defaultMenuItems

  return (
    <aside className="flex w-64 flex-col bg-brand-600 text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm font-semibold uppercase tracking-wide">
          Menu
        </div>
        <div className="text-lg">≡</div>
      </div>
      <div className="flex flex-col gap-1 px-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition',
                isActive ? 'bg-brand-700 text-white' : 'hover:bg-brand-500/60',
              ].join(' ')
            }
          >
            <span>➤</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
