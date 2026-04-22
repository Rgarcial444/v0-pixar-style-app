"use client"

import { useState } from "react"
import ToyCarButton from "@/components/toy-car-button"
import { Download, Search, Loader2, Sparkles } from "lucide-react"
import { exportAllStories } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Props = {
  onToggleSearch?: () => void
  showSearch?: boolean
  className?: string
}

export default function BackupTools({ onToggleSearch, showSearch, className }: Props) {
  const [busyAction, setBusyAction] = useState<null | "export">(null)
  const { toast } = useToast()

  const onExport = async () => {
    try {
      setBusyAction("export")
      const blob = await exportAllStories()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      a.download = `cuentoteca-backup-${ts}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Copia exportada", description: "Guárdala en un lugar seguro." })
    } catch (e) {
      console.error(e)
      toast({ title: "Error al exportar", variant: "destructive" })
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-white/60 backdrop-blur-md shadow-lg",
        "ring-1 ring-sky-100/60",
        className,
      )}
      aria-label="Herramientas"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-72 h-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-80 h-80 rounded-full bg-teal-200/40 blur-3xl" />
      </div>

      <div className="grid gap-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/70 to-emerald-400/70 text-white shadow">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-emerald-900">Herramientas</h3>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-tRlFGRUJxBlxeHXTUWwTERkuhxSV4X.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-[74px] md:h-[84px] max-h-[84px] w-auto object-contain pointer-events-none select-none drop-shadow-sm ml-2"
              style={{ filter: "saturate(1.05)" }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ToyCarButton
              onClick={onExport}
              disabled={busyAction !== null}
              variant="secondary"
              showWheels={false}
              className="px-3 py-2 text-sm"
              aria-label="Exportar copia de seguridad"
              title="Exportar copia (.json)"
            >
              {busyAction === "export" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar
            </ToyCarButton>

            <ToyCarButton
              onClick={onToggleSearch}
              disabled={busyAction !== null}
              variant={showSearch ? "primary" : "secondary"}
              showWheels={false}
              className="px-3 py-2 text-sm"
              aria-pressed={!!showSearch}
              aria-label={showSearch ? "Ocultar búsqueda y filtros" : "Mostrar búsqueda y filtros"}
              title={showSearch ? "Ocultar búsqueda y filtros" : "Buscar y filtrar"}
            >
              <Search className="h-4 w-4" />
              {showSearch ? "Ocultar" : "Buscar y filtrar"}
            </ToyCarButton>
          </div>
        </div>
      </div>
    </section>
  )
}