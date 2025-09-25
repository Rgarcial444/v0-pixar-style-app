"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import ToyCarButton from "@/components/toy-car-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, BookOpen, ImageIcon, Lock } from "lucide-react"
import type { Story } from "@/types/story"
import { deleteStory } from "@/lib/hybrid-db"
import StoryDialog from "@/components/story-dialog"
import { formatDateES, countWords } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type Props = {
  story: Story
  onChange?: () => void
}

export default function StoryCard({ story, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log("=== STORY CARD ===")
    console.log("Story:", story.title)
    console.log("Has imageBlob:", !!story.imageBlob)
    console.log("Has imageDataUrl:", !!story.imageDataUrl)
    console.log("imageDataUrl:", story.imageDataUrl?.substring(0, 50) + "...")

    let objectUrl: string | null = null
    setImageError(false)
    setImageLoading(true)

    const loadImage = async () => {
      try {
        // Prioridad 1: URL directa de Supabase
        if (story.imageDataUrl && story.imageDataUrl.startsWith("http")) {
          console.log("Using Supabase URL")
          setImageUrl(story.imageDataUrl)
          setImageLoading(false)
          return
        }

        // Prioridad 2: Data URL
        if (story.imageDataUrl && story.imageDataUrl.startsWith("data:")) {
          console.log("Using data URL")
          setImageUrl(story.imageDataUrl)
          setImageLoading(false)
          return
        }

        // Prioridad 3: Blob local
        if (story.imageBlob) {
          console.log("Creating object URL from blob")
          objectUrl = URL.createObjectURL(story.imageBlob)
          setImageUrl(objectUrl)
          setImageLoading(false)
          return
        }

        // Sin imagen
        console.log("No image available")
        setImageUrl(null)
        setImageLoading(false)
      } catch (error) {
        console.error("Error loading image:", error)
        setImageError(true)
        setImageLoading(false)
      }
    }

    loadImage()

    return () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch (error) {
          console.warn("Error revoking object URL:", error)
        }
      }
    }
  }, [story.id, story.imageBlob, story.imageDataUrl])

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
    setPassword("")
    setPasswordError(false)
  }

  const onDelete = async () => {
    // Validar contraseña de owner
    if (password !== "Maggie96") {
      setPasswordError(true)
      toast({
        title: "Acceso denegado",
        description: "Solo el administrador puede eliminar cuentos",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      await deleteStory(story.id)
      toast({ title: "Cuento eliminado por el administrador" })
      onChange?.()
    } catch (error) {
      console.error("Error deleting story:", error)
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setPassword("")
      setPasswordError(false)
    }
  }

  const hasImage = story.imageBlob || story.imageDataUrl

  return (
    <>
      <Card className="overflow-hidden group">
        <CardContent className="p-0">
          {imageLoading ? (
            <div className="w-full h-32 bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
              <div className="text-xs text-muted-foreground">Cargando imagen...</div>
            </div>
          ) : imageUrl && !imageError ? (
            <div className="relative">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={"Portada de " + story.title}
                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onLoad={() => {
                  console.log("✅ Card image loaded successfully for:", story.title)
                }}
                onError={(e) => {
                  console.error("❌ Card image failed to load for:", story.title)
                  console.error("Failed URL:", imageUrl)
                  setImageError(true)
                }}
              />
              {/* Indicador de que tiene imagen */}
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                <ImageIcon className="h-3 w-3 inline mr-1" />
                Con imagen
              </div>
            </div>
          ) : hasImage ? (
            <div className="w-full h-32 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-red-400 mx-auto mb-1" />
                <div className="text-xs text-red-600">Error cargando imagen</div>
              </div>
            </div>
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                <div className="text-xs text-gray-500">Sin imagen</div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 grid gap-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold line-clamp-1">{story.title}</h4>
            <Badge variant="secondary">{countWords(story.text)} palabras</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{formatDateES(story.createdAt)}</div>

          <div className="flex gap-2">
            <ToyCarButton className="flex-1 group" onClick={() => setOpen(true)} showWheels={false}>
              <BookOpen className="h-4 w-4" />
              Leer
            </ToyCarButton>
            <ToyCarButton
              variant="danger"
              onClick={handleDeleteClick}
              aria-label="Eliminar (Solo administrador)"
              showWheels={false}
            >
              <Trash2 className="h-4 w-4" />
            </ToyCarButton>
          </div>
        </CardFooter>
      </Card>
      <StoryDialog open={open} onOpenChange={setOpen} story={story} />

      {/* Dialog de confirmación para eliminar con contraseña */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Lock className="h-5 w-5" />
              Acceso de Administrador
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <div>
                Para eliminar <strong>"{story.title}"</strong>, ingresa la contraseña de administrador:
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  ⚠️ Solo el owner puede eliminar cuentos. Esta acción no se puede deshacer.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Contraseña de Administrador</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(false)
              }}
              placeholder="Ingresa la contraseña"
              className={passwordError ? "border-red-500 focus:border-red-500" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password.trim()) {
                  onDelete()
                }
              }}
            />
            {passwordError && (
              <p className="text-sm text-red-600">
                Contraseña incorrecta. Solo el administrador puede eliminar cuentos.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <ToyCarButton
              variant="secondary"
              onClick={() => {
                setShowDeleteDialog(false)
                setPassword("")
                setPasswordError(false)
              }}
              showWheels={false}
            >
              Cancelar
            </ToyCarButton>
            <ToyCarButton
              variant="danger"
              onClick={onDelete}
              disabled={!password.trim() || isDeleting}
              showWheels={false}
            >
              {isDeleting ? (
                <>Eliminando...</>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </ToyCarButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
