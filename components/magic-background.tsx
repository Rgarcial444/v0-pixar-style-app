"use client"

import { useEffect, useRef } from "react"
import BackgroundCharacters from "@/components/background-characters"

export default function MagicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-blue-100 to-indigo-100" />
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-sky-300/30 rounded-full blur-3xl" />
      <div className="absolute -top-10 -right-20 w-56 h-56 bg-emerald-300/25 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl" />
    </div>
  )
}
