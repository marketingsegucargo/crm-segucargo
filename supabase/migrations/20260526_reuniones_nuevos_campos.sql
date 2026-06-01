-- Migración: Nuevos campos para tabla reuniones
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS lead_id uuid;
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS contact_id uuid;
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS ejecutivo_id uuid REFERENCES profiles(id);
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS teams_link text;
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS duracion_minutos integer DEFAULT 60;
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS participantes jsonb DEFAULT '[]';
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS recordatorio_enviado boolean DEFAULT false;
