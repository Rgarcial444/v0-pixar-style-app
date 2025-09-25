"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bug, Database, Cloud, ImageIcon, RefreshCw, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react"
import { checkDatabaseStatus, getAllStories } from "@/lib/hybrid-db"
import { useToast } from "@/hooks/use-toast"

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      console.log("🔍 EJECUTANDO DIAGNÓSTICOS...")

      // 1. Verificar estado de la base de datos
      const dbStatus = await checkDatabaseStatus()

      // 2. Cargar todos los cuentos
      const stories = await getAllStories()

      // 3. Analizar imágenes
      const imageStats = {
        total: stories.length,
        withBlob: stories.filter((s) => s.imageBlob).length,
        withDataUrl: stories.filter((s) => s.imageDataUrl).length,
        withSupabaseUrl: stories.filter((s) => s.imageDataUrl?.startsWith("http")).length,
        withLocalDataUrl: stories.filter((s) => s.imageDataUrl?.startsWith("data:")).length,
        withoutImage: stories.filter((s) => !s.imageBlob && !s.imageDataUrl).length,
      }

      // 4. Verificar URLs de Supabase
      const supabaseUrls = stories
        .filter((s) => s.imageDataUrl?.startsWith("http"))
        .map((s) => ({
          title: s.title,
          url: s.imageDataUrl,
          accessible: false, // Se verificará después
        }))

      // 5. Probar accesibilidad de URLs
      for (const item of supabaseUrls) {
        try {
          const response = await fetch(item.url!, { method: "HEAD" })
          item.accessible = response.ok
        } catch (error) {
          item.accessible = false
        }
      }

      const info = {
        timestamp: new Date().toISOString(),
        database: dbStatus,
        stories: {
          total: stories.length,
          recent: stories.slice(0, 3).map((s) => ({
            title: s.title,
            hasBlob: !!s.imageBlob,
            hasDataUrl: !!s.imageDataUrl,
            imageType: s.imageType,
            createdAt: s.createdAt,
          })),
        },
        images: imageStats,
        supabaseUrls: supabaseUrls,
        environment: {
          isProduction: process.env.NODE_ENV === "production",
          hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          userAgent: navigator.userAgent.substring(0, 100),
        },
      }

      setDebugInfo(info)
      console.log("🔍 DIAGNÓSTICOS COMPLETADOS:", info)

      toast({
        title: "Diagnósticos completados",
        description: `${stories.length} cuentos analizados`,
      })
    } catch (error) {
      console.error("❌ Error en diagnósticos:", error)
      toast({
        title: "Error en diagnósticos",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 z-50">
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Panel de Diagnósticos
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <EyeOff className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={runDiagnostics} disabled={loading} className="w-full" size="sm">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {loading ? "Analizando..." : "Ejecutar Diagnósticos"}
        </Button>

        {debugInfo && (
          <div className="space-y-2 text-xs">
            {/* Estado de la base de datos */}
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">Base de datos:</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={debugInfo.database.supabaseConfigured ? "default" : "secondary"}>
                    {debugInfo.database.supabaseConfigured ? "Configurado" : "No configurado"}
                  </Badge>
                  <Badge variant={debugInfo.database.tablesExist ? "default" : "destructive"}>
                    {debugInfo.database.tablesExist ? "Tablas OK" : "Sin tablas"}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            {/* Estadísticas de imágenes */}
            <Alert>
              <ImageIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">Imágenes ({debugInfo.images.total} cuentos):</div>
                <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                  <div>Con blob: {debugInfo.images.withBlob}</div>
                  <div>Con data URL: {debugInfo.images.withDataUrl}</div>
                  <div>URLs Supabase: {debugInfo.images.withSupabaseUrl}</div>
                  <div>URLs locales: {debugInfo.images.withLocalDataUrl}</div>
                  <div>Sin imagen: {debugInfo.images.withoutImage}</div>
                </div>
              </AlertDescription>
            </Alert>

            {/* URLs de Supabase */}
            {debugInfo.supabaseUrls.length > 0 && (
              <Alert>
                <Cloud className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">URLs de Supabase:</div>
                  <div className="space-y-1 mt-1">
                    {debugInfo.supabaseUrls.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        {item.accessible ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Cuentos recientes */}
            {debugInfo.stories.recent.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="font-semibold">Últimos cuentos:</div>
                  <div className="space-y-1 mt-1">
                    {debugInfo.stories.recent.map((story: any, index: number) => (
                      <div key={index} className="text-xs">
                        <div className="font-medium truncate">{story.title}</div>
                        <div className="flex gap-2">
                          <Badge variant={story.hasBlob ? "default" : "secondary"} className="text-xs">
                            {story.hasBlob ? "Blob ✓" : "No blob"}
                          </Badge>
                          <Badge variant={story.hasDataUrl ? "default" : "secondary"} className="text-xs">
                            {story.hasDataUrl ? "URL ✓" : "No URL"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
