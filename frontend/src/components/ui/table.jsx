import React from 'react'
import { cn } from '../../lib/cn.js'

export function Table({ className, ...props }) {
  return <table className={cn('min-w-full border-collapse text-sm', className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return <th className={cn('px-3 py-2 text-left', className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td className={cn('px-3 py-2', className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return <tr className={cn('border-b border-slateish-200', className)} {...props} />
}
