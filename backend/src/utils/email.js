const https = require('https')

function sendBrevo(body) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY not configured')
  const payload = JSON.stringify(body)
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 10000,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data)
          else reject(new Error(`Brevo API error: ${res.statusCode} ${data}`))
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Brevo API request timed out')) })
    req.write(payload)
    req.end()
  })
}

exports.sendWelcome = async (email, nombre, loginUrl) => {
  return sendBrevo({
    sender: { name: 'LigaManager Pro', email: process.env.EMAIL_FROM || 'eduardoc.sistemas@gmail.com' },
    to: [{ email }],
    subject: '¡Bienvenido a LigaManager Pro! 🏆',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#16a34a">¡Hola, ${nombre}! 👋</h2>
        <p>Tu cuenta en <strong>LigaManager Pro</strong> está lista.</p>
        <p>Con el <strong>Plan Gratis</strong> puedes:</p>
        <ul style="padding-left:20px;line-height:1.8">
          <li>Crear 1 liga activa</li>
          <li>Hasta 10 equipos y 15 jugadores por equipo</li>
          <li>Jornadas automáticas, cobros y estadísticas</li>
          <li>Página pública de tu liga</li>
          <li>Live scoring en tiempo real</li>
        </ul>
        <a href="${loginUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
          Ir a mi dashboard →
        </a>
        <p style="font-size:13px;color:#555">¿Quieres más ligas o funciones avanzadas? Escríbenos y te activamos el plan que necesitas.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:12px;color:#999">LigaManager Pro — Gestión de ligas amateur</p>
      </div>
    `,
  })
}

exports.sendPasswordReset = async (email, resetUrl) => {
  return sendBrevo({
    sender: { name: 'LigaManager Pro', email: process.env.EMAIL_FROM || 'eduardoc.sistemas@gmail.com' },
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
}
