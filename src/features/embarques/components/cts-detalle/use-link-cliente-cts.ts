"use client";

/**
 * Generación del Link Cliente desde el detalle CTS (plan de paridad §4.A.2.9):
 * el payload incluye `embarque_id`, la carta fusionada actual como `json_data`
 * (o el armado inicial coordinación+cargas+fechas-mov si aún no hay carta) y
 * `json_data_usuario` tal cual está guardado, para que el nuevo link conserve
 * el borrador del cliente. La vista pública obtiene la cotización del JWT.
 */

import { useCallback, useState } from "react";
import { useGenerarLinkCartaInstruccionesPrivado } from "@/features/carta-instrucciones";
import type { Coordinacion } from "@/features/coordinaciones";
import { useUpdateCoordinacion } from "@/features/coordinaciones";
import {
  COD_CC_EMBARQUES,
  COD_EMPRESA_EMBARQUES,
  COD_MODULO_EMBARQUES,
} from "@/features/embarques/lib/constantes";
import { buildCoordPayload } from "@/shared/lib/payload-utils";
import { asText } from "@/shared/lib/text";

type JsonRecord = Record<string, unknown>;

interface Params {
  embarqueId: number | null;
  embarqueData: Coordinacion | null | undefined;
  cotizacionCabeceraId: string | number | null;
  entidadIdCliente: unknown;
  jsonCartaCliente: JsonRecord | null;
  filaCartaCliente: JsonRecord | null;
  listaCoordinacion: JsonRecord;
  cargas: unknown[];
  fechasMovData: unknown[];
}

function extraerLinkExistente(embarqueData: Coordinacion | null | undefined): string {
  const raw = embarqueData?.jsonDatosOpcionales ?? embarqueData?.json_datos_opcionales ?? null;
  if (!raw) return "";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return asText((parsed as JsonRecord)?.linkCliente);
  } catch {
    return "";
  }
}

export function useLinkClienteCts({
  embarqueId,
  embarqueData,
  cotizacionCabeceraId,
  entidadIdCliente,
  jsonCartaCliente,
  filaCartaCliente,
  listaCoordinacion,
  cargas,
  fechasMovData,
}: Params) {
  const [generatedLink, setGeneratedLink] = useState("");
  const { mutate: actualizarCoordinacion } = useUpdateCoordinacion();

  const existingLinkCliente = extraerLinkExistente(embarqueData);

  const { mutate: generarLink, isPending: isGeneratingLink } =
    useGenerarLinkCartaInstruccionesPrivado({
      onSuccess: (data) => {
        const resData = data.data as unknown as JsonRecord | undefined;
        let url = asText(resData?.url_cliente ?? resData?.link);
        if (!url && typeof data === "string") url = data;
        url = url.replaceAll('"', "");
        setGeneratedLink(url);
        if (url && embarqueData) {
          // Persistir el link en json_datos_opcionales de la coordinación para
          // reutilizarlo la próxima vez que se abra el diálogo.
          actualizarCoordinacion(
            buildCoordPayload(embarqueData, {
              json_datos_opcionales: { linkCliente: url },
            }) as Record<string, unknown>,
          );
        }
      },
      onError: () => setGeneratedLink(""),
    });

  const handleGenerarLink = useCallback(
    (enviarNotificacion = true) => {
      setGeneratedLink("");
      if (!cotizacionCabeceraId || !embarqueId) return;

      // json_data_usuario tal cual está guardado: el nuevo link conserva el
      // borrador exacto del cliente.
      const jsonDataUsuarioActual =
        filaCartaCliente?.json_data_usuario ??
        filaCartaCliente?.JSON_DATA_USUARIO ??
        filaCartaCliente?.jsonDataUsuario ??
        null;

      generarLink({
        entidad_id: Number(entidadIdCliente ?? 0),
        cod_cotizacion_cabecera: Number(cotizacionCabeceraId),
        embarque_id: Number(embarqueId),
        cod_modulo: COD_MODULO_EMBARQUES,
        cod_cc: Number(embarqueData?.cod_cc ?? embarqueData?.centroId ?? COD_CC_EMBARQUES),
        cod_empresa: Number(
          embarqueData?.cod_empresa ?? embarqueData?.empresaId ?? COD_EMPRESA_EMBARQUES,
        ),
        endpoint_front: globalThis.location.origin,
        url_front: "/public/cts",
        json_data: jsonCartaCliente ?? {
          "lista-coordinacion": listaCoordinacion,
          "lista-coordinacion-carga": cargas,
          "lista-coordinacion-fecha-mov": fechasMovData,
        },
        json_data_usuario: jsonDataUsuarioActual,
        // Plan §7.D.5: correo de notificación al cliente, opt-out por checkbox.
        enviar_notificacion: Boolean(enviarNotificacion),
      });
    },
    [
      cotizacionCabeceraId,
      embarqueId,
      entidadIdCliente,
      embarqueData,
      filaCartaCliente,
      jsonCartaCliente,
      listaCoordinacion,
      cargas,
      fechasMovData,
      generarLink,
    ],
  );

  return {
    existingLinkCliente,
    generatedLink,
    setGeneratedLink,
    isGeneratingLink,
    handleGenerarLink,
  };
}
