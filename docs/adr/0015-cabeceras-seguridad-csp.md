# 0015 — Cabeceras de seguridad HTTP (+ CSP con nonce)

- **Status**: **Aceptado** (cabeceras actuales + CSP con nonce)
- **Fecha**: 2026-06

## Context

Una app web expuesta necesita cabeceras de seguridad para mitigar clickjacking,
sniffing de tipo, fuga de referrer y abuso de APIs del navegador. La defensa más
fuerte contra XSS —`Content-Security-Policy`— requiere, para ser efectiva sin
`unsafe-inline`/`unsafe-eval`, un **nonce por request**.

## Decision

**Implementado**: cabeceras estáticas en `next.config.ts` (`headers()`), aplicadas
a todas las rutas:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `X-DNS-Prefetch-Control: on`

**Implementado** (Fase 1): `Content-Security-Policy` con
**nonce por request**, sin `unsafe-inline`/`unsafe-eval` en producción. El
proxy (`src/proxy.ts`) genera el nonce con `crypto.randomUUID()`,
inyecta `x-nonce` en los request headers y compone el `Content-Security-Policy`
efectivo en la respuesta. La CSP no puede vivir en `headers()` estáticos porque
el nonce cambia en cada request — se materializa en el proxy.

## Consequences

- **+** Las cabeceras actuales ya cubren clickjacking, sniffing y referrer.
- **+** CSP con nonce cubre XSS sin `unsafe-inline`/`unsafe-eval` en producción.
  Los scripts/styles inline del runtime de Next (Sentry Replay, hidratación)
  cargan sin violaciones.
- **−** En dev se permite `unsafe-eval` y `unsafe-inline` para React Refresh y
  HMR — comportamiento esperado y limitado a `NODE_ENV !== "production"`.

## Referencias

- `src/proxy.ts` (generación de nonce + CSP efectivo)
- `next.config.ts` (`headers()` y cabeceras estáticas)
- `docs/ARQUITECTURA.md` §9 (Seguridad de cabeceras HTTP)
