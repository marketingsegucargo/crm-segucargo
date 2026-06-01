// Integración con Microsoft Graph API para envío de correo y Teams

const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string | undefined
const REDIRECT_URI = `${window.location.origin}/oauth/microsoft/callback`

/**
 * Envía un correo usando Microsoft Graph API (OAuth2 Bearer Token).
 */
export async function sendEmailViaMicrosoft(params: {
  to: string
  cc?: string
  subject: string
  body: string
  accessToken: string
}): Promise<{ ok: boolean; error?: string }> {
  const toRecipients = params.to.split(',').map(addr => ({
    emailAddress: { address: addr.trim() },
  }))

  const ccRecipients = params.cc
    ? params.cc.split(',').map(addr => ({
        emailAddress: { address: addr.trim() },
      }))
    : []

  const message: Record<string, unknown> = {
    subject: params.subject,
    body: { contentType: 'HTML', content: params.body },
    toRecipients,
  }
  if (ccRecipients.length > 0) message.ccRecipients = ccRecipients

  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/**
 * Inicia el flujo OAuth de Microsoft para obtener acceso a Mail.Send.
 * Redirige al usuario a la página de autorización de Microsoft.
 */
export function iniciarOAuthMicrosoft() {
  if (!MICROSOFT_CLIENT_ID) {
    alert(
      'Falta la variable VITE_MICROSOFT_CLIENT_ID en el archivo .env.\n' +
        'Regístrala en portal.azure.com y agrega el Client ID.'
    )
    return
  }

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'Mail.Send offline_access User.Read',
    response_mode: 'query',
  })

  window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Genera un link de Teams para llamada ad-hoc con los participantes dados.
 */
export function generarLinkTeamsAdhoc(emails: string[]): string {
  const usuarios = emails.map(encodeURIComponent).join(',')
  return `https://teams.microsoft.com/l/call/0/0?users=${usuarios}`
}
