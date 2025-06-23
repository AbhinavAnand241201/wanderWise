"use client"

import * as React from "react"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

interface DraggableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  disabled?: boolean
}

export function DraggableCardContainer({
  children,
  className,
  ...props
}: DraggableCardProps) {
  return (
    <div
      className={cn(
        "relative h-full w-full cursor-grab active:cursor-grabbing",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DraggableCardBody({
  children,
  className,
  disabled,
  ...props
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: React.useId(),
    disabled,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "touch-none select-none transition-transform duration-200",
        isDragging && "z-50 scale-105 shadow-2xl",
        className
      )}
      style={style}
      {...listeners}
      {...attributes}
      {...props}
    >
      {children}
    </div>
  )
}
