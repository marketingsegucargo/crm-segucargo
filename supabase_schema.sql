-- ============================================================
-- SEGUCARGO CRM — Esquema SQL para Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM TYPES ───────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'ejecutivo', 'operaciones', 'gerencia');
CREATE TYPE lead_status AS ENUM (
  'nuevo','contactado','en_levantamiento','cotizacion_solicitada',
  'cotizacion_enviada','seguimiento','negociacion','ganado','perdido'
);
CREATE TYPE service_type AS ENUM (
  'maritimo','aereo','terrestre','importacion_china','mudanza',
  'freight_forwarder','carga_proyecto','otro'
);
CREATE TYPE lead_origin AS ENUM (
  'google_ads','meta_ads','linkedin','whatsapp','web','referido','email','organico'
);
CREATE TYPE quote_status AS ENUM ('borrador','enviada','aprobada','rechazada','vencida');
CREATE TYPE activity_type AS ENUM (
  'llamada','email','whatsapp','reunion','nota','tarea','cambio_estado','cotizacion_enviada'
);
CREATE TYPE operation_status AS ENUM (
  'pendiente_documentacion','en_coordinacion','reservado',
  'en_transito','en_destino','entregado','finalizado'
);
CREATE TYPE lost_reason AS ENUM (
  'precio','no_responde','otro_proveedor','servicio_no_disponible','sin_presupuesto','otro'
);

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  nombre       TEXT NOT NULL,
  apellido     TEXT NOT NULL,
  rol          user_role NOT NULL DEFAULT 'ejecutivo',
  telefono     TEXT,
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE((NEW.raw_user_meta_data->>'rol')::user_role, 'ejecutivo')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── CONTACTS ─────────────────────────────────────────────────────────────────

CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  apellido     TEXT NOT NULL,
  empresa      TEXT,
  email        TEXT,
  telefono     TEXT,
  cargo        TEXT,
  pais         TEXT,
  ciudad       TEXT,
  origen       lead_origin NOT NULL DEFAULT 'web',
  observaciones TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_empresa ON contacts(empresa);
CREATE INDEX idx_contacts_email   ON contacts(email);

-- ─── LEADS ────────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id           UUID REFERENCES contacts(id) ON DELETE SET NULL,
  nombre               TEXT NOT NULL,
  empresa              TEXT,
  email                TEXT,
  telefono             TEXT,
  servicio             service_type NOT NULL DEFAULT 'otro',
  origen               lead_origin NOT NULL DEFAULT 'web',
  origen_geo           TEXT,
  destino_geo          TEXT,
  pais_origen          TEXT,
  pais_destino         TEXT,
  tipo_carga           TEXT,
  volumen_estimado     NUMERIC(12,2),
  peso_estimado        NUMERIC(12,2),
  incoterm             TEXT,
  presupuesto_estimado NUMERIC(14,2),
  urgencia             TEXT CHECK (urgencia IN ('baja','media','alta')) DEFAULT 'media',
  estado               lead_status NOT NULL DEFAULT 'nuevo',
  ejecutivo_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  probabilidad         INTEGER CHECK (probabilidad BETWEEN 0 AND 100),
  valor_estimado       NUMERIC(14,2),
  proxima_accion       TEXT,
  fecha_proxima_accion DATE,
  observaciones        TEXT,
  motivo_perdida       lost_reason,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_estado       ON leads(estado);
CREATE INDEX idx_leads_ejecutivo_id ON leads(ejecutivo_id);
CREATE INDEX idx_leads_servicio     ON leads(servicio);
CREATE INDEX idx_leads_origen       ON leads(origen);
CREATE INDEX idx_leads_created_at   ON leads(created_at DESC);

-- ─── QUOTES ───────────────────────────────────────────────────────────────────

CREATE TABLE quotes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id              UUID REFERENCES leads(id) ON DELETE SET NULL,
  numero               TEXT NOT NULL UNIQUE,
  cliente              TEXT NOT NULL,
  empresa              TEXT,
  servicio             service_type NOT NULL DEFAULT 'otro',
  origen               TEXT,
  destino              TEXT,
  tipo_transporte      TEXT,
  incoterm             TEXT,
  descripcion_carga    TEXT,
  peso                 NUMERIC(12,2),
  volumen              NUMERIC(12,2),
  bultos               INTEGER,
  moneda               TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD','CLP','EUR')),
  valor_neto           NUMERIC(14,2) NOT NULL DEFAULT 0,
  impuestos            NUMERIC(14,2) DEFAULT 0,
  valor_total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  vigencia             DATE,
  condiciones          TEXT,
  estado               quote_status NOT NULL DEFAULT 'borrador',
  ejecutivo_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  comentarios_internos TEXT,
  fecha_envio          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX idx_quotes_estado  ON quotes(estado);

-- ─── ACTIVITIES ───────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id          UUID REFERENCES leads(id) ON DELETE CASCADE,
  contact_id       UUID REFERENCES contacts(id) ON DELETE CASCADE,
  usuario_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo             activity_type NOT NULL DEFAULT 'nota',
  titulo           TEXT NOT NULL,
  descripcion      TEXT,
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_vencimiento TIMESTAMPTZ,
  completado       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_lead_id    ON activities(lead_id);
CREATE INDEX idx_activities_usuario_id ON activities(usuario_id);
CREATE INDEX idx_activities_fecha      ON activities(fecha DESC);

-- ─── OPERATIONS ───────────────────────────────────────────────────────────────

CREATE TABLE operations (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  cliente                TEXT NOT NULL,
  servicio               service_type NOT NULL,
  origen                 TEXT,
  destino                TEXT,
  estado                 operation_status NOT NULL DEFAULT 'pendiente_documentacion',
  fecha_salida_estimada  DATE,
  fecha_llegada_estimada DATE,
  naviera_aerolinea      TEXT,
  tracking               TEXT,
  responsable_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  observaciones          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operations_lead_id        ON operations(lead_id);
CREATE INDEX idx_operations_responsable_id ON operations(responsable_id);

-- ─── DOCUMENTS ────────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  url          TEXT NOT NULL,
  lead_id      UUID REFERENCES leads(id) ON DELETE CASCADE,
  quote_id     UUID REFERENCES quotes(id) ON DELETE CASCADE,
  operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
  subido_por   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents  ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT rol FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES: todos los autenticados pueden ver, solo admin puede modificar otros
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- CONTACTS: todos los autenticados acceden
CREATE POLICY "contacts_all" ON contacts FOR ALL USING (auth.uid() IS NOT NULL);

-- LEADS: ejecutivo solo ve sus asignados; admin/gerencia ven todos
CREATE POLICY "leads_admin_gerencia" ON leads FOR ALL
  USING (get_user_role() IN ('admin','gerencia'));

CREATE POLICY "leads_ejecutivo_select" ON leads FOR SELECT
  USING (get_user_role() = 'ejecutivo' AND ejecutivo_id = auth.uid());

CREATE POLICY "leads_ejecutivo_update" ON leads FOR UPDATE
  USING (get_user_role() = 'ejecutivo' AND ejecutivo_id = auth.uid());

CREATE POLICY "leads_ejecutivo_insert" ON leads FOR INSERT
  WITH CHECK (get_user_role() = 'ejecutivo');

CREATE POLICY "leads_operaciones_select" ON leads FOR SELECT
  USING (get_user_role() = 'operaciones');

-- QUOTES: similar a leads
CREATE POLICY "quotes_admin_gerencia" ON quotes FOR ALL
  USING (get_user_role() IN ('admin','gerencia'));

CREATE POLICY "quotes_ejecutivo" ON quotes FOR ALL
  USING (get_user_role() = 'ejecutivo' AND ejecutivo_id = auth.uid());

CREATE POLICY "quotes_operaciones_select" ON quotes FOR SELECT
  USING (get_user_role() = 'operaciones');

-- ACTIVITIES: el usuario ve las suyas; admin/gerencia todas
CREATE POLICY "activities_own" ON activities FOR ALL
  USING (usuario_id = auth.uid() OR get_user_role() IN ('admin','gerencia'));

-- OPERATIONS: operaciones y admin
CREATE POLICY "operations_all" ON operations FOR ALL
  USING (get_user_role() IN ('admin','gerencia','operaciones'));

-- DOCUMENTS: todos los autenticados
CREATE POLICY "documents_all" ON documents FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── STORAGE ──────────────────────────────────────────────────────────────────

-- Crear bucket en Supabase Storage Dashboard: "segucargo-docs" (private)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('segucargo-docs', 'segucargo-docs', false);

-- ─── DATOS DE PRUEBA ──────────────────────────────────────────────────────────

-- NOTA: Primero crea un usuario desde Supabase Auth, luego ejecuta esto con su UUID real.
-- Reemplaza 'TU-UUID-AQUI' con el UUID del usuario administrador.

/*
UPDATE profiles
SET nombre = 'Admin', apellido = 'Segucargo', rol = 'admin'
WHERE id = 'TU-UUID-AQUI';

INSERT INTO contacts (nombre, apellido, empresa, email, telefono, cargo, pais, ciudad, origen) VALUES
('Carlos', 'Rodríguez', 'Importaciones Chile SA', 'carlos@importaciones.cl', '+56912345678', 'Gerente Comercial', 'Chile', 'Santiago', 'web'),
('María', 'González', 'TechCorp SpA', 'maria@techcorp.cl', '+56923456789', 'Jefa de Operaciones', 'Chile', 'Valparaíso', 'google_ads'),
('Juan', 'Martínez', 'Mudanzas Internacionales Ltda', 'juan@mudanzas.cl', '+56934567890', 'Director', 'Chile', 'Santiago', 'referido'),
('Ana', 'López', 'Exportaciones del Sur', 'ana@exportsur.cl', '+56945678901', 'Coordinadora', 'Chile', 'Concepción', 'linkedin'),
('Pedro', 'Silva', 'Global Trade Partners', 'pedro@globaltp.com', '+56956789012', 'CEO', 'Chile', 'Santiago', 'meta_ads');

INSERT INTO leads (nombre, empresa, email, telefono, servicio, origen, origen_geo, destino_geo, pais_origen, pais_destino, tipo_carga, peso_estimado, volumen_estimado, valor_estimado, estado, probabilidad) VALUES
('Importación contenedores Shanghai', 'Importaciones Chile SA', 'carlos@importaciones.cl', '+56912345678', 'maritimo', 'web', 'Shanghái, China', 'San Antonio, Chile', 'China', 'Chile', 'Electrónica de consumo', 15000, 45, 28000, 'cotizacion_enviada', 65),
('Carga aérea urgente Miami', 'TechCorp SpA', 'maria@techcorp.cl', '+56923456789', 'aereo', 'google_ads', 'Miami, USA', 'Santiago, Chile', 'USA', 'Chile', 'Equipos tecnológicos', 500, 2.5, 8500, 'negociacion', 80),
('Mudanza internacional Chile-España', 'Mudanzas Internacionales Ltda', 'juan@mudanzas.cl', '+56934567890', 'mudanza', 'referido', 'Santiago, Chile', 'Madrid, España', 'Chile', 'España', 'Enseres domésticos', 3000, 25, 12000, 'seguimiento', 50),
('Freight Forwarder importación recurrente', 'Exportaciones del Sur', 'ana@exportsur.cl', '+56945678901', 'freight_forwarder', 'linkedin', 'Guangzhou, China', 'Valparaíso, Chile', 'China', 'Chile', 'Textiles y confección', 8000, 35, 45000, 'en_levantamiento', 40),
('Transporte terrestre Mendoza-Santiago', 'Global Trade Partners', 'pedro@globaltp.com', '+56956789012', 'terrestre', 'meta_ads', 'Mendoza, Argentina', 'Santiago, Chile', 'Argentina', 'Chile', 'Vinos y alimentos', 12000, 20, 3500, 'nuevo', 20);
*/
