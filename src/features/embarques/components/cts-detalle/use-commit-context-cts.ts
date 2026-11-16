"use client";

/**
 * Contexto del motor de commit (A.3) armado desde la capa de datos del detalle
 * CTS: con esto "Crear Coordinación" aplica el borrador de la carta a los
 * endpoints reales. Incluye la preselección de shipper/consignatario que el
 * formulario muestra como válida (fallback D/A.3 — sin él, una coordinación
 * nueva donde nunca se tocó el selector omitía el rol y no asignaba el shipper
 * mostrado).
 */

import { useMemo } from "react";
import type { CommitContextInput } from "../../hooks/use-commit-pending-changes";
import { CROPA_DOCS } from "../../lib/constantes";
import type { useDatosCartaPrivada } from "./use-datos-carta-privada";

type JsonRecord = Record<string, unknown>;

export function useCommitContextCts({
  datos,
  embarqueId,
}: {
  datos: ReturnType<typeof useDatosCartaPrivada>;
  embarqueId: number | null;
}): CommitContextInput {
  return useMemo(
    () => ({
      embarqueData: datos.embarqueData as unknown as JsonRecord,
      jsonCartaCliente: datos.jsonCartaCliente,
      cartaListaCoordinacion: datos.cartaListaCoordinacionGuardada,
      fechasMovData: datos.fechasMovData as unknown as JsonRecord[],
      catalogos: {
        tiposPagoCatalog: datos.catalogos.tipoPago,
        tiposCargaCatalog: datos.catalogos.tipoCarga,
        tiposServicioCatalog: datos.catalogos.servicios,
        tiposEmbalajeCatalog: datos.catalogos.embalaje,
        clasificacionCargaCatalog: datos.catalogos.clasificacionCarga,
      },
      cropaDocKeys: CROPA_DOCS.map(({ key }) => key),
      entidadIdCliente: datos.entidadIdCliente,
      cotizacionCabeceraId: datos.cotizacionCabeceraId,
      embarqueId,
      entidadIdShipperCoord: datos.entidadIdShipperCoord,
      entidadIdConsignatarioCoord: datos.entidadIdConsignatarioCoord,
      refetchCartaCliente: datos.refetchCartaCliente,
    }),
    [
      datos.embarqueData,
      datos.jsonCartaCliente,
      datos.cartaListaCoordinacionGuardada,
      datos.fechasMovData,
      datos.catalogos,
      datos.entidadIdCliente,
      datos.cotizacionCabeceraId,
      embarqueId,
      datos.entidadIdShipperCoord,
      datos.entidadIdConsignatarioCoord,
      datos.refetchCartaCliente,
    ],
  );
}
