import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Renders a card component.
 * @param {object} props - The properties of the card.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {JSX.Element} The rendered card component.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the header of a card component.
 * @param {object} props - The properties of the card header.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {JSX.Element} The rendered card header component.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the title of a card component.
 * @param {object} props - The properties of the card title.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {JSX.Element} The rendered card title component.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Renders the description of a card component.
 * @param {object} props - The properties of the card description.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {JSX.Element} The rendered card description component.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * Renders an action area within a card component.
 * @param {object} props - The properties of the card action.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {JSX.Element} The rendered card action component.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the content area of a card component.
 * @param {object} props - The properties of the card content.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {JSX.Element} The rendered card content component.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/**
 * Renders the footer of a card component.
 * @param {object} props - The properties of the card footer.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {JSX.Element} The rendered card footer component.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
