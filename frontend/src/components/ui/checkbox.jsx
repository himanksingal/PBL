import React from 'react'
import { cn } from '../../lib/cn.js'

export const Checkbox = React.forwardRef(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn('h-4 w-4 rounded border-slateish-300 text-brand-600 focus:ring-brand-300', className)}
      {...props}
    />
  )
})
