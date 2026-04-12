import React, { useEffect, useState, useCallback } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import Layout from './components/Layout.jsx'

import Login from './pages/Login.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import FacultyDashboard from './pages/FacultyDashboard.jsx'
import Profile from './pages/Profile.jsx'
import PblPresentation from './pages/PblPresentation.jsx'
import AdminHome from './pages/AdminHome.jsx'
import AdminManageUsers from './pages/AdminManageUsers.jsx'
import FacultyAssignments from './pages/FacultyAssignments.jsx'

import LoggedOut from './pages/LoggedOut.jsx'
import PhaseSubmit from './pages/PhaseSubmit.jsx'
import PhaseReview from './pages/PhaseReview.jsx'
import PhaseEvaluate from './pages/PhaseEvaluate.jsx'
import PhaseConfigPage from './pages/PhaseConfigPage.jsx'
import PblReview from './pages/PblReview.jsx'

function PageFallback() {
  return <div className="min-h-screen bg-slateish-100" />
}

function SessionExpiredOverlay({ countdown, onLoginClick }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slateish-800">Session Expired</h2>
        <p className="mt-2 text-sm text-slateish-500">
          Your session has expired due to inactivity. Please log in again to continue.
        </p>
        <p className="mt-4 text-xs text-slateish-400">
          Redirecting to login in <span className="font-bold text-brand-600">{countdown}</span> seconds...
        </p>
        <button
          onClick={onLoginClick}
          className="mt-5 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('student')
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const navigate = useNavigate()
  const location = useLocation()

  const loadSession = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      })
      if (!response.ok) {
        console.warn(`[session] Profile check failed: ${response.status}`);

        if (response.status === 401) {
          // Try silent refresh before giving up
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          })
          if (refreshRes.ok) {
            // Refresh succeeded — retry profile
            const retryRes = await fetch('/api/profile', { credentials: 'include' })
            if (retryRes.ok) {
              const data = await retryRes.json()
              if (data?.user) {
                setUser(data.user)
                setRole(data.user.role)
                return
              }
            }
          }

          // Refresh failed — session is truly expired
          if (user) {
            // User was logged in, show session expired
            setSessionExpired(true)
            setCountdown(5)
            setUser(null)
            return
          }
        }

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
          setRole('student')
          window.location.href = data.logoutUrl
          return
        }
      }
    } catch {
      // continue to local logout even if the request fails
    }

    setUser(null)
    setRole('student')
    navigate('/logged-out')
  }

  const handleLoginRedirect = useCallback(() => {
    setSessionExpired(false)
    navigate('/login')
  }, [navigate])

  // Countdown timer for session expired overlay
  useEffect(() => {
    if (!sessionExpired) return
    if (countdown <= 0) {
      handleLoginRedirect()
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [sessionExpired, countdown, handleLoginRedirect])

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/logged-out') {
      setLoadingSession(false)
      setSessionExpired(false)
      return
    }

    setLoadingSession(true)
    loadSession()
  }, [location.pathname])

  const isAuthenticated = Boolean(user)
  const isStudent = role === 'student'
  const isAdmin = role === 'admin'
  const isFacultyCoordinator = role === 'Faculty Coordinator'
  const isFaculty = role === 'faculty'

  if (loadingSession) {
    return <PageFallback />
  }

  return (
    <>
      {sessionExpired && (
        <SessionExpiredOverlay countdown={countdown} onLoginClick={handleLoginRedirect} />
      )}

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
              element={
                isAdmin
                  ? <AdminHome user={user} />
                  : isStudent
                    ? <StudentDashboard user={user} />
                    : <FacultyDashboard role={role} user={user} />
              }
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
              path="/pbl-presentation"
              element={isStudent ? <PblPresentation user={user} /> : <Navigate to="/home" />}
            />

            <Route
              path="/pbl-review"
              element={isFaculty || isFacultyCoordinator || isAdmin ? <PblReview user={user} /> : <Navigate to="/home" />}
            />

            <Route
              path="/phases/:phaseId/submit"
              element={isStudent ? <PhaseSubmit user={user} /> : <Navigate to="/home" />}
            />
            <Route
              path="/phases/:phaseId/review"
              element={isFaculty || isFacultyCoordinator || isAdmin ? <PhaseReview user={user} /> : <Navigate to="/home" />}
            />
            <Route
              path="/phases/:phaseId/evaluate"
              element={isFaculty || isFacultyCoordinator || isAdmin ? <PhaseEvaluate user={user} /> : <Navigate to="/home" />}
            />
            <Route
              path="/admin/phases/config"
              element={isAdmin || isFacultyCoordinator ? <PhaseConfigPage user={user} /> : <Navigate to="/home" />}
            />

            <Route path="/profile" element={<Profile />} />
          </Route>
        )}

        {/* Fallback for unauthenticated or unknown routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/login'} />} />
      </Routes>
    </>
  )
}
