/**
 * Decodifica el query param `cli_inf` del link público de la carta de
 * instrucciones. El backend lo emite en dos formatos históricos:
 *  1. base64 de un JSON plano `{ entidad_id, embarque_id, version_app, … }`.
 *  2. un JWT — se decodifica el payload (sin validar firma: la validación es
 *     del backend) para extraer entidad_id / embarque_id / app_version.
 * En ambos casos el token de interacción que viaja en los headers públicos es
 * el `cli_inf` completo salvo que el JSON traiga `token_interaccion` propio.
 */

import { logger } from "@/shared/lib/logger";

export interface CliInfo {
  token_interaccion: string;
  entidad_id?: number | string | null;
  embarque_id?: number | string | null;
  cod_tipo?: number | string | null;
  version_app?: string | null;
  app_version?: string | null;
  [key: string]: unknown;
}

function decodeBase64(value: string): string | null {
  try {
    if (typeof atob === "function") return atob(value);
    return Buffer.from(value, "base64").toString("binary");
  } catch {
    return null;
  }
}

export function parseCliInfo(cli: string | null | undefined): CliInfo | null {
  if (!cli) return null;

  // intento 1: base64 de un JSON plano
  const decoded = decodeBase64(cli);
  if (decoded) {
    try {
      const json = JSON.parse(decoded) as Record<string, unknown>;
      if (json && typeof json === "object" && !Array.isArray(json)) {
        return {
          ...json,
          token_interaccion: String(json.token_interaccion || cli),
        };
      }
    } catch (error) {
      logger.debug("cli_inf no era base64-json, se intenta como JWT:", error);
    }
  }

  // intento 2: JWT — solo el payload
  const parts = cli.split(".");
  if (parts.length === 3 && parts[1]) {
    const payloadRaw = decodeBase64(parts[1].replaceAll("-", "+").replaceAll("_", "/"));
    if (payloadRaw) {
      try {
        const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
        return {
          token_interaccion: cli,
          entidad_id: (payload?.entidad_id ?? payload?.ENTIDAD_ID ?? null) as
            | number
            | string
            | null,
          embarque_id: (payload?.embarque_id ?? payload?.EMBARQUE_ID ?? null) as
            | number
            | string
            | null,
          app_version: (payload?.app_version ?? null) as string | null,
        };
      } catch (error) {
        logger.debug("Payload de JWT en cli_inf ilegible, cae al token plano:", error);
      }
    }
  }

  return { token_interaccion: cli };
}
