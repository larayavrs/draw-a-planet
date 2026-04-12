# draw-a-planet — Contexto del proyecto

> Generado el 2026-04-12. Resume toda la sesión de trabajo en Claude Code.

---

## Idea original

Aplicación web tipo [drawafish.com](https://drawafish.com) pero para **planetas**. El usuario dibuja y diseña un planeta en un canvas 2D, le pone nombre, elige un sistema (sector), y lo publica para que orbite en un tablero 3D compartido en tiempo real junto a los planetas de otros usuarios.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| 3D | React Three Fiber + @react-three/drei |
| Canvas 2D | Fabric.js |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + OAuth Google/GitHub) |
| Realtime | Supabase Realtime (postgres_changes) |
| Storage | Supabase Storage (bucket `planet-textures`) |
| Estado global | Zustand |
| i18n | next-intl (ES + EN) |
| Pagos | MercadoPago Preapprovals API |
| Estilos | Tailwind CSS v4 |
| Deploy | Vercel |
| Runtime | Node.js / Edge (proxy middleware) |

---

## Proyecto Supabase

- **Proyecto vinculado:** `bkqkexbhccrqpgztdapb` (nombre: drawaplanet)
- **URL:** `https://bkqkexbhccrqpgztdapb.supabase.co`
- **Región:** East US (Ohio)
- **Org:** vercel_icfg_ayL6aiNOBSOAqbLcE3Aqb9wy

> Nota: existe también el proyecto `aduzwbtgyyioljywzaid` (dap) en West US que NO está vinculado ni en uso.

---

## Sistema de tiers

| Feature | Guest | Explorer (free) | Premium |
|---|---|---|---|
| Tipos de planeta | Solo Rocky | Rocky, Gaseous, Icy | Los 7 tipos |
| Paleta de colores | 8 swatches | 20 swatches | Espectro completo + hex custom |
| Vida del planeta | 24 horas | 30 días | Permanente |
| Límite de planetas | 1 por sesión | Ilimitado | Ilimitado |
| Nombre visible | "Anonymous" | Username | Username |
| Selección de sistema | Default only | Cualquiera | Cualquiera |
| Vista previa 3D | No | Sí | Sí |
| Texturas custom | No | No | Sí |
| Efectos especiales | No | No | Aurora, anillos, glow |
| Analíticas | No | No | Sí (views chart) |
| Órbita prioritaria | No | No | Sí (más cercana/rápida) |

---

## Diseño (DESIGN.md)

- **Tema:** Dark mode, estética tipo Sentry
- **Fondo:** `#1f1633` (deep purple), `#150f23` (darker purple)
- **Acentos:** `#6a5fc1` (sentry purple), `#c2ef4e` (lime), `#ffb287` (coral), `#fa7faa` (pink)
- **Bordes:** `#362d59`
- **Tipografía:** Dammit Sans (solo heroes/display), Rubik (UI), Monaco (monospace)
- **Efectos:** Frosted glass (`backdrop-blur(18px) saturate(180%)`), inset shadows en botones
- **Ancho máximo:** 1152px

---

## Estructura del proyecto

```
draw-a-planet/
├── supabase/migrations/
│   ├── 0001_schema.sql      ← tablas, triggers, funciones, pg_cron
│   ├── 0002_rls.sql         ← Row Level Security policies
│   └── 0003_seed.sql        ← 3 sistemas iniciales
├── messages/
│   ├── en.json
│   └── es.json
├── public/fonts/            ← DammitSans.woff2 (agregar manualmente)
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx           ← root layout con Rubik, next-intl, Navbar, Footer
│   │   │   ├── page.tsx             ← landing page
│   │   │   ├── draw/page.tsx        ← canvas de dibujo
│   │   │   ├── system/[slug]/page.tsx  ← tablero 3D con órbitas
│   │   │   ├── planet/[id]/page.tsx    ← detalle de planeta
│   │   │   ├── profile/[username]/page.tsx
│   │   │   ├── auth/login/page.tsx
│   │   │   ├── auth/register/page.tsx
│   │   │   ├── premium/page.tsx     ← checkout MercadoPago
│   │   │   ├── settings/page.tsx
│   │   │   └── legal/{terms,privacy}/page.tsx
│   │   └── api/
│   │       ├── auth/guest/route.ts          ← emite JWT para guests
│   │       ├── planets/route.ts             ← POST/GET planetas
│   │       ├── planets/[id]/view/route.ts   ← incrementa view_count
│   │       ├── systems/route.ts
│   │       ├── premium/checkout/route.ts    ← crea Preapproval MP
│   │       └── webhooks/mercadopago/route.ts ← maneja eventos MP
│   ├── components/
│   │   ├── canvas/    ← PlanetCanvas, ColorPicker, BrushToolbar, PlanetTypeSelector
│   │   ├── three/     ← SystemBoard, OrbitingPlanet, CentralStar
│   │   ├── ui/        ← Button, GlassCard, Modal, Navbar, TierBadge
│   │   └── layout/    ← Footer, LocaleSwitcher
│   ├── lib/
│   │   ├── supabase/{client,server}.ts
│   │   ├── auth/{guest,tier}.ts
│   │   ├── mercadopago/{client,webhooks}.ts
│   │   ├── planet/{limits,serializer}.ts
│   │   ├── three/orbitMath.ts
│   │   └── utils.ts
│   ├── hooks/         ← useGuestSession, useUserTier, useSystemRealtime
│   ├── stores/canvasStore.ts   ← Zustand
│   ├── types/         ← planet.ts, tier.ts
│   ├── i18n/{routing,request}.ts
│   └── proxy.ts       ← next-intl + Supabase session refresh (era middleware.ts)
├── .env.local
├── next.config.ts
├── tailwind.config.ts (vacío — config vía @theme en globals.css)
└── DESIGN.md
```

---

## Base de datos — Schema

### Tablas

| Tabla | Descripción |
|---|---|
| `public.users` | Perfil extendido de auth.users. Tier se sincroniza automáticamente. |
| `public.guest_sessions` | Sesiones anónimas. Token = sha256(JWT jti). Máx 1 planeta. |
| `public.systems` | Sistemas solares (Alpha Solaris, Crimson Nebula, Void Station). |
| `public.planets` | Planetas publicados. canvas_data = JSONB de Fabric.js. texture_url = PNG en Storage. |
| `public.subscriptions` | Suscripciones premium. Sincroniza tier via trigger. |

### Tipos enum
- `user_tier`: guest | registered | premium
- `planet_type`: rocky | gaseous | icy | lava | ocean | desert | ringed
- `star_type`: yellow_dwarf | red_dwarf | blue_giant | white_dwarf | neutron
- `subscription_status`: active | past_due | cancelled | trialing | pending
- `subscription_plan`: monthly | annual

### Triggers y funciones
- `handle_new_user()` — crea perfil en `public.users` al registrarse
- `handle_updated_at()` — actualiza `updated_at` automáticamente
- `sync_user_tier()` — sincroniza `users.tier` cuando cambia el estado de la suscripción
- `expire_planets()` — desactiva planetas vencidos (pg_cron hourly)
- `check_subscription_expiry()` — pone `past_due` si venció el período (pg_cron daily)
- `increment_planet_views(uuid)` — incrementa view_count atómicamente

### RLS
- `users`: lectura pública, update solo del propio row
- `systems`: lectura pública (is_active = true)
- `planets`: lectura pública (is_active = true), insert solo usuarios registrados vía RLS; guests usan service-role en API
- `subscriptions`: lectura solo del propio user; escritura solo via service-role (webhook)

---

## Sistemas sembrados

| Sistema | Slug | Estrella | Default |
|---|---|---|---|
| Alpha Solaris | alpha-solaris | yellow_dwarf | ✓ |
| Crimson Nebula | crimson-nebula | red_dwarf | |
| Void Station | void-station | neutron | |

---

## Decisiones técnicas clave

| Decisión | Elección | Razón |
|---|---|---|
| 3D | React Three Fiber + drei | Modelo React, Suspense, OrbitControls, Stars, Html tooltips |
| Canvas 2D | Fabric.js | Serialización JSON → JSONB, clip circular, undo/redo nativo |
| i18n | next-intl | Soporte nativo App Router + server components async |
| Estado | Zustand | Liviano, funciona fuera del contexto React (callbacks de canvas) |
| Auth guest | JWT custom (jose HS256) | Sin row en auth.users, verdaderamente efímero |
| Color picker | react-colorful | 2.8 KB, sin estilos, fácil de tematizar |
| Texturas | Fabric toDataURL → Supabase Storage → THREE.TextureLoader | Desacopla dibujo de renderizado 3D |
| Rate limiting | Contador DB (guest) + token bucket in-process (registered) | Sin infra extra en lanzamiento |
| Pagos | MercadoPago Preapprovals API | Billing recurrente nativo, webhook idempotente |
| Proxy/Middleware | `src/proxy.ts` con export `proxy` | Next.js 16 deprecó `middleware.ts` → ahora es `proxy.ts` |
| UUID | `gen_random_uuid()` | Nativo en Postgres 13+; `uuid_generate_v4()` no está en el search path de Supabase |

---

## Variables de entorno (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://bkqkexbhccrqpgztdapb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del proyecto drawaplanet>
SUPABASE_SERVICE_ROLE_KEY=<service role key del proyecto drawaplanet>

GUEST_TOKEN_SECRET=<mínimo 32 caracteres aleatorios>

# MercadoPago — https://www.mercadopago.com.ar/developers/panel
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000   # cambiar a dominio real en producción
```

---

## Flujo MercadoPago ↔ Supabase

1. **Checkout** → `POST /api/premium/checkout` → crea Preapproval en MP → retorna `init_point` → usuario va al checkout hosteado de MP → se inserta row en `subscriptions` con `status = 'pending'`
2. **Webhook** → MP envía `POST /api/webhooks/mercadopago` → verifica firma HMAC-SHA256 con `MERCADOPAGO_WEBHOOK_SECRET` → upsert en `subscriptions` (status: `active`) → trigger `sync_user_tier` sube tier a `premium`
3. **Renovación** → webhook de payment → actualiza `current_period_end`
4. **Cancelación** → webhook → `status = 'cancelled'` → trigger baja tier a `registered`
5. **Safety net** → pg_cron daily → si `current_period_end < now()` → pone `past_due`

---

## Flujo de autenticación guest

1. Primera visita: `POST /api/auth/guest` → firma JWT (jose HS256) con `session_id` + `jti` → almacena `sha256(jti)` en `guest_sessions.session_token` → devuelve token → cliente guarda en `localStorage`
2. Al publicar: cliente envía `Authorization: Bearer <token>` → API verifica firma + busca hash en DB → valida `planet_count < 1` + `expires_at` → permite la creación
3. Guest puede crear 1 planeta por sesión (enforced en DB y API)

---

## Flujo de publicación de planeta

1. Usuario dibuja en `PlanetCanvas` (Fabric.js, 512×512, clip circular)
2. Al hacer "Publicar": `fabric.canvas.toJSON()` → canvas_data + `canvas.toDataURL()` → base64 PNG
3. `POST /api/planets` con canvas_data + texture_data_url + name + planet_type + system_id
4. API: auth check → tier check → Zod validate → sanitize name → rate limit → orbit math → upload PNG a Storage → insert en planets
5. Redirect a `/system/<slug>` → el planeta aparece orbitando via Realtime (INSERT event)

---

## Órbitas — Parámetros

```
orbit_radius  = BASE_RADIUS(18) + count * SPACING(4) + jitter(±1)
orbit_speed   = { guest: 0.08, registered: 0.12, premium: 0.18 } + random(±0.01)
orbit_offset  = random * 2π  (posición inicial aleatoria)
orbit_inclination = random * 0.3  (inclinación leve)
```

Premium → `count % 8` (cycling) → planetas más cercanos al centro.

---

## Seguridad implementada

- **Nunca confiar en el tier del cliente** — cada API route re-fetcha de `public.users.tier` via service-role
- **Guest JWT** — verifica firma + hash jti contra DB
- **Sanitización de nombres** — `sanitize-html` + constraint DB (40 chars)
- **canvas_data** — Zod schema (max 500 objetos, max 100 KB JSON, tipos permitidos)
- **Webhook MP** — HMAC-SHA256 en cada request
- **RLS** — inserts de guest solo via service-role (no path cliente)
- **Storage** — bucket público para lectura, escritura solo via service-role
- **Rate limiting** — 1 planeta/sesión (guest, DB); 10/min por user_id (registered, token bucket in-process); (Vercel Edge en `/api/*` pendiente)
- **CSRF** — cookies Supabase: HttpOnly + SameSite=Lax; JWT guest en Authorization header

---

## Estado actual del proyecto (2026-04-12)

### Completado ✓
- [x] Scaffold Next.js 16 + todas las dependencias instaladas
- [x] Tailwind v4 configurado con todos los tokens de DESIGN.md
- [x] 3 migraciones SQL aplicadas al proyecto Supabase `bkqkexbhccrqpgztdapb`
- [x] 5 tablas creadas con RLS, triggers y funciones
- [x] 3 sistemas sembrados (Alpha Solaris, Crimson Nebula, Void Station)
- [x] Auth: Supabase clients (browser/server), proxy.ts, guest JWT API
- [x] Canvas de dibujo: PlanetCanvas (Fabric.js), ColorPicker, BrushToolbar, PlanetTypeSelector
- [x] API completa: /api/planets, /api/systems, /api/auth/guest, /api/planets/[id]/view
- [x] 3D System Board: React Three Fiber, OrbitingPlanet, CentralStar, Realtime
- [x] MercadoPago: checkout API + webhook con verificación de firma
- [x] i18n: next-intl, mensajes en EN y ES, LocaleSwitcher
- [x] Páginas: landing, draw, system/[slug], planet/[id], profile/[username], auth/login, auth/register, premium, settings, legal/terms, legal/privacy
- [x] Build limpio sin errores TypeScript (`npm run build` ✓)
- [x] URL de Supabase corregida al proyecto correcto
- [x] `middleware.ts` → `proxy.ts` (convención Next.js 16)
- [x] `uuid_generate_v4()` → `gen_random_uuid()` (compatible con Supabase)

### Pendiente ⚠
- [ ] **Agregar fuente Dammit Sans** — colocar `DammitSans.woff2` en `/public/fonts/`
- [ ] **Bucket `planet-textures`** — crear en Supabase dashboard > Storage (public read)
- [ ] **Realtime** — habilitar para tabla `planets` en Supabase dashboard > Database > Replication
- [ ] **MercadoPago** — completar `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` en `.env.local`
- [ ] **OAuth providers** — configurar Google y GitHub en Supabase Auth dashboard
- [ ] **Vercel deploy** — configurar env vars en Vercel, agregar URL al Supabase Auth redirect list
- [ ] **Webhook URL** — registrar `https://<dominio>/api/webhooks/mercadopago` en MercadoPago

### Opcional / futuro
- [ ] Vista previa 3D antes de publicar (`PlanetPreview` modal con mini canvas R3F)
- [ ] Rate limiting por IP en Edge (Vercel Edge Middleware)
- [ ] Analíticas de planeta (chart de views para usuarios Premium)
- [ ] Más pasarelas de pago (Stripe, etc.)
- [ ] Texturas personalizadas para Premium (upload de imagen)
- [ ] Efectos especiales: aurora, anillos, glow de atmósfera (shaders GLSL)
- [ ] SEO avanzado: sitemap, OpenGraph por planeta
- [ ] Página de perfil con más datos (seguidores, sistema favorito)

---

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Supabase — push migraciones al proyecto vinculado
npx supabase db push --linked

# Supabase — ver estado de tablas remotas
npx supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# Supabase — re-linkear si es necesario
npx supabase link --project-ref bkqkexbhccrqpgztdapb

# TypeScript check
npx tsc --noEmit
```

---

## Archivos críticos por área

| Área | Archivo |
|---|---|
| DB Schema | [supabase/migrations/0001_schema.sql](supabase/migrations/0001_schema.sql) |
| RLS | [supabase/migrations/0002_rls.sql](supabase/migrations/0002_rls.sql) |
| Seed | [supabase/migrations/0003_seed.sql](supabase/migrations/0003_seed.sql) |
| Supabase client | [src/lib/supabase/client.ts](src/lib/supabase/client.ts) |
| Supabase server | [src/lib/supabase/server.ts](src/lib/supabase/server.ts) |
| Guest JWT | [src/lib/auth/guest.ts](src/lib/auth/guest.ts) |
| Tier limits | [src/lib/planet/limits.ts](src/lib/planet/limits.ts) |
| Planet API | [src/app/api/planets/route.ts](src/app/api/planets/route.ts) |
| Webhook MP | [src/app/api/webhooks/mercadopago/route.ts](src/app/api/webhooks/mercadopago/route.ts) |
| Canvas draw | [src/components/canvas/PlanetCanvas.tsx](src/components/canvas/PlanetCanvas.tsx) |
| 3D board | [src/components/three/SystemBoard.tsx](src/components/three/SystemBoard.tsx) |
| Orbiting planet | [src/components/three/OrbitingPlanet.tsx](src/components/three/OrbitingPlanet.tsx) |
| Orbit math | [src/lib/three/orbitMath.ts](src/lib/three/orbitMath.ts) |
| Zustand store | [src/stores/canvasStore.ts](src/stores/canvasStore.ts) |
| Proxy/Middleware | [src/proxy.ts](src/proxy.ts) |
| Globals CSS | [src/app/globals.css](src/app/globals.css) |
| i18n routing | [src/i18n/routing.ts](src/i18n/routing.ts) |
| Env vars | [.env.local](.env.local) |
| Design system | [DESIGN.md](DESIGN.md) |
