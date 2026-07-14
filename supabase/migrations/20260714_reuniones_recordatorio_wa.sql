-- Agrega columna para rastrear cuándo se envió el recordatorio de WhatsApp 24h antes
ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS recordatorio_wa_enviado timestamptz;
