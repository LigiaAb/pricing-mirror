"use client";

/**
 * Guardado por sección de la carta desde el detalle CTS privado (port de
 * `handleGuardarSeccion` del legacy CTS/[id]/page.jsx): arma
 * `{json_data, json_data_usuario}` con buildCartaJson y POSTea
 * actualizar-json-link privado **sin `cod_link_publico`** (con ese campo el
 * backend escribe sobre OTRO link_id y el cambio nunca se refleja al releer —
 * la fila se resuelve por cod_cotizacion_cabecera). Tras guardar: refetch +
 * escritura optimista de la carta fusionada en caché (el GET inmediato puede
 * no reflejar el POST — consistencia eventual del backend).
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildCartaJson,
  buildFacturacionMods,
  extraerCamposModificados,
  extraerJsonCartaInstrucciones,
  useActualizarJsonCartaInstruccionesPrivado,
} from "@/features/carta-instrucciones";

type JsonRecord = Record<string, unknown>;

export interface EstadoAvisoPrivado {
  tipo: "success" | "error";
  mensaje: string;
}

interface Params {
  cotizacionCabeceraId: string | number | null;
  /** Carta fusionada guardada (jsonCarta). */
  jsonCartaCliente: JsonRecord | null;
  cartaListaCoordinacionGuardada: JsonRecord;
  /** Estado en memoria de las secciones. */
  shipperValues: JsonRecord;
  consignatarioValues: JsonRecord;
  facturacionValues: { cliente?: JsonRecord; detalles?: JsonRecord };
  fechasValues: JsonRecord;
  notificacionesValues: JsonRecord;
  cargasPublicasValues: JsonRecord[];
  documentosCropa: Record<string, boolean>;
  /** Ids originales de la coordinación (preselección). */
  entidadIdShipperCoord: unknown;
  entidadIdConsignatarioCoord: unknown;
  refetchCartaCliente: () => Promise<unknown>;
  limpiarEstadoSecciones: () => void;
}

export function useGuardarSeccionPrivada({
  cotizacionCabeceraId,
  jsonCartaCliente,
  cartaListaCoordinacionGuardada,
  shipperValues,
  consignatarioValues,
  facturacionValues,
  fechasValues,
  notificacionesValues,
  cargasPublicasValues,
  documentosCropa,
  entidadIdShipperCoord,
  entidadIdConsignatarioCoord,
  refetchCartaCliente,
  limpiarEstadoSecciones,
}: Params) {
  const queryClient = useQueryClient();
  const { mutateAsync: actualizarJson, isPending: isSaving } =
    useActualizarJsonCartaInstruccionesPrivado();
  const [aviso, setAviso] = useState<EstadoAvisoPrivado | null>(null);

  // El aviso de éxito se autodescarta (banner propio, no toast manual).
  useEffect(() => {
    if (aviso?.tipo !== "success") return;
    const timer = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(timer);
  }, [aviso]);

  // `guardarSeccion` se pasa como `onSave` a TODAS las secciones del wizard:
  // si dependiera directamente de shipperValues/consignatarioValues/etc,
  // cada tecla escrita en cualquier sección cambiaría su identidad y rompería
  // la memoización (React.memo) de las demás. Se leen por ref en su lugar.
  const valoresRef = useRef({
    jsonCartaCliente,
    cartaListaCoordinacionGuardada,
    shipperValues,
    consignatarioValues,
    facturacionValues,
    fechasValues,
    notificacionesValues,
    cargasPublicasValues,
    documentosCropa,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
  });
  valoresRef.current = {
    jsonCartaCliente,
    cartaListaCoordinacionGuardada,
    shipperValues,
    consignatarioValues,
    facturacionValues,
    fechasValues,
    notificacionesValues,
    cargasPublicasValues,
    documentosCropa,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
  };

  const guardarSeccion = useCallback(
    async (overrideCargas?: JsonRecord[]): Promise<"ok" | "error"> => {
      const {
        jsonCartaCliente,
        cartaListaCoordinacionGuardada,
        shipperValues,
        consignatarioValues,
        facturacionValues,
        fechasValues,
        notificacionesValues,
        cargasPublicasValues,
        documentosCropa,
        entidadIdShipperCoord,
        entidadIdConsignatarioCoord,
      } = valoresRef.current;

      const cargasChanged = overrideCargas !== undefined || cargasPublicasValues.length > 0;
      const cargasGuardadas =
        (jsonCartaCliente?.["lista-coordinacion-carga"] as JsonRecord[] | undefined) ?? [];
      const cargasBase =
        overrideCargas ??
        (cargasPublicasValues.length > 0 ? cargasPublicasValues : cargasGuardadas);

      const shipperMods = extraerCamposModificados(shipperValues);
      const consignatarioMods = extraerCamposModificados(consignatarioValues);
      const facturacionMods = buildFacturacionMods(
        extraerCamposModificados(facturacionValues?.cliente ?? {}),
        extraerCamposModificados(facturacionValues?.detalles ?? {}),
      );
      const notificacionesMods =
        Object.keys(notificacionesValues).length > 0 ? notificacionesValues : null;
      const fechasMods = fechasValues?.fecha_recoleccion
        ? { fecha_recoleccion: fechasValues.fecha_recoleccion }
        : null;

      // Documentos CROPA: solo viajan si cambiaron respecto a lo guardado.
      const cropaOriginal =
        ((cartaListaCoordinacionGuardada?.carta_documentos as JsonRecord | undefined)?.cropa as
          | Record<string, boolean>
          | undefined) ?? {};
      const cropaChanged = Object.entries(documentosCropa).some(
        ([key, value]) => value !== (cropaOriginal[key] ?? false),
      );
      const documentosMods = cropaChanged ? { cropa: documentosCropa } : null;

      const { json_data, json_data_usuario } = buildCartaJson({
        originals: {
          listaCoordinacion: cartaListaCoordinacionGuardada,
          cargas: cargasGuardadas,
          fechasMov:
            (jsonCartaCliente?.["lista-coordinacion-fecha-mov"] as JsonRecord[] | undefined) ?? [],
        },
        secciones: {
          shipperMods,
          consignatarioMods,
          facturacionMods,
          notificacionesMods,
          fechasMods,
          documentosMods,
          cargas: cargasBase,
          cargasChanged,
        },
        entidades: {
          shipper: {
            selected: shipperValues?.entidad_id,
            original: entidadIdShipperCoord,
            explicito:
              Array.isArray(shipperValues?._modificados) &&
              (shipperValues._modificados as string[]).includes("entidad_id"),
          },
          consignatario: {
            selected: consignatarioValues?.entidad_id,
            original: entidadIdConsignatarioCoord,
            explicito:
              Array.isArray(consignatarioValues?._modificados) &&
              (consignatarioValues._modificados as string[]).includes("entidad_id"),
          },
        },
      });

      try {
        const resultado = await actualizarJson({
          json_data,
          json_data_usuario,
          cod_cotizacion_cabecera: cotizacionCabeceraId,
        });

        // El backend responde HTTP 200 aunque el guardado falle: sin este
        // chequeo se limpiaría el estado local y el asesor perdería lo escrito.
        if (resultado?.data?.success === false) {
          setAviso({
            tipo: "error",
            mensaje:
              resultado?.data?.mensaje || "No se pudo guardar la sección. Intente nuevamente.",
          });
          return "error";
        }

        setAviso({ tipo: "success", mensaje: "Datos guardados correctamente" });
        // Refetch ANTES de limpiar el estado pendiente: limpiarlo antes haría
        // que un guardado posterior reconstruya la carta desde el snapshot
        // anterior, deshaciendo cambios recién guardados.
        await refetchCartaCliente();

        const jsonCartaOptimista = extraerJsonCartaInstrucciones({
          data: { json_data, json_data_usuario },
        });
        if (jsonCartaOptimista) {
          queryClient.setQueryData(
            ["carta-instrucciones-data", "private", cotizacionCabeceraId],
            (prev: { filaCarta?: unknown } | undefined) => ({
              jsonCarta: jsonCartaOptimista,
              filaCarta: prev?.filaCarta ?? null,
            }),
          );
        }

        limpiarEstadoSecciones();
        return "ok";
      } catch {
        setAviso({
          tipo: "error",
          mensaje: "No se pudo guardar la sección. Intente nuevamente.",
        });
        return "error";
      }
    },
    [
      actualizarJson,
      cotizacionCabeceraId,
      refetchCartaCliente,
      limpiarEstadoSecciones,
      queryClient,
    ],
  );

  return { guardarSeccion, isSaving, aviso, setAviso };
}
