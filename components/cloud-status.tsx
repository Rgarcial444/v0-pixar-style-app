"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Cloud, WifiOff, Database, AlertTriangle } from "lucide-react"
import { checkDatabaseStatus } from "@/lib/hybrid-db"

export default function CloudStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [status, setStatus] = useState<{
    supabaseConfigured: boolean
    tablesExist: boolean
  }>({
    supabaseConfigured: false,
    tablesExist: false,
  })

  useEffect(() => {
    // Verificar conexión a internet
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Verificar estado de la base de datos
    const checkStatus = async () => {
      try {
        const dbStatus = await checkDatabaseStatus()
        setStatus(dbStatus)
      } catch (error) {
        console.error("Error checking database status:", error)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Verificar cada 30 segundos

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
      clearInterval(interval)
    }
  }, [])

  if (!status.supabaseConfigured) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Database className="h-3 w-3" />
        Solo local
      </Badge>
    )
  }

  if (!isOnline) {
    return (
      <Badge variant="secondary" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Sin conexión
      </Badge>
    )
  }

  if (!status.tablesExist) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Configuración pendiente
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="gap-1 bg-emerald-500">
      <Cloud className="h-3 w-3" />
      Sincronizado
    </Badge>
  )
}
