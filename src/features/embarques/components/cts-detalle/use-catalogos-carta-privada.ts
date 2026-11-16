"use client";

/**
 * Catálogos privados que las secciones del wizard y el motor de commit usan
 * para resolver IDs a labels (incoterm, tipo de pago, tipo de carga,
 * servicios por tipo de embarque, embalaje y clasificación de carga).
 * Espejo de `use-catalogos-carta-publica` alimentado por los endpoints
 * privados.
 */

import { useMemo } from "react";
import { incoterms, tipos } from "@/features/catalogos";

export function useCatalogosCartaPrivada({ tipoIdEmbarque }: { tipoIdEmbarque: unknown }) {
  const { data: tipoPagoCatalog = [] } = tipos.useLista({ tipo_tabla: "PAGO" });
  const { data: tipoCargaCatalog = [] } = tipos.useLista({ tipo_tabla: "TIPO_CARGA" });
  const { data: incotermCatalogRaw = [] } = incoterms.useLista({});
  const { data: serviciosCatalog = [] } = tipos.useLista(
    { tipo_tabla: "SERVICIO", cod_tipo_padre: tipoIdEmbarque },
    { enabled: Boolean(tipoIdEmbarque) },
  );
  // El motor de commit resuelve el tipo de embalaje de cada carga contra este
  // catálogo (buildCargaPayload).
  const { data: embalajeCatalog = [] } = tipos.useLista({ tipo_tabla: "embalaje" });
  const { data: clasificacionCargaCatalog = [] } = tipos.useLista({
    tipo_tabla: "clasificacion_carga",
  });

  return useMemo(
    () => ({
      // Mismo shape {value,label} que expone el catálogo público de incoterms.
      incoterm: incotermCatalogRaw.map((i) => ({
        value: i.incoterm_id,
        label: `${i.codigo ?? ""} - ${i.nombre_eng ?? ""} ( ${i.nombre} )`,
        codigo: i.codigo,
      })),
      tipoPago: tipoPagoCatalog,
      tipoCarga: tipoCargaCatalog,
      servicios: serviciosCatalog,
      embalaje: embalajeCatalog,
      clasificacionCarga: clasificacionCargaCatalog,
    }),
    [
      incotermCatalogRaw,
      tipoPagoCatalog,
      tipoCargaCatalog,
      serviciosCatalog,
      embalajeCatalog,
      clasificacionCargaCatalog,
    ],
  );
}
