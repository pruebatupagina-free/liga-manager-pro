/**
 * Script Playwright — Documentar flujo de pruebas en Google Docs
 * Usa Chrome Profile 7 (sesión de Google ya iniciada)
 */

const { chromium } = require('./frontend/node_modules/playwright')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

const DOC_URL = 'https://docs.google.com/document/d/1fRUTHb49gadJMWFHOAZkUGuLQovlvT3al9FLQoUAAlw/edit'
const SCREENSHOTS_DIR = path.join(__dirname, 'docs_screenshots')
const API = 'https://liga-manager-pro-production.up.railway.app/api'

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR)

// ─── Helpers ────────────────────────────────────────────────────────────────

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`)
  try {
    await page.screenshot({ path: file, fullPage: false, timeout: 10000 })
    console.log(`  📸 ${name}.png`)
  } catch (e) {
    console.log(`  ⚠️ screenshot ${name} omitido (${e.message.slice(0, 40)})`)
  }
}

// Escribe texto en el doc con Ctrl+A protegido — no borra, sólo inserta
async function type(page, text) {
  await page.keyboard.insertText(text)
  await wait(80)
}

// Título (Heading 1)
async function heading1(page, text) {
  await applyStyle(page, 'Heading 1')
  await type(page, text)
  await page.keyboard.press('Enter')
  await applyStyle(page, 'Normal text')
}

// Título (Heading 2)
async function heading2(page, text) {
  await applyStyle(page, 'Heading 2')
  await type(page, text)
  await page.keyboard.press('Enter')
  await applyStyle(page, 'Normal text')
}

// Heading 3
async function heading3(page, text) {
  await applyStyle(page, 'Heading 3')
  await type(page, text)
  await page.keyboard.press('Enter')
  await applyStyle(page, 'Normal text')
}

// Aplicar estilo desde el menú de estilos de Google Docs
async function applyStyle(page, styleName) {
  // Usar atajo: Format > Paragraph styles
  // El selector del dropdown de estilos en Google Docs
  try {
    const styleDropdown = page.locator('[aria-label="Styles"]').first()
    if (await styleDropdown.isVisible({ timeout: 1000 })) {
      await styleDropdown.click()
      await wait(300)
      const option = page.locator(`[aria-label="${styleName}"]`).first()
      if (await option.isVisible({ timeout: 1000 })) {
        await option.click()
        await wait(200)
        return
      }
    }
  } catch {}
  // Fallback: usar atajos de teclado
  if (styleName === 'Heading 1') {
    await page.keyboard.press('Control+Alt+1')
  } else if (styleName === 'Heading 2') {
    await page.keyboard.press('Control+Alt+2')
  } else if (styleName === 'Heading 3') {
    await page.keyboard.press('Control+Alt+3')
  } else {
    await page.keyboard.press('Control+Alt+0')
  }
  await wait(150)
}

async function bold(page, text) {
  await page.keyboard.press('Control+b')
  await type(page, text)
  await page.keyboard.press('Control+b')
}

async function newline(page, n = 1) {
  for (let i = 0; i < n; i++) await page.keyboard.press('Enter')
}

async function bullet(page, text) {
  await page.keyboard.press('Control+Shift+8') // bullet list
  await type(page, text)
  await page.keyboard.press('Enter')
}

async function endBullet(page) {
  await page.keyboard.press('Enter') // salir de lista
}

// Línea horizontal (3 guiones + Enter en Google Docs)
async function separator(page) {
  await type(page, '---')
  await page.keyboard.press('Enter')
  await wait(200)
}

// Pega un bloque de código como texto monoespacio
async function codeBlock(page, text) {
  // Google Docs no tiene bloque de código nativo vía teclado simple
  // Lo insertamos como texto con formato monospace via Courier New
  await page.keyboard.press('Control+Alt+0') // Normal text primero
  await wait(100)
  // Marcar como monospace cambiando fuente (no disponible fácilmente vía atajos)
  // Insertamos simplemente con indentación
  const lines = text.split('\n')
  for (const line of lines) {
    await type(page, '    ' + line)
    await page.keyboard.press('Enter')
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('🚀 Conectando a Chrome (Profile 7) vía CDP...')

  // Chrome ya está corriendo con --remote-debugging-port=9222
  const browser = await chromium.connectOverCDP('http://localhost:9222')
  const contexts = browser.contexts()
  const ctx = contexts[0]
  const pages = ctx.pages()
  const page = pages.length > 0 ? pages[0] : await ctx.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })

  // ── Abrir Google Doc ──────────────────────────────────────────────────────
  console.log('📄 Abriendo Google Doc...')
  await page.goto(DOC_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await wait(3000)
  await screenshot(page, '00-doc-abierto')

  // Seleccionar todo el contenido existente y borrarlo para empezar limpio
  console.log('🧹 Limpiando documento...')
  await page.keyboard.press('Control+a')
  await wait(300)
  await page.keyboard.press('Delete')
  await wait(500)

  // Clic en el body del doc para asegurar el foco
  try {
    await page.locator('.kix-appview-editor').click()
    await wait(300)
  } catch {
    await page.mouse.click(720, 400)
    await wait(300)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTADA
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Escribiendo portada...')

  await heading1(page, 'Liga Manager Pro — Manual de Flujo de Pruebas')
  await type(page, 'Versión de prueba: AMC Sport Center (cliente Elite)')
  await newline(page)
  await type(page, 'Fecha: 2026-05-03')
  await newline(page)
  await type(page, 'API: https://liga-manager-pro-production.up.railway.app/api')
  await newline(page, 2)
  await separator(page)

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 1 — CREDENCIALES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 1: Credenciales...')

  await heading2(page, '1. Credenciales del sistema de pruebas')

  await heading3(page, '1.1 Superadmin (LigaManagerPro)')
  await type(page, 'Email: admin@ligamanager.pro')
  await newline(page)
  await type(page, 'Password: Admin2026!Liga')
  await newline(page)
  await type(page, 'Rol: superadmin')
  await newline(page, 2)

  await heading3(page, '1.2 Admin Liga — AMC Sport Center (cliente Elite)')
  await type(page, 'Email: amc@ligamanager.pro')
  await newline(page)
  await type(page, 'Password: AMC2026!Liga')
  await newline(page)
  await type(page, 'Rol: admin_liga | Plan: Elite | Vencimiento: 2027-12-31')
  await newline(page)
  await type(page, 'ID: 69f66a25b7ebdf9d4104adc2')
  await newline(page, 2)

  await heading3(page, '1.3 Dueños de equipo')

  const duenos = [
    { nombre: 'Carlos López', email: 'carlos@dueno.com', pwd: 'Carlos2026!', equipo: 'Águilas FC', id: '69f66f3a24bba379a3fe6769' },
    { nombre: 'Miguel Torres', email: 'miguel@dueno.com', pwd: 'Miguel2026!', equipo: 'Sparta FC', id: '69f66f3b24bba379a3fe676a' },
    { nombre: 'Roberto Sánchez', email: 'roberto@dueno.com', pwd: 'Roberto2026!', equipo: 'Toros Rojos', id: '69f66f3b24bba379a3fe676b' },
    { nombre: 'Ana García', email: 'ana@dueno.com', pwd: 'Ana2026!', equipo: 'Cheetahs', id: '69f66f3c24bba379a3fe676c' },
  ]

  for (const d of duenos) {
    await type(page, `${d.nombre} | ${d.email} / ${d.pwd} | Equipo: ${d.equipo} | ID: ${d.id}`)
    await newline(page)
  }
  await newline(page)

  await heading3(page, '1.4 Vendedor')
  await type(page, 'Negocio: Deportes Elite (uniformes deportivos)')
  await newline(page)
  await type(page, 'Email: deportes.elite@gmail.com')
  await newline(page)
  await type(page, 'Password: Deportes2026!')
  await newline(page)
  await type(page, 'WhatsApp: 5519876543 | ID: 69f66fc7ec08eecf2ba07786')
  await newline(page, 2)

  await heading3(page, '1.5 Liga creada')
  await type(page, 'Nombre: Liga Dominical 2026')
  await newline(page)
  await type(page, 'Slug: liga-dominical-2026')
  await newline(page)
  await type(page, 'liga_id: 69f66a3fb7ebdf9d4104adc3')
  await newline(page)
  await type(page, 'Equipos: 33 (6 fijo + 27 sin fijo) | Jornadas: 12 | Canchas: 2')
  await newline(page)
  await type(page, 'Horario: domingos 09:00–14:00')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '01-credenciales')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 2 — ARQUITECTURA
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 2: Arquitectura...')

  await heading2(page, '2. Arquitectura del sistema')

  await type(page, 'Stack: Node.js 20 + Express + MongoDB Atlas M0 + Railway (backend) + GitHub Pages (frontend React/Vite)')
  await newline(page)
  await type(page, 'Autenticación: JWT (7 días) via Authorization: Bearer <token>')
  await newline(page)
  await type(page, 'Almacenamiento de imágenes: Cloudinary')
  await newline(page)
  await type(page, 'Email transaccional: Brevo HTTP API')
  await newline(page, 2)

  await heading3(page, '2.1 Roles del sistema')
  const roles = [
    ['superadmin', 'Dueño de LigaManagerPro. Crea cuentas de admin_liga, gestiona planes/licencias.'],
    ['admin_liga', 'Dueño del negocio de ligas (ej. AMC Sport Center). Crea ligas, equipos, jornadas, liguilla.'],
    ['dueno_equipo', 'Capitán/dueño de un equipo. Ve su equipo, cobros, publica en red social, DMs con vendedores.'],
    ['vendedor', 'Proveedor externo (uniformes, etc.). Asignado a ligas. Publica posts, recibe mensajes de dueños.'],
  ]
  for (const [rol, desc] of roles) {
    await type(page, `${rol}: ${desc}`)
    await newline(page)
  }
  await newline(page)

  await heading3(page, '2.2 Planes de licencia')
  await type(page, 'basico — hasta 1 liga | pro — hasta 5 ligas | elite — ilimitado + soporte prioritario')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '02-arquitectura')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 3 — FLUJO SUPERADMIN
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 3: Flujo superadmin...')

  await heading2(page, '3. Flujo Superadmin — Crear cliente con plan Elite')

  await type(page, 'El superadmin es el propietario de LigaManagerPro. Su primera acción es dar de alta un cliente (admin_liga) con el plan que corresponda.')
  await newline(page, 2)

  await heading3(page, '3.1 Login como superadmin')
  await type(page, 'POST /api/auth/login')
  await newline(page)
  await type(page, 'Body: { "email": "admin@ligamanager.pro", "password": "Admin2026!Liga" }')
  await newline(page)
  await type(page, 'Respuesta: { token, user: { rol: "superadmin", ... } }')
  await newline(page, 2)

  await heading3(page, '3.2 Crear cuenta de cliente AMC Sport Center')
  await type(page, 'POST /api/auth/register  (Header: Authorization: Bearer <superadmin_token>)')
  await newline(page)
  await type(page, 'Body:')
  await newline(page)
  await type(page, '  nombre: "AMC Sport Center"')
  await newline(page)
  await type(page, '  email: "amc@ligamanager.pro"')
  await newline(page)
  await type(page, '  password: "AMC2026!Liga"')
  await newline(page)
  await type(page, '  username: "amcsportcenter"')
  await newline(page)
  await type(page, '  rol: "admin_liga"')
  await newline(page)
  await type(page, '  plan: "elite"')
  await newline(page)
  await type(page, '  fecha_vencimiento: "2027-12-31"')
  await newline(page)
  await type(page, 'Resultado: Usuario creado con plan elite activo hasta 2027-12-31 ✓')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '03-flujo-superadmin')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 4 — FLUJO ADMIN LIGA
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 4: Flujo admin liga...')

  await heading2(page, '4. Flujo Admin Liga — Configurar liga completa')

  await heading3(page, '4.1 Crear la liga')
  await type(page, 'POST /api/ligas  (Header: AMC token)')
  await newline(page)
  await type(page, 'Configuración de Liga Dominical 2026:')
  await newline(page)
  await type(page, '  nombre: "Liga Dominical", días: ["domingo"], canchas: 2')
  await newline(page)
  await type(page, '  hora_inicio: "09:00", hora_fin: "14:00", duracion_partido: 50 min')
  await newline(page)
  await type(page, '  cuota_inscripcion: $500, costo_arbitraje: $500/partido, pago_fijo_temporada: $1,000')
  await newline(page)
  await type(page, '  num_jornadas: 12, max_equipos_fijos: 6, tiene_liguilla: true')
  await newline(page)
  await type(page, '  liguilla: { num_grupos: 3, clasificados_por_grupo: 8 }')
  await newline(page)
  await type(page, 'liga_id obtenido: 69f66a3fb7ebdf9d4104adc3 ✓')
  await newline(page, 2)

  await heading3(page, '4.2 Crear equipos')
  await type(page, 'POST /api/equipos  (repetido 33 veces)')
  await newline(page)
  await type(page, '6 equipos FIJO (tiene_hora_fija: true) — cobro = $500 inscripción + $1,000 fijo + $500×partidos jugados')
  await newline(page)
  await type(page, '  Águilas FC (09:00), Tigres Dorados (09:30), Lobos Negros (10:00)')
  await newline(page)
  await type(page, '  Toros Rojos (10:30), Leones Azules (11:00), Halcones Verde (11:30)')
  await newline(page)
  await type(page, '27 equipos SIN FIJO — cobro = $500 inscripción + $500×partidos jugados')
  await newline(page)
  await type(page, 'Cálculo matemático validado al final de temporada (12 jornadas):')
  await newline(page)
  await type(page, '  Equipo FIJO:    $500 + $1,000 + ($500 × 12) = $7,500 ✓')
  await newline(page)
  await type(page, '  Equipo sin fijo: $500 + ($500 × 12) = $6,500 ✓')
  await newline(page, 2)

  await heading3(page, '4.3 Crear cuentas de dueños de equipo')
  await type(page, 'POST /api/equipos/:id/cuenta  (admin asigna credenciales al dueño)')
  await newline(page)
  await type(page, 'Este endpoint crea el usuario dueno_equipo y lo vincula al equipo via equipo.dueno_id')
  await newline(page)
  await type(page, '4 cuentas creadas: Carlos (Águilas), Miguel (Sparta), Roberto (Toros), Ana (Cheetahs)')
  await newline(page, 2)

  await heading3(page, '4.4 Crear vendedor externo')
  await type(page, 'POST /api/admin/vendedores  (superadmin o admin_liga)')
  await newline(page)
  await type(page, 'Deportes Elite: uniformes personalizados, asignado a liga_id 69f66a3fb7ebdf9d4104adc3')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '04-flujo-admin-liga')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 5 — JORNADAS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 5: Jornadas...')

  await heading2(page, '5. Flujo Jornadas — Generación y resultados')

  await heading3(page, '5.1 Generar jornadas (round-robin)')
  await type(page, 'POST /api/jornadas/generar  { liga_id, fecha }')
  await newline(page)
  await type(page, 'El algoritmo round-robin genera N-1 rondas para N equipos.')
  await newline(page)
  await type(page, 'Con 33 equipos (impar): 32 rondas × ~16 partidos + 1 BYE por ronda.')
  await newline(page)
  await type(page, 'Se generaron 12 jornadas, una por domingo desde 2026-05-03 hasta 2026-07-19.')
  await newline(page)
  await type(page, 'Partidos por jornada: 16 + 1 BYE = 17 registros (BYE no cuenta en cobros)')
  await newline(page, 2)

  await heading3(page, '5.2 Registrar resultados')
  await type(page, 'PUT /api/partidos/:id/resultado  { goles_local, goles_visitante }')
  await newline(page)
  await type(page, 'Flujo por jornada:')
  await newline(page)
  await type(page, '  1. PUT /api/jornadas/:id  { estado: "en_curso" }')
  await newline(page)
  await type(page, '  2. GET /api/partidos?jornada_id=xxx  → lista partidos')
  await newline(page)
  await type(page, '  3. PUT /api/partidos/:id/resultado  por cada partido no-BYE')
  await newline(page)
  await type(page, '  4. PUT /api/jornadas/:id  { estado: "finalizada" }')
  await newline(page)
  await type(page, 'Resultado: 12 jornadas finalizadas, ~190 resultados registrados ✓')
  await newline(page, 2)

  await heading3(page, '5.3 Estado de jornadas al final de temporada')
  const jornadas = Array.from({ length: 12 }, (_, i) => `J${i+1}: finalizada`)
  await type(page, jornadas.join(' | '))
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '05-jornadas')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 6 — COBROS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 6: Cobros...')

  await heading2(page, '6. Flujo Cobros — Validación matemática')

  await type(page, 'GET /api/cobros?liga_id=xxx  (admin_liga token)')
  await newline(page)
  await type(page, 'La función calcularPagos() calcula en tiempo real el total a pagar por equipo.')
  await newline(page, 2)

  await heading3(page, '6.1 Fórmula de cobros')
  await type(page, 'Inscripción:   $500 (pago único al inicio)')
  await newline(page)
  await type(page, 'Fijo:          $1,000 (solo equipos con tiene_hora_fija=true)')
  await newline(page)
  await type(page, 'Arbitraje:     $500 × número de partidos jugados (excluyendo BYEs y cancelados)')
  await newline(page)
  await type(page, 'Total deuda = suma de todos los conceptos no pagados')
  await newline(page, 2)

  await heading3(page, '6.2 Validación con 12 jornadas completadas')
  await type(page, 'Equipo FIJO (ej. Águilas FC):')
  await newline(page)
  await type(page, '  $500 (inscripción) + $1,000 (fijo) + $500 × 12 partidos = $7,500 ✓')
  await newline(page)
  await type(page, 'Equipo sin fijo (ej. Cóndores):')
  await newline(page)
  await type(page, '  $500 (inscripción) + $500 × 12 partidos = $6,500 ✓')
  await newline(page, 2)

  await heading3(page, '6.3 Registrar pagos')
  await type(page, 'POST /api/cobros/registrar-pago')
  await newline(page)
  await type(page, 'Body: { equipo_id, concepto, monto, metodo_pago, notas }')
  await newline(page)
  await type(page, 'Se registraron pagos parciales y totales para validar el sistema de saldos.')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '06-cobros')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 7 — LIGUILLA
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 7: Liguilla...')

  await heading2(page, '7. Flujo Liguilla — Fase final del torneo')

  await type(page, 'La liguilla es la fase de postemporada. Se configura en la liga con:')
  await newline(page)
  await type(page, '  activa: true, num_grupos: 3, clasificados_por_grupo: 8')
  await newline(page)
  await type(page, 'Total clasificados: 24 equipos (top 8 de cada grupo × 3 grupos)')
  await newline(page, 2)

  await heading3(page, '7.1 Generar liguilla')
  await type(page, 'POST /api/liguilla/generar  { liga_id }')
  await newline(page)
  await type(page, 'El sistema toma la tabla de posiciones final y clasifica los mejores 24 equipos.')
  await newline(page)
  await type(page, 'Criterios de clasificación: Puntos > Diferencia de goles > Goles a favor')
  await newline(page)
  await type(page, 'Crea 3 grupos de 8 equipos (todos contra todos dentro del grupo):')
  await newline(page)
  await type(page, '  Grupo 1: 8 equipos → C(8,2) = 28 partidos')
  await newline(page)
  await type(page, '  Grupo 2: 8 equipos → 28 partidos')
  await newline(page)
  await type(page, '  Grupo 3: 8 equipos → 28 partidos')
  await newline(page)
  await type(page, '  Total fase grupos: 84 partidos ✓')
  await newline(page, 2)

  await heading3(page, '7.2 Registrar resultados de grupos')
  await type(page, 'PUT /api/liguilla/partido/:id/resultado  { goles_local, goles_visitante }')
  await newline(page)
  await type(page, 'Al terminar TODOS los partidos de un grupo, el sistema auto-genera cuartos de final.')
  await newline(page)
  await type(page, 'Resultado: 84/84 partidos jugados → 6 partidos de cuartos generados automáticamente ✓')
  await newline(page, 2)

  await heading3(page, '7.3 Cuartos de final')
  await type(page, 'Cruz cruzada: 1° grupo A vs 2° grupo B, etc.')
  await newline(page)
  await type(page, 'Partidos de cuartos jugados:')
  await newline(page)
  await type(page, '  Sparta FC 2-1 Jaguares FC  → Gana: Sparta FC')
  await newline(page)
  await type(page, '  Centellas 3-2 Piratas       → Gana: Centellas')
  await newline(page)
  await type(page, '  Centellas 1-0 Halcones Verde→ Gana: Centellas')
  await newline(page)
  await type(page, '  Infinity FC 2-0 Jaguares FC → Gana: Infinity FC')
  await newline(page)
  await type(page, '  Infinity FC 3-1 Piratas     → Gana: Infinity FC')
  await newline(page)
  await type(page, '  Sparta FC 1-2 Halcones Verde→ Gana: Halcones Verde')
  await newline(page)
  await type(page, 'Al terminar cuartos → sistema auto-genera semifinales ✓')
  await newline(page, 2)

  await heading3(page, '7.4 Semifinales')
  await type(page, 'Sparta FC 3-1 Centellas     → Gana: Sparta FC')
  await newline(page)
  await type(page, 'Centellas 2-0 Infinity FC   → Gana: Centellas')
  await newline(page)
  await type(page, 'Infinity FC 1-3 Sparta FC   → Gana: Sparta FC')
  await newline(page)
  await type(page, 'Al terminar semis → sistema auto-genera FINAL ✓')
  await newline(page, 2)

  await heading3(page, '7.5 Gran Final 🏆')
  await type(page, 'Sparta FC vs Centellas')
  await newline(page)
  await type(page, 'Resultado: 1-1 (tiempo reglamentario)')
  await newline(page)
  await type(page, 'Definición por penales: Sparta FC 5 - 3 Centellas')
  await newline(page)
  await type(page, 'CAMPEÓN: SPARTA FC 🏆🛡️')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '07-liguilla')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 8 — RED SOCIAL
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 8: Red social...')

  await heading2(page, '8. Flujo Red Social — Posts, likes y mensajería')

  await heading3(page, '8.1 Publicar posts')
  await type(page, 'POST /api/posts  { liga_id, texto }  (Header: Bearer <token del rol correspondiente>)')
  await newline(page)
  await type(page, 'Todos los roles con acceso a la liga pueden publicar:')
  await newline(page)
  await type(page, '  admin_liga → autor_nombre = nombre de la liga')
  await newline(page)
  await type(page, '  dueno_equipo → autor_nombre = nombre del equipo')
  await newline(page)
  await type(page, '  vendedor → autor_nombre = nombre del negocio (require liga en ligas_asignadas)')
  await newline(page, 2)

  await heading3(page, '8.2 Posts publicados en Liga Dominical 2026')
  await type(page, '4 posts de admin_liga (Liga Dominical):')
  await newline(page)
  await type(page, '  • ¡Arrancó la Liga Dominical 2026! 33 equipos inscritos.')
  await newline(page)
  await type(page, '  • TABLA DE POSICIONES — Jornada 6: Sparta FC lidera...')
  await newline(page)
  await type(page, '  • Recordatorio: Mañana domingo es jornada 7...')
  await newline(page)
  await type(page, '  • AVISO IMPORTANTE: Equipos sin fijo deben llegar 15 min antes.')
  await newline(page)
  await type(page, '2 posts de Águilas FC (Carlos López)')
  await newline(page)
  await type(page, '2 posts de Sparta FC (Miguel Torres)')
  await newline(page)
  await type(page, '2 posts de Toros Rojos (Roberto Sánchez)')
  await newline(page)
  await type(page, '2 posts de Cheetahs (Ana García)')
  await newline(page)
  await type(page, '3 posts de Deportes Elite (vendedor)')
  await newline(page)
  await type(page, 'Total: 15 posts activos en el feed ✓')
  await newline(page, 2)

  await heading3(page, '8.3 Likes — GET / PUT /api/posts/:id/like')
  await type(page, 'Funciona como toggle. Llamar dos veces = quitar like.')
  await newline(page)
  await type(page, 'Likes aplicados:')
  await newline(page)
  await type(page, '  • Todos los dueños → 4 posts del admin (4 likes por post)')
  await newline(page)
  await type(page, '  • Admin → 6 posts de dueños')
  await newline(page)
  await type(page, '  • Carlos, Roberto, Ana, Miguel → 3 posts del vendedor (4 likes cada uno)')
  await newline(page)
  await type(page, '  • Carlos → posts de Sparta FC | Ana → posts de Toros Rojos')
  await newline(page)
  await type(page, '  • Deportes Elite → 2 posts del admin')
  await newline(page, 2)

  await heading3(page, '8.4 Mensajería directa (DMs)')
  await type(page, 'Ruta disponible solo para dueno_equipo y vendedor.')
  await newline(page)
  await type(page, 'POST /api/mensajes  { liga_id, vendedor_id, texto }  ← nuevo hilo')
  await newline(page)
  await type(page, 'POST /api/mensajes  { conversacion_id, texto }       ← responder')
  await newline(page)
  await type(page, 'GET  /api/mensajes/conversaciones                    ← listar')
  await newline(page)
  await type(page, 'GET  /api/mensajes/:conversacion_id                  ← leer hilo')
  await newline(page, 2)
  await type(page, '4 conversaciones creadas (1 por equipo ↔ Deportes Elite):')
  await newline(page)
  await type(page, '  • Águilas FC ↔ Deportes Elite  conv: 69f710f24852124cd20dabaa')
  await newline(page)
  await type(page, '  • Cheetahs   ↔ Deportes Elite  conv: 69f710f24852124cd20dabab')
  await newline(page)
  await type(page, '  • Toros Rojos ↔ Deportes Elite conv: 69f710f34852124cd20dabac')
  await newline(page)
  await type(page, '  • Sparta FC  ↔ Deportes Elite  conv: 69f710f34852124cd20dabad')
  await newline(page)
  await type(page, 'Flujo simulado: cotización de uniformes con 3 mensajes por conversación (12 total) ✓')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '08-red-social')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 9 — BUGS ENCONTRADOS Y CORREGIDOS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 9: Bugs...')

  await heading2(page, '9. Bugs encontrados durante las pruebas y sus correcciones')

  const bugs = [
    {
      titulo: 'Bug 1 — BYE matches bloqueaban generación de jornadas (500)',
      desc: 'Con número impar de equipos (33), el round-robin crea un partido "BYE" donde el visitante es null. El modelo Partido tenía equipo_visitante_id: required: true.',
      fix: 'Archivo: backend/src/models/Partido.js\nCambio: equipo_visitante_id: required: true → default: null',
    },
    {
      titulo: 'Bug 2 — Ruta incorrecta para registrar resultados',
      desc: 'Se intentó usar PUT /api/partidos/:id (no existe). La ruta correcta es PUT /api/partidos/:id/resultado.',
      fix: 'No requirió cambio de código. Corrección en el script de pruebas.',
    },
    {
      titulo: 'Bug 3 — Liguilla: "Liguilla no está configurada"',
      desc: 'El controller verificaba liga.configuracion.liguilla.activa pero el schema de Liga solo tenía tiene_liguilla: Boolean (sin el sub-objeto liguilla).',
      fix: 'Archivo: backend/src/models/Liga.js → agregado sub-objeto liguilla { activa, num_grupos, clasificados_por_grupo }\nArchivo: backend/src/controllers/liguillaController.js → fallback: tieneLiguilla = liguilla?.activa || liga.configuracion?.tiene_liguilla',
    },
    {
      titulo: 'Bug 4 — Liguilla generaba 500 silencioso (Atlas M0 no soporta transacciones)',
      desc: 'El controller usaba mongoose.startSession() + session.startTransaction(). MongoDB Atlas M0 no soporta transacciones multi-documento ACID. El proceso crasheaba sin mensaje de error.',
      fix: 'Archivo: backend/src/controllers/liguillaController.js → removido todo el código de session/transaction. Se reemplazó con awaits directos.',
    },
    {
      titulo: 'Bug 5 — LiguillaPartido: fase "grupos" no estaba en el enum',
      desc: 'El enum era [\'cuartos\', \'semis\', \'final\'] pero el controller intentaba crear partidos con fase: "grupos". Faltaba también el campo estado y grupo_id era required.',
      fix: 'Archivo: backend/src/models/LiguillaPartido.js → agregado "grupos" al enum, grupo_id: default null, estado: { enum, default: "programado" }',
    },
    {
      titulo: 'Bug 6 — dueno_id no se guardaba al actualizar equipo',
      desc: 'El array campos en equiposController.update no incluía dueno_id, por lo que el campo se ignoraba silenciosamente.',
      fix: 'Archivo: backend/src/controllers/equiposController.js → agregado: if (liga && req.body.dueno_id !== undefined) equipo.dueno_id = req.body.dueno_id || null',
    },
    {
      titulo: 'Bug 7 — Vendedor no podía publicar posts (403 Sin acceso)',
      desc: 'La función verificarAcceso en postsController solo contemplaba superadmin, admin_liga y dueno_equipo. El rol vendedor no tenía acceso aunque estuviera asignado a la liga.',
      fix: 'Archivo: backend/src/controllers/postsController.js → agregado: if (user.rol === "vendedor") return !!(await Usuario.exists({ _id: user.id, ligas_asignadas: ligaId }))\nArchivo: backend/src/models/Post.js → "vendedor" agregado al enum de autor_tipo',
    },
    {
      titulo: 'Bug 8 — Semis y final no se auto-generaban al terminar cuartos/semis',
      desc: 'El controller solo auto-generaba cuartos al terminar la fase de grupos. No existía lógica para avanzar de cuartos → semis → final.',
      fix: 'Archivo: backend/src/controllers/liguillaController.js → agregada función generarSiguienteFase(ligaId, faseActual, faseNext) y lógica de trigger en guardarResultado para cuartos y semis.',
    },
  ]

  for (const bug of bugs) {
    await heading3(page, bug.titulo)
    await type(page, 'Problema: ' + bug.desc)
    await newline(page)
    await type(page, 'Corrección: ' + bug.fix)
    await newline(page, 2)
  }

  await separator(page)
  await screenshot(page, '09-bugs')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 10 — ENDPOINTS REFERENCIA
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 10: Endpoints referencia...')

  await heading2(page, '10. Referencia rápida de endpoints')

  const endpoints = [
    ['AUTH', 'POST /api/auth/login', '{ email, password } → { token, user }'],
    ['AUTH', 'POST /api/auth/register', 'Superadmin crea usuarios → { user }'],
    ['AUTH', 'GET /api/auth/me', 'Perfil del usuario autenticado'],
    ['LIGAS', 'POST /api/ligas', 'Crear liga'],
    ['LIGAS', 'GET /api/ligas', 'Ligas del admin autenticado'],
    ['LIGAS', 'PUT /api/ligas/:id', 'Actualizar configuración de liga'],
    ['EQUIPOS', 'GET /api/equipos?liga_id=xxx', 'Todos los equipos de una liga'],
    ['EQUIPOS', 'POST /api/equipos', 'Crear equipo (soporta logo multipart)'],
    ['EQUIPOS', 'PUT /api/equipos/:id', 'Actualizar equipo (incluye dueno_id, baja)'],
    ['EQUIPOS', 'POST /api/equipos/:id/cuenta', 'Crear/actualizar credenciales del dueño'],
    ['EQUIPOS', 'GET /api/equipos/mi-equipo', 'Vista del dueño: equipo + cobros'],
    ['JORNADAS', 'POST /api/jornadas/generar', '{ liga_id, fecha } → genera round-robin'],
    ['JORNADAS', 'GET /api/jornadas?liga_id=xxx', 'Lista de jornadas'],
    ['JORNADAS', 'PUT /api/jornadas/:id', '{ estado: "en_curso"|"finalizada" }'],
    ['PARTIDOS', 'GET /api/partidos?jornada_id=xxx', 'Partidos de una jornada'],
    ['PARTIDOS', 'PUT /api/partidos/:id/resultado', '{ goles_local, goles_visitante }'],
    ['COBROS', 'GET /api/cobros?liga_id=xxx', 'Estado de cobros de todos los equipos'],
    ['COBROS', 'POST /api/cobros/registrar-pago', '{ equipo_id, concepto, monto, metodo_pago }'],
    ['LIGUILLA', 'POST /api/liguilla/generar', '{ liga_id } → crea grupos y partidos'],
    ['LIGUILLA', 'DELETE /api/liguilla?liga_id=xxx', 'Reset completo de la liguilla'],
    ['LIGUILLA', 'GET /api/liguilla?liga_id=xxx', '{ grupos, partidos }'],
    ['LIGUILLA', 'PUT /api/liguilla/partido/:id/resultado', '{ goles_local, goles_visitante, penales_local?, penales_visitante? }'],
    ['ESTADÍSTICAS', 'GET /api/estadisticas/tabla?liga_id=xxx', 'Tabla de posiciones'],
    ['POSTS', 'GET /api/posts?liga_id=xxx', '{ posts, hasMore } — feed con cursor'],
    ['POSTS', 'POST /api/posts', '{ liga_id, texto, imagen? }'],
    ['POSTS', 'PUT /api/posts/:id/like', 'Toggle like (add/remove)'],
    ['POSTS', 'DELETE /api/posts/:id', 'Eliminar post propio'],
    ['MENSAJES', 'GET /api/mensajes/conversaciones', 'Lista de conversaciones del usuario'],
    ['MENSAJES', 'POST /api/mensajes', '{ liga_id, vendedor_id, texto } o { conversacion_id, texto }'],
    ['MENSAJES', 'GET /api/mensajes/:conversacion_id', 'Hilo completo (marca como leído)'],
    ['VENDEDORES', 'POST /api/admin/vendedores', 'Crear vendedor con negocio y ligas_asignadas'],
  ]

  for (const [modulo, ruta, desc] of endpoints) {
    await type(page, `[${modulo}] ${ruta}`)
    await newline(page)
    await type(page, `  ${desc}`)
    await newline(page)
  }
  await newline(page)

  await separator(page)
  await screenshot(page, '10-endpoints')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 11 — RESUMEN EJECUTIVO
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Sección 11: Resumen ejecutivo...')

  await heading2(page, '11. Resumen ejecutivo — Estado del sistema')

  await heading3(page, '11.1 Cobertura de flujos probados')
  const flujos = [
    '✓ Superadmin crea cliente con plan Elite',
    '✓ Admin liga crea y configura liga completa (33 equipos, 12 jornadas, liguilla)',
    '✓ Cobros calculados correctamente (fijo $7,500 / sin fijo $6,500)',
    '✓ Round-robin genera partidos correctamente con BYE para número impar',
    '✓ Resultados de 12 jornadas registrados y finalizados',
    '✓ Tabla de posiciones calculada por el motor de estadísticas',
    '✓ Liguilla generada: 3 grupos × 8 equipos = 84 partidos de grupos',
    '✓ Fase eliminatoria completa: cuartos → semis → final (auto-generación)',
    '✓ Final con penales: Sparta FC campeón 🏆',
    '✓ 15 posts publicados por 4 roles diferentes',
    '✓ Sistema de likes toggle funcionando',
    '✓ 4 conversaciones DM completas con 12 mensajes',
    '✓ Contadores de mensajes no leídos actualizados correctamente',
    '✓ 8 bugs encontrados y corregidos durante la sesión',
  ]
  for (const f of flujos) {
    await type(page, f)
    await newline(page)
  }
  await newline(page)

  await heading3(page, '11.2 Commits de corrección aplicados')
  await type(page, 'fix: Partido.equipo_visitante_id required→default null (BYE support)')
  await newline(page)
  await type(page, 'fix: Liga.configuracion.liguilla sub-object + LiguillaPartido enum/fields')
  await newline(page)
  await type(page, 'fix: remove MongoDB sessions from liguillaController (M0 incompatibility)')
  await newline(page)
  await type(page, 'fix: add DELETE /api/liguilla reset endpoint')
  await newline(page)
  await type(page, 'fix: equiposController.update supports dueno_id field')
  await newline(page)
  await type(page, 'feat: allow vendedor role to create posts in assigned ligas')
  await newline(page)
  await type(page, 'feat: auto-generate semis from cuartos and final from semis in liguilla')
  await newline(page, 2)

  await heading3(page, '11.3 Notas importantes de producción')
  await type(page, '• MongoDB Atlas M0 NO soporta transacciones (startSession/startTransaction). No usar nunca.')
  await newline(page)
  await type(page, '• En PowerShell, $pid es variable reservada de solo lectura. Usar $postRef o similar.')
  await newline(page)
  await type(page, '• Railway puede tener latencia de DNS en scripts background. Preferir ejecución directa.')
  await newline(page)
  await type(page, '• El campo autor_tipo en Post.js requiere "vendedor" en el enum para vendedores.')
  await newline(page)
  await type(page, '• ligas_asignadas en Usuario es el mecanismo de acceso de vendedores a ligas.')
  await newline(page, 2)

  await separator(page)
  await screenshot(page, '11-resumen')

  // ── Screenshot final completo ─────────────────────────────────────────────
  await page.keyboard.press('Control+Home') // volver al inicio
  await wait(1000)
  await screenshot(page, '12-doc-final-inicio')

  console.log('\n✅ Documentación completada')
  console.log(`📸 Screenshots guardados en: ${SCREENSHOTS_DIR}`)

  await wait(3000)
  // No cerramos Chrome (puede quedar abierto para que el usuario vea el resultado)
  console.log('\n✅ Script terminado — Chrome permanece abierto.')
})()
