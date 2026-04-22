"use client"

import type { Story, NewStory } from "@/types/story"
import * as localDb from "./db"
import * as cloudDb from "./cloud-db"
import { isSupabaseAvailable } from "./supabase"

// Función para verificar si podemos usar la nube
async function canUseCloud(): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.log("🌐 Supabase no disponible")
    return false
  }

  try {
    const tablesExist = await cloudDb.checkTablesExist()
    console.log("🌐 Tablas existen:", tablesExist)
    return tablesExist
  } catch (error) {
    console.log("🌐 Error verificando nube:", error)
    return false
  }
}

export async function addStory(input: NewStory): Promise<Story> {
  console.log("=== HYBRID DB: GUARDANDO CUENTO ===")
  console.log("Título:", input.title)
  console.log("Texto:", input.text.length, "caracteres")
  console.log("Tiene imageBlob:", !!input.imageBlob)
  console.log("Tamaño imageBlob:", input.imageBlob?.size)
  console.log("Tiene imageDataUrl:", !!input.imageDataUrl)
  console.log("Longitud imageDataUrl:", input.imageDataUrl?.length)

  const useCloud = await canUseCloud()
  console.log("🌐 Usar nube:", useCloud)

  // ESTRATEGIA ROBUSTA: Intentar nube primero, luego local
  if (useCloud) {
    try {
      console.log("☁️ INTENTANDO GUARDAR EN LA NUBE...")
      const cloudStory = await cloudDb.addStoryToCloud(input)
      console.log("✅ Guardado en nube exitoso:", cloudStory.id)

      // También guardar localmente como backup
      try {
        console.log("💾 Guardando backup local...")
        await localDb.addStory(input)
        console.log("✅ Backup local guardado")
      } catch (localError) {
        console.warn("⚠️ Error en backup local (no crítico):", localError)
      }

      return cloudStory
    } catch (cloudError) {
      console.error("❌ Error guardando en nube:", cloudError)
      console.log("🔄 Fallback a almacenamiento local...")

      // Fallback a local si falla la nube
      try {
        const localStory = await localDb.addStory(input)
        console.log("✅ Guardado local como fallback:", localStory.id)
        return localStory
      } catch (localError) {
        console.error("❌ Error en fallback local:", localError)
        throw new Error("No se pudo guardar el cuento ni en la nube ni localmente")
      }
    }
  } else {
    // Solo local si la nube no está disponible
    console.log("💾 Guardando solo localmente...")
    try {
      const localStory = await localDb.addStory(input)
      console.log("✅ Guardado local exitoso:", localStory.id)
      return localStory
    } catch (localError) {
      console.error("❌ Error guardando localmente:", localError)
      throw new Error("No se pudo guardar el cuento localmente")
    }
  }
}

export async function getAllStories(): Promise<Story[]> {
  console.log("=== HYBRID DB: CARGANDO CUENTOS ===")

  const useCloud = await canUseCloud()
  console.log("🌐 Usar nube:", useCloud)

  if (useCloud) {
    try {
      console.log("☁️ Cargando desde la nube...")
      const cloudStories = await cloudDb.getAllStoriesFromCloud()
      console.log(`✅ Cargados ${cloudStories.length} cuentos desde la nube`)

      // Verificar si hay cuentos con imágenes
      const withImages = cloudStories.filter((s) => s.imageBlob || s.imageDataUrl).length
      console.log(`📸 ${withImages} cuentos tienen imágenes`)

      // DEDUPLICAR: eliminar duplicados basándose en título+texto (y limpiar automáticamente)
      return await deduplicateAndClean(cloudStories, true)
    } catch (error) {
      console.error("❌ Error cargando desde nube:", error)
      console.log("🔄 Fallback a almacenamiento local...")

      // Fallback a almacenamiento local
      try {
        const localStories = await localDb.getAllStories()
        console.log(`✅ Fallback: cargados ${localStories.length} cuentos locales`)
        return await deduplicateAndClean(localStories, false)
      } catch (localError) {
        console.error("❌ Error cargando localmente:", localError)
        return []
      }
    }
  } else {
    console.log("💾 Cargando desde almacenamiento local...")
    try {
      const localStories = await localDb.getAllStories()
      console.log(`✅ Cargados ${localStories.length} cuentos locales`)
      return await deduplicateAndClean(localStories, false)
    } catch (localError) {
      console.error("❌ Error cargando localmente:", localError)
      return []
    }
  }
}

// Función para deduplicar y limpiar duplicados persistidos de la DB
async function deduplicateAndClean(stories: Story[], cleanFromDb: boolean): Promise<Story[]> {
  const seen = new Set<string>()
  const unique: Story[] = []
  const cloudIds = new Set<string>()

  for (const story of stories) {
    // Crear clave única basada en título y texto (normalizados)
    const key = `${story.title.trim().toLowerCase()}|${story.text.trim().toLowerCase()}`

    if (!seen.has(key)) {
      seen.add(key)
      unique.push(story)
      cloudIds.add(story.id)
    } else {
      console.log(`🗑️ Duplicado encontrado y removido: "${story.title}"`)
    }
  }

  if (seen.size < stories.length) {
    const duplicates = stories.length - seen.size
    console.log(`⚠️ Se eliminaron ${duplicates} duplicados`)

    // Limpiar duplicados de la DB local si es la primera carga
    if (cleanFromDb) {
      console.log("🧹 Limpiando duplicados de la base de datos local...")
      for (const story of stories) {
        if (!cloudIds.has(story.id)) {
          const key = `${story.title.trim().toLowerCase()}|${story.text.trim().toLowerCase()}`
          if (seen.has(key) && seen.has(key)) {
            await localDb.deleteStory(story.id)
            console.log(`🗑️ Eliminado: "${story.title}"`)
          }
        }
      }
    }
  }

  return unique
}

// Función para deduplicar cuentos basándose en título+texto
function deduplicateStories(stories: Story[]): Story[] {
  const seen = new Set<string>()
  const unique: Story[] = []

  for (const story of stories) {
    const key = `${story.title.trim().toLowerCase()}|${story.text.trim().toLowerCase()}`

    if (!seen.has(key)) {
      seen.add(key)
      unique.push(story)
    } else {
      console.log(`🗑️ Duplicado filtrado: "${story.title}"`)
    }
  }

  if (seen.size < stories.length) {
    console.log(`⚠️ Se filtraron ${stories.length - seen.size} duplicados`)
  }

  return unique
}

// Función para eliminar duplicados guardados en la base de datos local
export async function cleanDuplicates(): Promise<{ cleaned: number; remaining: number }> {
  console.log("🧹 INICIANDO LIMPIEZA DE DUPLICADOS...")

  const allStories = await localDb.getAllStories()
  console.log(`📦 Encontrados ${allStories.length} cuentos totales`)

  const seen = new Set<string>()
  const toDelete: string[] = []

  for (const story of allStories) {
    const key = `${story.title.trim().toLowerCase()}|${story.text.trim().toLowerCase()}`

    if (seen.has(key)) {
      toDelete.push(story.id)
      console.log(`🗑️ Marcado para eliminar: "${story.title}"`)
    } else {
      seen.add(key)
    }
  }

  console.log(`🗑️ Eliminando ${toDelete.length} duplicados...`)

  for (const id of toDelete) {
    await localDb.deleteStory(id)
  }

  const remaining = allStories.length - toDelete.length
  console.log(`✅ Limpieza completada: ${toDelete.length} eliminados, ${remaining} restantes`)

  return { cleaned: toDelete.length, remaining }
}

// Función para deduplicar cuentos basándose en título+texto
function deduplicateStories(stories: Story[]): Story[] {
  const seen = new Set<string>()
  const unique: Story[] = []

  for (const story of stories) {
    // Crear clave única basada en título y texto (normalizados)
    const key = `${story.title.trim().toLowerCase()}|${story.text.trim().toLowerCase()}`

    if (!seen.has(key)) {
      seen.add(key)
      unique.push(story)
    } else {
      console.log(`🗑️ Duplicado encontrado y removido: "${story.title}"`)
    }
  }

  if (seen.size < stories.length) {
    console.log(`⚠️ Se eliminaron ${stories.length - seen.size} duplicados`)
  }

  return unique
}

// Función para eliminar duplicados guardados en la base de datos local
export async function cleanDuplicates(): Promise<{ cleaned: number; remaining: number }> {
  console.log("🧹 INICIANDO LIMPIEZA DE DUPLICADOS...")

  const allStories = await localDb.getAllStories()
  console.log(`📦 Encontrados ${allStories.length} cuentos totales`)

  const seen = new Set<string>()
  const toDelete: string[] = []

  for (const story of allStories) {
    const key = `${story.title.trim().toLowerCase()}|${story.text.trim().toLowerCase()}`

    if (seen.has(key)) {
      toDelete.push(story.id)
      console.log(`🗑️ Marcado para eliminar: "${story.title}"`)
    } else {
      seen.add(key)
    }
  }

  console.log(`🗑️ Eliminando ${toDelete.length} duplicados...`)

  for (const id of toDelete) {
    await localDb.deleteStory(id)
  }

  const remaining = allStories.length - toDelete.length
  console.log(`✅ Limpieza completada: ${toDelete.length} eliminados, ${remaining} restantes`)

  return { cleaned: toDelete.length, remaining }
}

export async function deleteStory(id: string, password: string): Promise<void> {
  const useCloud = await canUseCloud()

  if (useCloud) {
    try {
      await cloudDb.deleteStoryFromCloud(id, password)
      try {
        await localDb.deleteStory(id)
      } catch { /* ignore */ }
    } catch (error) {
      console.error("Error deleting from cloud:", error)
      throw error
    }
  } else {
    await localDb.deleteStory(id)
  }
}

export async function clearAll(): Promise<void> {
  const useCloud = await canUseCloud()

  if (useCloud) {
    try {
      await cloudDb.clearAllStoriesFromCloud()
      // También limpiar localmente
      try {
        await localDb.clearAll()
      } catch (error) {
        console.warn("Error clearing local backup:", error)
      }
    } catch (error) {
      console.error("Error clearing cloud, falling back to local:", error)
      await localDb.clearAll()
    }
  } else {
    await localDb.clearAll()
  }
}

// Funciones de exportación/importación (mantener compatibilidad)
export async function exportAllStories(): Promise<Blob> {
  // Siempre usar la función local para exportación
  return await localDb.exportAllStories()
}

export async function importStories(fileText: string): Promise<void> {
  // Importar tanto local como nube si está habilitada
  await localDb.importStories(fileText)

  const useCloud = await canUseCloud()
  if (useCloud) {
    try {
      // Migrar los datos importados a la nube
      await cloudDb.migrateLocalToCloud()
    } catch (error) {
      console.error("Error migrating imported data to cloud:", error)
    }
  }
}

// Función para migrar datos existentes
export async function migrateToCloud(): Promise<void> {
  const useCloud = await canUseCloud()
  if (useCloud) {
    await cloudDb.migrateLocalToCloud()
  } else {
    throw new Error("Las tablas de Supabase no están creadas")
  }
}

// Función para verificar si la nube está disponible
export async function isCloudAvailable(): Promise<boolean> {
  return await canUseCloud()
}

// Función para verificar si las tablas existen
export async function checkDatabaseStatus(): Promise<{
  supabaseConfigured: boolean
  tablesExist: boolean
}> {
  const supabaseConfigured = isSupabaseAvailable()
  let tablesExist = false

  if (supabaseConfigured) {
    try {
      tablesExist = await cloudDb.checkTablesExist()
    } catch (error) {
      console.log("Error checking tables:", error)
    }
  }

  return {
    supabaseConfigured,
    tablesExist,
  }
}

// NUEVA FUNCIÓN: Forzar sincronización con la nube
export async function forceSyncToCloud(): Promise<{ success: number; errors: number }> {
  console.log("🔄 FORZANDO SINCRONIZACIÓN CON LA NUBE...")

  const useCloud = await canUseCloud()
  if (!useCloud) {
    throw new Error("La nube no está disponible")
  }

  const localStories = await localDb.getAllStories()
  console.log(`📦 Encontrados ${localStories.length} cuentos locales`)

  let success = 0
  let errors = 0

  for (const story of localStories) {
    try {
      console.log(`🔄 Sincronizando: ${story.title}`)
      await cloudDb.addStoryToCloud({
        title: story.title,
        text: story.text,
        createdAt: story.createdAt,
        imageBlob: story.imageBlob,
        imageDataUrl: story.imageDataUrl,
        imageType: story.imageType,
      })
      success++
      console.log(`✅ Sincronizado: ${story.title}`)
    } catch (error) {
      errors++
      console.error(`❌ Error sincronizando ${story.title}:`, error)
    }
  }

  console.log(`🎉 Sincronización completada: ${success} éxitos, ${errors} errores`)
  return { success, errors }
}
