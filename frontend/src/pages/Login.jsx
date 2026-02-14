import React, { useState } from 'react'
import BrandLogo from '../components/BrandLogo.jsx'

export default function Login({ onLogin, onKeycloakLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLocalLogin = async () => {
    setLoading(true)
    setError('')
    const result = await onLogin({ username, password })
    setLoading(false)
    if (!result?.ok) {
      setError(result?.error || 'Login failed')
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
            <div className="text-2xl font-semibold text-brand-600">Sign In</div>

            <div className="space-y-4">
              <input
                className="shadcn-input"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <input
                className="shadcn-input"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button className="shadcn-button" onClick={handleLocalLogin} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <button className="shadcn-button-outline" onClick={onKeycloakLogin}>
                Sign In with Keycloak
              </button>
            </div>

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
