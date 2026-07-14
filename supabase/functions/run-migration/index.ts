// Función temporal para aplicar DDL migrations via conexión directa a Postgres
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

const DB_URL = Deno.env.get('SUPABASE_DB_URL') || ''

Deno.serve(async () => {
  if (!DB_URL) return new Response(JSON.stringify({ error: 'SUPABASE_DB_URL not set' }), { status: 500 })
  const client = new Client(DB_URL)
  await client.connect()
  try {
    await client.queryArray(`ALTER TABLE reuniones ADD COLUMN IF NOT EXISTS recordatorio_wa_enviado timestamptz;`)
    return new Response(JSON.stringify({ ok: true, msg: 'Migración aplicada' }))
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  } finally {
    await client.end()
  }
})
