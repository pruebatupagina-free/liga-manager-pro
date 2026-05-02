const https = require('https')

exports.sendPasswordReset = async (email, resetUrl) => {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY not configured')

  const body = JSON.stringify({
    sender: {
      name: 'LigaManager Pro',
      email: process.env.EMAIL_FROM || 'eduardoc.sistemas@gmail.com',
    },
    to: [{ email }],
    subject: 'Recuperar contraseña — LigaManager Pro',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#16a34a">LigaManager Pro</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el botón para crear una nueva contraseña. El enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
          Restablecer contraseña
        </a>
        <p style="font-size:12px;color:#666">Si no solicitaste esto, ignora este mensaje.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#999">LigaManager Pro — Gestión de ligas amateur</p>
      </div>
    `,
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data)
          } else {
            reject(new Error(`Brevo API error: ${res.statusCode} ${data}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Brevo API request timed out'))
    })
    req.write(body)
    req.end()
  })
}
