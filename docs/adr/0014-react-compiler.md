# 0014 — Adopción de React Compiler

- **Status**: Aceptado
- **Fecha**: 2026-06

## Context

La memoización manual (`useMemo`, `useCallback`, `React.memo`) es ruido repetitivo,
fácil de olvidar y fuente de bugs sutiles (dependencias mal declaradas). React 19

- React Compiler memoizan automáticamente en tiempo de build.

## Decision

Activar **React Compiler** (`reactCompiler: true` en `next.config.ts`, con
`babel-plugin-react-compiler`). Next.js 16 usa **Turbopack** como bundler por
defecto (dev y build). Se evita añadir `useMemo`/`useCallback` salvo cuando haya
una razón concreta que el compilador no cubra.

## Consequences

- **+** Menos memoización manual y menos bugs de dependencias.
- **+** Rendimiento por defecto sin esfuerzo del autor.
- **−** Requiere código que cumpla las Reglas de los Hooks (el compilador asume
  pureza); patrones no idiomáticos pueden quedar sin optimizar o avisar.
- **−** Dependencia de una herramienta relativamente nueva (mitigado: es opt-in y
  desactivable con un flag).

## Referencias

- `next.config.ts` (`reactCompiler: true`)
- `package.json` (`babel-plugin-react-compiler`, `next`, `react`)
- `docs/ARQUITECTURA.md` §2
