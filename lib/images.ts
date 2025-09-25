"use client"

export async function resizeImageToBlob(fileOrBlob: File | Blob, maxDim = 1600, quality = 0.9): Promise<Blob> {
  const srcBlob = fileOrBlob
  const img = await loadImage(srcBlob)
  const { width, height } = img
  const scale = Math.min(1, maxDim / Math.max(width, height))
  const targetW = Math.round(width * scale)
  const targetH = Math.round(height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No 2D context")
  ctx.drawImage(img.element, 0, 0, targetW, targetH)
  const type = "image/jpeg"
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality),
  )
  if (img.cleanup) img.cleanup()
  return blob
}

async function loadImage(
  blob: Blob,
): Promise<{ element: CanvasImageSource & HTMLImageElement; width: number; height: number; cleanup?: () => void }> {
  if ("createImageBitmap" in window && window.createImageBitmap) {
    const bmp = await createImageBitmap(blob)
    return {
      element: bmp as any,
      width: bmp.width,
      height: bmp.height,
      cleanup: () => bmp.close(),
    }
  }
  // Fallback for Safari/older
  const url = URL.createObjectURL(blob)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
    img.crossOrigin = "anonymous"
  })
  return {
    element: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  }
}

export function blobToObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export function dataUrlFromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => {
      const result = fr.result as string
      if (result) {
        resolve(result)
      } else {
        reject(new Error("Failed to convert blob to data URL"))
      }
    }
    fr.onerror = () => reject(new Error("FileReader error"))
    fr.readAsDataURL(blob)
  })
}

export async function blobFromDataUrl(dataUrl: string): Promise<Blob> {
  try {
    // Validar que sea una data URL válida
    if (!dataUrl.startsWith("data:")) {
      throw new Error("Invalid data URL format")
    }

    const res = await fetch(dataUrl)
    if (!res.ok) {
      throw new Error(`Failed to fetch data URL: ${res.status}`)
    }

    const blob = await res.blob()
    if (!blob || blob.size === 0) {
      throw new Error("Empty blob from data URL")
    }

    return blob
  } catch (error) {
    console.error("Error converting data URL to blob:", error)
    throw error
  }
}
