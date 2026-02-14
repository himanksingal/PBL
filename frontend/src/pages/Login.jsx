import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'

export default function Login({ onLogin, onKeycloakLogin, onResetFirstLoginPassword }) {
  const collageBg = '/assets/collagemujslcm.png'
  const loginPanelBg = '/assets/mujslcmlogin.jpg'
  const [searchParams] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [currentPasswordForReset, setCurrentPasswordForReset] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Show Keycloak errors that arrive via URL query params
  useEffect(() => {
    const kcError = searchParams.get('error')
    if (kcError) {
      setError(`Keycloak login failed: ${kcError}`)
    }
  }, [searchParams])

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
    <div className="min-h-screen bg-black">
      <div className="relative mx-auto flex min-h-screen w-full items-start justify-center overflow-hidden pt-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${collageBg}')` }}
        />
        <div className="relative z-10 grid h-[560px] w-[1120px] grid-cols-[0.95fr_1.35fr] overflow-hidden rounded-tl-[26px] rounded-br-[26px] rounded-tr-none rounded-bl-none bg-white shadow-card">
          <div className="flex flex-col justify-center gap-4 bg-white px-16 py-10">
            <div className="flex items-center justify-center">
              <BrandLogo wordmark className="scale-[2.4] origin-center" />
            </div>
            <div className="mt-8 flex flex-col gap-4">
              <div className="text-center text-sm font-semibold text-slateish-500">WELCOME TO MUJ PORTAL</div>
              <div className="text-center text-2xl font-semibold text-brand-600">
                {resetMode ? 'Reset Password' : 'Sign In'}
              </div>

              {!resetMode ? (
                <form onSubmit={(e) => { e.preventDefault(); handleLocalLogin() }}>
                  <div className="mx-auto w-full max-w-[520px] space-y-4">
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

                  <div className="mx-auto flex w-full max-w-[520px] justify-center gap-4 mt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onKeycloakLogin}>
                      Sign In with Keycloak
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleResetPassword() }}>
                  <div className="mx-auto w-full max-w-[520px] space-y-4">
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

                  <div className="mx-auto flex w-full max-w-[520px] justify-center gap-4 mt-4">
                    <Button type="submit" disabled={loading}>
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
                </form>
              )}

              {error && <p className="text-center text-sm text-red-600">{error}</p>}
            </div>
          </div>
          <div className="relative h-full">
            <div
              className="absolute inset-0 bg-cover bg-[14%_56%] bg-no-repeat"
              style={{ backgroundImage: `url('${loginPanelBg}')` }}
            />
            <div className="absolute inset-0 bg-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}
