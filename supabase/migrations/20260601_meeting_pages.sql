-- Tabla de páginas de programación de reuniones (estilo HubSpot)
create table if not exists meeting_pages (
  id             uuid primary key default gen_random_uuid(),
  nombre_interno text not null,
  organizador_id uuid references profiles(id) on delete set null,
  titulo_evento  text,
  ubicacion      text,
  video_link     text,
  descripcion    text,
  tipo           text not null default 'personalizada', -- personalizada | grupo | rotacion
  duraciones     integer[] not null default array[30, 60],
  slug           text unique not null,
  activo         boolean not null default true,
  cancelar_reprogramar boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS
alter table meeting_pages enable row level security;

-- Usuarios autenticados pueden leer y escribir sus páginas
create policy "meeting_pages_auth_all"
  on meeting_pages for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Cualquiera puede leer páginas activas (para la página pública de reserva)
create policy "meeting_pages_public_read"
  on meeting_pages for select
  using (activo = true);

-- Tabla de reservas desde la página pública
create table if not exists meeting_bookings (
  id             uuid primary key default gen_random_uuid(),
  page_id        uuid not null references meeting_pages(id) on delete cascade,
  nombre         text not null,
  email          text not null,
  fecha_inicio   timestamptz not null,
  duracion_minutos integer not null,
  notas          text,
  estado         text not null default 'confirmada', -- confirmada | cancelada
  teams_link     text,
  created_at     timestamptz not null default now()
);

alter table meeting_bookings enable row level security;

create policy "meeting_bookings_auth_read"
  on meeting_bookings for select
  using (auth.role() = 'authenticated');

create policy "meeting_bookings_public_insert"
  on meeting_bookings for insert
  with check (true);
