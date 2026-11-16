"use client";

/**
 * Flags de visibilidad de secciones/pasos derivados de la carta pública
 * (gastos, clasificación de carga, peligrosidad) y `codFile` resuelto.
 * Extraído de `useDatosCartaPublica` para mantenerlo bajo el límite de
 * tamaño de archivo.
 */

import { useMemo } from "react";
import type { ResumenCoordinacionPublico } from "@/features/coordinaciones";
import {
  CLASIFICACION_CARGA_PELIGROSA,
  COD_RUBRO_DOCS_CROPA,
  COD_RUBRO_FECHAS,
} from "@/features/embarques/lib/constantes";
import { texto } from "./entidad-resolvers";

type JsonRecord = Record<string, unknown>;

export function useFlagsCartaPublica({
  resumenData,
  detallesData,
}: {
  resumenData: ResumenCoordinacionPublico | undefined;
  detallesData: JsonRecord;
}) {
  const showCropaDocs = useMemo(
    () => (resumenData?.gastos ?? []).some((g) => Number(g.codRubro) === COD_RUBRO_DOCS_CROPA),
    [resumenData],
  );
  const showFechas = useMemo(
    () => (resumenData?.gastos ?? []).some((g) => Number(g.codRubro) === COD_RUBRO_FECHAS),
    [resumenData],
  );

  // Paso "Documentos": solo con clasificación PELIGROSA (exige Hoja de
  // Seguridad MSDS) y/o cobertura de seguro activa ("C" en el array de
  // peligrosidad guardado en Detalles → exige Factura Cobertura Seguro).
  const showDocumentosPeligrosidad = useMemo(
    () => Number(detallesData.clasificacionCarga) === CLASIFICACION_CARGA_PELIGROSA,
    [detallesData.clasificacionCarga],
  );
  const showDocumentosCoberturaSeguro = useMemo(
    () =>
      Array.isArray(detallesData.peligrosidad) &&
      (detallesData.peligrosidad as string[]).includes("C"),
    [detallesData.peligrosidad],
  );

  const codFile = useMemo(() => {
    return texto(resumenData?.coordinacion?.codFile);
  }, [resumenData?.coordinacion?.codFile]);

  return {
    showCropaDocs,
    showFechas,
    showDocumentosPeligrosidad,
    showDocumentosCoberturaSeguro,
    codFile,
  };
}
