# LigaManager Pro — Claude Code Instructions

## Proyecto

Plataforma web para administradores de ligas de fútbol amateur.
- **Repo:** liga-manager-pro
- **GitHub User:** (configurar al inicio)
- **Demo URL:** https://[github-user].github.io/liga-manager-pro/
- **Stack:** React + Vite (frontend) · Node.js + Express (backend) · MongoDB Atlas (DB)

---

## 🚨 REGLA ABSOLUTA DE AUTONOMÍA

Claude trabaja solo con mínimas interrupciones.
Solo interrumpir cuando sea IMPOSIBLE continuar sin input humano.

### Las ÚNICAS interrupciones permitidas

1. **Credenciales que no existen aún** → pedir solo ese dato específico
2. **MongoDB Atlas connection string** → el usuario la crea en el dashboard (gratis)
3. **Confirmación antes de hacer push a GitHub** → mostrar resumen y esperar "sí"
4. **Variables de entorno secretas** → pedir una sola vez, guardar en .env

---

## Carpeta raíz del proyecto

```
C:\Users\Tibs\clientes-web\liga-manager-pro\
├── CLAUDE.md
├── frontend\          ← React + Vite (se publica en GitHub Pages)
├── backend\           ← Node.js + Express (se despliega en Railway/Render)
└── .env.example
```

---

## Configuración de Playwright (Chrome con sesión guardada)

```json
{
  "userDataDir": "C:\\Users\\Tibs\\AppData\\Local\\Google\\Chrome\\User Data",
  "channel": "chrome",
  "profile": "Profile 7"
}
```

Playwright usa Profile 7 — no se necesita login manual en GitHub, MongoDB Atlas, ni Railway.

---

## Tech Stack Completo

### Frontend
- React 18 + Vite
- React Router v6
- TailwindCSS v3
- React Query (TanStack Query v5)
- Recharts (gráficas)
- Lucide React (iconos)
- react-hot-toast (notificaciones)
- canvas-confetti (animaciones MVP)
- Driver.js (tour guiado)
- jsPDF + jsPDF-AutoTable (exportar PDF)
- xlsx / SheetJS (exportar Excel)
- Fuentes: Bebas Neue (títulos) + DM Sans (cuerpo) vía Google Fonts

### Backend
- Node.js + Express
- Mongoose (ODM para MongoDB)
- JWT + bcryptjs (auth)
- Multer + Cloudinary (imágenes)
- node-cron (cron jobs)
- cors, helmet, express-rate-limit

### Base de datos
- MongoDB Atlas (gratuito tier M0)
- ODM: Mongoose con schemas tipados

### Deploy
- **Frontend:** GitHub Pages (build estático de Vite)
- **Backend:** Railway (free tier) o Render
- **Imágenes:** Cloudinary

---

## Variables de Entorno

### backend/.env
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ULTRAMSG_TOKEN=...
ULTRAMSG_INSTANCE=...
FRONTEND_URL=https://[github-user].github.io/liga-manager-pro
```

### frontend/.env
```
VITE_API_URL=https://[railway-url].railway.app
VITE_APP_NAME=LigaManager Pro
```

---

## Estructura de la Base de Datos (MongoDB)

### Colección: `usuarios`
```js
{
  _id: ObjectId,
  nombre: String,
  email: { type: String, unique: true },
  password: String, // bcrypt hash
  rol: { type: String, enum: ['superadmin', 'admin_liga', 'dueno_equipo'] },
  username: { type: String, unique: true, sparse: true }, // solo admin_liga
  foto: String, // URL Cloudinary
  telefono: String,
  licencia: {
    plan: { type: String, enum: ['basico', 'pro', 'elite'] },
    estado: { type: String, enum: ['activa', 'por_vencer', 'vencida', 'suspendida'] },
    fecha_inicio: Date,
    fecha_vencimiento: Date,
    pago: { type: String, enum: ['mensual', 'anual'] }
  },
  ultimo_ping: Date,
  dispositivo: { type: String, enum: ['mobile', 'desktop'] },
  chat_mensajes_hoy: { count: Number, fecha: Date }, // límite chatbot IA
  createdAt: Date,
  updatedAt: Date
}
```

### Colección: `ligas`
```js
{
  _id: ObjectId,
  admin_id: { type: ObjectId, ref: 'Usuario' },
  nombre: String,
  slug: { type: String, unique: true }, // auto-generado
  estado: { type: String, enum: ['activa', 'finalizada', 'pausada', 'archivada'] },
  configuracion: {
    dias_juego: [String], // ['sabado', 'domingo']
    num_canchas: Number,
    hora_inicio: String, // 'HH:MM'
    hora_fin: String,
    duracion_partido: Number, // minutos
    num_jornadas: Number,
    max_equipos_fijos: Number,
    cuota_inscripcion: Number,
    costo_arbitraje: Number,
    pago_fijo_temporada: Number, // para equipos con hora fija
    tiene_liguilla: Boolean,
    criterios_desempate: [String] // orden configurado
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Colección: `equipos`
```js
{
  _id: ObjectId,
  liga_id: { type: ObjectId, ref: 'Liga' },
  dueno_id: { type: ObjectId, ref: 'Usuario', sparse: true },
  nombre: String,
  slug: String,
  color_principal: String, // hex
  logo: String, // URL Cloudinary
  dia_juego: String,
  hora_fija: String, // 'HH:MM' o null
  tiene_hora_fija: Boolean,
  telefono: String,
  whatsapp: String,
  monto_pagado: { type: Number, default: 0 },
  veces_bye: { type: Number, default: 0 },
  baja: {
    activa: { type: Boolean, default: false },
    motivo: String,
    fecha: Date,
    conservar_partidos: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Colección: `jugadores`
```js
{
  _id: ObjectId,
  equipo_id: { type: ObjectId, ref: 'Equipo' },
  nombre: String,
  numero_camiseta: Number,
  posicion: { type: String, enum: ['Portero', 'Defensa', 'Mediocampista', 'Delantero'] },
  foto: String, // URL Cloudinary
  activo: { type: Boolean, default: true },
  createdAt: Date
}
```

### Colección: `jornadas`
```js
{
  _id: ObjectId,
  liga_id: { type: ObjectId, ref: 'Liga' },
  numero: Number,
  fecha: Date,
  hora_inicio: String,
  notas: String,
  estado: { type: String, enum: ['pendiente', 'en_curso', 'finalizada'] },
  createdAt: Date
}
```

### Colección: `partidos`
```js
{
  _id: ObjectId,
  jornada_id: { type: ObjectId, ref: 'Jornada' },
  liga_id: { type: ObjectId, ref: 'Liga' },
  equipo_local_id: { type: ObjectId, ref: 'Equipo' },
  equipo_visitante_id: { type: ObjectId, ref: 'Equipo' },
  cancha: Number,
  hora: String,
  goles_local: { type: Number, default: null },
  goles_visitante: { type: Number, default: null },
  estado: {
    type: String,
    enum: ['pendiente', 'jugado', 'cancelado', 'wo', 'reprogramado'],
    default: 'pendiente'
  },
  tipo: { type: String, enum: ['normal', 'extra', 'revancha'], default: 'normal' },
  es_bye: { type: Boolean, default: false },
  arbitraje: {
    local: { monto: Number, pagado: Boolean },
    visitante: { monto: Number, pagado: Boolean }
  },
  mvp_jugador_id: { type: ObjectId, ref: 'Jugador', sparse: true },
  mvp_equipo_id: { type: ObjectId, ref: 'Equipo', sparse: true },
  notas: String,
  createdAt: Date
}
```

### Colección: `goles`
```js
{
  _id: ObjectId,
  partido_id: { type: ObjectId, ref: 'Partido' },
  jugador_id: { type: ObjectId, ref: 'Jugador' },
  equipo_id: { type: ObjectId, ref: 'Equipo' },
  minuto: Number,
  tipo: { type: String, enum: ['normal', 'penal', 'autogol'] },
  createdAt: Date
}
```

### Colección: `tarjetas`
```js
{
  _id: ObjectId,
  partido_id: { type: ObjectId, ref: 'Partido' },
  jugador_id: { type: ObjectId, ref: 'Jugador' },
  equipo_id: { type: ObjectId, ref: 'Equipo' },
  tipo: { type: String, enum: ['amarilla', 'roja'] },
  minuto: Number,
  createdAt: Date
}
```

### Colección: `sanciones`
```js
{
  _id: ObjectId,
  jugador_id: { type: ObjectId, ref: 'Jugador' },
  liga_id: { type: ObjectId, ref: 'Liga' },
  motivo: String,
  jornadas_suspension: Number,
  jornada_inicio: Number,
  activa: Boolean,
  createdAt: Date
}
```

### Colección: `whatsapp_log`
```js
{
  _id: ObjectId,
  liga_id: { type: ObjectId, ref: 'Liga' },
  equipo_id: { type: ObjectId, ref: 'Equipo', sparse: true },
  tipo: String, // 'jornada', 'cobro', 'bye', etc.
  mensaje: String,
  estado: { type: String, enum: ['enviado', 'error'] },
  createdAt: Date
}
```

### Colección: `liguilla_grupos`
```js
{
  _id: ObjectId,
  liga_id: { type: ObjectId, ref: 'Liga' },
  numero_grupo: Number,
  equipos: [{ type: ObjectId, ref: 'Equipo' }],
  campeon_id: { type: ObjectId, ref: 'Equipo', sparse: true },
  createdAt: Date
}
```

### Colección: `liguilla_partidos`
```js
{
  _id: ObjectId,
  grupo_id: { type: ObjectId, ref: 'LiguillaGrupo' },
  liga_id: { type: ObjectId, ref: 'Liga' },
  fase: { type: String, enum: ['cuartos', 'semis', 'final'] },
  equipo_local_id: { type: ObjectId, ref: 'Equipo' },
  equipo_visitante_id: { type: ObjectId, ref: 'Equipo' },
  goles_local: Number,
  goles_visitante: Number,
  penales_local: Number,
  penales_visitante: Number,
  ganador_id: { type: ObjectId, ref: 'Equipo', sparse: true },
  es_bye: Boolean,
  createdAt: Date
}
```

---

## Reglas de Negocio Críticas (NO saltarse)

1. `monto_pagado` siempre se distribuye: inscripción → fijo → arbitrajes
2. WO = 3-0 a favor del equipo presente
3. Partidos cancelados no cuentan en tabla
4. BYE al equipo con menos descansos; nunca dos jornadas seguidas si hay opción
5. Criterios de desempate se aplican en el orden configurado por el admin
6. Slug de liga: minúsculas, sin acentos, espacios→guiones + año. Único en BD
7. Username reservados: login, dashboard, admin, api, ligas, equipos, usuarios, solicitudes
8. Chatbot IA: máximo 30 mensajes/día por admin (rastrear en usuarios.chat_mensajes_hoy)
9. Máximo 30 jugadores por equipo
10. Licencias: nunca usar null en campos de fecha/tiempo de Mongo sin validar

---

## Roles y Permisos

| Rol | Acceso |
|-----|--------|
| `superadmin` | Todo. Gestiona admins y licencias. Ve presencia online. |
| `admin_liga` | Solo sus propias ligas. Crea equipos, jornadas, resultados, cobros, chatbot IA. |
| `dueno_equipo` | Solo lectura de su liga. Edita su equipo y jugadores. |

Middleware de auth: verificar JWT → verificar rol → verificar que el recurso pertenece al usuario.

---

## Estructura de Rutas del Backend

```
/api/auth          → login, register, ping (presencia)
/api/ligas         → CRUD ligas
/api/equipos       → CRUD equipos
/api/jugadores     → CRUD jugadores
/api/jornadas      → CRUD + generación round robin
/api/partidos      → CRUD + resultados + MVP
/api/goles         → CRUD goles por partido
/api/tarjetas      → CRUD tarjetas por partido
/api/cobros        → cálculo y estado de pagos
/api/estadisticas  → tabla, goleadores, rendimiento
/api/whatsapp      → envío de mensajes
/api/chatbot       → proxy a Claude API con contexto de liga
/api/liguilla      → grupos y partidos de playoffs
/api/public        → rutas sin auth (página pública)
/api/admin         → solo superadmin: usuarios, licencias
```

---

## Despliegue

### Frontend → GitHub Pages

```bash
# En frontend/vite.config.js
base: '/liga-manager-pro/'

# Build y deploy
cd frontend
npm run build
gh-pages -d dist
```

### Backend → Railway

```bash
# railway.json en raíz de backend/
{
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "node src/server.js" }
}
```

---

## Herramientas

| Necesidad | Herramienta |
|-----------|-------------|
| Crear archivos y carpetas | Bash |
| Instalar dependencias | Bash (npm install) |
| Git y GitHub Pages | Bash + gh CLI |
| Abrir MongoDB Atlas | Playwright Profile 7 |
| Abrir Railway | Playwright Profile 7 |
| Verificar deploy | Playwright Profile 7 |

---

## Notas Importantes

- **NUNCA hacer push sin confirmar con el usuario primero**
- El frontend usa `VITE_API_URL` para apuntar al backend — cambiar en `.env` según entorno
- GitHub Pages solo sirve archivos estáticos — el backend SIEMPRE va en Railway/Render
- Playwright Profile 7 ya tiene sesión de GitHub, MongoDB Atlas, Railway
- En MongoDB: siempre usar `lean()` en queries de solo lectura para performance
- Los índices importantes: `email` (usuarios), `slug` (ligas), `liga_id` (equipos/jornadas/partidos)
