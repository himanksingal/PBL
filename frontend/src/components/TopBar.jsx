import React from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo.jsx'

export default function TopBar({ user, onLogout }) {
  return (
    <header className="border-b border-slateish-200 bg-white px-5 py-3">
      <div className="flex w-full items-center gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <BrandLogo wordmark />
        </div>

        <div className="mx-auto hidden w-full max-w-[620px] xl:block">
          <div>
            <input
              className="h-12 w-full rounded-full border-2 border-brand-500 bg-white px-4 text-sm text-slateish-700 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              placeholder="Search..."
            />
          </div>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <button
            className="rounded-md border border-brand-300 px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50"
            onClick={onLogout}
          >
            Sign Out
          </button>
          <div className="max-w-[220px] text-right text-sm text-brand-600">
            <p className="truncate font-semibold">
              {user?.name || 'Guest'}
            </p>
          </div>

          <Link
            to="/profile"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slateish-200 bg-slateish-50 text-slateish-500 transition hover:border-brand-300"
            aria-label="Open profile"
          >
            👤
          </Link>
        </div>
      </div>

      <div className="mt-3 space-y-2 xl:hidden">
        <div>
          <input
            className="h-11 w-full rounded-full border-2 border-brand-500 bg-white px-4 text-sm text-slateish-700 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Search..."
          />
        </div>
      </div>
    </header>
  )
}
