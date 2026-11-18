import "server-only";
import { cookies, headers } from "next/headers";
import { env } from "@/shared/config/env";

const TOKEN_COOKIE = "auth-token";

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

/**
 * Secure según el protocolo por el que llegó la petición: NPM lo declara en
 * X-Forwarded-Proto y nginx/proxy-headers.conf lo reenvía. Así app.cropa.com.gt
 * (HTTPS) emite Secure y erpdev (HTTP, solo LAN) no, sin configuración por
 * servidor. Sin cabecera se cae al criterio por entorno.
 */
async function isSecureRequest(): Promise<boolean> {
  const forwardedProto = (await headers()).get("x-forwarded-proto");
  if (!forwardedProto) return env.NODE_ENV === "production";
  // Varios proxies encadenados la acumulan ("https,http"): manda el primero.
  return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
}

export async function setServerToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: await isSecureRequest(),
    sameSite: "lax",
    path: "/",
  });
}

export async function removeServerToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}
