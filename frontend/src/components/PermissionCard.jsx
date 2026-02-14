import React from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function PermissionCard({ title, description, enabled }) {
  return (
    <div
      className={classNames(
        'rounded-xl border px-4 py-3 transition',
        enabled
          ? 'border-brand-200 bg-brand-50 text-brand-700'
          : 'border-slateish-200 bg-slateish-50 text-slateish-500'
      )}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  )
}
