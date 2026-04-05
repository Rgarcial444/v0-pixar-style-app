"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Story } from "@/types/story"
import { useEffect, useState } from "react"
import { formatDateES } from "@/lib/format"
import ToyCarButton from "@/components/toy-car-button"
import { RefreshCw, ImageIcon } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  story: Story
}

export default function StoryDialog({ open, onOpenChange, story }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageExpanded, setImageExpanded] = useState(false)

  const cleanText = (text: string) => text.replace(/\*/g, "")
  const cleanTitle = cleanText(story.title)
  const cleanTextContent = cleanText(story.text)

  const generateImageUrl = async (story: Story): Promise<string | null> => {
    try {
      // Prioridad 1: URL directa de Supabase
      if (story.imageDataUrl && story.imageDataUrl.startsWith("http")) {
        console.log("Using Supabase URL for dialog:", story.title)
        return story.imageDataUrl
      }

      // Prioridad 2: Data URL
      if (story.imageDataUrl && story.imageDataUrl.startsWith("data:")) {
        console.log("Using data URL for dialog:", story.title)
        return story.imageDataUrl
      }

      // Prioridad 3: Crear desde blob
      if (story.imageBlob) {
        console.log("Creating object URL from blob for dialog:", story.title)
        return URL.createObjectURL(story.imageBlob)
      }

      return null
    } catch (error) {
      console.error("Error generating image URL for dialog:", error)
      return null
    }
  }

  const loadImage = async () => {
    setImageError(false)
    setRetrying(true)
    setImageLoading(true)

    try {
      // Limpiar URL anterior
      if (url && url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url)
        } catch (error) {
          console.warn("Error revoking previous URL:", error)
        }
      }

      const newUrl = await generateImageUrl(story)
      setUrl(newUrl)

      if (!newUrl && (story.imageBlob || story.imageDataUrl)) {
        setImageError(true)
      }
    } catch (error) {
      console.error("Error loading image for dialog:", error)
      setImageError(true)
    } finally {
      setRetrying(false)
      setImageLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    if (open) {
      loadImage()
    }

    return () => {
      isActive = false
      if (url && url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url)
        } catch (error) {
          console.warn("Error revoking object URL:", error)
        }
      }
    }
  }, [open, story.id])

  const hasImage = story.imageBlob || story.imageDataUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{cleanTitle}</DialogTitle>
          <DialogDescription>{formatDateES(story.createdAt)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          {/* Imagen grande en el diálogo */}
          {imageLoading ? (
            <div className="w-full h-64 bg-gradient-to-br from-sky-100 to-emerald-100 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-8 w-8 animate-spin text-sky-600" />
                <span className="text-sm text-muted-foreground">Cargando imagen...</span>
              </div>
            </div>
          ) : url && !imageError ? (
            <div className="relative">
              <img
                src={url || "/placeholder.svg"}
                alt={"Imagen del cuento " + cleanTitle}
                className={`w-full rounded-lg shadow-lg bg-white transition-all duration-300 ${
                  imageExpanded ? "max-h-[70vh] object-contain cursor-zoom-out" : "max-h-96 object-contain cursor-zoom-in"
                }`}
                onClick={() => setImageExpanded(!imageExpanded)}
                onLoad={() => console.log("Dialog image loaded successfully")}
                onError={() => {
                  console.warn("Dialog image failed to load for story:", cleanTitle)
                  setImageError(true)
                }}
              />
              {!imageExpanded && hasImage && (
                <button
                  onClick={() => setImageExpanded(true)}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white text-sky-700 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all hover:scale-105"
                >
                  Leer
                </button>
              )}
            </div>
          ) : hasImage ? (
            <div className="w-full h-48 bg-gradient-to-br from-sky-100 to-emerald-100 rounded-lg flex flex-col items-center justify-center gap-3">
              <ImageIcon className="h-12 w-12 text-sky-600/60" />
              <div className="text-center">
                <span className="text-sm text-muted-foreground block">
                  {imageError ? "Error cargando imagen" : "Cargando imagen..."}
                </span>
                {imageError && (
                  <ToyCarButton
                    size="sm"
                    variant="secondary"
                    onClick={loadImage}
                    disabled={retrying}
                    showWheels={false}
                    className="text-xs px-3 py-1 mt-2"
                  >
                    {retrying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Reintentar
                  </ToyCarButton>
                )}
              </div>
            </div>
          ) : null}

          {/* Texto del cuento */}
          <article className="prose prose-sm md:prose-base max-w-none whitespace-pre-wrap leading-relaxed text-gray-800">
            {cleanTextContent}
          </article>
        </div>
      </DialogContent>
    </Dialog>
  )
}
