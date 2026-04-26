"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, CalendarIcon, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import PixarHeader from "@/components/pixar-header"
import StoryForm from "@/components/story-form"
import StoryList from "@/components/story-list"
import MagicBackground from "@/components/magic-background"
import SupabaseSetup from "@/components/supabase-setup"
import type { Story } from "@/types/story"
import { getAllStories, checkDatabaseStatus } from "@/lib/hybrid-db"

export default function Page() {
  const [stories, setStories] = useState<Story[]>([])
  const [query, setQuery] = useState<Story[]>([])
  const [queryStr, setQueryStr] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [showForm, setShowForm] = useState<boolean>(false)
  const [showSearch, setShowSearch] = useState(false)
  const [dbStatus, setDbStatus] = useState<{ supabaseConfigured: boolean; tablesExist: boolean }>({
    supabaseConfigured: false,
    tablesExist: false,
  })
  const { toast } = useToast()

  const refresh = async () => {
    try {
      const data = await getAllStories()
      setStories(data)
    } catch {
      toast({ title: "Error al cargar", variant: "destructive" })
    }
  }

  const checkStatus = async () => {
    try {
      const status = await checkDatabaseStatus()
      setDbStatus(status)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh()
    checkStatus()
  }, [])

  const filtered = useMemo(() => {
    const q = queryStr.trim().toLowerCase()
    return stories.filter((s) => {
      const matchesQuery = !q || s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q)
      const matchesDate = !dateFilter || s.createdAt.slice(0, 10) === dateFilter
      return matchesQuery && matchesDate
    })
  }, [stories, queryStr, dateFilter])

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-100 to-indigo-100">
      <MagicBackground />
      <PixarHeader onRefresh={refresh} />

      <div className="px-3 md:px-6 lg:px-12 -mt-16 relative z-10 pb-8">
        {dbStatus.supabaseConfigured && !dbStatus.tablesExist && <SupabaseSetup />}

        <Card className="border-none shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg md:text-xl font-semibold text-indigo-900/90">
                  {dbStatus.tablesExist ? "Cuentos" : "Tus cuentos"}
                </h2>
                <span className="text-sm text-muted-foreground">({filtered.length})</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button size="sm" onClick={() => setShowSearch(!showSearch)} variant="outline" className="flex-1 sm:flex-none">
                  <Search className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setShowForm(!showForm)} className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4" />
                  <span className="ml-1">{showForm ? "Cerrar" : "Nuevo"}</span>
                </Button>
              </div>
            </div>

            {showSearch && (
              <div className="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-white/50 rounded-xl">
                <div className="flex-1 flex items-center gap-2">
                  <Search className="h-4 w-4 text-sky-600 flex-shrink-0" />
                  <Input
                    placeholder="Buscar..."
                    value={queryStr}
                    onChange={(e) => setQueryStr(e.target.value)}
                    className="border-0 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-[140px] md:w-[160px]"
                  />
                  {dateFilter && (
                    <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {showForm && (
              <div className="mb-4">
                <StoryForm
                  onCreated={() => {
                    setShowForm(false)
                    refresh()
                    toast({ title: "Cuento guardado" })
                  }}
                />
              </div>
            )}

            <Separator className="my-4" />

            <StoryList stories={filtered} onChange={refresh} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
