import React from 'react'
import { cn } from '../../lib/cn.js'

export function Card({ className, ...props }) {
  return <div className={cn('rounded-xl border border-slateish-200 bg-white p-6 shadow-soft', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn('text-xl font-semibold text-slateish-700', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('', className)} {...props} />
}
