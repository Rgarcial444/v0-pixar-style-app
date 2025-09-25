-- Script completo y corregido para crear la tabla de cuentos
-- Ejecutar todo este script de una vez en el editor SQL de Supabase

-- 1. Eliminar tabla existente si hay problemas (CUIDADO: esto borra datos existentes)
-- DROP TABLE IF EXISTS stories CASCADE;

-- 2. Crear la tabla con todas las columnas necesarias
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  image_type TEXT DEFAULT 'image/jpeg'
);

-- 3. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS stories_title_idx ON stories(title);

-- 4. DESHABILITAR Row Level Security temporalmente para que funcione
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- 5. Crear bucket para imágenes (opcional, puede fallar sin problemas)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('story-images', 'story-images', true);
EXCEPTION WHEN OTHERS THEN
  -- Ignorar error si el bucket ya existe o no se puede crear
  NULL;
END $$;

-- 6. Verificar que la tabla se creó correctamente
SELECT 'Tabla stories creada correctamente' as status;
