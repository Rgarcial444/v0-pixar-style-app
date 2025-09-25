export type Story = {
  id: string
  title: string
  text: string
  createdAt: string // ISO
  updatedAt: string // ISO
  imageBlob?: Blob
  imageDataUrl?: string // Añadir data URL para mejor compatibilidad
  imageType?: string
}

export type NewStory = {
  title: string
  text: string
  createdAt: string
  imageBlob?: Blob
  imageDataUrl?: string
  imageType?: string
}
