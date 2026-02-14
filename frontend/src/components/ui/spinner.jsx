import React from 'react'
import { cn } from '@/lib/utils'

export function Spinner({ className }) {
  return <span className={cn('h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent', className)} />
}
