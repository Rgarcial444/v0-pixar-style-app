"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, CheckCircle2, Database, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SupabaseSetup() {
  const [showInstructions, setShowInstructions] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado", description: "Texto copiado al portapapeles" })
  }

  // Script mínimo que siempre funciona
  const minimalScript = `-- Script MÍNIMO que siempre funciona
-- Solo crea las columnas básicas necesarias

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar RLS para evitar problemas
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Verificar que se creó
SELECT 'Tabla básica creada correctamente' as status;`

  // Script completo con imágenes
  const completeScript = `-- Script COMPLETO con soporte para imágenes
-- Incluye todas las columnas

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  image_type TEXT DEFAULT 'image/jpeg'
);

-- Crear índices
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON stories(created_at DESC);

-- Deshabilitar RLS para evitar problemas
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- Crear bucket para imágenes (opcional)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('story-images', 'story-images', true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Verificar que se creó
SELECT 'Tabla completa creada correctamente' as status;`

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-orange-600" />
          Configuración adaptativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <Zap className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Código adaptativo:</strong> El código ahora detecta automáticamente qué columnas existen y se
            adapta. Puedes usar cualquier script.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowInstructions(!showInstructions)} variant="outline">
            {showInstructions ? "Ocultar" : "Mostrar"} opciones
          </Button>
          <Button
            onClick={() => window.open("https://supabase.com/dashboard/project/lqzoeqxezcadhezhzqgo/sql", "_blank")}
            className="bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Editor SQL
          </Button>
        </div>

        {showInstructions && (
          <div className="space-y-4 p-4 bg-white rounded-lg border">
            <h3 className="font-semibold text-lg">Elige una opción:</h3>

            <div className="space-y-6">
              <div className="border rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-green-800 mb-2">
                  OPCIÓN A: Script mínimo (recomendado si tienes dudas)
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  Solo crea las columnas básicas. Los cuentos se guardarán sin imágenes pero funcionará 100%.
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
                    {minimalScript}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(minimalScript)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-2">OPCIÓN B: Script completo (recomendado)</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Incluye soporte completo para imágenes. Si falla, usa la Opción A.
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-blue-400 p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
                    {completeScript}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(completeScript)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Instrucciones:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                  <li>Elige UNA de las opciones de arriba</li>
                  <li>Copia el script correspondiente</li>
                  <li>Pégalo en el editor SQL de Supabase</li>
                  <li>Haz clic en "Run"</li>
                  <li>Recarga esta página</li>
                </ol>
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>¡Ahora es a prueba de fallos!</strong> El código detecta automáticamente qué columnas existen y
                funciona con cualquier estructura de tabla.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
