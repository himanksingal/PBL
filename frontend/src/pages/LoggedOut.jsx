import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoggedOut() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(3)

  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include' })
        if (!response.ok) return
        const data = await response.json().catch(() => ({}))
        if (!cancelled && data?.user) {
          navigate('/home', { replace: true })
        }
      } catch {
        // ignore and fall back to countdown
      }
    }

    checkSession()

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/login', { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slateish-100 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slateish-200 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-slateish-700">You have been successfully logged out</h1>
        <p className="mt-3 text-sm text-slateish-500">
          Redirecting to login page in <span className="font-semibold text-brand-600">{seconds}</span> second{seconds === 1 ? '' : 's'}.
        </p>
      </div>
    </div>
  )
}
