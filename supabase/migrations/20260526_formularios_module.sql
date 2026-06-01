-- Migración: Módulo de Formularios
-- Ejecutar en Supabase SQL Editor o via CLI

-- Asegurar estructura correcta en formularios
ALTER TABLE formularios ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE formularios ADD COLUMN IF NOT EXISTS campos jsonb DEFAULT '[]';
ALTER TABLE formularios ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}';
ALTER TABLE formularios ADD COLUMN IF NOT EXISTS origen_lead text DEFAULT 'web';
ALTER TABLE formularios ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE formularios ADD COLUMN IF NOT EXISTS total_respuestas integer DEFAULT 0;

-- Tabla de respuestas (crear si no existe, luego agregar columnas)
CREATE TABLE IF NOT EXISTS formulario_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE formulario_respuestas ADD COLUMN IF NOT EXISTS formulario_slug text;
ALTER TABLE formulario_respuestas ADD COLUMN IF NOT EXISTS datos jsonb;
ALTER TABLE formulario_respuestas ADD COLUMN IF NOT EXISTS ip text;
ALTER TABLE formulario_respuestas ADD COLUMN IF NOT EXISTS created_lead_id uuid;

-- Índices
CREATE INDEX IF NOT EXISTS idx_formularios_slug ON formularios(slug);
CREATE INDEX IF NOT EXISTS idx_formulario_respuestas_slug ON formulario_respuestas(formulario_slug);
