"use client";

/**
 * Guardado por sección de la carta pública (port de `handleGuardarSeccion` del
 * legacy public/page.jsx): arma `{json_data, json_data_usuario}` con
 * buildCartaJson, POSTea actualizar-json-link con el token de interacción y,
 * tras guardar, refetchea y escribe la carta fusionada de forma optimista en
 * la caché (el GET inmediato puede no reflejar el POST — consistencia eventual
 * del backend).
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  extraerJsonCartaInstrucciones,
  useActualizarJsonCartaInstruccionesPublico,
} from "@/features/carta-instrucciones";
import type { CliInfo } from "@/features/embarques/lib/cli-info";
import { buildGuardarSeccionPayload } from "./guardar-seccion-publica-payload";

type JsonRecord = Record<string, unknown>;

export type ResultadoGuardado = "ok" | "culmino" | "error";

export interface EstadoAviso {
  tipo: "success" | "error";
  mensaje: string;
}

interface Params {
  embarqueId: number;
  cliInfo: CliInfo | null;
  /** Carta fusionada guardada (jsonCarta) y snapshot del resumen. */
  jsonCartaCliente: JsonRecord | null;
  cartaListaCoordinacionGuardada: JsonRecord;
  cargas: JsonRecord[];
  fechasMovOriginales: JsonRecord[];
  /** Estado en memoria de las secciones. */
  shipperValues: JsonRecord;
  consignatarioValues: JsonRecord;
  facturacionValues: { cliente?: JsonRecord; detalles?: JsonRecord };
  fechasValues: JsonRecord;
  notificacionesValues: JsonRecord;
  cargasPublicasValues: JsonRecord[];
  documentosCropa: Record<string, boolean>;
  /** Ids originales de la coordinación. */
  entidadIdShipperCoord: unknown;
  entidadIdConsignatarioCoord: unknown;
  /** Maestro de entidades relacionadas normalizado. */
  allEntidades: JsonRecord[];
  industriaLabel: (value: unknown) => string | null | undefined;
  refetchTodo: () => Promise<unknown>;
  limpiarEstadoSecciones: () => void;
}

export function useGuardarSeccionPublica({
  embarqueId,
  cliInfo,
  jsonCartaCliente,
  cartaListaCoordinacionGuardada,
  cargas,
  fechasMovOriginales,
  shipperValues,
  consignatarioValues,
  facturacionValues,
  fechasValues,
  notificacionesValues,
  cargasPublicasValues,
  documentosCropa,
  entidadIdShipperCoord,
  entidadIdConsignatarioCoord,
  allEntidades,
  industriaLabel,
  refetchTodo,
  limpiarEstadoSecciones,
}: Params) {
  const queryClient = useQueryClient();
  const { mutateAsync: actualizarJson, isPending: isSaving } =
    useActualizarJsonCartaInstruccionesPublico();
  const [aviso, setAviso] = useState<EstadoAviso | null>(null);
  const [completadoMensaje, setCompletadoMensaje] = useState("");

  // El aviso de éxito se autodescarta (no es un toast manual: banner propio).
  useEffect(() => {
    if (aviso?.tipo !== "success") return;
    const timer = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(timer);
  }, [aviso]);

  // `guardarSeccion` se pasa como `onSave` a TODAS las secciones del wizard:
  // si dependiera directamente de shipperValues/consignatarioValues/etc, cada
  // tecla escrita en cualquier sección cambiaría su identidad y rompería la
  // memoización (React.memo) de las demás. Se leen por ref en su lugar.
  const valoresRef = useRef({
    jsonCartaCliente,
    cartaListaCoordinacionGuardada,
    cargas,
    fechasMovOriginales,
    shipperValues,
    consignatarioValues,
    facturacionValues,
    fechasValues,
    notificacionesValues,
    cargasPublicasValues,
    documentosCropa,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    allEntidades,
  });
  valoresRef.current = {
    jsonCartaCliente,
    cartaListaCoordinacionGuardada,
    cargas,
    fechasMovOriginales,
    shipperValues,
    consignatarioValues,
    facturacionValues,
    fechasValues,
    notificacionesValues,
    cargasPublicasValues,
    documentosCropa,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    allEntidades,
  };

  const guardarSeccion = useCallback(
    async (overrideCargas?: JsonRecord[], codEstado?: number): Promise<ResultadoGuardado> => {
      const { json_data, json_data_usuario } = buildGuardarSeccionPayload(
        valoresRef.current,
        overrideCargas,
        industriaLabel,
      );

      try {
        const resultado = await actualizarJson({
          json_data,
          json_data_usuario,
          token_interaccion: cliInfo?.token_interaccion,
          version_app: cliInfo?.version_app || "0.0.2",
          ...(codEstado !== undefined ? { cod_estado: codEstado } : {}),
        });

        // 1002 "la gestión ya culminó": el formulario ya fue completado y no
        // admite más cambios — se muestra la pantalla de éxito.
        const codMensaje = Number(resultado?.data?.cod_mensaje);
        const mensaje = resultado?.data?.mensaje ?? "";
        if (codMensaje === 1002 || /culmin/i.test(mensaje)) {
          setCompletadoMensaje(mensaje || "La gestión ya culminó de manera satisfactoria");
          return "culmino";
        }

        // El backend responde HTTP 200 aunque el guardado falle (token vencido,
        // 1001/1003/1062): sin este chequeo se limpiaría el estado local igual
        // que en un guardado exitoso y el cliente perdería lo que escribió.
        if (resultado?.data?.success === false) {
          setAviso({
            tipo: "error",
            mensaje: mensaje || "Error al guardar los datos. Intente nuevamente.",
          });
          return "error";
        }

        // Al completar la carta el resultado se comunica mediante la pantalla
        // terminal; no se muestra un segundo mensaje de éxito intermedio.
        if (codEstado === undefined) {
          setAviso({ tipo: "success", mensaje: "Datos guardados correctamente" });
        }
        // Esperar el refetch ANTES de limpiar el estado pendiente: limpiarlo
        // antes haría que un guardado posterior en vuelo reconstruya la carta
        // desde el snapshot anterior, deshaciendo cambios recién guardados.
        await refetchTodo();

        // Escritura optimista: reconstruimos localmente el mismo jsonCarta
        // fusionado que produciría el backend y lo escribimos en la caché para
        // que la UI (y el PDF) vean el dato recién guardado sin depender del
        // timing de la lectura.
        const jsonCartaOptimista = extraerJsonCartaInstrucciones({
          data: { json_data, json_data_usuario },
        });
        if (jsonCartaOptimista) {
          queryClient.setQueryData(
            ["carta-instrucciones-data", "public", embarqueId],
            (prev: { filaCarta?: unknown } | undefined) => ({
              jsonCarta: jsonCartaOptimista,
              filaCarta: prev?.filaCarta ?? null,
            }),
          );
        }

        limpiarEstadoSecciones();
        return "ok";
      } catch {
        setAviso({ tipo: "error", mensaje: "Error al guardar los datos" });
        return "error";
      }
    },
    [
      actualizarJson,
      cliInfo,
      refetchTodo,
      limpiarEstadoSecciones,
      queryClient,
      embarqueId,
      industriaLabel,
    ],
  );

  return { guardarSeccion, isSaving, aviso, setAviso, completadoMensaje };
}
