import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BookUser,
  ClipboardList,
  GraduationCap,
  HandCoins,
  House,
  Menu,
  Presentation,
  SlidersHorizontal,
  UserCircle2,
  Users,
} from 'lucide-react'

const studentMenuItems = [
  { label: 'Home', path: '/home', icon: House },
  { label: 'PBL Presentation', path: '/pbl-presentation', icon: Presentation },
  { label: 'Profile', path: '/profile', icon: UserCircle2 },
]

const facultyMenuItems = [
  { label: 'Home', path: '/home', icon: House },
  { label: 'Assignments', path: '/assignments', icon: BookUser },
  { label: 'Student Panel', path: '/faculty/student-panel', icon: SlidersHorizontal },
  { label: 'Profile', path: '/profile', icon: UserCircle2 },
]

const defaultMenuItems = [
  { label: 'Home', path: '/home', icon: House },
  { label: 'Academics', path: '/timetable', icon: GraduationCap },
  { label: 'Finance', path: '/marks', icon: HandCoins },
  { label: 'Examination', path: '/reports', icon: ClipboardList },
  { label: 'Profile', path: '/profile', icon: UserCircle2 },
]

const adminMenuItems = [
  { label: 'Home', path: '/home', icon: House },
  { label: 'Manage', path: '/admin/manage', icon: Users },
  { label: 'Assignments', path: '/assignments', icon: BookUser },
  { label: 'Profile', path: '/profile', icon: UserCircle2 },
]

export default function Sidebar({ role }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })
  const menuItems =
    role === 'Student'
      ? studentMenuItems
      : role === 'Master Admin'
        ? adminMenuItems
        : role === 'Faculty'
          ? facultyMenuItems.filter((item) => item.path !== '/assignments')
          : role === 'Faculty Coordinator'
            ? facultyMenuItems
          : defaultMenuItems

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
    } catch {
      // no-op
    }
  }, [collapsed])

  return (
    <aside
      className={[
        'flex flex-col bg-brand-600 text-white transition-all duration-300 ease-out',
        collapsed ? 'w-20' : 'w-64',
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center py-4 transition-all duration-300',
          collapsed ? 'justify-center px-0' : 'justify-between px-4',
        ].join(' ')}
      >
        {!collapsed && (
          <div className="overflow-hidden transition-all duration-300 w-36 opacity-100">
            <div className="text-sm font-semibold uppercase tracking-wide">Menu</div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-md p-2 text-white transition hover:bg-brand-700"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className={['flex flex-col gap-1', collapsed ? 'px-0' : 'px-2'].join(' ')}>
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              [
                'group flex items-center rounded-lg px-4 py-3 text-left text-sm transition duration-200',
                isActive ? 'bg-brand-700 text-white' : 'hover:bg-brand-500/60',
                collapsed ? 'mx-auto h-14 w-14 justify-center gap-0 px-0' : 'gap-3',
              ].join(' ')
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span
              className={[
                'whitespace-nowrap transition-all duration-200',
                collapsed ? 'w-0 -translate-x-2 opacity-0' : 'w-auto translate-x-0 opacity-100',
              ].join(' ')}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
