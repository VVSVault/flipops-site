import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 [a&]:hover:bg-gray-200 dark:[a&]:hover:bg-zinc-700",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90",
        outline:
          "border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 [a&]:hover:bg-gray-100 dark:[a&]:hover:bg-zinc-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
