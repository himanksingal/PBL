import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import Layout from './components/Layout.jsx'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Timetable from './pages/Timetable.jsx'
import Marks from './pages/Marks.jsx'
import Profile from './pages/Profile.jsx'
import PblPresentation from './pages/PblPresentation.jsx'
import AdminHome from './pages/AdminHome.jsx'
import AdminManageUsers from './pages/AdminManageUsers.jsx'
import FacultyAssignments from './pages/FacultyAssignments.jsx'
import StudentPanelConfig from './pages/StudentPanelConfig.jsx'
import LoggedOut from './pages/LoggedOut.jsx'

function PageFallback() {
  return <div className="min-h-screen bg-slateish-100" />
}

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('Student')
  const [loadingSession, setLoadingSession] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const loadSession = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      })
      if (!response.ok) {
        setUser(null)
        return
      }

      const data = await response.json()
      if (data?.user) {
        setUser(data.user)
        setRole(data.user.role)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoadingSession(false)
    }
  }

  const handleLogin = async ({ username, password }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (body?.requiresPasswordReset) {
        return {
          ok: false,
          requiresPasswordReset: true,
          username: body.username || username,
          currentPassword: password,
          error: body.error || 'Password reset required.',
        }
      }
      return { ok: false, error: body.error || 'Login failed' }
    }

    await loadSession()
    navigate('/home')
    return { ok: true }
  }

  const handleResetFirstLoginPassword = async ({ username, currentPassword, newPassword }) => {
    const response = await fetch('/api/auth/reset-first-login-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, currentPassword, newPassword }),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: body.error || 'Password reset failed' }
    }

    await loadSession()
    navigate('/home')
    return { ok: true }
  }

  const handleKeycloakLogin = () => {
    window.location.href = '/api/auth/keycloak/login'
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}))
        if (data.logoutUrl) {
          setUser(null)
          setRole('Student')
          window.location.href = data.logoutUrl
          return
        }
      }
    } catch {
      // continue to local logout even if the request fails
    }

    setUser(null)
    setRole('Student')
    navigate('/logged-out')
  }

  useEffect(() => {
    if (location.pathname === '/login') {
      setLoadingSession(false)
      return
    }

    setLoadingSession(true)
    loadSession()
  }, [location.pathname])

  const isAuthenticated = Boolean(user)
  const isStudent = role === 'Student'
  const isAdmin = role === 'Master Admin'
  const isFacultyCoordinator = role === 'Faculty Coordinator'
  const isFaculty = role === 'Faculty'

  if (loadingSession) {
    return <PageFallback />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/login'} />} />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/home" />
          ) : (
            <Login
              onLogin={handleLogin}
              onKeycloakLogin={handleKeycloakLogin}
              onResetFirstLoginPassword={handleResetFirstLoginPassword}
            />
          )
        }
      />

      <Route
        path="/logged-out"
        element={
          <LoggedOut />
        }
      />

      {/* Protected Routes with Persistent Layout */}
      {isAuthenticated && (
        <Route
          element={
            <Layout role={role} user={user} onLogout={handleLogout}>
              <Outlet />
            </Layout>
          }
        >
          <Route
            path="/home"
            element={isAdmin ? <AdminHome user={user} /> : <Dashboard role={role} user={user} permissions={[]} />}
          />

          <Route
            path="/admin/manage"
            element={isAdmin ? <AdminManageUsers /> : <Navigate to="/home" />}
          />

          <Route
            path="/assignments"
            element={isAdmin || isFacultyCoordinator ? <FacultyAssignments /> : <Navigate to="/home" />}
          />

          <Route
            path="/faculty/student-panel"
            element={isFaculty || isFacultyCoordinator ? <StudentPanelConfig role={role} /> : <Navigate to="/home" />}
          />

          <Route
            path="/pbl-presentation"
            element={isStudent ? <PblPresentation /> : <Navigate to="/home" />}
          />

          <Route
            path="/timetable"
            element={isStudent || isAdmin ? <Navigate to="/home" /> : <Timetable />}
          />

          <Route
            path="/reports"
            element={isStudent || isAdmin ? <Navigate to="/home" /> : <Timetable showReportsMenu />}
          />

          <Route
            path="/marks"
            element={isStudent || isAdmin ? <Navigate to="/home" /> : <Marks />}
          />

          <Route path="/profile" element={<Profile />} />
        </Route>
      )}

      {/* Fallback for unauthenticated or unknown routes */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/login'} />} />
    </Routes>
  )
}
