-- Migración: Tabla emails_enviados y campos Microsoft en profiles

CREATE TABLE IF NOT EXISTS emails_enviados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  contact_id uuid,
  ejecutivo_id uuid REFERENCES profiles(id),
  para text NOT NULL,
  cc text,
  asunto text NOT NULL,
  cuerpo_html text,
  cuerpo_texto text,
  estado text DEFAULT 'borrador', -- borrador, enviado, error
  provider text DEFAULT 'microsoft', -- microsoft, smtp
  message_id text,
  error_msg text,
  created_at timestamptz DEFAULT now(),
  enviado_at timestamptz
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS microsoft_access_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS microsoft_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS microsoft_email text;
