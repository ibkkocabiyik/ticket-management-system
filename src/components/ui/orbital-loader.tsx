"use client"

import React from "react"
import { cva } from "class-variance-authority"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

const orbitalLoaderVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface OrbitalLoaderProps {
  message?: string
  messagePlacement?: "top" | "bottom" | "left" | "right"
  /** Ring rengi — varsayılan proje primary rengi #6366F1 */
  color?: string
}

export function OrbitalLoader({
  className,
  message,
  messagePlacement,
  color = "#6366F1",
  ...props
}: React.ComponentProps<"div"> & OrbitalLoaderProps) {
  const ringStyle = { borderTopColor: color }

  return (
    <div className={cn(orbitalLoaderVariants({ messagePlacement }))}>
      <div className={cn("relative w-16 h-16", className)} {...props}>
        <motion.div
          className="absolute inset-0 border-2 border-transparent rounded-full"
          style={ringStyle}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 border-2 border-transparent rounded-full"
          style={ringStyle}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-4 border-2 border-transparent rounded-full"
          style={ringStyle}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>
      {message && <div>{message}</div>}
    </div>
  )
}
