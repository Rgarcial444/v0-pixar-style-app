"use client"

import { useState, useEffect } from "react"
import { forceSyncToCloud, checkDatabaseStatus } from "@/lib/hybrid-db"
import { NeonButton } from "@/components/ui/neon-button"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User } from "lucide-react"

type Props = {
  onRefresh?: () => void
}

export default function PixarHeader({ onRefresh }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [user, setUser] = useState<{ email?: string; user_metadata?: { avatar_url?: string; full_name?: string } } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const handleSecretSync = async () => {
    if (syncing) return

    try {
      setSyncing(true)
      const dbStatus = await checkDatabaseStatus()
      if (!dbStatus.tablesExist) return

      const result = await forceSyncToCloud()
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="relative overflow-hidden">
      <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex items-center gap-2">
        {user?.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full"
          />
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full text-xs text-gray-600 hover:bg-white/80 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>

      <div className="relative">
        <div className="h-[260px] md:h-[320px] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-300 via-blue-200 to-indigo-200" />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-8 -left-8 w-40 h-40 bg-sky-200 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-10 right-6 w-52 h-52 bg-indigo-200 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-blue-200 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="absolute top-4 right-4 md:top-6 md:right-8 pointer-events-none">
          <img
            src="/characters/buzz-lightyear.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="h-[120px] md:h-[160px] w-auto object-contain drop-shadow-lg opacity-90"
            style={{ filter: "saturate(1.1)" }}
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <NeonButton
              onClick={handleSecretSync}
              disabled={syncing}
              size="sm"
              neon={true}
              className="bg-white/70 backdrop-blur text-blue-700 font-medium"
            >
              {syncing ? "Sincronizando..." : "Hecho con amor ❤️"}
            </NeonButton>
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-indigo-900">
              {"Nuestros cuentos"}
            </h1>
            <p className="mt-2 max-w-2xl mx-auto text-sm md:text-base text-indigo-900/80">
              {"Cada cuento es un tesoro que merece vivir para siempre"}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
