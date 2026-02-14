import React from 'react'

export default function BrandLogo({ className = '', compact = false, wordmark = false }) {
  const sizeClass = wordmark
    ? 'h-12 w-auto object-contain'
    : compact
      ? 'h-10 w-auto object-contain'
      : 'h-16 w-auto object-contain'

  return (
    <div className={`flex items-center ${className}`.trim()}>
      <img
        src="/assets/manipal-logo.png"
        alt="Manipal University Jaipur"
        className={sizeClass}
        onError={(event) => {
          event.currentTarget.style.display = 'none'
          const fallback = event.currentTarget.nextElementSibling
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      <div
        className={wordmark
          ? 'hidden h-12 min-w-[120px] items-center justify-center rounded-md border border-brand-200 bg-brand-50 px-3 text-xs font-semibold text-brand-600'
          : compact
          ? 'hidden h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-600'
          : 'hidden h-16 w-16 items-center justify-center rounded-full border-2 border-brand-500 text-xl font-semibold text-brand-500'}
      >
        {wordmark ? 'MANIPAL' : 'MUJ'}
      </div>
    </div>
  )
}
