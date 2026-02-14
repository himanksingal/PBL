import React from 'react'
import TopBar from './TopBar.jsx'
import Sidebar from './Sidebar.jsx'

export default function Layout({ children, role, user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-slateish-100">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <TopBar user={user} onLogout={onLogout} />
        {children}
      </div>
    </div>
  )
}
