import React, { useState } from 'react'
import BrandLogo from '../components/BrandLogo.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'

export default function Login({ onLogin, onKeycloakLogin, onResetFirstLoginPassword }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [currentPasswordForReset, setCurrentPasswordForReset] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLocalLogin = async () => {
    setLoading(true)
    setError('')
    const result = await onLogin({ username, password })
    setLoading(false)

    if (result?.requiresPasswordReset) {
      setResetMode(true)
      setUsername(result.username || username)
      setCurrentPasswordForReset(result.currentPassword || password)
      setPassword('')
      setError('First login requires password reset. Set a new password to continue.')
      return
    }

    if (!result?.ok) {
      setError(result?.error || 'Login failed')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    const result = await onResetFirstLoginPassword({
      username,
      currentPassword: currentPasswordForReset,
      newPassword,
    })
    setLoading(false)

    if (!result?.ok) {
      setError(result?.error || 'Password reset failed')
    }
  }

  return (
    <div className="min-h-screen bg-slateish-200">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-4 gap-2 p-6">
          {Array.from({ length: 16 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl bg-gradient-to-br from-slateish-200 via-slateish-100 to-white shadow-soft"
            />
          ))}
        </div>
        <div className="relative z-10 grid w-[1100px] grid-cols-[1fr_1.2fr] overflow-hidden rounded-[36px] bg-white shadow-card">
          <div className="flex flex-col gap-6 px-12 py-10">
            <div className="flex items-center gap-4">
              <BrandLogo wordmark />
            </div>
            <div className="text-sm font-semibold text-slateish-500">WELCOME TO MUJ PORTAL</div>
            <div className="text-2xl font-semibold text-brand-600">
              {resetMode ? 'Reset Password' : 'Sign In'}
            </div>

            {!resetMode ? (
              <>
                <div className="space-y-4">
                  <Input
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleLocalLogin} disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <Button variant="outline" onClick={onKeycloakLogin}>
                    Sign In with Keycloak
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <Input value={username} disabled placeholder="Username" />
                  <Input
                    value={currentPasswordForReset}
                    type="password"
                    onChange={(event) => setCurrentPasswordForReset(event.target.value)}
                    placeholder="Current/Temporary Password"
                  />
                  <Input
                    value={newPassword}
                    type="password"
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New Password"
                  />
                  <Input
                    value={confirmPassword}
                    type="password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm New Password"
                  />
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleResetPassword} disabled={loading}>
                    {loading ? 'Updating...' : 'Reset Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResetMode(false)
                      setNewPassword('')
                      setConfirmPassword('')
                      setError('')
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-sky-100 to-amber-100" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-5xl font-bold text-slateish-800">MUJ Campus</div>
              <div className="mt-3 text-sm text-slateish-600">
                A vibrant hub for innovation and project-driven learning
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
