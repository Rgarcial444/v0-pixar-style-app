-- Script corregido para crear las tablas con políticas RLS funcionales

-- Crear tabla completa para los cuentos
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  image_type TEXT DEFAULT 'image/jpeg'
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS stories_title_idx ON stories(title);

-- Habilitar Row Level Security (RLS)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can read stories" ON stories;
DROP POLICY IF EXISTS "Anyone can insert stories" ON stories;
DROP POLICY IF EXISTS "Anyone can update stories" ON stories;
DROP POLICY IF EXISTS "Anyone can delete stories" ON stories;

-- Crear políticas nuevas con sintaxis correcta
CREATE POLICY "Anyone can read stories" ON stories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert stories" ON stories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update stories" ON stories
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete stories" ON stories
  FOR DELETE USING (true);

-- Crear bucket para imágenes en Supabase Storage (OPCIONAL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes del storage si existen
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Crear políticas nuevas para el bucket de imágenes
CREATE POLICY "Anyone can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'story-images');

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'story-images');
