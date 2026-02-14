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

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      return { ok: false, error: body.error || 'Login failed' }
    }

    await loadSession()
    navigate('/home')
    return { ok: true }
  }

  const handleKeycloakLogin = () => {
    window.location.href = '/api/auth/keycloak/login'
  }

  const handleLogout = async () => {
    let logoutUrl = ''
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await response.json()
          logoutUrl = data.logoutUrl || ''
        }
      }
    } finally {
      setUser(null)
      setRole('Student')
      if (logoutUrl) {
        window.location.href = logoutUrl
      } else {
        navigate('/login')
      }
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
              <Login onLogin={handleLogin} onKeycloakLogin={handleKeycloakLogin} />
            )
          }
        />

        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <Layout role={role} user={user} onLogout={handleLogout}>
                {isAdmin ? <AdminHome user={user} /> : <Dashboard role={role} permissions={[]} />}
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
          path="/pbl-presentation"
          element={
            isAuthenticated ? (
              <Layout role={role} user={user} onLogout={handleLogout}>
                <PblPresentation />
              </Layout>
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
