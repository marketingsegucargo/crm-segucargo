import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SubmitPayload {
  slug: string
  datos: Record<string, string | boolean>
}

interface CampoFormulario {
  id: string
  tipo: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox'
  label: string
  placeholder?: string
  requerido: boolean
  opciones?: string[]
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body: SubmitPayload = await req.json()
    const { slug, datos } = body

    if (!slug || !datos) {
      return new Response(
        JSON.stringify({ error: 'slug y datos son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Buscar el formulario por slug
    const { data: formulario, error: formError } = await supabase
      .from('formularios')
      .select('*')
      .eq('slug', slug)
      .eq('activo', true)
      .single()

    if (formError || !formulario) {
      return new Response(
        JSON.stringify({ error: 'Formulario no encontrado o inactivo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Obtener IP del cliente
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || null

    // 3. Mapear campos a datos de lead
    const campos: CampoFormulario[] = formulario.campos || []

    let nombre: string | null = null
    let email: string | null = null
    let telefono: string | null = null

    for (const campo of campos) {
      const valor = datos[campo.id]
      if (typeof valor !== 'string' || !valor) continue

      const labelLower = campo.label.toLowerCase()
      const tipoField = campo.tipo

      if (!nombre && (labelLower.includes('nombre') || labelLower.includes('name'))) {
        nombre = valor
      }
      if (!email && (tipoField === 'email' || labelLower.includes('email') || labelLower.includes('correo'))) {
        email = valor
      }
      if (!telefono && (tipoField === 'tel' || labelLower.includes('teléfono') || labelLower.includes('telefono') || labelLower.includes('phone'))) {
        telefono = valor
      }
    }

    // Fallback: si no detectó nombre, usar el primer campo de texto
    if (!nombre) {
      const primerTexto = campos.find(c => c.tipo === 'text')
      if (primerTexto && datos[primerTexto.id]) {
        nombre = String(datos[primerTexto.id])
      }
    }

    // 4. Crear lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nombre: nombre || 'Sin nombre',
        email: email || null,
        telefono: telefono || null,
        origen: formulario.origen_lead || 'web',
        estado: 'nuevo',
        notas: `Lead generado desde formulario: ${formulario.nombre} (${slug})`,
      })
      .select('id')
      .single()

    if (leadError) {
      console.error('Error creando lead:', leadError)
      // No bloqueamos — registramos igual la respuesta
    }

    // 5. Insertar respuesta del formulario
    const { error: respError } = await supabase
      .from('formulario_respuestas')
      .insert({
        formulario_id: formulario.id,
        formulario_slug: slug,
        datos,
        ip,
        created_lead_id: lead?.id || null,
      })

    if (respError) {
      console.error('Error guardando respuesta:', respError)
    }

    // 6. Incrementar contador de respuestas
    await supabase.rpc('increment_form_responses', { form_id: formulario.id }).catch(() => {
      // Si no existe la función RPC, actualizar manualmente
      supabase
        .from('formularios')
        .update({ total_respuestas: (formulario.total_respuestas || 0) + 1 })
        .eq('id', formulario.id)
    })

    return new Response(
      JSON.stringify({ success: true, lead_id: lead?.id || null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en submit-form:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
