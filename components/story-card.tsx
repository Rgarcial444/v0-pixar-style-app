"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import ToyCarButton from "@/components/toy-car-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, BookOpen, ImageIcon, Lock } from "lucide-react"
import type { Story } from "@/types/story"
import { deleteStory } from "@/lib/hybrid-db"
import StoryDialog from "@/components/story-dialog"
import { formatDateES } from "@/lib/format"
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
    let objectUrl: string | null = null
    setImageError(false)
    setImageLoading(true)

    const loadImage = async () => {
      try {
        if (story.imageDataUrl?.startsWith("http")) {
          setImageUrl(story.imageDataUrl)
          setImageLoading(false)
          return
        }

        if (story.imageDataUrl?.startsWith("data:")) {
          setImageUrl(story.imageDataUrl)
          setImageLoading(false)
          return
        }

        if (story.imageBlob) {
          objectUrl = URL.createObjectURL(story.imageBlob)
          setImageUrl(objectUrl)
          setImageLoading(false)
          return
        }

        setImageUrl(null)
        setImageLoading(false)
      } catch {
        setImageError(true)
        setImageLoading(false)
      }
    }

    loadImage()

    return () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch {
          // ignore
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
      await deleteStory(story.id, password)
      toast({ title: "Cuento eliminado" })
      onChange?.()
    } catch {
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
      <Card className="overflow-hidden group h-full flex flex-col bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-0 flex-shrink-0">
          {imageLoading ? (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
              <div className="text-xs text-muted-foreground">...</div>
            </div>
          ) : imageUrl && !imageError ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt={story.title}
                loading="lazy"
                className="w-full aspect-[16/9] object-cover"
              />
              <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
              </div>
            </div>
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </CardContent>
        <CardFooter className="p-3 md:p-4 flex flex-col gap-2 flex-grow bg-white">
          <div className="w-full">
            <h4 className="font-bold text-base md:text-lg text-slate-900 leading-tight">{story.title}</h4>
            <div className="flex items-center mt-2">
              <span className="text-xs text-slate-500">{formatDateES(story.createdAt)}</span>
            </div>
          </div>

          <div className="flex gap-2 w-full mt-auto">
            <ToyCarButton className="flex-1" onClick={() => setOpen(true)} showWheels={false}>
              <BookOpen className="h-4 w-4" />
              <span className="ml-1 text-xs md:text-sm">Leer</span>
            </ToyCarButton>
            <ToyCarButton variant="danger" onClick={handleDeleteClick} showWheels={false} className="px-2">
              <Trash2 className="h-4 w-4" />
            </ToyCarButton>
          </div>
        </CardFooter>
      </Card>
      <StoryDialog open={open} onOpenChange={setOpen} story={story} />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Lock className="h-5 w-5" />
              Eliminar cuento
            </DialogTitle>
            <DialogDescription>
              Para eliminar <strong>"{story.title}"</strong>, ingresa la contraseña:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(false)
              }}
              placeholder="Contraseña"
              className={passwordError ? "border-red-500" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password.trim()) {
                  onDelete()
                }
              }}
            />
            {passwordError && (
              <p className="text-sm text-red-600">Contraseña incorrecta</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <ToyCarButton variant="secondary" onClick={() => setShowDeleteDialog(false)} showWheels={false}>
              Cancelar
            </ToyCarButton>
            <ToyCarButton variant="danger" onClick={onDelete} disabled={!password.trim() || isDeleting} showWheels={false}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </ToyCarButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
