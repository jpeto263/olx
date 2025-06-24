"use client"

import type React from "react"
import { initializeSession, updateSessionActivity } from "@/lib/session-tracker"
import { useEffect } from "react"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // Initialize session tracking
    initializeSession()

    // Track page changes
    const handleRouteChange = () => {
      updateSessionActivity()
    }

    // Update activity every 30 seconds
    const activityInterval = setInterval(() => {
      updateSessionActivity()
    }, 30000)

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateSessionActivity()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleRouteChange)

    return () => {
      clearInterval(activityInterval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleRouteChange)
    }
  }, [])

  return <>{children}</>
}
