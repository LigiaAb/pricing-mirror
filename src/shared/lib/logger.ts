import * as Sentry from "@sentry/nextjs";
import { isSesionExpirada } from "@/shared/api/errors";
import { env } from "@/shared/config/env";

const isDev = env.NODE_ENV !== "production";

function captureMessage(message: string, level: Sentry.SeverityLevel, args: unknown[]) {
  Sentry.captureMessage(message, {
    level,
    ...(args.length > 0 ? { extra: { args } } : {}),
  });
}

function captureException(
  message: string,
  error: unknown,
  level: "error" | "fatal",
  extra?: Record<string, unknown>,
) {
  // Flujo esperado: el adaptador HTTP ya hizo logout y redirigió a /login.
  if (isSesionExpirada(error)) return;

  const exception = error instanceof Error ? error : new Error(message);

  Sentry.captureException(exception, {
    level,
    ...((error !== undefined && !(error instanceof Error)) || extra
      ? {
          extra: {
            ...(error !== undefined && !(error instanceof Error) ? { error } : {}),
            ...extra,
          },
        }
      : {}),
  });
}

export const logger = {
  error(message: string, error?: unknown, extra?: Record<string, unknown>) {
    if (isDev) {
      if (extra) {
        console.error(message, error, extra);
      } else {
        console.error(message, error);
      }
      return;
    }
    captureException(message, error, "error", extra);
  },

  fatal(message: string, error?: unknown, extra?: Record<string, unknown>) {
    if (isDev) {
      if (extra) {
        console.error(message, error, extra);
      } else {
        console.error(message, error);
      }
      return;
    }
    captureException(message, error, "fatal", extra);
  },

  warn(message: string, ...args: unknown[]) {
    if (isDev) {
      console.warn(message, ...args);
      return;
    }
    captureMessage(message, "warning", args);
  },

  log(message: string, ...args: unknown[]) {
    if (isDev) {
      console.log(message, ...args);
      return;
    }
    captureMessage(message, "log", args);
  },

  info(message: string, ...args: unknown[]) {
    if (isDev) {
      console.info(message, ...args);
      return;
    }
    captureMessage(message, "info", args);
  },

  debug(message: string, ...args: unknown[]) {
    if (isDev) {
      console.log(message, ...args);
    }
  },
};
