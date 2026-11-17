# Contribuir a ERP Web

Gracias por contribuir. Este proyecto es el frontend de un ERP construido con
Next.js 16, React 19 y TypeScript estricto. Antes de enviar cambios, revisa
[`docs/CONVENCIONES.md`](./CONVENCIONES.md) y
[`docs/ARQUITECTURA.md`](./ARQUITECTURA.md); son las referencias normativas
del repositorio.

## Preparar el entorno

Requisitos:

- Node.js 26.x.
- pnpm 12.x. La versión exacta del proyecto está fijada en `package.json`.
- Acceso al backend REST usado por el entorno de desarrollo.

Desde la raíz del repositorio:

```bash
npm install --global pnpm@12
pnpm --version
pnpm install
cp .env.example .env.local
```

Completa en `.env.local` al menos `NEXT_PUBLIC_API_URL`. Las variables de Sentry
son opcionales durante el desarrollo. No confirmes credenciales, tokens ni
otros secretos en Git.

pnpm descarga y usa la versión fijada en `packageManager` si hace falta. Luego
inicia el servidor con `pnpm dev`. La aplicación estará disponible normalmente
en <http://localhost:3000> (o en el siguiente puerto libre).

## Flujo de trabajo

1. Crea una rama pequeña y enfocada a un solo cambio.
2. Revisa el código existente y los ADR relacionados en `docs/adr/` antes de
   introducir un patrón nuevo.
3. Implementa el cambio respetando las fronteras de arquitectura.
4. Añade o actualiza las pruebas correspondientes.
5. Ejecuta las verificaciones locales relevantes.
6. Haz rebase sobre `main`, resuelve conflictos y abre el pull request con CI
   verde.
7. Elimina la rama después del merge.

No incluyas refactors ajenos, formateos masivos ni cambios generados que no sean
necesarios para el objetivo de la contribución.

## Arquitectura

El código está organizado en tres capas:

```text
src/app/                 routing y composición de páginas
src/features/<dominio>/  lógica y UI de cada dominio
src/shared/              código transversal sin conocimiento de dominios
```

Reglas principales:

- `app/` contiene routing, layouts y wrappers; la lógica de negocio vive en
  `features/`.
- Cada feature publica una API curada mediante `src/features/<dominio>/index.ts`.
- Los imports entre features pasan únicamente por esa API pública.
- `shared/` no importa desde `features/` ni desde `app/`.
- `features/` no importa desde `app/` y no se permiten ciclos.
- Los componentes compartidos se importan por subpath, por ejemplo
  `@/shared/components/ui/button`.
- No se crean barrels para agregar carpetas planas ni se usa `export *`.

`pnpm depcruise` comprueba estas fronteras. Para una feature nueva, crea
`src/features/<dominio>/` con solo las carpetas que necesite (`api/`,
`components/`, `hooks/`, `stores/` o `lib/`) y un `index.ts` con exports
nombrados. `src/app/` debe limitarse a montar la pantalla de la feature.

Las URLs siguen la estructura `/modulo/menu/categoria/`; módulo y menú son
segmentos de ruta, mientras que la categoría contiene la página. Todos los
segmentos usan kebab-case.

## Convenciones de código

- Usa sustantivos de dominio en español y términos técnicos en inglés, sin
  tildes ni `ñ` en identificadores.
- Usa kebab-case para archivos y carpetas, PascalCase para componentes y
  camelCase para hooks.
- Deriva los tipos de los schemas Zod con `z.infer`; no dupliques tipos a mano.
- Procesa el envelope del backend únicamente con `parseEnvelope`.
- Lee variables de entorno mediante `src/shared/config/env.ts`; no uses
  `process.env` directamente.
- En queries y mutations, centraliza los mensajes con
  `meta: { silent, successMessage }`; no muestres toasts manuales.
- No ocultes errores con `catch` silenciosos. Propágalos al boundary o al
  manejador global correspondiente.
- No conserves aliases ni reexports de compatibilidad al mover código:
  actualiza los consumidores y elimina la ubicación anterior.
- Carga dinámicamente las librerías cliente mayores de 50 KB.
- Los archivos nuevos no pueden superar 500 líneas. Los archivos incluidos en
  el baseline de deuda no deben crecer.

Para un catálogo CRUD simple, usa `createCatalogo` según
[`ADR-0008`](./adr/0008-factory-create-catalogo.md). Para la estructura de
`api/` de una feature, consulta la receta de
[`docs/CONVENCIONES.md`](./CONVENCIONES.md#receta-estructura-de-api-de-una-feature).

## Accesibilidad

Todo cambio de interfaz debe cumplir, como mínimo:

- Botones que solo muestran un icono con `aria-label`.
- Inputs con un label asociado.
- Diálogos, popovers y menús personalizados construidos sobre primitives de
  Radix.
- Contraste AA para tokens nuevos de color.
- Cero errores de las reglas de accesibilidad de Biome.

## Pruebas

Las pruebas unitarias y de componentes viven en `tests/vitest/` y reflejan la
ruta del archivo bajo `src/`. Usa `*.test.ts` o `*.test.tsx`.

Si modificas código excluido de coverage en `vitest.config.mts`, retíralo de la
exclusión y añade pruebas. Ejecuta la comprobación proporcional al cambio:

```bash
pnpm test             # Vitest en modo watch
pnpm test:run         # suite Vitest una vez
pnpm test:coverage    # suite con coverage
pnpm test:e2e         # Playwright E2E
```

Los E2E usan las credenciales `E2E_USERNAME` y `E2E_PASSWORD` del entorno. Tras
el login, selecciona Guatemala, CROPA S.A. e Informatica como centro de costo.
Para Pricing y CRM utiliza Exportación como centro de costo. Nunca publiques
esas credenciales en el PR ni en capturas.

## Verificaciones locales

Antes de solicitar revisión, ejecuta:

```bash
pnpm verify
```

Según el alcance del cambio, ejecuta también:

```bash
pnpm depcruise
pnpm knip
pnpm check:file-size
pnpm check:top-levels
pnpm check:security-invariants
pnpm build
```

Otros comandos útiles son `pnpm lint`, `pnpm typecheck`,
`pnpm check:design-tokens` y `pnpm check:bundle-size`.

Lefthook instala los hooks con `pnpm install`. El pre-commit aplica Biome a los
archivos staged y el pre-push ejecuta el typecheck. Los hooks ayudan, pero no
sustituyen las verificaciones del cambio ni el CI.

## Commits

Usa el formato:

```text
tipo(ambito): descripcion en minusculas y en espanol de dominio
```

Tipos admitidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci` y
`perf`. El ámbito es opcional y normalmente corresponde a la feature o área
afectada.

Ejemplos:

```text
feat(embarques): agrega consulta de coordinaciones pendientes
fix(auth): conserva la sesion al recargar la pagina
docs(arquitectura): aclara la frontera de server components
```

La primera línea debe describir qué cambia para el sistema. Evita mensajes como
`cambios`, `pruebas` o `wip`.

## Pull requests

Completa la plantilla de PR y explica qué cambia, por qué y cómo se verificó.
Antes del merge, confirma que:

- El PR tiene un alcance claro y no contiene secretos.
- La lógica está en la capa correcta y las fronteras se mantienen.
- Las dependencias nuevas se justificaron, incluyendo peso y alternativas ya
  presentes en el repositorio.
- Las rutas API nuevas fuera del proxy validan la sesión del lado del servidor
  con `getServerToken`.
- Los archivos y URLs cumplen las convenciones de nombre y tamaño.
- Se documentaron las pruebas automáticas y manuales realizadas.
- La rama está actualizada con `main` y todos los checks de CI están verdes
  antes del merge.

No hagas merge mientras el CI esté ejecutándose ni con verificaciones fallidas.

## Cambios sobre código legacy

Al migrar funcionalidad conserva el comportamiento necesario,
pero adapta la implementación a la arquitectura, convenciones y librerías de
este repositorio. No traslades patrones obsoletos ni mantengas capas de
compatibilidad innecesarias.

Si una decisión no está cubierta aquí, consulta los ADR en `docs/adr/` y plantea
la decisión en el pull request antes de introducir una nueva convención.
