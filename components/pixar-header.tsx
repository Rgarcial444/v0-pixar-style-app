"use client"

import { useState } from "react"
import { forceSyncToCloud, checkDatabaseStatus } from "@/lib/hybrid-db"

type Props = {
  onRefresh?: () => void
}

export default function PixarHeader({ onRefresh }: Props) {
  const [syncing, setSyncing] = useState(false)

  const handleSecretSync = async () => {
    if (syncing) return

    try {
      setSyncing(true)
      console.log("🔄 Sincronización secreta iniciada...")

      // Verificar si la nube está disponible
      const dbStatus = await checkDatabaseStatus()
      if (!dbStatus.tablesExist) {
        console.log("⚠️ Nube no disponible, saltando sincronización")
        return
      }

      // Ejecutar sincronización silenciosa
      const result = await forceSyncToCloud()
      console.log(`✅ Sincronización completada: ${result.success} éxitos, ${result.errors} errores`)

      // Refrescar la lista si hay callback
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("❌ Error en sincronización secreta:", error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="relative overflow-hidden">
      <div className="relative">
        {/* Banda superior con paleta actual */}
        <div className="h-[260px] md:h-[320px] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-300 via-blue-200 to-indigo-200" />

        {/* Blobs suaves (azules/índigo) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-8 -left-8 w-40 h-40 bg-sky-200 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-10 right-6 w-52 h-52 bg-indigo-200 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-blue-200 rounded-full blur-3xl opacity-60" />
        </div>

        {/* Buzz Lightyear en el header */}
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

        {/* Título y subtítulo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {/* BOTÓN INVISIBLE - "Hecho con amor" con funcionalidad de sync */}
            <button
              onClick={handleSecretSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur text-blue-700 text-xs font-medium shadow-sm hover:bg-white/80 transition-colors cursor-pointer border-none"
              title={syncing ? "Sincronizando..." : "Hecho con amor"}
            >
              {syncing ? "Sincronizando..." : "Hecho con amor"}
            </button>
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-indigo-900">
              {"Nuestros cuentos"}
            </h1>
            <p className="mt-2 max-w-2xl mx-auto text-sm md:text-base text-indigo-900/80">
              {"Aquí venimos a guardar y seguir guardando recuerdos hasta que nos de la vida"}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
