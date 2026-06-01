-- Secuencias de correo
CREATE TABLE IF NOT EXISTS secuencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  estado text DEFAULT 'borrador', -- borrador, activa, pausada
  tipo_trigger text DEFAULT 'manual', -- manual, estado_lead
  trigger_estado text, -- estado del lead que activa la secuencia
  pasos jsonb DEFAULT '[]', -- array de pasos
  total_inscritos integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Plantillas de correo
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  asunto text NOT NULL,
  cuerpo_html text NOT NULL,
  variables jsonb DEFAULT '[]', -- variables disponibles: {{nombre}}, {{empresa}}, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inscripciones en secuencias
CREATE TABLE IF NOT EXISTS secuencia_inscritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secuencia_id uuid REFERENCES secuencias(id),
  lead_id uuid,
  contact_id uuid,
  paso_actual integer DEFAULT 0,
  estado text DEFAULT 'activo', -- activo, completado, cancelado
  fecha_inicio timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Plantillas predefinidas para carga internacional
INSERT INTO email_templates (nombre, asunto, cuerpo_html, variables) VALUES
(
  'Bienvenida - Nuevo Lead',
  'Bienvenido/a a Segucargo, {{nombre}}',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E5D; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Segucargo</h1>
    <p style="color: #a0b4d6; margin: 5px 0 0 0;">Soluciones de Carga Internacional</p>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Estimado/a <strong>{{nombre}}</strong>,</p>
    <p>Es un placer darle la bienvenida a Segucargo. Somos una empresa especializada en soluciones de carga internacional — marítima, aérea y terrestre — con amplia experiencia en importación desde China y gestión de proyectos especiales.</p>
    <p>Quedamos a su entera disposición para asesorarle en su próxima operación de comercio exterior.</p>
    <p>No dude en contactarnos ante cualquier consulta.</p>
    <br>
    <p>Saludos cordiales,</p>
    <p><strong>Equipo Segucargo</strong><br>
    <a href="mailto:contacto@segucargo.cl" style="color: #001E5D;">contacto@segucargo.cl</a><br>
    <a href="https://segucargo.cl" style="color: #001E5D;">www.segucargo.cl</a></p>
  </div>
</body>
</html>',
  '["nombre", "apellido", "empresa", "email", "telefono"]'
),
(
  'Solicitud de Detalle de Carga',
  'Necesitamos más información sobre su carga — {{empresa}}',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E5D; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Segucargo</h1>
    <p style="color: #a0b4d6; margin: 5px 0 0 0;">Soluciones de Carga Internacional</p>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Estimado/a <strong>{{nombre}}</strong>,</p>
    <p>Para poder preparar una cotización precisa y adaptada a sus necesidades, le solicitamos nos proporcione los siguientes detalles sobre su carga:</p>
    <ul style="padding-left: 20px; line-height: 1.8;">
      <li>Origen y destino de la carga</li>
      <li>Tipo de mercancía (descripción, clasificación arancelaria si la conoce)</li>
      <li>Peso bruto y volumen estimado (m³)</li>
      <li>Número de bultos o pallets</li>
      <li>Incoterm preferido (EXW, FOB, CIF, DDP, etc.)</li>
      <li>Fecha estimada de embarque</li>
      <li>¿Requiere seguro de carga?</li>
    </ul>
    <p>Con esta información podremos entregarle una propuesta competitiva a la brevedad.</p>
    <br>
    <p>Saludos cordiales,</p>
    <p><strong>Equipo Segucargo</strong><br>
    <a href="mailto:contacto@segucargo.cl" style="color: #001E5D;">contacto@segucargo.cl</a></p>
  </div>
</body>
</html>',
  '["nombre", "apellido", "empresa", "email", "telefono"]'
),
(
  'Seguimiento - Sin Respuesta',
  'Seguimiento a su consulta — Segucargo',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E5D; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Segucargo</h1>
    <p style="color: #a0b4d6; margin: 5px 0 0 0;">Soluciones de Carga Internacional</p>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Estimado/a <strong>{{nombre}}</strong>,</p>
    <p>Me permito contactarle nuevamente, ya que hace unos días le enviamos información sobre nuestros servicios de carga internacional y aún no hemos recibido respuesta.</p>
    <p>Entendemos que los tiempos pueden ser ajustados, por ello queremos asegurarnos de que recibió nuestro mensaje y de que no tiene ninguna consulta pendiente que podamos resolver.</p>
    <p>Si en este momento no es el momento adecuado, con gusto podemos agendar una llamada en la fecha que mejor le convenga.</p>
    <br>
    <p>Saludos cordiales,</p>
    <p><strong>Equipo Segucargo</strong><br>
    <a href="mailto:contacto@segucargo.cl" style="color: #001E5D;">contacto@segucargo.cl</a></p>
  </div>
</body>
</html>',
  '["nombre", "apellido", "empresa", "email", "telefono"]'
),
(
  'Cotización Lista',
  'Su cotización de carga está lista — Folio #{{folio}}',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E5D; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Segucargo</h1>
    <p style="color: #a0b4d6; margin: 5px 0 0 0;">Soluciones de Carga Internacional</p>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Estimado/a <strong>{{nombre}}</strong>,</p>
    <p>Nos complace informarle que su cotización de carga ha sido preparada y está lista para su revisión.</p>
    <div style="background: #f0f4ff; border-left: 4px solid #001E5D; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold; color: #001E5D;">Detalles de la cotización:</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">La propuesta adjunta incluye tarifas, tiempos de tránsito y condiciones del servicio.</p>
    </div>
    <p>Le invitamos a revisar la cotización adjunta y a contactarnos ante cualquier consulta o ajuste que requiera.</p>
    <p>Esta cotización tiene una vigencia de <strong>7 días hábiles</strong>.</p>
    <br>
    <p>Saludos cordiales,</p>
    <p><strong>Equipo Segucargo</strong><br>
    <a href="mailto:contacto@segucargo.cl" style="color: #001E5D;">contacto@segucargo.cl</a></p>
  </div>
</body>
</html>',
  '["nombre", "apellido", "empresa", "email", "telefono", "folio"]'
),
(
  'Cierre de Negocio',
  '¡Bienvenido como cliente de Segucargo, {{empresa}}!',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #001E5D; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Segucargo</h1>
    <p style="color: #a0b4d6; margin: 5px 0 0 0;">Soluciones de Carga Internacional</p>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Estimado/a <strong>{{nombre}}</strong>,</p>
    <p>Es un placer confirmarle que hemos recibido su aprobación y que nos encontramos listos para dar inicio a la operación de carga.</p>
    <p>A continuación, los próximos pasos:</p>
    <ol style="padding-left: 20px; line-height: 1.8;">
      <li>Nuestro ejecutivo se pondrá en contacto para coordinar la documentación necesaria.</li>
      <li>Recibirá una confirmación formal de la operación con los datos de embarque.</li>
      <li>Tendrá acceso a seguimiento en tiempo real de su carga.</li>
    </ol>
    <p>Gracias por confiar en Segucargo. Trabajaremos con el máximo compromiso para asegurar que su carga llegue en tiempo y forma.</p>
    <br>
    <p>Saludos cordiales,</p>
    <p><strong>Equipo Segucargo</strong><br>
    <a href="mailto:contacto@segucargo.cl" style="color: #001E5D;">contacto@segucargo.cl</a><br>
    <a href="https://segucargo.cl" style="color: #001E5D;">www.segucargo.cl</a></p>
  </div>
</body>
</html>',
  '["nombre", "apellido", "empresa", "email", "telefono"]'
);
