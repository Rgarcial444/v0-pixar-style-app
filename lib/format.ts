"use client"

export function formatDateES(dateOrISO: string | Date): string {
  const d = typeof dateOrISO === "string" ? new Date(dateOrISO) : dateOrISO
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(d)
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
