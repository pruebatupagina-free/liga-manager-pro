# Web Design Business Workflow — Claude Code

## Quién soy y qué hago

Tengo un negocio de diseño de páginas web. Creo landing pages premium para negocios locales (veterinarias, barberías, restaurantes, cafeterías, dentistas, etc.) y las publico como demo/preview en GitHub Pages. Cuando el cliente aprueba, se compra un dominio personalizado (el dominio lo paga el cliente directamente — NO está incluido en ningún plan).

## Cuenta de GitHub

- **Username:** pruebatupagina-free
- **URL base de demos:** https://pruebatupagina-free.github.io/[nombre-del-repo]/

## Carpeta Raíz de Proyectos

**SIEMPRE** guardar todos los proyectos en:
```
C:\Users\Tibs\clientes-web\[nombre-proyecto]\
```

## Stack Tecnológico

- HTML + CSS + JavaScript vanilla (SIN frameworks)
- **Tipografía:** Dinámica. Usar el par de fuentes (Google Fonts) que recomiende UI/UX Pro Max. NUNCA usar Outfit/Inter por defecto.
- **Imágenes:** IA generada (vía Gemini) O imágenes reales del negocio.
- Responsive mobile-first con breakpoints: 640px, 768px, 1024px

## Estructura Estándar de Proyecto

```
C:\Users\Tibs\clientes-web\[nombre-proyecto]\
├── CLAUDE.md
├── .claude\
│   └── skills\          ← Generado por uipro init --ai claude
├── index.html
├── style.css
├── script.js
└── assets\
    ├── images\
    │   ├── hero.png/jpg
    │   ├── [service images].png/jpg
    │   └── logo.png (si aplica)
    └── redes_sociales\
        ├── post_regalo\
        │   ├── post_regalo.txt
        │   └── [6 imágenes kit regalo].png
        └── post_mes1\          ← Solo si el cliente compra plan mensual
            ├── posts_mes1.txt
            └── [12 imágenes mes 1].png/jpg
```

## Configuración de Playwright (Chrome con sesión guardada)

```json
{
  "userDataDir": "C:\\Users\\Tibs\\AppData\\Local\\Google\\Chrome\\User Data",
  "channel": "chrome",
  "profile": "Profile 7"
}
```

## Planes y Precios

> Claude debe conocer estos precios para upsells, cierres y mensajes de seguimiento.
> El dominio NO está incluido — es costo adicional del cliente (~$150-$300/año).

### Plan Web — $4,500 a $6,000 (pago único)
Incluye todo. La demo se hace siempre en versión básica (sin Calendly ni Analytics).
Cuando el cliente confirma la compra → Claude agrega Calendly y Analytics automáticamente.

### Planes de Redes Sociales (recurrente)

| Plan | Contenido | Precio |
|---|---|---|
| **Redes Starter** | 12 posts/mes + copy + hashtags | $1,500 — $2,000/mes |
| **Redes Pro** | 12 posts + stories + estrategia | $2,500 — $3,500/mes |

### Combos

| Combo | Contenido | Precio |
|---|---|---|
| **Web + Redes** | Plan Web + Redes Starter primer mes gratis | $4,500 — $6,000 inicio |
| **Solo Redes** | Redes Starter o Pro sin página web | Desde $1,500/mes |

### Estrategia de precios por etapa

- **Primeros 3-5 clientes** — cobrar precio mínimo para conseguir testimonios
- **Con testimonios** — cobrar precio completo según tipo de negocio

---

# FILOSOFÍA DE INTERACCIÓN

> 🚨 **REGLA ABSOLUTA DE AUTONOMÍA:**
> Claude trabaja solo con mínimas interrupciones.
> Solo interrumpir cuando sea IMPOSIBLE continuar sin input humano.

### Las ÚNICAS interrupciones permitidas

1. **Primer mensaje incompleto** → mostrar formulario de inicio
2. **Descarga de imágenes de Gemini** → el usuario descarga manualmente
3. **Info del negocio que no existe en ninguna fuente** → preguntar solo lo que falta

### Formulario de inicio

Si el mensaje es incompleto, responder SOLO con esto:

```
Para arrancar necesito 2 datos:

1. ¿Cómo me llega este cliente?
   → Link de Google Maps
   → Links de Facebook y/o Instagram
   → No tiene nada online (dame nombre, servicios, WhatsApp y dirección)
   → Busca un prospecto en [ciudad]

2. ¿Imágenes?
   → IA o reales
```

Si el usuario ya incluye estos datos → arrancar directo sin preguntar nada.

---

# FLUJO DE TRABAJO — Paso a Paso

## DETECCIÓN DE INTENCIÓN

| Si el mensaje menciona... | Flujo |
|---|---|
| "landing page", "página web", "sitio web" | → **FLUJO A: Landing Page** |
| "kit de redes", "posts", "contenido" | → **FLUJO B: Solo Redes** |
| Ambas | → *"¿Primero la página y luego redes, o solo redes por ahora?"* |

---

## FLUJO B: Solo Kit de Redes Sociales

### Inicio

Si el mensaje es incompleto, preguntar SOLO:
```
¿Qué plan de redes?
→ starter (12 posts) / pro (12 posts + stories)
```

### Estructura de carpetas

```bash
mkdir -p "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/redes_sociales/post_regalo"
cp "C:/Users/Tibs/CLAUDE.md" "C:/Users/Tibs/clientes-web/[nombre-proyecto]/CLAUDE.md"
cd "C:/Users/Tibs/clientes-web/[nombre-proyecto]"
uipro init --ai claude
```

### Flujo completo

1. Investigar el negocio según la fuente disponible
2. Investigar estilo visual actual (últimos 9-12 posts en Instagram y Facebook)
3. Documentar estilo encontrado
4. Generar Kit de 6 posts de regalo
5. Crear `ficha_cliente.md`
6. Entregar con gancho de upsell:
> *"Por cierto, este negocio no tiene página web. Con la info que ya tenemos, la tendría lista en minutos. ¿Quieres que te la muestre? Plan Web desde $4,500."*

> **NOTA:** Si acepta upsell → continuar con FLUJO A desde PASO 1. NO repetir investigación.

---

## FLUJO A: Landing Page Completa

## PASO 0: Inicio

Si el mensaje ya incluye fuente del cliente + tipo de imágenes → arrancar directo.
Si no → usar el formulario de 2 datos.

Una vez con los datos, crear estructura:

```bash
mkdir -p "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/images"
mkdir -p "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/redes_sociales/post_regalo"
cp "C:/Users/Tibs/CLAUDE.md" "C:/Users/Tibs/clientes-web/[nombre-proyecto]/CLAUDE.md"
cd "C:/Users/Tibs/clientes-web/[nombre-proyecto]"
uipro init --ai claude
```

### Investigación según fuente del cliente

> ⚠️ **REGLA MAESTRA:** Agotar TODAS las fuentes disponibles antes de preguntar al usuario.

**Fuente 1 — Link de Google Maps:**
1. Playwright abre el link → extrae: Nombre, Dirección, Teléfono, Horario, Calificación, Reseñas, links a redes
2. Si tiene Facebook/Instagram enlazados → navegar y extraer descripción, servicios, precios, estilo visual
3. Si no tiene redes → buscar con WebSearch: `"[nombre negocio]" site:instagram.com` o `site:facebook.com`

**Fuente 2 — Links de Facebook y/o Instagram:**
1. Playwright navega a cada link
2. Extraer: nombre, descripción, servicios, precios, horario, estilo visual, posts recientes
3. Si falta WhatsApp → preguntar al usuario

**Fuente 3 — Sin presencia online:**
1. Usar exactamente los datos que el usuario proporcionó
2. No inventar ni suponer información
3. Si falta algún dato esencial → preguntar al usuario

**Fuente 4 — Buscar prospecto:**
1. WebSearch para encontrar negocios SIN página web con 4+ estrellas
2. Proponer 1-2 opciones y esperar elección
3. Una vez elegido → continuar con Fuente 1

### Intervención Humana por Nicho

Solo preguntar si NO se encontró la info. SECUENCIAL.

**Salud (Dentistas, Médicos):**
Servicios → Precios base → Cédula/certificación (si no hay, omitir)

**Estética (Barberías, Uñas, Spas):**
Servicios → Precios → Fotos reales de trabajos

**Automotriz (Talleres, Llanteras):**
Servicios → Precios + grúa 24/7 + marcas → Diferenciador

**Comida (Restaurantes, Cafés):**
Menú → Precios → Platillo estrella o promoción

---

## PASO 1: Imágenes

> Si el usuario ya indicó tipo de imágenes → saltar directo al PASO 2.

### IMÁGENES CON IA (Gemini)

1. Preparar prompts detallados para todas las imágenes.
2. Playwright con Profile 7 → `https://gemini.google.com/app` → nuevo chat.
3. Escribir cada prompt secuencialmente.
4. Avisar al usuario:
   > *"Ya generé las imágenes en Gemini. Descárgalas desde tu Chrome normal a Descargas y avísame."*
5. Cuando confirme, mover con bash:
```bash
mv "C:/Users/Tibs/Downloads/Gemini_Generated_Image_*.png" "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/images/"
```

### IMÁGENES REALES

> 🚨 **REGLA ABSOLUTA:**
> SOLO fotos reales del perfil específico de este negocio.
> NUNCA usar fotos de otro negocio similar.
> NUNCA inventar, suponer ni generar con IA sin aprobación explícita.

1. Playwright → Google Maps (sección Fotos) + Facebook + Instagram
2. Clasificar: hero, servicios, ambiente, logo
3. Presentar tabla con links directos y estado ✅/❌
4. Para las ❌: *"No encontré estas imágenes. ¿Quieres que las genere con IA?"*
5. Solo si el usuario aprueba → generar faltantes en Gemini

---

## PASO 2: Diseñar la Landing Page

### ⚡ UI/UX Pro Max — OBLIGATORIO AL 100%

> 🚨 La landing page se diseña 100% basada en UI/UX Pro Max.
> NUNCA tomar decisiones de diseño sin consultarla primero.
> Si no está instalada → `uipro init --ai claude` ANTES de escribir CSS.

1. **Estilo UI** — 67+ estilos. NUNCA repetir el mismo para negocios del mismo giro.
2. **Tipografía** — NUNCA Inter, Roboto, Arial o Space Grotesk.
3. **Paleta** — base de datos de UI/UX Pro Max como referencia principal.
4. **Layout** — patrón específico para este negocio.
5. **Efectos** — coherentes con el estilo. NO glassmorphism automático.

### Validación de imágenes ANTES de diseñar

```bash
ls "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/images/"
```
Si está vacía → NO continuar. Avisar al usuario.

### Secciones Obligatorias

1. **SEO + Meta Tags** — title, description, Open Graph, favicon + JSON-LD Schema.org LocalBusiness
2. **Navbar** — adaptativo según estilo
3. **Hero Section** — imagen + CTA
4. **Servicios** — layout según nicho
5. **Testimonios** — reseñas reales + badge Google
6. **Contacto** — dirección, teléfono, horario
7. **Google Maps** — iframe interactivo
8. **WhatsApp flotante** — sticky esquina inferior derecha
9. **Footer** — navegación, contacto, copyright
10. **Menú móvil** — overlay + panel animado
11. **Animaciones** — según UI/UX Pro Max

### Botones CTA — ⚠️ REGLA

- TODOS los botones "Agendar Cita" → WhatsApp, NO llamada
- `https://wa.me/52XXXXXXXXXX?text=Hola%2C%20me%20gustaría%20agendar%20una%20cita`
- Siempre `target="_blank"`
- Solo "Llamar Ahora" y número en texto usan `tel:`

### Google Maps — ⚠️ REGLA CRÍTICA

- NUNCA `maps/embed?pb=` con coordenadas inventadas
- NUNCA inventar Place IDs
- SIEMPRE formato query por nombre:

```html
<iframe 
  src="https://maps.google.com/maps?q=NOMBRE+DEL+NEGOCIO+CIUDAD+ESTADO&t=&z=17&ie=UTF8&iwloc=&output=embed" 
  width="100%" height="100%" 
  style="border:0;border-radius:16px;" 
  allowfullscreen loading="lazy" 
  referrerpolicy="no-referrer-when-downgrade">
</iframe>
```

---

## PASO 3: Publicar en GitHub Pages

### Repo nuevo:

```bash
cd "C:/Users/Tibs/clientes-web/[nombre-proyecto]"
git init
git config user.email "pruebatupagina.free@gmail.com"
git config user.name "pruebatupagina-free"
git add .
git commit -m "Initial commit: landing page [nombre-negocio]"
gh repo create pruebatupagina-free/[nombre-repo] --public --source=. --remote=origin --push
git branch -M main
git push -u origin main
gh api repos/pruebatupagina-free/[nombre-repo]/pages -X POST -f build_type=legacy -f source[branch]=main -f source[path]=/
```

### Repo existente:

```bash
cd "C:/Users/Tibs/clientes-web/[nombre-proyecto]"
git add .
git commit -m "Update: [descripción]"
git push origin main
```

URL final: `https://pruebatupagina-free.github.io/[nombre-repo]/`

---

## PASO 4: Validación Final

Playwright toma screenshots OBLIGATORIOS:
1. Vista desktop completa
2. Vista mobile (viewport 375px)

Verificar en ambas:
- Hero visible y correcto
- Servicios bien presentados
- Testimonios con estrellas
- Mapa cargando
- WhatsApp flotante visible
- Menú móvil funcionando
- Meta tags correctos

---

## PASO 5: Kit de Redes Sociales y Ficha de Cliente

> 🚨 **ORDEN OBLIGATORIO: El kit de posts se genera SIEMPRE antes del mensaje de WhatsApp.**

### Ficha del Cliente

Crear `ficha_cliente.md`:
- Nombre, tono de voz, paleta usada
- Estilo UI de UI/UX Pro Max
- Servicios, estilo de imágenes
- Contacto, WhatsApp
- Plan contratado y precio

### ⚠️ Investigar Estilo Visual ANTES de generar posts

> NUNCA generar posts sin investigar primero el estilo actual del cliente en redes.
> El objetivo es que los posts parezcan una evolución natural de su contenido — no algo de IA.

1. Playwright → Instagram del negocio → últimos 9-12 posts:
   - Colores dominantes, fondos (sólido o foto), texto en imágenes, tipografías visibles
   - Marcos/bordes, emojis recurrentes, estilo general (minimalista, colorido, profesional)
   - Tono: ¿formal? ¿cercano? ¿divertido?
2. Playwright → Facebook → confirmar o contrastar estilo
3. Documentar antes de generar:
   > *"Posts actuales: [descripción detallada]. Nuestros posts: misma línea visual + paleta de la landing + tipografía del proyecto."*
4. Sin redes activas o posts de baja calidad → crear estilo desde cero coherente con la landing

### Generar Kit de Regalo — 6 posts en total

#### Distribución

| Posts | Herramienta | Tipo |
|---|---|---|
| Post 1, 2, 3 | **Claude Design** | Gráficos de marca con texto, colores, iconos, CTA |
| Post 4, 5, 6 | **Gemini** | Imágenes fotorrealistas de personas/ambientes sin texto |

#### Flujo Claude Design (Posts 1-3)

> ⚠️ Requiere cuenta de Claude autenticada en Profile 7.
> Si no está autenticada: *"Por favor inicia sesión en claude.ai en tu Chrome de Profile 7."*

1. Playwright → `https://claude.ai/design`
2. Para cada post, escribir prompt que especifique:
   - Tamaño: **1080x1080px (square 1:1)**
   - Paleta exacta del proyecto (colores hex reales)
   - Tipografía de la landing (Google Font usada)
   - Estilo visual coherente con el UI elegido (Claymorphism, Glassmorphism, etc.)
   - Texto del post, icono/emoji, CTA
   - Basado en el estilo investigado del cliente en redes
3. Esperar que Claude Design genere el diseño completo
4. Escribir en el chat de Claude Design: `export as png`
5. Claude Design convierte el diseño a PNG 1080x1080 y muestra botón de descarga
6. Playwright hace clic en el botón **"Download [nombre].png"**
7. El archivo cae automáticamente en `C:\Users\Tibs\Downloads\`
8. Bash mueve y renombra al proyecto:
```bash
mv "C:/Users/Tibs/Downloads/[nombre].png" "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/redes_sociales/post_regalo/post-[N]-[tema].png"
```
9. Repetir para cada post

> ✅ Este flujo produce imágenes exactamente en 1080x1080px de alta calidad — sin depender del tamaño de pantalla.

> 🚨 **FALLBACK — Si Claude Design falla:**
> NO usar imágenes fotorrealistas como reemplazo.
> Generar con **Gemini** replicando el mismo estilo gráfico de marca:
> - Incluir en el prompt: *"NOT photorealistic. Flat graphic design style."*
> - Especificar colores hex exactos del proyecto
> - Especificar tipografía del proyecto
> - Especificar estilo UI (Claymorphism, Glassmorphism, etc.)
> - Incluir el texto exacto del post
> - Ejemplo: *"Square 1:1 social media post graphic, NOT photorealistic, flat design, solid background #[color], white text '[texto]', [tipografía] font style, rounded corners, brand colors #[primario] and #[acento], clean minimal layout, no people, no photos, only graphic design elements."*
> - Avisar al usuario: *"Claude Design falló en post [N], lo generé con Gemini manteniendo el estilo gráfico de marca."*

#### Flujo Gemini (Posts 4-6)

> ⚠️ Si ya se generaron imágenes para la landing → abrir chat NUEVO en Gemini antes de generar posts.
> ⚠️ NUNCA tomar screenshots de las imágenes de Gemini — la calidad es inferior a la descarga original.

1. Playwright → `https://gemini.google.com/app` → nuevo chat
2. Generar imágenes una por una con prompt detallado
3. Una vez generadas todas, **DETENERSE** y avisar al usuario:

```
🎨 Ya generé las 3 imágenes fotorrealistas en Gemini.

Para obtener la mejor calidad, descárgalas manualmente:
1. Abre tu Chrome normal
2. Ve a gemini.google.com — el chat ya está ahí
3. Haz clic en cada imagen → botón de descarga
4. Guárdalas en tu carpeta de Descargas
5. Avísame cuando estén listas y las muevo automáticamente

⚠️ No uses el navegador que abrí yo (Playwright) para descargar
— las imágenes originales tienen mejor resolución desde tu Chrome normal.
```

4. Cuando el usuario confirme, mover con bash:
```bash
mv "C:/Users/Tibs/Downloads/Gemini_Generated_Image_*.png" "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/redes_sociales/post_regalo/post-[N]-[tema].png"
```

#### Temas de los 6 Posts (adaptar al nicho)

| Post | Tema | Herramienta | Objetivo |
|---|---|---|---|
| Post 1 | Presentación del servicio principal | Claude Design | Awareness |
| Post 2 | Beneficio concreto / transformación | Claude Design | Conexión emocional |
| Post 3 | CTA directo + datos de contacto | Claude Design | Conversión |
| Post 4 | Ambiente / equipo / local | Gemini | Confianza |
| Post 5 | Cliente feliz / resultado | Gemini | Prueba social |
| Post 6 | Servicio en acción | Gemini | Deseo |

#### Coherencia Visual Obligatoria

- Los 6 posts usan la **misma paleta** que la landing
- Misma **tipografía** del proyecto
- El estilo (Claymorphism, etc.) se refleja en bordes, sombras y radios
- Deben **parecer del mismo equipo de marketing** — no como posts genéricos de IA

### Formato del `post_regalo.txt`

```
POST 1: [Tema]
HERRAMIENTA: Claude Design
IMAGEN: (post-1-[nombre].png)
COPY:
[Copy persuasivo + Emojis + Hashtags]
[CTA + Contacto + Link landing]

POST 2: [Tema]
HERRAMIENTA: Claude Design
IMAGEN: (post-2-[nombre].png)
COPY:
...

POST 3: [Tema]
HERRAMIENTA: Claude Design
...

POST 4: [Tema]
HERRAMIENTA: Gemini
IMAGEN: (post-4-[nombre].png)
COPY:
...

POST 5: [Tema]
HERRAMIENTA: Gemini
...

POST 6: [Tema]
HERRAMIENTA: Gemini
...
```

> Carpeta `post_mes1\` se crea SOLO cuando el cliente ya compró el servicio mensual.

---

## FLUJO D: Regenerar Kit de Regalo (cliente no quedó satisfecho)

### Trigger

Cuando el usuario mande cualquiera de estos mensajes:
- *"Regenera los posts de regalo de [nombre negocio]"*
- *"Rehaz los posts de [nombre negocio]"*
- *"Los posts de [nombre negocio] no quedaron bien, vuélvelos a hacer"*

### Flujo automático

1. Buscar `ficha_cliente.md` en `C:/Users/Tibs/clientes-web/[nombre-proyecto]/`
2. Leer toda la info del negocio
3. Investigar redes con Playwright — buscar qué falló visualmente en los posts anteriores
4. Eliminar imágenes anteriores de `assets/redes_sociales/post_regalo/`
5. Regenerar los 6 posts completos desde cero:
   - 3 con Claude Design (posts gráficos con texto)
   - 3 con Gemini (fotorrealistas)
6. Reemplazar `post_regalo.txt` con los nuevos copies
7. Entregar resumen:

```
✅ Kit de 6 posts regenerado para [Nombre]
📁 assets/redes_sociales/post_regalo/
🎨 3 Claude Design + 3 Gemini — nuevo enfoque visual
```

> **NOTA:** Siempre intentar mejorar el enfoque visual respecto a la versión anterior. No repetir el mismo estilo que no funcionó.

---

## FLUJO C: Generación de Posts Mensuales (cliente ya compró)

### Trigger

Cuando el usuario mande cualquiera de estos mensajes:
- *"[nombre negocio] compró Redes Starter"*
- *"[nombre negocio] compró Redes Pro"*
- *"[nombre negocio] mes 2 Redes Starter"*
- *"[nombre negocio] mes [N] Redes [plan]"*

### Flujo automático

1. Buscar `ficha_cliente.md` en `C:/Users/Tibs/clientes-web/[nombre-proyecto]/`
2. Leer toda la info del negocio (paleta, tipografía, estilo UI, tono de voz)
3. Investigar redes actuales con Playwright (últimos 9-12 posts) para ver si cambió el estilo
4. Crear carpeta si no existe:
```bash
mkdir -p "C:/Users/Tibs/clientes-web/[nombre-proyecto]/assets/redes_sociales/post_mes[N]"
```
5. Generar 12 posts con esta distribución:

### Distribución por plan

| Plan | Total | Claude Design | Gemini |
|---|---|---|---|
| **Redes Starter** | 12 posts | 8 posts gráficos con texto | 4 fotorrealistas |
| **Redes Pro** | 12 posts + stories | 8 posts + 4 stories gráficas | 4 fotorrealistas |

### Temas de los 12 posts (adaptar al nicho y mes)

| Post | Tema | Herramienta |
|---|---|---|
| 1 | Servicio principal | Claude Design |
| 2 | Beneficio / transformación | Claude Design |
| 3 | CTA + contacto | Claude Design |
| 4 | Tip / consejo del nicho | Claude Design |
| 5 | Promoción o fecha especial | Claude Design |
| 6 | Pregunta / interacción | Claude Design |
| 7 | Testimonio / reseña real | Claude Design |
| 8 | Dato curioso del nicho | Claude Design |
| 9 | Ambiente / local / equipo | Gemini |
| 10 | Servicio en acción | Gemini |
| 11 | Cliente feliz / resultado | Gemini |
| 12 | Producto / detalle visual | Gemini |

### Formato del `posts_mes[N].txt`

```
MES [N] — [Nombre del Negocio]
Plan: Redes [Starter/Pro]
Generado: [fecha]

POST 1: [Tema]
HERRAMIENTA: Claude Design
IMAGEN: (mes[N]-post-1-[nombre].png)
COPY:
[Copy + Emojis + Hashtags]
[CTA + Contacto + Link landing]

POST 2: [Tema]
...
[hasta POST 12]
```

### Entrega al usuario

```
✅ Mes [N] generado para [Nombre del Negocio]
📁 Carpeta: assets/redes_sociales/post_mes[N]/
🎨 8 posts Claude Design + 4 posts Gemini
📄 posts_mes[N].txt con todos los copies listos
```

---

## PASO 6: Entrega Final

> 🚨 **ORDEN OBLIGATORIO:**
> 1. Generar kit de 6 posts (PASO 5)
> 2. Enviar mensaje de WhatsApp (PASO 6)
> NO al revés.

### Mensaje de entrega al usuario

```
✅ Landing page publicada: [URL GitHub Pages]
🎨 Kit de 6 posts generado (3 Claude Design + 3 Gemini)
📋 Ficha del cliente guardada
📱 Enviando mensaje de WhatsApp al negocio...
```

### 📱 Envío automático de WhatsApp

1. Playwright → `https://web.whatsapp.com/send?phone=52[número]`
2. Esperar que cargue completamente
3. Redactar mensaje personalizado (plantilla abajo)
4. **DETENERSE** — mostrar preview al usuario:

```
📱 Mensaje listo para enviar a [Nombre]:

"[mensaje completo]"

¿Envío el mensaje? (sí / editar / no)
```

5. Sí → Playwright hace clic en enviar
6. Editar → corregir y mostrar preview de nuevo
7. No → guardar en `ficha_cliente.md` para envío manual

> ⚠️ NUNCA enviar sin confirmación explícita del usuario.
> ⚠️ Requiere WhatsApp Web vinculado en Chrome Profile 7.

### Plantilla de mensaje de WhatsApp

```
Hola [Nombre del negocio] 👋

Vi su negocio en Google Maps y noté que no tienen 
página web. Me tomé el atrevimiento de hacerles una 
demo gratuita para que vean cómo se vería 🙌

🌐 Su página demo: [link]

---

También les preparé 6 posts de regalo para sus 
redes sociales 🎁
[imagen post 1]
[imagen post 2]
[imagen post 3]
[imagen post 4]
[imagen post 5]
[imagen post 6]

---

Si les interesa activarla con su propio dominio:

📦 Plan Web — desde $4,500
✅ Página profesional con diseño único
✅ Se ve perfecto en celular y computadora
✅ Sus clientes los contactan por WhatsApp
✅ Sus clientes los encuentran en Google
✅ [línea dinámica según nicho]
✅ Primer mes de redes sociales de regalo

---

Y si por el momento no les interesa la página, 
sin compromiso también manejamos contenido mensual:

📱 Redes Starter — desde $1,500/mes
✅ 12 posts mensuales diseñados
✅ Textos y hashtags incluidos

📱 Redes Pro — desde $2,500/mes
✅ Todo lo anterior +
✅ Stories semanales
✅ Estrategia de contenido del mes

¿Qué les parece? Con gusto les resuelvo 
cualquier duda 😊
```

### Línea dinámica según nicho

| Nicho | Línea |
|---|---|
| Dentista / Médico / Spa / Barbería | ✅ Sus pacientes agendan cita directo desde la página |
| Restaurante / Taquería / Café | ✅ Sus clientes ven el menú completo desde su celular |
| Taller / Llanteras | ✅ Sus clientes los encuentran cuando buscan taller en Google |
| Veterinaria | ✅ Sus clientes agendan consulta directo desde la página |
| Otros | ✅ Sus clientes los encuentran antes que a su competencia |

### Seguimiento post-entrega

**Día 3:**
> *"Hola [Nombre], ¿tuvieron oportunidad de ver la página demo y los posts? ¿Qué les pareció? 😊"*

**Día 7:**
> *"Hola, les escribo de nuevo sobre su página. Esta semana tuve 2 negocios de [giro] que la activaron. Si les interesa, la inversión es desde $4,500 con todo incluido."*

**Día 15:**
> *"Hola, último aviso — la demo estará disponible hasta fin de mes. Si les interesa activarla, con gusto lo hacemos desde $4,500 😊"*

### Cierre de venta (cuando el cliente dice "sí")

**Agregar funciones automáticamente:**
1. Calendly — Playwright crea evento automáticamente:
   - Nombre: `Cita - [Nombre del Negocio]`
   - Tipo: One-on-One, 1 hora, In-person + dirección real
2. Google Analytics — Playwright crea propiedad y extrae ID `G-XXXXXXX`
3. Inyectar ambos en el proyecto y hacer push

**Dominio:**
1. Pedirle que compre dominio en Hostinger o GoDaddy (~$150-$300/año)
2. `Settings > Pages > Custom domain` en GitHub
3. Guiar configuración DNS
4. Si quiere archivos → comprimir en `.zip`

### Manejo de objeciones

*"Está muy caro"*
> *"Entiendo. Una página así con un diseñador tradicional costaría entre $15,000 y $30,000. Nuestro plan es desde $4,500 con todo incluido."*

*"Lo voy a pensar"*
> *"Claro, sin problema. Solo les comento que la demo estará disponible 30 días. Si deciden antes, puedo tenerla con dominio propio en menos de 24 horas."*

*"No tengo tiempo"*
> *"Por eso mismo es útil — una vez lista, trabaja por ustedes 24/7. De su parte el proceso es mínimo, yo me encargo de todo."*

*"Ya tenemos redes sociales"*
> *"Perfecto. La página complementa sus redes — cuando alguien los busca en Google, los encuentra aunque no esté en Facebook."*

---

## Paletas de Color por Giro (Fallback — Solo si UI/UX Pro Max no está disponible)

> 🚨 El diseño se hace 100% basado en UI/UX Pro Max.
> Esta tabla es ÚNICAMENTE respaldo de emergencia si `uipro init` falló.
> Si UI/UX Pro Max está disponible → ignorar completamente.

| Giro | Primario | Acento | Vibe |
|---|---|---|---|
| Veterinaria | #1a7a8a | #5ec6b8 | Salud, confianza |
| Barbería | #1a1a2e | #c4a35a | Elegancia masculina |
| Restaurante | #8b2500 | #d4a574 | Calidez, apetito |
| Café | #3e2723 | #d4a574 | Calidez, artesanal |
| Panadería | #5d4037 | #ffb74d | Hogar, tradición |
| Floristería | #2e7d32 | #f48fb1 | Frescura, romance |
| Dentista | #1565c0 | #4dd0e1 | Limpieza, confianza |
| Gym | #212121 | #ff5722 | Energía, poder |
| Spa | #6a1b4d | #f8b4c8 | Relajación, lujo |
| Abogados | #1b2838 | #b8860b | Seriedad, prestigio |
| Inmobiliaria | #0d47a1 | #26a69a | Confianza, inversión |
| Taller | #263238 | #ff6f00 | Resistencia, confianza |

---

## Herramientas

| Necesidad | Herramienta |
|---|---|
| Buscar info del negocio | WebSearch |
| Leer páginas / redes | WebFetch |
| Controlar navegador | Playwright MCP (Profile 7) |
| Crear/editar archivos | Bash |
| Mover imágenes | Bash (mv) |
| Git y GitHub Pages | Bash + gh CLI |
| Diseño UI/UX | UI/UX Pro Max (.claude/skills/) |
| Posts gráficos con texto | Claude Design (claude.ai/design) |
| Imágenes fotorrealistas | Gemini (gemini.google.com/app) |
| Investigar estilo posts | Playwright → Instagram + Facebook |

---

## Notas Importantes

- Claude crea carpetas y corre `uipro init --ai claude` automáticamente.
- Playwright usa Profile 7 — no se necesita login manual.
- Plantilla base en `C:\Users\Tibs\CLAUDE.md`.
- Cada proyecto tiene su CLAUDE.md y su UI/UX Pro Max propios.
- **Demo siempre en versión básica** — Calendly y Analytics se agregan solo al confirmar compra.
- **Kit de posts SIEMPRE antes del mensaje de WhatsApp** — nunca al revés.
- **⚠️ SINCRONIZACIÓN:** Al modificar `C:\Users\Tibs\CLAUDE.md` → copiar al proyecto activo inmediatamente.
