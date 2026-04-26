"use client"

import type { Story, NewStory } from "@/types/story"
import * as localDb from "./db"
import * as cloudDb from "./cloud-db"
import { isSupabaseAvailable } from "./supabase"

async function canUseCloud(): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    return false
  }
  try {
    return await cloudDb.checkTablesExist()
  } catch {
    return false
  }
}

export async function addStory(input: NewStory): Promise<Story> {
  const useCloud = await canUseCloud()

  if (useCloud) {
    try {
      const cloudStory = await cloudDb.addStoryToCloud(input)
      try {
        await localDb.addStory(input)
      } catch { /* ignore */ }
      return cloudStory
    } catch {
      try {
        return await localDb.addStory(input)
      } catch {
        throw new Error("No se pudo guardar el cuento")
      }
    }
  } else {
    return await localDb.addStory(input)
  }
}

export async function getAllStories(): Promise<Story[]> {
  const useCloud = await canUseCloud()

  if (useCloud) {
    try {
      return await cloudDb.getAllStoriesFromCloud()
    } catch {
      return await localDb.getAllStories()
    }
  } else {
    return await localDb.getAllStories()
  }
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
      try {
        await localDb.clearAll()
      } catch { /* ignore */ }
    } catch {
      await localDb.clearAll()
    }
  } else {
    await localDb.clearAll()
  }
}

export async function exportAllStories(): Promise<Blob> {
  return await localDb.exportAllStories()
}

export async function importStories(fileText: string): Promise<void> {
  await localDb.importStories(fileText)
}

export async function migrateToCloud(): Promise<void> {
  const useCloud = await canUseCloud()
  if (useCloud) {
    await cloudDb.migrateLocalToCloud()
  } else {
    throw new Error("Supabase no está configurado")
  }
}

export async function isCloudAvailable(): Promise<boolean> {
  return await canUseCloud()
}

export async function checkDatabaseStatus(): Promise<{
  supabaseConfigured: boolean
  tablesExist: boolean
}> {
  const supabaseConfigured = isSupabaseAvailable()
  let tablesExist = false

  if (supabaseConfigured) {
    try {
      tablesExist = await cloudDb.checkTablesExist()
    } catch { /* ignore */ }
  }

  return { supabaseConfigured, tablesExist }
}

export async function forceSyncToCloud(): Promise<{ success: number; errors: number }> {
  const useCloud = await canUseCloud()
  if (!useCloud) {
    throw new Error("La nube no está disponible")
  }

  const localStories = await localDb.getAllStories()
  let success = 0
  let errors = 0

  for (const story of localStories) {
    try {
      await cloudDb.addStoryToCloud({
        title: story.title,
        text: story.text,
        createdAt: story.createdAt,
        imageBlob: story.imageBlob,
        imageDataUrl: story.imageDataUrl,
        imageType: story.imageType,
      })
      success++
    } catch {
      errors++
    }
  }

  return { success, errors }
}// trigger rebuild
