import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BookUser, FolderOpenDot, CheckSquare,
  House, Menu, Presentation, UserCircle2, Users, Settings
} from 'lucide-react'

const studentMenuItems = [
  { label: 'Home', path: '/home', icon: House },
]

const facultyMenuItems = [
  { label: 'Home', path: '/home', icon: House },
  { label: 'Assignments', path: '/assignments', icon: BookUser },
  { label: 'Project/Internship Responses', path: '/pbl-review', icon: CheckSquare },
]

const adminMenuItems = [
  { label: 'Home', path: '/home', icon: House },
  { label: 'Manage', path: '/admin/manage', icon: Users },
  { label: 'Assignments', path: '/assignments', icon: BookUser },
  { label: 'Project/Internship Responses', path: '/pbl-review', icon: CheckSquare },
  { label: 'Phase Config', path: '/admin/phases/config', icon: Settings },
]

export default function Sidebar({ role, user }) {
  const [phaseConfigs, setPhaseConfigs] = useState([])
  
  useEffect(() => {
    fetch('/api/phases/config', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setPhaseConfigs(d.configs || []))
      .catch(console.error)
  }, [])

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })

  // Build Phase Menus dynamically
  const studentPhases = phaseConfigs
    .filter(c => c.enabled && !c.isEvaluationPhase)
    .map(c => ({ label: c.title, path: `/phases/${c.phaseId}/submit`, icon: FolderOpenDot }))
  
  const facultyPhases = phaseConfigs
    .filter(c => c.enabled)
    .map(c => ({
      label: `Review: ${c.title}`, 
      path: c.isEvaluationPhase ? `/phases/${c.phaseId}/evaluate` : `/phases/${c.phaseId}/review`,
      icon: CheckSquare
    }))

  const getPblMenuLabel = () => {
    if (!user || role !== 'student' || !user.semester) return 'Project/Internship Details'
    switch (String(user.semester)) {
      case '3': return 'PBL 1 Details'
      case '4': return 'PBL 2 Details'
      case '5': return 'PBL 3 Details'
      case '6': return 'PBL 4 / Minor Project Details'
      case '7': return 'Internship Details'
      case '8': return 'Major Project / Internship Details'
      default: return 'Project/Internship Details'
    }
  }

  const baseStudentMenu = [
    ...studentMenuItems,
    { label: getPblMenuLabel(), path: '/pbl-presentation', icon: Presentation },
    ...studentPhases,
    { label: 'Profile', path: '/profile', icon: UserCircle2 },
  ]

  const baseFacultyMenu = [
    ...facultyMenuItems.filter((item) => role === 'Faculty Coordinator' || item.path !== '/assignments'),
    ...facultyPhases,
    { label: 'Profile', path: '/profile', icon: UserCircle2 }
  ]

  const menuItems =
    role === 'student'
      ? baseStudentMenu
      : role === 'admin'
        ? [...adminMenuItems, ...facultyPhases, { label: 'Profile', path: '/profile', icon: UserCircle2 }]
        : role === 'Faculty Coordinator'
          ? [...baseFacultyMenu.slice(0, -1), { label: 'Phase Config', path: '/admin/phases/config', icon: Settings }, baseFacultyMenu[baseFacultyMenu.length - 1]]
          : baseFacultyMenu

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
                'transition-all duration-200 overflow-hidden text-ellipsis',
                collapsed ? 'w-0 whitespace-nowrap -translate-x-2 opacity-0' : 'w-auto translate-x-0 opacity-100 line-clamp-2',
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
