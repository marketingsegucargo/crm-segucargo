import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface CampoFormulario {
  id: string
  tipo: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox'
  label: string
  placeholder?: string
  requerido: boolean
  opciones?: string[]
}

interface EmbedCodeModalProps {
  formulario: {
    id: string
    nombre: string
    slug: string
    campos: CampoFormulario[]
    origen_lead: string
  }
  onClose: () => void
}

function generateEmbedCode(nombre: string, slug: string, campos: CampoFormulario[]): string {
  const fieldsJson = JSON.stringify(campos)
  return `<!-- Formulario Segucargo - ${nombre} -->
<div id="segucargo-form-${slug}" style="font-family: Arial, sans-serif; max-width: 480px;"></div>
<script>
(function() {
  var slug = '${slug}';
  var fields = ${fieldsJson};
  var container = document.getElementById('segucargo-form-' + slug);
  if (!container) return;

  // Estilos base
  var style = document.createElement('style');
  style.textContent = [
    '#segucargo-form-${slug} form { display: flex; flex-direction: column; gap: 14px; }',
    '#segucargo-form-${slug} label { display: block; font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px; }',
    '#segucargo-form-${slug} input, #segucargo-form-${slug} select, #segucargo-form-${slug} textarea { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; color: #111827; box-sizing: border-box; outline: none; transition: border-color 0.2s; }',
    '#segucargo-form-${slug} input:focus, #segucargo-form-${slug} select:focus, #segucargo-form-${slug} textarea:focus { border-color: #001E5D; }',
    '#segucargo-form-${slug} textarea { resize: vertical; min-height: 80px; }',
    '#segucargo-form-${slug} .sg-submit { background: #001E5D; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s; }',
    '#segucargo-form-${slug} .sg-submit:hover { background: #002f8a; }',
    '#segucargo-form-${slug} .sg-submit:disabled { opacity: 0.6; cursor: not-allowed; }',
    '#segucargo-form-${slug} .sg-msg { padding: 10px 14px; border-radius: 6px; font-size: 14px; text-align: center; }',
    '#segucargo-form-${slug} .sg-success { background: #dcfce7; color: #166534; }',
    '#segucargo-form-${slug} .sg-error { background: #fee2e2; color: #991b1b; }',
    '#segucargo-form-${slug} .sg-required { color: #dc2626; }'
  ].join('\\n');
  document.head.appendChild(style);

  // Construir formulario
  var form = document.createElement('form');
  form.noValidate = true;

  fields.forEach(function(f) {
    var group = document.createElement('div');
    var label = document.createElement('label');
    label.innerHTML = f.label + (f.requerido ? ' <span class="sg-required">*</span>' : '');

    var input;
    if (f.tipo === 'select') {
      input = document.createElement('select');
      var defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = 'Seleccionar...';
      input.appendChild(defaultOpt);
      (f.opciones || []).forEach(function(op) {
        var opt = document.createElement('option');
        opt.value = op;
        opt.textContent = op;
        input.appendChild(opt);
      });
    } else if (f.tipo === 'textarea') {
      input = document.createElement('textarea');
      if (f.placeholder) input.placeholder = f.placeholder;
    } else if (f.tipo === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.style.width = 'auto';
      input.style.marginRight = '8px';
      label.insertBefore(input, label.firstChild);
      group.appendChild(label);
      form.appendChild(group);
      input.dataset.id = f.id;
      input.dataset.tipo = f.tipo;
      input.dataset.requerido = f.requerido ? '1' : '0';
      return;
    } else {
      input = document.createElement('input');
      input.type = f.tipo;
      if (f.placeholder) input.placeholder = f.placeholder;
    }

    input.dataset.id = f.id;
    input.dataset.tipo = f.tipo;
    input.dataset.requerido = f.requerido ? '1' : '0';

    group.appendChild(label);
    group.appendChild(input);
    form.appendChild(group);
  });

  var submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'sg-submit';
  submitBtn.textContent = 'Enviar';
  form.appendChild(submitBtn);

  var msgDiv = document.createElement('div');
  msgDiv.style.display = 'none';
  form.appendChild(msgDiv);

  container.appendChild(form);

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var datos = {};
    var valid = true;

    form.querySelectorAll('[data-id]').forEach(function(el) {
      var id = el.dataset.id;
      var tipo = el.dataset.tipo;
      var requerido = el.dataset.requerido === '1';
      var value = tipo === 'checkbox' ? el.checked : el.value.trim();
      if (requerido && !value) { valid = false; el.style.borderColor = '#dc2626'; }
      else { el.style.borderColor = ''; }
      datos[id] = value;
    });

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    msgDiv.style.display = 'none';

    fetch('https://nfycpsmixjuhdjcvfydz.supabase.co/functions/v1/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, datos: datos })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        msgDiv.className = 'sg-msg sg-success';
        msgDiv.textContent = '¡Gracias! Tu mensaje fue enviado correctamente.';
        msgDiv.style.display = 'block';
        form.reset();
      } else {
        throw new Error(data.error || 'Error al enviar');
      }
    })
    .catch(function(err) {
      msgDiv.className = 'sg-msg sg-error';
      msgDiv.textContent = 'Error al enviar el formulario. Intenta nuevamente.';
      msgDiv.style.display = 'block';
    })
    .finally(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar';
    });
  });
})();
<\/script>`
}

export default function EmbedCodeModal({ formulario, onClose }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState(false)

  const code = generateEmbedCode(formulario.nombre, formulario.slug, formulario.campos)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Código para incrustar</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Formulario: <span className="font-medium text-[#001E5D]">{formulario.nombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 pt-4">
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            Pega este código en el HTML de tu landing page donde quieras que aparezca el formulario.
            Cuando alguien lo complete, se creará automáticamente un lead en el CRM.
          </p>
        </div>

        {/* Code block */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="relative h-full">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs leading-relaxed overflow-auto h-full font-mono whitespace-pre-wrap break-all">
              <code>{code}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-400 font-mono">
            slug: {formulario.slug}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#001E5D] hover:bg-[#002f8a] rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar código
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
