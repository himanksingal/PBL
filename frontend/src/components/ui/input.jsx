import React from 'react'
import { cn } from '../../lib/cn.js'

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-md border border-slateish-200 bg-white px-4 text-sm text-slateish-700 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slateish-100',
        className
      )}
      {...props}
    />
  )
})
