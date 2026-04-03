"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, CalendarIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import PixarHeader from "@/components/pixar-header"
import StoryForm from "@/components/story-form"
import StoryList from "@/components/story-list"
import BackupTools from "@/components/backup-tools"
import MagicBackground from "@/components/magic-background"
import CloudStatus from "@/components/cloud-status"
import DebugPanel from "@/components/debug-panel"
import type { Story } from "@/types/story"
import { getAllStories, checkDatabaseStatus } from "@/lib/hybrid-db"

export default function Page() {
  const [stories, setStories] = useState<Story[]>([])
  const [query, setQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [dbStatus, setDbStatus] = useState<{
    supabaseConfigured: boolean
    tablesExist: boolean
  }>({
    supabaseConfigured: false,
    tablesExist: false,
  })
  const { toast } = useToast()

  const refresh = async () => {
    try {
      console.log("🔄 Refrescando cuentos...")
      const data = await getAllStories()
      setStories(data)
      console.log(`✅ Cargados ${data.length} cuentos`)

      // Log de imágenes para debugging
      const withImages = data.filter((s) => s.imageBlob || s.imageDataUrl).length
      console.log(`📸 ${withImages} cuentos tienen imágenes`)
    } catch (error) {
      console.error("Error refreshing stories:", error)
      toast({
        title: "Error al cargar",
        description: "No se pudieron cargar los cuentos",
        variant: "destructive",
      })
    }
  }

  const checkStatus = async () => {
    try {
      const status = await checkDatabaseStatus()
      setDbStatus(status)
      console.log("📊 Estado de la base de datos:", status)
    } catch (error) {
      console.error("Error checking database status:", error)
    }
  }

  useEffect(() => {
    refresh()
    checkStatus()

    // Solo refrescar automáticamente si la nube está disponible
    if (dbStatus.supabaseConfigured && dbStatus.tablesExist) {
      const interval = setInterval(refresh, 30000)
      return () => clearInterval(interval)
    }
  }, [dbStatus.supabaseConfigured, dbStatus.tablesExist])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stories.filter((s) => {
      const matchesQuery = !q || s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q)
      const matchesDate = !dateFilter || s.createdAt.slice(0, 10) === dateFilter
      return matchesQuery && matchesDate
    })
  }, [stories, query, dateFilter])

  const showSupabaseSetup = dbStatus.supabaseConfigured && !dbStatus.tablesExist

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-blue-100 to-indigo-100">
      <MagicBackground />
      <PixarHeader onRefresh={refresh} />

      <div className="px-4 md:px-8 lg:px-12 -mt-16 relative z-10">
        <Card className="border-none shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-indigo-900/90">
                  {dbStatus.tablesExist ? "Cuentos compartidos" : "Tus cuentos"}
                </h2>
                <CloudStatus />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setShowForm((s) => !s)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {showForm ? "Cerrar" : "Nuevo cuento"}
                </Button>
              </div>
            </div>

            {showForm && (
              <>
                <Separator className="my-4" />
                <StoryForm
                  onCreated={() => {
                    setShowForm(false)
                    refresh()
                    toast({
                      title: "Cuento guardado",
                      description: dbStatus.tablesExist
                        ? "Guardado en la nube y visible para todos."
                        : "Guardado en este dispositivo.",
                    })
                  }}
                />
              </>
            )}

            <Separator className="my-4" />

            {/* Lista de cuentos */}
            <StoryList stories={filtered} onChange={refresh} />

            <Separator className="my-6" />

            {/* Herramientas */}
            <BackupTools onToggleSearch={() => setShowSearch((v) => !v)} showSearch={showSearch} className="mt-2" />

            {/* Panel de búsqueda */}
            {showSearch && (
              <>
                <Separator className="my-6" />
                <section
                  aria-label="Búsqueda y filtros"
                  className="rounded-3xl border bg-white/70 backdrop-blur-md p-4 md:p-5 shadow-md ring-1 ring-indigo-100/60"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <h3 className="text-base md:text-lg font-semibold text-indigo-900">Buscar y filtrar</h3>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 flex items-center gap-2">
                      <Search className="h-4 w-4 text-sky-600" />
                      <Input
                        placeholder="Buscar por título o texto..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Buscar por título o texto"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-indigo-600" />
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-[180px]"
                        aria-label="Filtrar por fecha"
                      />
                      {dateFilter && (
                        <Button variant="secondary" onClick={() => setDateFilter("")} className="px-4 py-2 text-sm">
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="px-4 md:px-8 lg:px-12 py-10 text-center text-sm text-muted-foreground">
        {dbStatus.tablesExist
          ? "Los cuentos se sincronizan automáticamente entre todos los dispositivos. ¡Todos pueden ver y crear recuerdos!"
          : dbStatus.supabaseConfigured
            ? "Ejecuta el script SQL en Supabase para habilitar la sincronización entre dispositivos."
            : "Los cuentos se guardan localmente en este dispositivo. Configura Supabase para compartir entre dispositivos."}
      </footer>

      {/* Panel de debug solo en desarrollo */}
      {process.env.NODE_ENV === "development" && <DebugPanel />}
    </main>
  )
}
