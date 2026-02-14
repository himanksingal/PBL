import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

const Layout = lazy(() => import('./components/Layout.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Timetable = lazy(() => import('./pages/Timetable.jsx'))
const Marks = lazy(() => import('./pages/Marks.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const PblPresentation = lazy(() => import('./pages/PblPresentation.jsx'))
const AdminHome = lazy(() => import('./pages/AdminHome.jsx'))
const AdminManageUsers = lazy(() => import('./pages/AdminManageUsers.jsx'))
const FacultyAssignments = lazy(() => import('./pages/FacultyAssignments.jsx'))
const StudentPanelConfig = lazy(() => import('./pages/StudentPanelConfig.jsx'))
const LoggedOut = lazy(() => import('./pages/LoggedOut.jsx'))

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
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setUser(null)
      setRole('Student')
      navigate('/logged-out')
    }
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
    <Suspense fallback={<PageFallback />}>
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
          element={<LoggedOut />}
        />

        <Route
          path="/home"
          element={
            isAuthenticated ? (
                <Layout role={role} user={user} onLogout={handleLogout}>
                {isAdmin ? <AdminHome user={user} /> : <Dashboard role={role} user={user} permissions={[]} />}
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/admin/manage"
          element={
            isAuthenticated ? (
              isAdmin ? (
                <Layout role={role} user={user} onLogout={handleLogout}>
                  <AdminManageUsers />
                </Layout>
              ) : (
                <Navigate to="/home" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/assignments"
          element={
            isAuthenticated ? (
              isAdmin || isFacultyCoordinator ? (
                <Layout role={role} user={user} onLogout={handleLogout}>
                  <FacultyAssignments />
                </Layout>
              ) : (
                <Navigate to="/home" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/faculty/student-panel"
          element={
            isAuthenticated ? (
              isFaculty || isFacultyCoordinator ? (
                <Layout role={role} user={user} onLogout={handleLogout}>
                  <StudentPanelConfig role={role} />
                </Layout>
              ) : (
                <Navigate to="/home" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/pbl-presentation"
          element={
            isAuthenticated ? (
              isStudent ? (
                <Layout role={role} user={user} onLogout={handleLogout}>
                  <PblPresentation />
                </Layout>
              ) : (
                <Navigate to="/home" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/timetable"
          element={
            isAuthenticated ? (
              isStudent || isAdmin ? (
                <Navigate to="/home" />
              ) : (
                <Layout role={role} user={user} onLogout={handleLogout}>
                  <Timetable />
                </Layout>
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/reports"
          element={
            isAuthenticated ? (
              isStudent || isAdmin ? (
                <Navigate to="/home" />
              ) : (
                <Layout role={role} user={user} onLogout={handleLogout}>
                  <Timetable showReportsMenu />
                </Layout>
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/marks"
          element={
            isAuthenticated ? (
              isStudent || isAdmin ? (
                <Navigate to="/home" />
              ) : (
                <Layout role={role} user={user} onLogout={handleLogout}>
                  <Marks />
                </Layout>
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Layout role={role} user={user} onLogout={handleLogout}>
                <Profile />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/login'} />} />
      </Routes>
    </Suspense>
  )
}
