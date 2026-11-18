import * as Sentry from "@sentry/nextjs";
import { env } from "@/shared/config/env";
import { logger } from "@/shared/lib/logger";

/**
 * Captura y envía un error a Sentry. Solo activo en producción.
 *
 * El contexto de la app (usuario, país, empresa, centro de costo, navegación)
 * vive en el scope global de Sentry: lo sincroniza reactivamente
 * SentryContextTracker (features/shell) — aquí no se lee estado de stores.
 */
export function reportError(error: unknown, extraContext?: Record<string, unknown>) {
  if (env.NODE_ENV !== "production") {
    if (env.NODE_ENV === "development") {
      logger.debug("[Sentry Report Error - Solo Producción]", error, extraContext);
    }
    return;
  }

  Sentry.captureException(error, extraContext ? { extra: extraContext } : undefined);
}
