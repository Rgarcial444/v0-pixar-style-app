-- SCRIPT DE VERIFICACIÓN - Ejecuta esto DESPUÉS del script anterior
-- Para comprobar que todo está funcionando

-- 1. Verificar que el bucket existe
SELECT 
  'Bucket exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES ✅' ELSE 'NO ❌' END as bucket_status
FROM storage.buckets 
WHERE id = 'story-images';

-- 2. Verificar configuración del bucket
SELECT 
  id as bucket_id,
  name,
  public as is_public,
  file_size_limit / 1024 / 1024 as max_size_mb,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'story-images';

-- 3. Verificar políticas de storage
SELECT 
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions' 
  END as conditions
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%images%';

-- 4. Verificar tabla stories
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'stories' 
  AND column_name IN ('image_url', 'image_type')
ORDER BY column_name;

-- 5. Contar cuentos existentes
SELECT 
  COUNT(*) as total_stories,
  COUNT(image_url) as stories_with_images
FROM stories;

-- 6. Estado final
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE id = 'story-images') > 0 
    THEN '✅ STORAGE CONFIGURADO CORRECTAMENTE'
    ELSE '❌ STORAGE NO CONFIGURADO'
  END as final_status;
