-- Script para AGREGAR las columnas de imagen a la tabla existente
-- Esto NO borra los datos existentes, solo agrega las columnas faltantes

-- Agregar columna para la URL/data de la imagen
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Agregar columna para el tipo de imagen
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'image/jpeg';

-- Crear índice para mejor rendimiento (opcional)
CREATE INDEX IF NOT EXISTS stories_image_url_idx ON stories(image_url);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stories' 
ORDER BY ordinal_position;
