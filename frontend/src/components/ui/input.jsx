import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-md border border-slateish-200 bg-white px-4 text-sm text-slateish-700 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:bg-slateish-100 disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
