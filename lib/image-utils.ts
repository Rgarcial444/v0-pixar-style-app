"use client"

import { useEffect } from "react"

import { useState } from "react"

// Utilidades para manejo optimizado de imágenes

export function getImageDisplayUrl(story: { imageDataUrl?: string; imageBlob?: Blob }): string | null {
  // Prioridad 1: URL directa de Supabase (más eficiente)
  if (story.imageDataUrl && story.imageDataUrl.startsWith("http")) {
    return story.imageDataUrl
  }

  // Prioridad 2: Data URL (también directa)
  if (story.imageDataUrl && story.imageDataUrl.startsWith("data:")) {
    return story.imageDataUrl
  }

  // Prioridad 3: Crear object URL desde blob (menos eficiente)
  if (story.imageBlob) {
    try {
      return URL.createObjectURL(story.imageBlob)
    } catch (error) {
      console.warn("Error creating object URL:", error)
      return null
    }
  }

  return null
}

export function isDirectUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith("http") || url.startsWith("data:")
}

export function needsObjectUrlCleanup(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith("blob:")
}

// Hook para manejo automático de URLs de imagen
export function useImageUrl(story: { imageDataUrl?: string; imageBlob?: Blob; id: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    setError(false)

    // URL directa (HTTP o data URL)
    if (story.imageDataUrl && isDirectUrl(story.imageDataUrl)) {
      setUrl(story.imageDataUrl)
      return
    }

    // Crear object URL desde blob
    if (story.imageBlob) {
      try {
        objectUrl = URL.createObjectURL(story.imageBlob)
        setUrl(objectUrl)
      } catch (err) {
        console.warn("Error creating object URL:", err)
        setError(true)
        setUrl(null)
      }
      return
    }

    // Sin imagen
    setUrl(null)

    // Cleanup
    return () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch (err) {
          console.warn("Error revoking object URL:", err)
        }
      }
    }
  }, [story.imageDataUrl, story.imageBlob, story.id])

  return { url, error }
}
