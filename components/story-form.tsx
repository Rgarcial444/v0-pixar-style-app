"use client"

import type React from "react"
import { useMemo, useRef, useState, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import ToyCarButton from "@/components/toy-car-button"
import {
  ImagePlus,
  Camera,
  Wand2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  X,
  Upload,
  FolderOpen,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addStory } from "@/lib/hybrid-db"
import { resizeImageToBlob } from "@/lib/images"
import { formatDateES } from "@/lib/format"
import { cn } from "@/lib/utils"

type Props = {
  onCreated?: () => void
}

export default function StoryForm({ onCreated }: Props) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const dropZoneRef = useRef<HTMLDivElement | null>(null)

  // Función para agregar debug info
  const addDebugInfo = useCallback((info: string) => {
    console.log("🔍 DEBUG:", info)
    setDebugInfo((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${info}`])
  }, [])



  // Paso activo: 1 título, 2 cuento, 3 imagen
  const step: 1 | 2 | 3 = title.trim() ? (text.trim() ? 3 : 2) : 1
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text])

  const suggestTitle = () => {
    const sugerido = `Cuento del ${formatDateES(new Date())}`
    setTitle((prev) => (prev.trim() ? prev : sugerido))
  }

  // FUNCIÓN SIMPLE PARA MANEJAR ARCHIVOS
  const handleFile = useCallback(
    async (f: File | null) => {
      addDebugInfo("=== MANEJANDO ARCHIVO ===")
      addDebugInfo(`Archivo: ${f ? f.name : "null"}`)

      if (!f) {
        setFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        return
      }

      // Validaciones básicas
      if (!f.type.startsWith("image/")) {
        addDebugInfo("❌ No es una imagen")
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        })
        return
      }

      if (f.size > 10 * 1024 * 1024) {
        addDebugInfo("❌ Archivo muy grande")
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 10MB",
          variant: "destructive",
        })
        return
      }

      try {
        // Limpiar URL anterior
        if (previewUrl) URL.revokeObjectURL(previewUrl)

        // Crear nueva URL
        const url = URL.createObjectURL(f)
        addDebugInfo(`✅ Preview URL creada: ${url.substring(0, 50)}...`)

        setFile(f)
        setPreviewUrl(url)

        toast({
          title: "¡Imagen cargada!",
          description: `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`,
        })
      } catch (error) {
        addDebugInfo(`❌ Error manejando archivo: ${error}`)
        toast({
          title: "Error cargando imagen",
          description: "No se pudo cargar la imagen",
          variant: "destructive",
        })
      }
    },
    [previewUrl, toast, addDebugInfo],
  )

  // DRAG & DROP SIMPLE
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      addDebugInfo(`🎯 Drop - archivos: ${files.length}`)

      if (files.length === 0) {
        toast({
          title: "Sin archivos",
          description: "No se detectaron archivos",
          variant: "destructive",
        })
        return
      }

      if (files.length > 1) {
        toast({
          title: "Múltiples archivos",
          description: "Solo puedes subir una imagen a la vez",
          variant: "destructive",
        })
        return
      }

      await handleFile(files[0])
    },
    [handleFile, toast, addDebugInfo],
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null
      addDebugInfo(`📁 Input change: ${selectedFile ? selectedFile.name : "null"}`)
      handleFile(selectedFile)
    },
    [handleFile, addDebugInfo],
  )

  const clearImage = useCallback(() => {
    addDebugInfo("🧹 Limpiando imagen")
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    setShowDebug(false)
  }, [previewUrl, addDebugInfo])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // MOSTRAR DEBUG SIEMPRE DURANTE EL GUARDADO
    setShowDebug(true)
    addDebugInfo("=== INICIANDO GUARDADO ===")
    addDebugInfo(`Título: "${title.trim()}" (${title.trim().length} chars)`)
    addDebugInfo(`Texto: ${text.trim().length} caracteres, ${words} palabras`)
    addDebugInfo(`Archivo: ${file ? `${file.name} (${file.size} bytes)` : "ninguno"}`)

    if (!title.trim()) {
      toast({
        title: "Falta el título",
        description: "Por favor, añade un título para tu cuento.",
        variant: "destructive",
      })
      return
    }

    if (!text.trim()) {
      toast({
        title: "Falta el cuento",
        description: "Escribe tu historia antes de guardar.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      let resizedBlob: Blob | undefined

      if (file) {
        addDebugInfo("=== PROCESANDO IMAGEN ===")
        addDebugInfo(`Archivo original: ${file.size} bytes, ${file.type}`)

        try {
          // REDIMENSIONAR CON CONFIGURACIÓN MÁS AGRESIVA PARA CUENTOS LARGOS
          const maxDimension = words > 200 ? 1200 : 1600 // Reducir tamaño si hay mucho texto
          const quality = words > 200 ? 0.8 : 0.9 // Reducir calidad si hay mucho texto

          addDebugInfo(`Configuración: maxDim=${maxDimension}, quality=${quality}`)

          resizedBlob = await resizeImageToBlob(file, maxDimension, quality)
          addDebugInfo(
            `✅ Imagen redimensionada: ${resizedBlob.size} bytes (${((resizedBlob.size / file.size) * 100).toFixed(1)}% del original)`,
          )

          // VERIFICAR TAMAÑO TOTAL ESTIMADO
          const textSize = new Blob([text]).size
          const totalEstimatedSize = resizedBlob.size + textSize + title.length
          addDebugInfo(`📊 Tamaño estimado total: ${(totalEstimatedSize / 1024 / 1024).toFixed(2)}MB`)

          // Si es muy grande, reducir más la imagen
          if (totalEstimatedSize > 8 * 1024 * 1024) {
            // 8MB límite
            addDebugInfo("⚠️ Tamaño muy grande, reduciendo imagen más...")
            resizedBlob = await resizeImageToBlob(file, 800, 0.7)
            addDebugInfo(`✅ Imagen re-redimensionada: ${resizedBlob.size} bytes`)
          }
        } catch (resizeError) {
          addDebugInfo(`❌ Error redimensionando: ${resizeError}`)

          // FALLBACK: usar imagen original pero más pequeña
          try {
            addDebugInfo("🔄 Fallback: redimensionando a tamaño mínimo...")
            resizedBlob = await resizeImageToBlob(file, 600, 0.6)
            addDebugInfo(`✅ Fallback exitoso: ${resizedBlob.size} bytes`)
          } catch (fallbackError) {
            addDebugInfo(`❌ Fallback falló: ${fallbackError}`)
            addDebugInfo("⚠️ Continuando sin imagen para evitar fallo total")
            resizedBlob = undefined
          }
        }
      } else {
        addDebugInfo("📷 No hay imagen para procesar")
      }

      const storyData = {
        title: title.trim(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
        imageBlob: resizedBlob,
        imageType: resizedBlob?.type || file?.type || "image/jpeg",
      }

      addDebugInfo("=== DATOS FINALES ===")
      addDebugInfo(`- título: ${storyData.title.length} chars`)
      addDebugInfo(`- texto: ${storyData.text.length} chars`)
      addDebugInfo(`- imageBlob: ${!!storyData.imageBlob} (${storyData.imageBlob?.size || 0} bytes)`)
      addDebugInfo(`- imageType: ${storyData.imageType}`)

      // GUARDAR CON TIMEOUT
      addDebugInfo("💾 Llamando a addStory...")
      const savePromise = addStory(storyData)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout guardando cuento")), 30000),
      )

      await Promise.race([savePromise, timeoutPromise])
      addDebugInfo("✅ CUENTO GUARDADO EXITOSAMENTE")

      // Limpiar formulario
      setTitle("")
      setText("")
      clearImage()
      setDebugInfo([])
      setShowDebug(false)

      onCreated?.()
      toast({
        title: "¡Cuento guardado!",
        description: file ? "Tu cuento se guardó con la imagen." : "Tu cuento se guardó correctamente.",
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido"
      addDebugInfo(`❌ ERROR GUARDANDO: ${errorMsg}`)
      console.error("❌ Error saving story:", err)

      toast({
        title: "Error al guardar",
        description:
          words > 200 && file
            ? "Cuento muy largo con imagen. Intenta con una imagen más pequeña o texto más corto."
            : "No se pudo guardar el cuento. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Debug info durante el guardado o si hay errores */}
      {showDebug && debugInfo.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {saving ? "Guardando..." : "Info de diagnóstico"}
              </span>
            </div>
            {!saving && (
              <button
                onClick={() => setShowDebug(false)}
                className="text-blue-600 hover:text-blue-800 text-sm"
                type="button"
              >
                Ocultar
              </button>
            )}
          </div>
          <div className="text-xs text-blue-700 space-y-1 max-h-40 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="font-mono">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
        {/* Indicador de pasos */}
        <div aria-label="Progreso" className="flex items-center justify-center gap-2 md:gap-3 py-2">
          <MobileStepDot index={1} label="Título" active={step === 1} done={step > 1} />
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
          <MobileStepDot index={2} label="Cuento" active={step === 2} done={step > 2} />
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
          <MobileStepDot index={3} label="Imagen" active={step === 3} done={false} />
        </div>

        {/* Paso 1: Título */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-emerald-900 font-bold text-sm md:text-base">
            Título del cuento
          </Label>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Un día en el parque"
              className="text-base md:text-lg h-11 md:h-12"
            />
            <ToyCarButton
              type="button"
              variant="secondary"
              onClick={suggestTitle}
              showWheels={false}
              className="h-11 md:h-12 px-4 text-sm"
            >
              <Wand2 className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sugerir</span>
            </ToyCarButton>
          </div>
        </div>

        {/* Paso 2: Cuento */}
        <div className="space-y-2">
          <Label htmlFor="text" className="text-emerald-900 font-bold text-sm md:text-base">
            Escribe tu cuento
          </Label>
          <Textarea
            id="text"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Érase una vez..."}
            className="text-sm md:text-base leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground" aria-live="polite">
            <span>{words} palabras</span>
            {words > 200 && file && (
              <span className="text-amber-600 font-medium">⚠️ Cuento largo + imagen: se optimizará automáticamente</span>
            )}
          </div>
        </div>

        {/* Paso 3: Imagen */}
        <div
          ref={dropZoneRef}
          className={cn(
            "rounded-2xl md:rounded-3xl overflow-hidden border-2 border-dashed p-3 md:p-4 transition-all duration-300",
            isDragOver
              ? "border-emerald-400 bg-gradient-to-br from-emerald-100 via-sky-100 to-teal-100 shadow-lg scale-[1.01] md:scale-[1.02]"
              : "border-sky-300 bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50",
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Label className="text-emerald-900 font-bold mb-3 md:mb-4 block text-sm md:text-base">
            Imagen (opcional)
            {isDragOver && (
              <span className="ml-2 text-emerald-600 animate-pulse text-xs md:text-sm">¡Suelta aquí!</span>
            )}
          </Label>

          {previewUrl ? (
            <div className="space-y-3 md:space-y-4">
              {/* Vista previa */}
              <div className="relative bg-white rounded-xl md:rounded-2xl p-2 shadow-lg">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Vista previa de la imagen"
                  className="w-full h-48 md:h-72 object-cover rounded-lg md:rounded-xl"
                  onLoad={() => addDebugInfo("✅ Preview cargado correctamente")}
                  onError={() => addDebugInfo("❌ Error cargando preview")}
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                  title="Quitar imagen"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>

              {/* Info de la imagen - SIMPLIFICADA */}
              <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                <div className="text-green-800 font-medium text-sm md:text-base">✅ Imagen lista para guardar</div>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <ToyCarButton
                  type="button"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                  showWheels={false}
                  className="h-10 md:h-11 text-xs md:text-sm"
                >
                  <ImagePlus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Cambiar</span>
                </ToyCarButton>
                <ToyCarButton
                  type="button"
                  variant="secondary"
                  onClick={clearImage}
                  showWheels={false}
                  className="h-10 md:h-11 text-xs md:text-sm"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">Quitar</span>
                </ToyCarButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {/* Zona de drop */}
              <div
                className={cn(
                  "w-full h-32 md:h-48 border-2 border-dashed rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300",
                  isDragOver ? "border-emerald-400 bg-emerald-50/80 shadow-inner" : "border-sky-300 bg-white/50",
                )}
              >
                <div className="text-center p-4 md:p-6">
                  {isDragOver ? (
                    <>
                      <Upload className="h-12 w-12 md:h-20 md:w-20 text-emerald-600 mx-auto mb-2 md:mb-4 animate-bounce" />
                      <div className="text-lg md:text-xl font-bold text-emerald-800 mb-1 md:mb-2">¡Suelta aquí!</div>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-10 w-10 md:h-16 md:w-16 text-sky-600 mx-auto mb-2 md:mb-4" />
                      <div className="text-sm md:text-lg font-semibold text-sky-800 mb-1 md:mb-2">
                        Agregar una imagen
                      </div>
                      <div className="text-xs md:text-sm text-sky-600 bg-sky-100 rounded-full px-2 md:px-3 py-1 inline-block">
                        💡 También puedes arrastrar desde tu galería
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Botones pequeños e intuitivos */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 transition-colors shadow-sm"
                  title="Seleccionar desde galería"
                >
                  <FolderOpen className="h-4 w-4 text-sky-600" />
                  <span className="text-sm text-sky-700 font-medium">Galería</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm"
                  title="Tomar foto con cámara"
                >
                  <Camera className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">Cámara</span>
                </button>
              </div>
            </div>
          )}

          {/* Inputs ocultos */}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {/* Acciones finales */}
        <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-emerald-800 justify-center md:justify-start">
            {title.trim() && text.trim() ? (
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
            ) : (
              <ImagePlus className="h-4 w-4 md:h-5 md:w-5 text-sky-600" />
            )}
            <span className="text-xs md:text-sm text-center md:text-left">
              {title.trim() && text.trim() ? "¡Listo para compartir!" : "Completa título y cuento para continuar"}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            <ToyCarButton
              type="submit"
              disabled={saving || !title.trim() || !text.trim()}
              className="h-12 md:h-11 px-6 text-sm md:text-base font-semibold"
              showWheels={false}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {saving ? "Guardando..." : "Compartir cuento"}
            </ToyCarButton>
            <ToyCarButton
              type="button"
              variant="secondary"
              onClick={() => {
                setTitle("")
                setText("")
                clearImage()
                setDebugInfo([])
                setShowDebug(false)
              }}
              showWheels={false}
              className="h-12 md:h-11 px-6 text-sm md:text-base"
            >
              Limpiar todo
            </ToyCarButton>
          </div>
        </div>
      </form>
    </div>
  )
}

// Componente de paso
function MobileStepDot({
  index,
  label,
  active,
  done,
}: { index: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      <div
        className={cn(
          "h-7 w-7 md:h-9 md:w-9 rounded-full grid place-items-center text-xs md:text-sm font-bold shadow-sm",
          done ? "bg-emerald-500 text-white" : active ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-700",
        )}
        aria-current={active ? "step" : undefined}
        aria-label={label}
      >
        {done ? <CheckCircle2 className="h-3 w-3 md:h-5 md:w-5" /> : index}
      </div>
      <div className={cn("text-xs md:text-sm font-medium", active ? "text-emerald-900" : "text-slate-600")}>
        {label}
      </div>
    </div>
  )
}
