"use client"

import { useMemo } from "react"
import { formatDateES } from "@/lib/format"
import type { Story } from "@/types/story"
import StoryCard from "@/components/story-card"

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
      <div className="text-center py-14 text-muted-foreground">
        {"Aún no hay cuentos. ¡Crea el primero con 'Nuevo cuento'!"}
      </div>
    )
  }

  return (
    <div className="grid gap-8">
      {groups.map(([day, items]) => (
        <section key={day} className="grid gap-3">
          <h3 className="text-sm font-medium text-fuchsia-900/80">{formatDateES(day)}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((story) => (
              <StoryCard key={story.id} story={story} onChange={onChange} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
