"use client";

import { relacionTipoPublico, tiposPublico } from "@/features/catalogos";

// G1: régimen aduanal, embalaje y unidad de medida de dimensiones — mismos
// catálogos que alimentan los <select> del formulario, para resolver el ID
// crudo de cada carga a etiqueta legible en el PDF.
export function useCatalogosPdfCargas({ tokenReady }: { tokenReady: boolean }) {
  const { data: regimenAduanalCatalog = [] } = tiposPublico.useLista(
    { tipo_tabla: "REGIMEN_ADUANAL" },
    { enabled: tokenReady },
  );
  const { data: tipoEmbalajeCatalog = [] } = tiposPublico.useLista(
    { tipo_tabla: "embalaje" },
    { enabled: tokenReady },
  );
  const { data: unidadMedidaCatalog = [] } = relacionTipoPublico.useLista(
    { tipo_tabla: "coordinacion_carga", cod_tipo_padre: 296 },
    { enabled: tokenReady },
  );

  return { regimenAduanalCatalog, tipoEmbalajeCatalog, unidadMedidaCatalog };
}
