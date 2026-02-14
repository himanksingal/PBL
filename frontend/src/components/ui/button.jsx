import React from 'react'
import { cn } from '../../lib/cn.js'

const variants = {
  default: 'inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-brand-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60',
  outline: 'inline-flex items-center justify-center gap-2 rounded-full border border-brand-500 bg-white px-6 py-2 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-60',
  destructive: 'inline-flex items-center justify-center gap-2 rounded-md border border-red-300 px-2 py-1 text-red-600 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-60',
  subtle: 'inline-flex items-center justify-center gap-2 rounded-md border border-brand-400 px-2 py-1 text-brand-600 transition hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-60',
}

export const Button = React.forwardRef(function Button(
  { className, variant = 'default', type = 'button', ...props },
  ref
) {
  return <button ref={ref} type={type} className={cn(variants[variant], className)} {...props} />
})
