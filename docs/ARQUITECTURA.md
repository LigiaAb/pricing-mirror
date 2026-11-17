# Arquitectura

Documento de referencia de la arquitectura de **erp-web**. Describe el estado
actual del repositorio. Las decisiones de fondo están registradas como ADRs en
[`docs/adr/`](./adr/) (ver §10).

> Convención: este documento describe el **estado real del repositorio**. Lo que
> aún no está implementado se marca explícitamente como _pendiente_ con su área
> del plan, para no documentar código inexistente.

---

## 1. Visión general y propósito

`erp-web` es el **frontend** de un ERP cuyo backend es una API REST en español.
La aplicación **no tiene base de datos propia**: actúa como **proxy + UI** sobre
ese backend.

- **Proxy**: las llamadas del navegador pasan por una route handler de Next
  (`src/app/api/proxy/[...path]/`) que añade el token de sesión (cookie httpOnly)
  y reenvía al backend. El navegador nunca habla directo con el backend salvo en
  endpoints públicos (login).
- **UI**: App Router de Next.js compone las pantallas a partir de _features_ por
  dominio.

El dominio se nombra en español (`coordinaciones`, `embarques`, `gastos`…); la
técnica en inglés (`useEntidadForm`, `parseEnvelope`). Detalle en
`docs/CONVENCIONES.md`.

---

## 2. Stack tecnológico

| Capa                  | Tecnología                                                     | Notas                                                      |
| --------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Framework             | **Next.js 16** (App Router, `output: standalone`)              | `next.config.ts`                                           |
| UI                    | **React 19** + **React Compiler** (`reactCompiler: true`)      | optimización automática de memoización                     |
| Lenguaje              | **TypeScript** estricto (`strict`, `noUncheckedIndexedAccess`) | `tsconfig.json`                                            |
| Estado servidor       | **TanStack Query v5**                                          | cache global, `meta:{silent,successMessage}`               |
| Estado cliente        | **Zustand v5** (persist)                                       | solo `auth-store`                                          |
| Validación            | **Zod v4**                                                     | tipos derivados con `z.infer`, sin duplicar a mano         |
| Estilos               | **Tailwind CSS v4** (`@tailwindcss/postcss`)                   | + primitivas Radix UI                                      |
| Formularios           | **react-hook-form** + `@hookform/resolvers` (zod)              |                                                            |
| Lint/format           | **Biome 2** (`biome.json`)                                     | un solo binario para lint + format                         |
| Tests unit/componente | **Vitest 4** + Testing Library (istanbul coverage)             | `vitest.config.mts`                                        |
| Tests E2E             | **Playwright** + `@axe-core/playwright`                        | 5 specs en `tests/e2e/` con mocking hermético del envelope |
| Observabilidad        | **Sentry** (`@sentry/nextjs`)                                  | `withSentryConfig` en `next.config.ts`                     |
| Gestor de paquetes    | **pnpm**                                                       | hooks de git con **lefthook**                              |
| Calidad/arquitectura  | **knip**, **dependency-cruiser**, guard de tamaño de archivo   | gates en CI                                                |

Librerías cliente pesadas (PDF/Excel/QR: `jspdf`, `exceljs`, `qrcode-generator`)
se cargan con `next/dynamic` / `await import()`, nunca con import estático
(ver Prohibiciones en `CLAUDE.md`).

---

## 3. Estructura de carpetas

```
src/
├── app/                      # SOLO routing (App Router): layouts + pages que componen features
│   ├── (protected)/          #   rutas que requieren sesión
│   ├── (public)/             #   rutas públicas (carta pública, etc.)
│   ├── api/
│   │   ├── proxy/[...path]/   #   proxy autenticado al backend REST
│   │   ├── notifications/sse/ #   stream SSE de notificaciones
│   │   └── health/            #   healthcheck
│   └── _components/           #   componentes colocados con su página (excluidos del routing por el prefijo `_`)
│
├── features/<dominio>/        # código por dominio, con index.ts curado como única API pública
│   ├── api/                   #   schemas zod, fetchers, hooks de queries/mutations
│   ├── components/            #   UI del dominio
│   ├── hooks/                 #   hooks de UI/estado del dominio
│   ├── stores/                #   estado local del dominio (si aplica)
│   ├── lib/                   #   utilidades del dominio
│   ├── index.ts               #   barrel curado (exports nombrados) — superficie pública
│   └── server.ts              #   barrel hermano para fetchers `server-only` (solo coordinaciones/correlativos)
│
└── shared/                    # transversal, sin dependencias de features/ ni app/
    ├── api/                   #   núcleo HTTP, envelope, taxonomía de errores
    ├── components/            #   ui/ (primitivas), form/base-form, data-table
    ├── config/               #   env.ts (única lectura de variables de entorno)
    ├── hooks/                 #   hooks transversales
    ├── lib/                   #   logger, sqids, text, date, sentry, auth/, tanstack/
    └── stores/                #   auth-store (Zustand)
```

**Features actuales** (33): `accesos`, `actividades`, `archivos`, `auth`, `bpm`,
`campanas`, `carta-instrucciones`, `catalogos`, `combex`, `configuracion`,
`coordinaciones`, `correlativos`, `cxc`, `documentacion`, `embarques`, `entidades`,
`estadisticas-personales`, `facturacion`, `gastos`, `geolocalizacion`,
`notificaciones`, `objetivos`, `oportunidades`, `organizacion`, `perfil`,
`permisos`, `personal`, `reportes-crm`, `reportesbi`, `shell`, `tracking`,
`tracking-embarques`, `wms-hn` (lista real: `ls src/features/`, referencia también
en `AGENTS.md`).

Reglas de oro:

- `app/` **solo** monta wrappers/pages; la lógica vive en `features/`.
- Cada feature expone su superficie por `index.ts` (exports nombrados, nunca `export *`).
- `shared/` es la base: no conoce a nadie por encima.

---

## 4. Fronteras y reglas de dependencias

Las fronteras feature-first se definen con **dependency-cruiser**
(`.dependency-cruiser.cjs`) y sus 6 reglas están en `severity: "error"`. El
enforcement automático (CI/pre-push) está inactivo hoy — ver el aviso más
abajo:

| Regla                               | Qué prohíbe                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `shared-no-importa-features-ni-app` | `shared/` no puede importar de `features/` ni `app/`                                                                     |
| `features-no-importan-app`          | `features/` no puede importar de `app/`                                                                                  |
| `cross-feature-solo-via-index`      | un feature consume otro **solo** por su `index.ts`                                                                       |
| `app-via-index`                     | `app/` consume features **solo** por `index.ts` o `server.ts`                                                            |
| `no-circular`                       | sin ciclos de dependencias entre módulos                                                                                 |
| `solo-top-levels-permitidos`        | `src/` solo admite `app/`, `features/`, `shared/`, `assets/`, `types/` y los entrypoints de instrumentación/proxy (D-15) |

### Sin excepciones `pathNot` (desde 2026-08)

Las dos excepciones que existieron para `entidades ↔ embarques`
(`cross-feature-solo-via-index`) y `combex/.../seleccionar-copias-modal.tsx`
(`app-via-index`) se retiraron del archivo (commit `54e54cb8`, "Remove path
exclusions for feature imports in dependency rules"): las 6 reglas de §4 hoy
se aplican sin excepciones acotadas.

### ⚠️ Estado real de dependency-cruiser: análisis ciego (A-7 reabierto)

Desde la migración a TypeScript 7 (2026-08-04, ver `chore: actualizar
Next.js 16.3 y TypeScript 7`), `dependency-cruiser` no tiene un compilador
TypeScript compatible (`typescript: >=2.0.0 <7.0.0`) y **cruza 0 módulos** —
`pnpm depcruise` sale en rojo a propósito por el guard en
`scripts/check-depcruise.mjs`, que falla si detecta 0 módulos/dependencias
analizados (evita que un "verde ciego" pase desapercibido, como ya ocurrió
una vez). Por eso `depcruise` está fuera del job de CI y de `lefthook.yml`
pre-push hoy (ver §9): las fronteras de esta sección son la regla objetivo,
pero **no hay enforcement automático activo** hasta que dependency-cruiser
soporte TypeScript 7 o el repo baje temporalmente a TypeScript 6 para el
análisis. No hagas bump de `typescript` sin verificar antes que
dependency-cruiser lo soporta.

### Patrón `index.ts` vs. `server.ts`

`server.ts` es un **barrel hermano** introducido en la fase 6 (B1) para fetchers
marcados con `import "server-only"`. No se pueden re-exportar desde `index.ts`
(un import de valor de ese barrel en un componente cliente arrastraría el módulo
server-only al bundle de cliente y rompería el build). Por eso
`coordinaciones/server.ts` y `correlativos/server.ts` re-exportan los fetchers que
los `page.tsx` (RSC) consumen. Detalle: [ADR-0010](./adr/0010-barrel-server-ts-fetchers-server-only.md).

---

## 5. Patrón API: envelope, adaptadores y `parseEnvelope`

El backend responde con un **sobre** (envelope). Forma habitual:

```jsonc
{
  "data": {
    "success": true,
    "mensaje": "OK",
    "cod_mensaje": "0000",
    "data": [
      /* items */
    ]
  }
}
```

con variantes históricas (`{ data: T[] }` y `T[]` a secas). El sobre se modela
**una sola vez** en `src/shared/api/`.

### Trío de adaptadores HTTP

Todos construidos sobre un núcleo único (`src/shared/api/http.ts`,
`executeRequest` + `createHttpMethods`):

| Adaptador    | Archivo         | Uso                                       | Auth                                                           |
| ------------ | --------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `http`       | `api/client.ts` | navegador → vía `/api/proxy`              | cookie httpOnly; **única ruta de logout** ante sesión expirada |
| `httpPublic` | `api/client.ts` | navegador → directo al backend            | sin sesión (login, carta pública)                              |
| `serverHttp` | `api/server.ts` | RSC / route handlers → directo al backend | token de la cookie (`getServerToken`); `import "server-only"`  |

El núcleo normaliza las claves del backend a minúsculas (`normalizeKeys`, el
casing del backend es inconsistente), parsea la respuesta y traduce errores a la
taxonomía (§7).

### `parseEnvelope` / `unwrapEnvelope`

`src/shared/api/envelope.ts`:

- `unwrapEnvelope<T>(data)` — desenvuelve el sobre sin validar la forma (legacy).
- `parseEnvelope(data, schema, contexto)` — desenvuelve **y valida** cada item con
  un schema zod:
  - en `development`: lanza `EnvelopeInvalidoError` (el contrato se rompió).
  - en producción: reporta a Sentry y devuelve solo los items válidos (la vista
    no se cae).

Regla: el sobre se parsea **solo** vía `parseEnvelope` (Prohibiciones en `CLAUDE.md`).
ADR: [ADR-0003](./adr/0003-envelope-parse-envelope.md), [ADR-0004](./adr/0004-trio-adaptadores-http.md).

---

## 6. Gestión de estado

### TanStack Query (estado de servidor)

`src/shared/lib/tanstack/query-client.ts` centraliza el cliente:

- **Cache global** singleton en navegador; instancia nueva por request en server.
- Defaults: `staleTime 60s`, `gcTime 5min`, `refetchOnWindowFocus: false`, `retry: 1`.
- **Manejo de errores y toasts centralizado** vía `meta`:
  - `meta.silent` — no muestra toast de error (la vista maneja el fallo).
  - `meta.successMessage` — toast de éxito al completar una mutación.
  - Nunca se escriben toasts a mano en queries/mutations (Prohibiciones).
  - `SesionExpiradaError` **no** genera toast: el adaptador HTTP ya redirige a `/login`.

Para catálogos CRUD existe la factory `createCatalogo`
(`src/features/catalogos/api/create-catalogo.ts`): ~20 líneas (schema zod +
endpoints) generan `queryOptions`, hooks de lista y mutaciones con invalidación.
ADR: [ADR-0005](./adr/0005-tanstack-query-meta.md), [ADR-0008](./adr/0008-factory-create-catalogo.md).

### Zustand (estado de cliente)

Único store: `src/shared/stores/auth-store.ts` (`useAuthStore`, persist con
nombre `auth-storage`). **`token` nunca se persiste** a `localStorage`
(`partialize: { user, isAuthenticated }`); la fuente de verdad del token es la
cookie httpOnly. `_hasHydrated` evita parpadeos de hidratación.

---

## 7. Autenticación y sesión

- **Cookie de sesión**: `auth-token` (httpOnly), manejada server-side en
  `src/shared/lib/auth/server-session.ts` (`getServerToken` / `setServerToken` /
  `removeServerToken`). `serverHttp` la usa para autorizar las llamadas RSC.
  El flag `Secure` se deriva del protocolo de la petición (`X-Forwarded-Proto`,
  que fija NPM y reenvía `nginx/proxy-headers.conf`); sin cabecera cae a
  `NODE_ENV === "production"`. Así `app.cropa.com.gt` (HTTPS) emite `Secure` y
  erpdev (HTTP, solo LAN) no, sin configuración por servidor. Nunca se
  hardcodea `secure: false` (invariante S-10).
- **Estado cliente**: `auth-store` (Zustand, persist parcial sin token).
  `src/shared/lib/auth/session.ts` expone `getToken()` y `clearSession()`.
- **Taxonomía de errores** (`src/shared/api/errors.ts`), distinguida por
  `instanceof` (nunca parseando mensajes):
  - `ApiError` — error genérico del backend (lleva `codMensaje`).
  - `SesionExpiradaError` — backend indicó sesión inválida (HTTP 401 **o**
    `cod_mensaje: 1003` con `success: false` y status 200).
  - `EnvelopeInvalidoError` — la respuesta no cumple el schema (solo en dev).
  - `mensajeDeError(err)` — mensaje legible para handlers globales/toasts.
- **Flujo `onSesionExpirada`**: el adaptador `http` (browser) detecta
  `SesionExpiradaError`, llama `clearSession()` (logout del store) y redirige a
  `/login`. El proxy (`http`) es la **única** ruta de logout automático.

ADR: [ADR-0006](./adr/0006-sesion-expirada-error.md).

### Modelo de autorización (decisión explícita, D-25)

**El backend es el control de datos; el frontend es UX.** Decisión aceptada
(condicionada) para un ERP interno:

- `use-permisos`, sidebar y header filtran menús y opciones **en el cliente**.
  Ninguna página de `(protected)` valida permisos en el servidor: el layout
  monta `ProtectedShell` y el proxy solo exige que exista sesión (presencia y
  expiración del token; la verificación criptográfica es del backend).
- Consecuencia asumida: cualquier usuario **autenticado** puede navegar a
  cualquier URL protegida. "No está en el menú" **no** es un control — la
  autorización real ocurre en el backend, por endpoint, en cada request que el
  proxy reenvía.
- **Condición de la decisión**: toda ruta propia del frontend con efectos
  (hoy `/api/notifications`; cualquier `/api/*` futuro fuera del proxy) valida
  sesión/entorno **server-side**, porque ahí el frontend ES el backend. Las
  herramientas administrativas (`/admin`) permanecen dentro del área
  protegida y sus operaciones son autorizadas por el backend.
- En la vista pública (carta de instrucciones) aplica el mismo principio: el
  sqid de la URL es ofuscación; el control es el token del link validado por
  el backend en cada endpoint público. (Se había previsto un ADR de modelo de
  amenaza dedicado para esta vista pública — nunca se creó; no existe hoy en
  `docs/adr/`, cuyo último número es 0015.)

Checklist para rutas nuevas: ¿la ruta tiene efectos propios (no pasa por
`/api/proxy`)? → valida `getServerToken` en el handler. ¿Es de desarrollo? →
gate por `NODE_ENV`. ¿Es pública? → el backend debe validar el token del link,
no confiar en ids.

### Auditoría S.11 — ola de migración de julio 2026 (2026-08-01)

Aplicado el checklist anterior a los 8 módulos que entraron entre el 22 y el
31 de julio (CRM, CXC, personal, accesos, organización, geolocalización,
objetivos, documentación):

- **Rutas propias con efectos** (`/api/notifications`,
  `/api/notifications/sse`): validan sesión vía `getServerToken()`.
  `/api/health` no expone dato sensible, no requiere validación.
- **7 de los 8 módulos** (CRM, CXC, personal, accesos, organización,
  geolocalización, objetivos) son **100% Client Components**: sus `page.tsx`
  son wrappers de servidor que solo renderizan un componente `"use client"`;
  no hacen fetch de datos en el servidor, así que el checklist de "ruta con
  efectos propios" no aplica — todo su acceso a datos pasa por
  `/api/proxy` desde el cliente.
- **Documentación es la excepción**: `src/features/documentacion/api/server-fetchers.ts`
  (`"server-only"`) llama `serverHttp` directo al backend desde Server
  Components (`centro-ayuda/inicio`, `[categoria]`, `[categoria]/[articulo]`),
  sin pasar por `/api/proxy` ni por `use-permisos`. Cumple la condición de
  D-25: `serverHttp` exige `getServerToken()` y rechaza sin cookie de sesión
  antes de tocar el backend; el backend valida el token igual que en el resto
  de la app. No hay bypass de sesión — es SSR de contenido de ayuda gateado
  por sesión (no por permiso de módulo), consistente con el modelo aceptado.
- **Ningún módulo de la ola tiene Server Actions (`"use server"`) ni rutas
  API propias.** El único `"use server"` del repo es
  `src/features/auth/api/actions.ts`, que escribe y borra la cookie de sesión
  ([ADR-0016](./adr/0016-mutaciones-tanstack-server-actions-cookies.md)).

Conclusión: sin hallazgos que contradigan "el control real es del backend
por endpoint". (Auditoría S.11 del plan de estabilización; el documento del
plan se retiró del repo el 2026-08-03 al cerrarse sus fases — ver historial
de `docs/PLAN-ESTABILIZACION.md` en git.)

### Notificaciones: estado en memoria de una sola instancia (S.4/D-18)

`src/app/api/notifications/emitter.ts` guarda `activeNotification` como
variable de módulo y difunde cambios vía `EventEmitter` a los clientes SSE
conectados (`sse/route.ts`). Es **best-effort por instancia**, aceptado a
propósito. El despliegue real es Docker blue/green (`scripts/deploy.sh`,
D-34 actualizada 2026-10-29): solo un slot sirve tráfico a la vez (el viejo
se apaga tras el swap), así que no hay réplicas que diverjan, **pero el
estado no sobrevive al swap**: el slot nuevo arranca sin notificación activa
y quien la publicó debe volver a publicarla tras cada deploy. Si eso deja de
ser aceptable, el estado necesita un backing compartido (persistirlo en
`backend_cloud`, Redis u otro) que el slot nuevo lea al arrancar.

Al apagarse un slot (`docker stop` → SIGINT) los streams SSE se cierran
(`closeStreamsOnShutdown` en `emitter.ts`): Next espera a que terminen las
conexiones abiertas antes de salir y un SSE no termina nunca, así que sin
esto cada apagado agotaba el drain completo. EventSource reconecta solo contra
el slot nuevo, escalonado por el `retry:` aleatorio.

### Despliegue: estáticos y caché

- **Estáticos entre builds**: `deploy.sh` copia `/_next/static` de cada build
  a `.nginx-static/` y Nginx lo sirve desde disco (últimos 5 builds). Una
  pestaña abierta antes del deploy sigue encontrando sus chunks diferidos
  (`exceljs`, `jspdf`...) aunque su slot ya esté apagado; `deploymentId` solo
  fuerza recarga en navegaciones, no en `import()`.
- **Caché de build**: store de pnpm y `.next/cache` (caché de Turbopack) en
  cache mounts de BuildKit; `deploy.sh` poda la caché sin uso en 7 días.
- **Sin caché de HTML/API** en Nginx ni data cache de servidor (`use cache`):
  las respuestas dependen del usuario y la autorización real está en el
  backend por endpoint (D-25); cachear entre usuarios en Next podría
  saltársela. La caché de datos es la de TanStack Query por navegador
  (`shared/api/cache.ts`); un catálogo global caro se cachea en `backend_cloud`.

---

## 8. Testing

### Vitest (unit + componente) — implementado

- Config: `vitest.config.mts` (entorno `jsdom`, provider de coverage `istanbul`).
- Comandos: `pnpm test:run` (una pasada), `pnpm test:coverage`.
- **Ratchet de thresholds**: tras cada fase los candados se fijan en
  `real - 2pts` (patrón fases 3-6). Estado actual (medido 2026-07-02):
  `statements 65 / branches 63 / functions 68 / lines 65` global, con un único
  glob de 90% para `src/shared/api/**` (real = 67.01/65.13/70.28/67.64).
- **Exclusiones documentadas** en el `exclude` de `vitest.config.mts`: barrels
  (`**/index.ts`, `**/server.ts`), PDF/canvas (no testeable en jsdom), SSE,
  páginas de routing triviales, thin wrappers, etc. Cada exclusión lleva su
  motivo en comentario.
- ADR: [ADR-0009](./adr/0009-ratchet-coverage.md).

### Playwright E2E + accesibilidad

Diseño detallado en [ADR-0013](./adr/0013-suite-e2e-playwright-axe.md). Estado
actual (2026-07-02):

- `tests/e2e/` con 5 specs (login, navegación-permisos, catálogo-CRUD,
  coordinación-estado, sesión-expirada).
- **Mocking hermético** vía `page.route` sobre el envelope real (helper
  `mockEnvelope`); sin backend real en CI.
- Gate de **accesibilidad** con `@axe-core/playwright` (`results.violations`
  vacío) al final de cada spec.
- Script `pnpm test:e2e` y `playwright.config.ts` operativos.
- ADR: [ADR-0013](./adr/0013-suite-e2e-playwright-axe.md) (Status: _Aceptado_).

---

## 9. CI/CD y quality gates

Workflow principal: `.github/workflows/ci.yml`, job `checks` (matriz en
paralelo) + job `gitleaks`, en cada PR y push contra `main`. Reducido a
propósito el 2026-08-03 ("disminución de reglas en CI, githook"):

| Gate                    | Dónde corre hoy           | Bloqueante |
| ----------------------- | ------------------------- | ---------- |
| `pnpm typecheck`        | CI (matriz)               | Sí         |
| `pnpm lint` (Biome)     | CI (matriz)               | Sí         |
| `pnpm check:top-levels` | CI (matriz)               | Sí         |
| Secret scan (gitleaks)  | CI (job `gitleaks`)       | Sí         |
| `biome check --staged`  | `lefthook.yml` pre-commit | Sí (local) |
| `pnpm typecheck`        | `lefthook.yml` pre-push   | Sí (local) |

`pnpm knip`, `pnpm depcruise`, `pnpm check:security-invariants`,
`pnpm check:bundle-size` y `pnpm build` existen como scripts en
`package.json` pero **no corren hoy ni en CI ni en los hooks de git** — se
sacaron del workflow en la misma reducción del 2026-08-03. En particular
`depcruise` está inhabilitado porque hoy sale ciego bajo TypeScript 7 (§4,
A-7 reabierto), y `pnpm check:security-invariants` falla en local en este
momento (falta `scripts/http-public-allowlist.txt`) — quedó sin gate que lo
detecte. `pnpm test`/`test:e2e`
tampoco son parte de CI (§8): quedan para desarrollo local, con el PR
template pidiendo declarar qué se probó a mano.

### Seguridad de cabeceras HTTP

`next.config.ts` `headers()` aplica a todas las rutas: `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy`, `X-DNS-Prefetch-Control`.

> **Content-Security-Policy aplicada en `src/proxy.ts`** (antes `middleware`,
> renombrado en Next.js 16). Construye la CSP por request con `nonce` aleatorio
> base64; los scripts se autorizan con `'self' 'nonce-<x>' 'strict-dynamic'`
> (más `'unsafe-eval'` en dev para React Refresh/HMR). En producción se
> omite `unsafe-eval`; en styles se usa `'unsafe-inline'` sin nonce por la
> presencia de estilos inline de Radix/shadcn. Detalle y trade-offs en
> [ADR-0015](./adr/0015-cabeceras-seguridad-csp.md).

---

## 10. Índice de ADRs

Architecture Decision Records en [`docs/adr/`](./adr/) (formato MADR-lite:
Status / Context / Decision / Consequences). Un archivo por decisión.
