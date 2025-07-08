"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

/**
 * Renders a customizable separator component.
 * @param {object} props - The properties of the separator.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {'horizontal' | 'vertical'} [props.orientation='horizontal'] - The orientation of the separator.
 * @param {boolean} [props.decorative=true] - Whether the separator is decorative.
 * @returns {JSX.Element} The rendered separator component.
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
