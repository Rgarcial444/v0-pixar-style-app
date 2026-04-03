"use client"

import { useMemo } from "react"
import { formatDateES } from "@/lib/format"
import type { Story } from "@/types/story"
import StoryCard from "@/components/story-card"
import { BookOpen, Sparkles } from "lucide-react"

type Props = {
  stories: Story[]
  onChange?: () => void
}

export default function StoryList({ stories, onChange }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, Story[]>()
    const sorted = [...stories].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    for (const s of sorted) {
      const day = s.createdAt.slice(0, 10)
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(s)
    }
    return Array.from(map.entries())
  }, [stories])

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
        <div className="relative mb-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 flex items-center justify-center">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-blue-500/60" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-300/80 flex items-center justify-center animate-bounce">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-700" />
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-indigo-900/80 mb-2">
          ¡Tu historia comienza aquí!
        </h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Cada gran aventura merece ser contada. Crea tu primer cuento y empieza a construir recuerdos magicales.
        </p>
        <div className="flex items-center gap-2 text-sm text-blue-600/70">
          <Sparkles className="w-4 h-4" />
          <span>Toca "Nuevo" para comenzar</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {groups.map(([day, items]) => (
        <section key={day} className="space-y-3">
          <h3 className="text-sm font-medium text-fuchsia-900/80 px-1">{formatDateES(day)}</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {items.map((story) => (
              <StoryCard key={story.id} story={story} onChange={onChange} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
