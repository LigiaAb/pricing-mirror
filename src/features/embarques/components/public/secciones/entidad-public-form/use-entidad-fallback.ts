"use client";

/**
 * Detalle de resolución de entidad pública: el endpoint de entidades
 * relacionadas puede no incluir todos los sub-registros. Se hidrata siempre
 * el maestro de la entidad seleccionada para mostrar dirección,
 * identificación e información existentes, incluso si la entidad sí aparece
 * en esa lista.
 */

import { useMemo } from "react";
import { useFetchDatosEntidadPrivado, useFetchDatosEntidadPublico } from "@/features/entidades";
import { aplanarEntidadPublica } from "../../entidad-resolvers";
import type { JsonRecord } from "./model";

interface Params {
  apiMode: "public" | "private";
  entidadSeleccionadaId: unknown;
  codTipo: number;
  /** El token público se setea async en el padre; sin esto el fetch dispara sin Authorization. */
  tokenReady: boolean;
  enabled?: boolean;
  /** Entidad cliente, para `fallbackMaestroCliente` (ver EntidadPublicConfig). */
  clienteId?: unknown;
  clienteCodTipo?: number;
}

const SUBREGISTROS = [
  "data_nombres",
  "data_contactos",
  "data_direcciones",
  "data_identificaciones",
] as const;

/** Atributos que el formulario muestra y que el cascarón suele traer nulos. */
const ATRIBUTOS_HEREDABLES = [
  "cod_pais",
  "nombre_pais",
  "cod_ciudad",
  "nombre_ciudad",
  "cod_industria",
  "nom_industria_es",
] as const;

const tieneSubregistros = (ent: JsonRecord | null): boolean =>
  Boolean(ent) &&
  SUBREGISTROS.some((key) => Array.isArray(ent?.[key]) && (ent[key] as unknown[]).length > 0);

const esVacio = (v: unknown): boolean => v === undefined || v === null || v === "";

export function useEntidadFallback({
  apiMode,
  entidadSeleccionadaId,
  codTipo,
  tokenReady,
  enabled = true,
  clienteId,
  clienteCodTipo,
}: Params): JsonRecord | null {
  const isPublic = apiMode === "public";
  const publicQuery = useFetchDatosEntidadPublico(
    { entidad_id: entidadSeleccionadaId },
    {
      enabled: enabled && isPublic && tokenReady && Boolean(entidadSeleccionadaId),
    },
  );
  const privateQuery = useFetchDatosEntidadPrivado(
    { entidad_id: entidadSeleccionadaId, cod_tipo: codTipo },
    { enabled: enabled && !isPublic && Boolean(entidadSeleccionadaId) },
  );
  // Maestro del cliente: solo se pide en privado. En público el endpoint ya
  // devuelve la ficha del propio token (el cliente) sin importar el id pedido,
  // así que ese modo nunca necesita esta segunda consulta.
  const clienteQuery = useFetchDatosEntidadPrivado(
    { entidad_id: clienteId, cod_tipo: clienteCodTipo },
    { enabled: enabled && !isPublic && Boolean(clienteId) && Boolean(clienteCodTipo) },
  );
  const entidadFallbackRaw = isPublic ? publicQuery.data : privateQuery.data;
  const clienteRaw = isPublic ? undefined : clienteQuery.data;

  return useMemo((): JsonRecord | null => {
    if (!enabled) return null;
    const propio = aplanarEntidadPublica(entidadFallbackRaw);
    if (tieneSubregistros(propio)) return propio;
    const cliente = aplanarEntidadPublica(clienteRaw);
    if (!tieneSubregistros(cliente)) return propio;
    // Mientras la ficha propia no llegue se devuelve null: heredar aquí la del
    // cliente mostraría su nombre como si fuera el de la entidad.
    if (!propio) return null;
    // Se conserva la identidad de la ficha propia (nombre y lo que sí tenga) y
    // solo se completa lo que le falta: sub-registros y atributos en nulo.
    const heredado: JsonRecord = Object.fromEntries(
      SUBREGISTROS.map((key) => [key, cliente?.[key] ?? []]),
    );
    for (const key of ATRIBUTOS_HEREDABLES) {
      if (esVacio(propio[key]) && !esVacio(cliente?.[key])) heredado[key] = cliente?.[key];
    }
    return { ...propio, ...heredado };
  }, [enabled, entidadFallbackRaw, clienteRaw]);
}
