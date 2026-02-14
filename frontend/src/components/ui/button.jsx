import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-full border border-transparent bg-brand-500 px-6 py-2 text-white shadow-sm hover:bg-brand-600",
        destructive:
          "rounded-md border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50",
        outline:
          "rounded-full border border-brand-500 bg-white px-6 py-2 text-brand-600 shadow-sm hover:bg-brand-50",
        secondary:
          "rounded-md border border-input bg-background px-4 py-2 text-foreground shadow-sm hover:bg-muted",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        subtle:
          "rounded-md border border-brand-400 px-2 py-1 text-brand-600 hover:bg-brand-50",
      },
      size: {
        default: "",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
