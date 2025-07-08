"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

/**
 * A collapsible component that can be opened and closed.
 * @param {object} props - The properties of the collapsible component.
 * @returns {JSX.Element} The rendered collapsible component.
 */
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

/**
 * The trigger for a collapsible component.
 * @param {object} props - The properties of the collapsible trigger.
 * @returns {JSX.Element} The rendered collapsible trigger component.
 */
function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/**
 * The content of a collapsible component.
 * @param {object} props - The properties of the collapsible content.
 * @returns {JSX.Element} The rendered collapsible content component.
 */
function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
