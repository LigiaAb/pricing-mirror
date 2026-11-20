"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  cargarVersion,
  construirFiltrosCalculo,
  cotizacionesCabeceraOptions,
  versionesOptions,
} from "@/features/pricing/cotizacion/calculo";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import type { FilaKpi } from "../api/kpi-cotizaciones";

/**
 * Todo lo de una cotización del reporte, con las mismas APIs que la pantalla de cotización:
 *  - cabecera completa: `lista-cotizacion-cabecera` filtrada por cliente y empresa (no hay
 *    consulta por id), buscando la cotización en el resultado;
 *  - versiones: `lista-cotizacion-detalle`;
 *  - versión activa (`cod_version_activa`, o la última): `cargarVersion` (rubros,
 *    dimensiones, legs, criterios guardados y la descripción de cada criterio).
 * Solo consulta mientras la ficha está abierta (`fila` no nula).
 */
export function useFichaCotizacion(fila: FilaKpi | null) {
  const cod = fila?.cotizacion ?? null;

  const cabeceras = useQuery({
    ...cotizacionesCabeceraOptions({
      entidad_id: fila?.cod_cliente ?? null,
      cod_empresa: fila?.cod_empresa ?? null,
    }),
    enabled: fila != null,
  });

  const cabecera = useMemo(
    () => cabeceras.data?.find((c) => String(c.cod_cotizacion_cabecera) === String(cod)) ?? null,
    [cabeceras.data, cod],
  );

  const versiones = useQuery({ ...versionesOptions(cod), enabled: cod != null });

  const versionActiva = useMemo(() => {
    const lista = versiones.data ?? [];
    const activa = cabecera?.cod_version_activa;
    return (
      (activa == null
        ? undefined
        : lista.find((v) => String(v.cod_cotizaciondetalle) === String(activa))) ??
      lista.at(-1) ??
      null
    );
  }, [versiones.data, cabecera?.cod_version_activa]);

  const codDetalle = versionActiva?.cod_cotizaciondetalle ?? null;

  const detalle = useQuery({
    ...CACHE_DYNAMIC,
    queryKey: ["reportes", "ficha-cotizacion", cod, codDetalle],
    queryFn: () => {
      if (cod == null || codDetalle == null || cabecera == null) {
        throw new Error("Falta la cotización o su versión.");
      }
      return cargarVersion({
        codCotizacionCabecera: cod,
        codCotizacionDetalle: codDetalle,
        filtros: construirFiltrosCalculo(cabecera),
      });
    },
    enabled: cod != null && codDetalle != null && cabecera != null,
  });

  return {
    cabecera,
    versiones: versiones.data ?? [],
    versionActiva,
    detalle: detalle.data ?? null,
    cargando: cabeceras.isLoading || versiones.isLoading || detalle.isLoading,
    error: cabeceras.error ?? versiones.error ?? detalle.error ?? null,
  };
}
