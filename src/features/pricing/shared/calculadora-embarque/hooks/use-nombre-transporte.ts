"use client";

import React from "react";

import { tipos } from "@/features/catalogos";

import { reconocerTransporte } from "../lib/calculos";

/**
 * Nombre (nomTipo) del tipo de transporte, desde el catálogo `tipos` con
 * `tipo_tabla = 'TRANSPORTE'`. Las conversiones deciden por nombre, no por código,
 * porque los códigos pueden cambiar entre ambientes (#157).
 *
 * Usa la misma consulta que `useCatalogosPricing` (`tipos.useLista()` sin filtros),
 * así que React Query no repite la llamada si la pantalla ya cargó los catálogos.
 *
 * `reconocido`: `false` si el código no está en el catálogo o su nombre no es
 * AEREO / MARITIMO / TERRESTRE; la calculadora calcula como AEREO y lo avisa.
 */
export function useNombreTransporte(codTipoTransporte?: string | number | null) {
  const lista = tipos.useLista();

  const nombre = React.useMemo(() => {
    if (codTipoTransporte == null || codTipoTransporte === "") return null;

    const tipo = (lista.data ?? []).find(
      (item) =>
        item.tipoTabla === "TRANSPORTE" && String(item.codTipo) === String(codTipoTransporte),
    );

    return tipo?.nomTipo ?? null;
  }, [lista.data, codTipoTransporte]);

  return {
    nombre,
    reconocido: reconocerTransporte(nombre) != null,
    isLoading: Boolean(lista.isLoading),
  };
}
