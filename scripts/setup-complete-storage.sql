-- SCRIPT COMPLETO PARA CONFIGURAR STORAGE DE IMÁGENES EN SUPABASE
-- Ejecuta TODO este script de una vez en el Editor SQL

-- 1. CREAR BUCKET PARA IMÁGENES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-images',
  'story-images', 
  true,
  10485760, -- 10MB límite
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. ELIMINAR POLÍTICAS EXISTENTES (si existen)
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;

-- 3. CREAR POLÍTICAS PARA EL BUCKET (ACCESO PÚBLICO TOTAL)
CREATE POLICY "Anyone can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'story-images');

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'story-images');

-- 4. VERIFICAR QUE EL BUCKET SE CREÓ CORRECTAMENTE
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'story-images';

-- 5. VERIFICAR LAS POLÍTICAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 6. MENSAJE DE CONFIRMACIÓN
SELECT 'Storage configurado correctamente para story-images' as status;
