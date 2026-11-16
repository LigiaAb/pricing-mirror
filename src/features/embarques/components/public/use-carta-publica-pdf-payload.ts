"use client";

/**
 * Payload del PDF de la carta pública (`cartaPublicaData`): solo datos ya
 * persistidos (no las ediciones en pantalla). Extraído de
 * `useDatosCartaPublica` para mantenerlo bajo el límite de tamaño de
 * archivo.
 */

import { useMemo } from "react";
import type { ResumenCoordinacionPublico } from "@/features/coordinaciones";
import { type CartaPublicaDataParams, construirCartaPublicaData } from "./carta-publica-data";

export function useCartaPublicaPdfPayload({
  resumenData,
  allEntidades,
  ...params
}: Omit<CartaPublicaDataParams, "entidades"> & {
  resumenData: ResumenCoordinacionPublico | undefined;
  allEntidades: CartaPublicaDataParams["entidades"];
}) {
  const {
    entidadesPublicas,
    facturacionPublica,
    notificacionesPublica,
    infoCoordinacionPublica,
    detallesData,
    listaCoordinacion,
    facturacionResuelta,
    codFile,
    entidadShipperFallback,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    entidadIdClienteCoord,
    contactoIdClienteCoord,
    catalogos,
    resolverNombrePais,
  } = params;

  return useMemo(() => {
    if (!resumenData) return null;
    return construirCartaPublicaData({
      entidadesPublicas,
      facturacionPublica,
      notificacionesPublica,
      infoCoordinacionPublica,
      detallesData,
      listaCoordinacion,
      facturacionResuelta,
      codFile,
      entidades: allEntidades,
      entidadShipperFallback,
      entidadIdShipperCoord,
      entidadIdConsignatarioCoord,
      entidadIdClienteCoord,
      contactoIdClienteCoord,
      catalogos,
      resolverNombrePais,
    });
  }, [
    resumenData,
    entidadesPublicas,
    facturacionPublica,
    notificacionesPublica,
    infoCoordinacionPublica,
    codFile,
    listaCoordinacion,
    resolverNombrePais,
    facturacionResuelta,
    catalogos,
    detallesData,
    allEntidades,
    entidadShipperFallback,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    entidadIdClienteCoord,
    contactoIdClienteCoord,
  ]);
}
