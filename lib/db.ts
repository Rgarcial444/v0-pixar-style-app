"use client"

import { createStore, get, set, del, clear, entries } from "idb-keyval"
import type { Story, NewStory } from "@/types/story"
import { dataUrlFromBlob, blobFromDataUrl } from "./images"

const store = createStore("pixar-stories-db", "stories")

export async function addStory(input: NewStory): Promise<Story> {
  console.log("=== GUARDANDO CUENTO ===")
  console.log("Título:", input.title)
  console.log("Tiene imagen:", !!input.imageBlob)

  let imageDataUrl: string | undefined
  let imageBlob: Blob | undefined

  // Si hay una imagen, procesarla
  if (input.imageBlob) {
    console.log("=== PROCESANDO IMAGEN EN DB LOCAL ===")
    console.log("Input imageBlob size:", input.imageBlob.size)
    console.log("Input imageBlob type:", input.imageBlob.type)

    try {
      // Mantener el blob original
      imageBlob = input.imageBlob
      console.log("✅ Blob asignado correctamente")

      // Convertir a data URL para almacenamiento confiable
      console.log("Convirtiendo imagen a data URL...")
      imageDataUrl = await dataUrlFromBlob(input.imageBlob)
      console.log("✅ Data URL creada, longitud:", imageDataUrl.length)
      console.log("✅ Data URL preview:", imageDataUrl.substring(0, 50) + "...")
    } catch (error) {
      console.error("❌ Error procesando imagen:", error)
      // Mantener al menos el blob si falla la conversión
      imageBlob = input.imageBlob
      console.log("⚠️ Manteniendo solo el blob")
    }
  } else {
    console.log("📷 No hay imagen para procesar")
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const story: Story = {
    id,
    title: input.title,
    text: input.text,
    createdAt: input.createdAt,
    updatedAt: now,
    imageBlob: imageBlob,
    imageDataUrl: imageDataUrl,
    imageType: input.imageType || "image/jpeg",
  }

  console.log("Guardando story con:")
  console.log("- imageBlob:", !!story.imageBlob)
  console.log("- imageDataUrl:", !!story.imageDataUrl)

  await set(id, story, store)
  console.log("✅ Cuento guardado con ID:", id)
  return story
}

export async function getStory(id: string): Promise<Story | undefined> {
  try {
    const story = await get<Story>(id, store)
    if (story) {
      return await ensureImageBlob(story)
    }
    return undefined
  } catch (error) {
    console.error("Error getting story:", error)
    return undefined
  }
}

export async function getAllStories(): Promise<Story[]> {
  try {
    console.log("=== CARGANDO TODOS LOS CUENTOS ===")
    const all = await entries<string, Story>(store)
    console.log(`Encontrados ${all.length} cuentos en la base de datos`)

    const items = await Promise.all(
      all.map(async ([, value]) => {
        try {
          console.log(`Procesando cuento: ${value.title}`)
          console.log(`- Tiene imageBlob: ${!!value.imageBlob}`)
          console.log(`- Tiene imageDataUrl: ${!!value.imageDataUrl}`)

          const processedStory = await ensureImageBlob(value)

          console.log(`- Después del procesamiento:`)
          console.log(`  - imageBlob: ${!!processedStory.imageBlob}`)
          console.log(`  - imageDataUrl: ${!!processedStory.imageDataUrl}`)

          return processedStory
        } catch (error) {
          console.error("Error procesando cuento:", value.id, error)
          // Devolver la historia sin imagen si hay error
          return {
            ...value,
            imageBlob: undefined,
            imageType: value.imageType || "image/jpeg",
          }
        }
      }),
    )

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    console.log(`✅ Cargados ${items.length} cuentos exitosamente`)

    // Log de resumen
    const withImages = items.filter((item) => item.imageBlob || item.imageDataUrl).length
    console.log(`📸 ${withImages} cuentos tienen imágenes`)

    return items
  } catch (error) {
    console.error("Error loading stories:", error)
    return []
  }
}

// Función para asegurar que el story tenga un blob válido
async function ensureImageBlob(story: Story): Promise<Story> {
  // Si ya tiene un blob válido, devolverlo tal como está
  if (story.imageBlob) {
    try {
      // Verificar que el blob sea válido
      URL.createObjectURL(story.imageBlob)
      return story
    } catch (error) {
      console.warn("Blob inválido detectado, regenerando desde data URL")
    }
  }

  // Si tiene data URL pero no blob, regenerar el blob
  if (story.imageDataUrl && !story.imageBlob) {
    try {
      console.log("Regenerando blob desde data URL para cuento:", story.id)
      const blob = await blobFromDataUrl(story.imageDataUrl)
      return {
        ...story,
        imageBlob: blob,
      }
    } catch (error) {
      console.error("Error regenerando blob desde data URL:", error)
    }
  }

  // Devolver sin imagen si no se puede procesar
  return {
    ...story,
    imageBlob: undefined,
  }
}

export async function deleteStory(id: string): Promise<void> {
  try {
    await del(id, store)
    console.log("Story deleted:", id)
  } catch (error) {
    console.error("Error deleting story:", error)
    throw error
  }
}

export async function clearAll(): Promise<void> {
  try {
    await clear(store)
    console.log("All stories cleared")
  } catch (error) {
    console.error("Error clearing stories:", error)
    throw error
  }
}

export async function exportAllStories(): Promise<Blob> {
  try {
    const all = await getAllStories()
    console.log(`Exporting ${all.length} stories`)

    // Serializar usando data URLs (más confiable para exportación)
    const serialized = await Promise.all(
      all.map(async (s) => {
        let imageDataUrl: string | null = null

        // Priorizar data URL existente, luego convertir blob
        if (s.imageDataUrl) {
          imageDataUrl = s.imageDataUrl
        } else if (s.imageBlob) {
          try {
            imageDataUrl = await dataUrlFromBlob(s.imageBlob)
          } catch (error) {
            console.warn(`Error converting blob to data URL for story ${s.id}:`, error)
          }
        }

        return {
          id: s.id,
          title: s.title,
          text: s.text,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          imageType: s.imageType || "image/jpeg",
          imageDataUrl: imageDataUrl,
        }
      }),
    )

    const payload = {
      version: 3, // Incrementar versión
      exportedAt: new Date().toISOString(),
      stories: serialized,
    }

    console.log("Export completed successfully")
    return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  } catch (error) {
    console.error("Error exporting stories:", error)
    throw new Error("Error al exportar los cuentos")
  }
}

export async function importStories(fileText: string): Promise<void> {
  try {
    const parsed = JSON.parse(fileText) as {
      version?: number
      stories: Array<any>
    }

    if (!parsed || !Array.isArray(parsed.stories)) {
      throw new Error("Formato de archivo inválido")
    }

    console.log(`Importing ${parsed.stories.length} stories (version: ${parsed.version || 1})`)

    let successCount = 0
    let errorCount = 0

    for (const s of parsed.stories) {
      try {
        const id = s.id || crypto.randomUUID()
        let imgBlob: Blob | undefined
        const imageDataUrl: string | undefined = s.imageDataUrl

        // Convertir data URL a blob si existe
        if (s.imageDataUrl && typeof s.imageDataUrl === "string") {
          try {
            imgBlob = await blobFromDataUrl(s.imageDataUrl)
            console.log(`Successfully converted image for story: ${s.title}`)
          } catch (error) {
            console.warn(`Error converting data URL to blob for story ${id}:`, error)
            // Mantener el data URL aunque falle la conversión a blob
          }
        }

        const story: Story = {
          id,
          title: s.title || "Cuento sin título",
          text: s.text || "",
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || new Date().toISOString(),
          imageBlob: imgBlob,
          imageDataUrl: imageDataUrl,
          imageType: s.imageType || imgBlob?.type || "image/jpeg",
        }

        await set(id, story, store)
        successCount++
        console.log(`Successfully imported story: ${story.title}`)
      } catch (error) {
        errorCount++
        console.error(`Error importing individual story:`, error)
      }
    }

    console.log(`Import completed: ${successCount} success, ${errorCount} errors`)

    if (successCount === 0 && errorCount > 0) {
      throw new Error("No se pudo importar ningún cuento")
    }
  } catch (error) {
    console.error("Error importing stories:", error)
    throw new Error("Error al importar los cuentos. Verifica que el archivo sea válido.")
  }
}

// Función de utilidad para regenerar todos los blobs (útil para debugging)
export async function regenerateAllBlobs(): Promise<void> {
  try {
    console.log("Regenerating all blobs...")
    const all = await entries<string, Story>(store)

    for (const [id, story] of all) {
      if (story.imageDataUrl && !story.imageBlob) {
        try {
          const blob = await blobFromDataUrl(story.imageDataUrl)
          const updatedStory = { ...story, imageBlob: blob }
          await set(id, updatedStory, store)
          console.log(`Regenerated blob for story: ${story.title}`)
        } catch (error) {
          console.error(`Error regenerating blob for story ${id}:`, error)
        }
      }
    }
    console.log("Blob regeneration completed")
  } catch (error) {
    console.error("Error during blob regeneration:", error)
  }
}
