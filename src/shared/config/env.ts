import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Única puerta de acceso a variables de entorno. Valida en build/arranque y
 * falla rápido si falta configuración (sin fallbacks silenciosos).
 *
 * process.env directo está prohibido fuera de este archivo y de los archivos
 * de frontera del framework (instrumentation, next.config, sentry.*.config) —
 * regla Biome noProcessEnv.
 */
export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    // NO es la versión de este front: es un valor fijo que solo valida el backend
    // (header `version_app`). La versión del front es NEXT_PUBLIC_APP_BUILD_ID.
    NEXT_PUBLIC_APP_VERSION: z.string().min(1).default("0.0.0"),
    NEXT_PUBLIC_APP_BUILD_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_APP_URL: z.url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    NEXT_PUBLIC_SQIDS_ALPHABET: z.string().min(16).optional(),
    // Marcada por Playwright en CI/local para que el código cliente pueda
    // omitir elementos de developer experience (TanStack Devtools) que en
    // tests e2e interceptan pointer events y rompen aserciones de a11y.
    NEXT_PUBLIC_E2E: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  // Next.js inlinea las NEXT_PUBLIC_* en build: deben referenciarse una a una
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_APP_BUILD_ID: process.env.NEXT_PUBLIC_APP_BUILD_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SQIDS_ALPHABET: process.env.NEXT_PUBLIC_SQIDS_ALPHABET,
    NEXT_PUBLIC_E2E: process.env.NEXT_PUBLIC_E2E,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
