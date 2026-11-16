"use client";

/**
 * Catálogos públicos que las secciones del wizard usan para resolver IDs a
 * labels (incoterm, tipo de pago, tipo de carga, servicios por tipo de
 * embarque y clasificación de carga).
 */

import { useMemo } from "react";
import { incotermsPublico, relacionTipoPublico, tiposPublico } from "@/features/catalogos";

// Referencia estable para queries deshabilitadas o aún sin datos: el default
// `= []` del destructuring crea un array nuevo en cada render (con `data`
// `undefined`), lo que invalida el useMemo de abajo en cada tecla escrita en
// cualquier sección del wizard (rompe la memoización de `datos` completa).
const EMPTY: never[] = [];

export function useCatalogosCartaPublica({
  tokenReady,
  tipoIdEmbarque,
}: {
  tokenReady: boolean;
  tipoIdEmbarque: unknown;
}) {
  const { data: tipoPagoCatalog = EMPTY } = tiposPublico.useLista(
    { tipo_tabla: "PAGO" },
    { enabled: tokenReady },
  );
  const { data: tipoCargaCatalog = EMPTY } = tiposPublico.useLista(
    { tipo_tabla: "TIPO_CARGA" },
    { enabled: tokenReady },
  );
  const { data: transportesCatalog = EMPTY } = tiposPublico.useLista(
    { tipo_tabla: "TRANSPORTE" },
    { enabled: tokenReady },
  );
  const { data: serviciosCatalog = EMPTY } = relacionTipoPublico.useLista(
    { tipo_tabla: "SERVICIO", cod_tipo_padre: tipoIdEmbarque },
    { enabled: tokenReady && Boolean(tipoIdEmbarque) },
  );
  const { data: incotermCatalog = EMPTY } = incotermsPublico.useLista({}, { enabled: tokenReady });
  const { data: clasificacionCargaCatalog = EMPTY } = tiposPublico.useLista(
    { tipo_tabla: "clasificacion_carga" },
    { enabled: tokenReady },
  );

  return useMemo(
    () => ({
      incoterm: incotermCatalog,
      tipoPago: tipoPagoCatalog,
      tipoCarga: tipoCargaCatalog,
      transportes: transportesCatalog,
      servicios: serviciosCatalog,
      clasificacionCarga: clasificacionCargaCatalog,
    }),
    [
      incotermCatalog,
      tipoPagoCatalog,
      tipoCargaCatalog,
      transportesCatalog,
      serviciosCatalog,
      clasificacionCargaCatalog,
    ],
  );
}
