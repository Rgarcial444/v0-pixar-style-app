"use client"

import { supabase, isSupabaseAvailable } from "./supabase"
import type { Story, NewStory } from "@/types/story"

// Función para verificar si las tablas existen
export async function checkTablesExist(): Promise<boolean> {
  if (!isSupabaseAvailable() || !supabase) {
    return false
  }

  try {
    const { error } = await supabase.from("stories").select("count").limit(1)
    return !error
  } catch (error) {
    console.log("Tables don't exist yet:", error)
    return false
  }
}

// Función para verificar qué columnas existen en la tabla
async function getTableColumns(): Promise<string[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("stories").select("*").limit(1)

    if (error) {
      console.log("Error checking columns:", error)
      return ["id", "title", "text", "created_at", "updated_at"]
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      console.log("✅ Available columns:", columns)
      return columns
    }

    return ["id", "title", "text", "created_at", "updated_at"]
  } catch (error) {
    console.error("Error getting table columns:", error)
    return ["id", "title", "text", "created_at", "updated_at"]
  }
}

// Función SIMPLIFICADA para verificar y usar el bucket de storage
async function uploadImageToStorage(imageBlob: Blob, imageType: string): Promise<string | null> {
  if (!supabase) {
    console.log("❌ No Supabase client")
    return null
  }

  try {
    console.log("📸 Iniciando upload de imagen...")
    console.log("📸 Tamaño del blob:", imageBlob.size, "bytes")
    console.log("📸 Tipo de imagen:", imageType)

    // Generar nombre único para el archivo
    const fileExt = imageType?.split("/")[1] || "jpg"
    const fileName = `story-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    console.log("📸 Nombre del archivo:", fileName)

    // Intentar subir directamente - si el bucket existe, funcionará
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("story-images")
      .upload(fileName, imageBlob, {
        contentType: imageType || "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ Error en upload:", uploadError)
      return null
    }

    if (!uploadData) {
      console.error("❌ No se recibieron datos del upload")
      return null
    }

    console.log("✅ Upload exitoso:", uploadData.path)

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from("story-images").getPublicUrl(uploadData.path)

    if (!urlData?.publicUrl) {
      console.error("❌ No se pudo obtener URL pública")
      return null
    }

    console.log("✅ URL pública generada:", urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error("❌ Error general en upload:", error)
    return null
  }
}

export async function addStoryToCloud(input: NewStory): Promise<Story> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase no está configurado")
  }

  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    throw new Error("TABLES_NOT_CREATED")
  }

  try {
    console.log("🚀 Guardando cuento en la nube:", input.title)

    // Verificar columnas disponibles
    const availableColumns = await getTableColumns()
    const hasImageUrl = availableColumns.includes("image_url")
    const hasImageType = availableColumns.includes("image_type")

    console.log("📋 Tabla soporta imágenes:", hasImageUrl && hasImageType)

    let imageUrl: string | null = null

    // Procesar imagen si existe y la tabla lo soporta
    if (hasImageUrl && input.imageBlob) {
      console.log("📸 Procesando imagen para la nube...")

      imageUrl = await uploadImageToStorage(input.imageBlob, input.imageType || "image/jpeg")

      if (imageUrl) {
        console.log("✅ Imagen subida exitosamente a:", imageUrl)
      } else {
        console.log("⚠️ No se pudo subir la imagen, guardando cuento sin imagen")
      }
    }

    // Preparar datos para insertar
    const insertData: any = {
      title: input.title,
      text: input.text,
    }

    if (availableColumns.includes("created_at")) {
      insertData.created_at = input.createdAt
    }

    if (availableColumns.includes("updated_at")) {
      insertData.updated_at = new Date().toISOString()
    }

    if (hasImageUrl && imageUrl) {
      insertData.image_url = imageUrl
    }

    if (hasImageType && input.imageType) {
      insertData.image_type = input.imageType
    }

    console.log("💾 Insertando cuento con datos:", Object.keys(insertData))

    // Insertar en la base de datos
    const { data, error } = await supabase.from("stories").insert(insertData).select().single()

    if (error) {
      console.error("❌ Error insertando cuento:", error)
      throw new Error(`Error al guardar en la nube: ${error.message}`)
    }

    console.log("✅ Cuento guardado en la nube:", data.id)

    // Crear objeto Story para retornar
    const story: Story = {
      id: data.id,
      title: data.title,
      text: data.text,
      createdAt: data.created_at || input.createdAt,
      updatedAt: data.updated_at || new Date().toISOString(),
      imageBlob: input.imageBlob, // Mantener blob local
      imageDataUrl: imageUrl || input.imageDataUrl, // URL de Supabase o data URL local
      imageType: hasImageType ? data.image_type || input.imageType : input.imageType || "image/jpeg",
    }

    return story
  } catch (error) {
    console.error("❌ Error guardando cuento en la nube:", error)
    throw error
  }
}

export async function getAllStoriesFromCloud(): Promise<Story[]> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase no está configurado")
  }

  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    throw new Error("TABLES_NOT_CREATED")
  }

  try {
    console.log("📚 Cargando cuentos desde la nube...")

    const { data, error } = await supabase.from("stories").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error cargando cuentos:", error)
      throw error
    }

    console.log(`📖 Cargados ${data.length} cuentos desde la nube`)

    // Verificar columnas disponibles
    const availableColumns = data.length > 0 ? Object.keys(data[0]) : []
    const hasImageUrl = availableColumns.includes("image_url")
    const hasImageType = availableColumns.includes("image_type")

    console.log("📋 Columnas disponibles:", availableColumns)
    console.log("🖼️ Soporte para imágenes:", hasImageUrl && hasImageType)

    const stories = await Promise.all(
      data.map(async (item, index) => {
        console.log(`📖 Procesando cuento ${index + 1}: ${item.title}`)

        let imageBlob: Blob | undefined
        let imageDataUrl: string | undefined

        if (hasImageUrl && item.image_url) {
          console.log("🖼️ Cuento tiene imagen:", item.image_url.substring(0, 100) + "...")

          try {
            if (item.image_url.startsWith("http")) {
              // URL de Supabase Storage
              console.log("🌐 Usando URL de Supabase Storage")
              imageDataUrl = item.image_url

              // Intentar descargar para crear blob (opcional)
              try {
                const response = await fetch(item.image_url)
                if (response.ok) {
                  imageBlob = await response.blob()
                  console.log("✅ Imagen descargada como blob:", imageBlob.size, "bytes")
                } else {
                  console.warn("⚠️ No se pudo descargar imagen:", response.status)
                }
              } catch (fetchError) {
                console.warn("⚠️ Error descargando imagen:", fetchError)
              }
            } else {
              console.warn("❓ Formato de URL no reconocido:", item.image_url.substring(0, 50))
            }
          } catch (error) {
            console.error("❌ Error procesando imagen:", error)
          }
        } else {
          console.log("📷 Sin imagen para:", item.title)
        }

        const story: Story = {
          id: item.id,
          title: item.title,
          text: item.text,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
          imageBlob: imageBlob,
          imageDataUrl: imageDataUrl,
          imageType: hasImageType ? item.image_type || "image/jpeg" : "image/jpeg",
        }

        console.log("📊 Cuento procesado:")
        console.log("  - imageBlob:", !!story.imageBlob)
        console.log("  - imageDataUrl:", !!story.imageDataUrl)
        console.log("  - imageType:", story.imageType)

        return story
      }),
    )

    console.log("\n=== 📈 RESUMEN FINAL ===")
    const withImages = stories.filter((s) => s.imageBlob || s.imageDataUrl).length
    console.log(`📸 ${withImages} de ${stories.length} cuentos tienen imágenes`)

    return stories
  } catch (error) {
    console.error("❌ Error cargando cuentos desde la nube:", error)
    throw error
  }
}

export async function deleteStoryFromCloud(id: string, password: string): Promise<void> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase no está configurado")
  }

  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    throw new Error("TABLES_NOT_CREATED")
  }

  try {
    const { data: story } = await supabase.from("stories").select("image_url").eq("id", id).single()

    if (story?.image_url && story.image_url.startsWith("http")) {
      const urlParts = story.image_url.split("/")
      const fileName = urlParts[urlParts.length - 1]
      if (fileName) {
        try {
          await supabase.storage.from("story-images").remove([fileName])
        } catch { /* ignore */ }
      }
    }

    const { error } = await supabase.rpc("delete_story_with_password", {
      story_id: id,
      password: password
    })

    if (error) {
      console.error("❌ Error eliminando cuento:", error)
      throw error
    }
  } catch (error) {
    console.error("❌ Error eliminando cuento de la nube:", error)
    throw error
  }
}

export async function clearAllStoriesFromCloud(): Promise<void> {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error("Supabase no está configurado")
  }

  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    throw new Error("TABLES_NOT_CREATED")
  }

  try {
    console.log("🧹 Limpiando todos los cuentos de la nube...")

    const availableColumns = await getTableColumns()
    const hasImageUrl = availableColumns.includes("image_url")

    if (hasImageUrl) {
      // Obtener todas las imágenes para eliminarlas del storage
      const { data: stories } = await supabase.from("stories").select("image_url")

      if (stories) {
        const imageFiles = stories
          .filter((s) => s.image_url && s.image_url.startsWith("http"))
          .map((s) => {
            const urlParts = s.image_url!.split("/")
            return urlParts[urlParts.length - 1]
          })
          .filter(Boolean)

        if (imageFiles.length > 0) {
          try {
            await supabase.storage.from("story-images").remove(imageFiles)
            console.log("🗑️ Todas las imágenes eliminadas del storage")
          } catch (error) {
            console.warn("⚠️ Error eliminando imágenes del storage:", error)
          }
        }
      }
    }

    // Eliminar todos los cuentos
    const { error } = await supabase.from("stories").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
      console.error("❌ Error limpiando cuentos:", error)
      throw error
    }

    console.log("✅ Todos los cuentos eliminados exitosamente")
  } catch (error) {
    console.error("❌ Error limpiando cuentos de la nube:", error)
    throw error
  }
}

export async function migrateLocalToCloud(): Promise<void> {
  if (!isSupabaseAvailable()) {
    throw new Error("Supabase no está configurado")
  }

  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    throw new Error("TABLES_NOT_CREATED")
  }

  try {
    console.log("🔄 Iniciando migración de local a nube...")

    const { getAllStories } = await import("./db")
    const localStories = await getAllStories()

    console.log(`📦 Encontrados ${localStories.length} cuentos locales para migrar`)

    for (const story of localStories) {
      try {
        await addStoryToCloud({
          title: story.title,
          text: story.text,
          createdAt: story.createdAt,
          imageBlob: story.imageBlob,
          imageDataUrl: story.imageDataUrl,
          imageType: story.imageType,
        })
        console.log(`✅ Migrado: ${story.title}`)
      } catch (error) {
        console.error(`❌ Error migrando ${story.title}:`, error)
      }
    }

    console.log("🎉 Migración completada")
  } catch (error) {
    console.error("❌ Error durante la migración:", error)
    throw error
  }
}
