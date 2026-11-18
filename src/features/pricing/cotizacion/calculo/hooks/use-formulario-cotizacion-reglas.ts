"use client";

import * as React from "react";
import type { Empresa, Pais, Tipo } from "@/features/catalogos";
import type { CotizacionCabeceraPayload } from "../api/cotizacion-cabecera";
import { CAMPOS_REQUERIDOS, type ReglaCampoCabecera } from "../lib/cabecera";
import { COD_TIPO_SERVICIO_ESTACION, TIPO_PAGO } from "../lib/constantes";
import { getLabel, getValue, PAISES_TERRESTRES } from "../lib/formulario-cotizacion-helpers";
import type {
  CatalogosFormularioCotizacion,
  OpcionFormularioCotizacion,
  TipoFormularioCotizacion,
  ValoresFormulario,
} from "../lib/formulario-cotizacion-tipos";
import type { Id } from "../lib/tipos";
import { mismoId } from "../lib/utils";

type Params = {
  values: ValoresFormulario;
  catalogos: CatalogosFormularioCotizacion;
  reglasCampos: Record<string, ReglaCampoCabecera>;
  tipoFormulario: TipoFormularioCotizacion;
  defaultValues: CotizacionCabeceraPayload | undefined;
  inputsToHide: readonly string[];
  groupsToHide: readonly string[];
  inputsReadOnly: readonly string[];
  inputsNoObligatorios: readonly string[];
};

/**
 * Reglas que dependen de los valores del formulario de cotización: catálogos filtrados,
 * visibilidad, solo lectura y campos obligatorios. Parte de `useFormularioCotizacion`.
 */
export function useFormularioCotizacionReglas({
  values,
  catalogos,
  reglasCampos,
  tipoFormulario,
  defaultValues,
  inputsToHide,
  groupsToHide,
  inputsReadOnly,
  inputsNoObligatorios,
}: Params) {
  /* ==========================================================================
   * CATÁLOGOS DEPENDIENTES
   * ========================================================================== */

  const obtenerCatalogoById = React.useCallback(
    (id: string, currentValues: Record<string, unknown> = values) => {
      const values_inter = currentValues ?? values;
      const catalogoId = reglasCampos?.[id]?.catalogo;
      if (!catalogoId) return [];

      if (
        (id === "paisOrigen" || id === "paisDestino") &&
        getLabel(values_inter.tipoTransporte).trim().toUpperCase() === "TERRESTRE"
      ) {
        return ((catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[]).filter(
          (pais) =>
            PAISES_TERRESTRES.has(
              String(pais.ref_pais_2 ?? "")
                .trim()
                .toUpperCase(),
            ),
        );
      }

      if (id === "ciudadOrigen") {
        const paisSeleccionado = values_inter.paisOrigen as Pais | null;

        return ((catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[]).filter(
          (cc) => cc.cod_pais === paisSeleccionado?.cod_pais,
        );
      }
      if (id === "ciudadDestino") {
        const paisSeleccionado = values_inter.paisDestino as Pais | null;

        return ((catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[]).filter(
          (cc) => cc.cod_pais === paisSeleccionado?.cod_pais,
        );
      }

      if (id === "puntoEnlaceOrigen") {
        const paisSeleccionado = values_inter.paisOrigen as Pais | null;
        const tipoPuntoOrigenSeleccionado = values_inter.tipoPuntoEnlaceOrigen as Tipo | null;

        return ((catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[])
          .filter((cc) => cc.cod_pais === paisSeleccionado?.cod_pais)
          .filter((cc) => cc.cod_tipo === tipoPuntoOrigenSeleccionado?.cod_tipo);
      }
      if (id === "puntoEnlaceDestino") {
        const paisSeleccionado = values_inter.paisDestino as Pais | null;
        const tipoPuntoDestinoSeleccionado = values_inter.tipoPuntoEnlaceDestino as Tipo | null;

        return ((catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[])
          .filter((cc) => cc.cod_pais === paisSeleccionado?.cod_pais)
          .filter((cc) => cc.cod_tipo === tipoPuntoDestinoSeleccionado?.cod_tipo);
      }

      if (id === "centroCosto") {
        const empresaSeleccionada = values_inter.empresa as Empresa | null;

        return ((catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[]).filter(
          (cc) => cc.codEmpresaCc === empresaSeleccionada?.cod_empresa,
        );
      }

      if (id === "tipoServicio") {
        const tipoTransporteSeleccionado = values_inter.tipoTransporte as Tipo | null;

        return ((catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[]).filter(
          (ts) => {
            const esDelTipoTransporte = ts.cod_tipo_padre === tipoTransporteSeleccionado?.value;

            if (esDelTipoTransporte) return true;

            return false;
          },
        );
      }

      if (id === "tipoClasificacion") {
        const rubroSeleccionado = values_inter.rubro as { label?: string } | null;

        const normalizarTexto = (texto: unknown) =>
          String(texto ?? "")
            .trim()
            .toLowerCase();

        const rubroLabel = normalizarTexto(rubroSeleccionado?.label);
        // const esFlete = rubroSeleccionado?.esFlete;

        const rubroEsFlete = rubroLabel.includes("flete");
        const rubroEsExpress = rubroLabel.includes("express");

        const catalogoFiltrado = (
          (catalogos?.[catalogoId] ?? []) as readonly OpcionFormularioCotizacion[]
        ).filter((ct) => {
          const clasificacionLabel = normalizarTexto(ct.tipo_tabla);

          const clasificacionEsFlete = clasificacionLabel === "flete";
          const clasificacionEsFleteExpress = clasificacionLabel === "flete express";

          // NUEVO: si el rubro es FLETE EXPRESS, solo mostrar FLETE EXPRESS
          if (rubroEsFlete && rubroEsExpress) {
            return clasificacionEsFleteExpress;
          }

          // NUEVO: si el rubro es FLETE normal, solo mostrar FLETE
          if (rubroEsFlete) {
            return clasificacionEsFlete;
          }

          // NUEVO: si el rubro es EXPRESS, solo mostrar EXPRESS
          if (rubroEsExpress) {
            return clasificacionEsFleteExpress;
          }

          // NUEVO: si el rubro no es FLETE, ocultar FLETE y FLETE EXPRESS
          return ct.value;
        });

        return catalogoFiltrado;
      }

      return catalogos?.[catalogoId] ?? [];
    },
    [catalogos, reglasCampos, values],
  );

  /* ==========================================================================
   * VISIBILIDAD / READONLY / REQUERIDOS
   * ========================================================================== */

  const verificarSiGrupoEsVisible = React.useCallback(
    (id: string) => !groupsToHide.includes(id),
    [groupsToHide],
  );

  const verificarSiEsVisible = React.useCallback(
    (id: string) => {
      if (inputsToHide.includes(id)) return false;

      if (id === "estacion") {
        const codTipoPago =
          (getValue(values.tipoPago) as Id | null) ?? (values.cod_tipo_pago as Id | null);

        const codTipoServicio =
          (getValue(values.tipoServicio) as Id | null) ?? (values.cod_tipo_servicio as Id | null);

        if (
          mismoId(codTipoPago, TIPO_PAGO.TODOS) &&
          mismoId(codTipoServicio, COD_TIPO_SERVICIO_ESTACION)
        ) {
          return true;
        }

        if (
          mismoId(codTipoPago, TIPO_PAGO.COLLECT) &&
          mismoId(codTipoServicio, COD_TIPO_SERVICIO_ESTACION)
        ) {
          return true;
        }

        return false;
      }

      if (id === "contacto_estacion") {
        return values.estacion != null;
      }

      return true;
    },
    [inputsToHide, values],
  );

  const verificarSiEsLectura = React.useCallback(
    (id: string) => {
      if (tipoFormulario === "lectura") return true;

      /*
       * Mismo comportamiento legado:
       * una cotización persistida no permite cambiar cliente.
       */
      if (id === "cliente") {
        return defaultValues?.entidad_id != null;
      }

      if (id === "contacto") {
        if (tipoFormulario === "ingreso" && !values.cliente) {
          return true;
        }

        if (defaultValues?.entidadcontacto_id == null) {
          return false;
        }

        if (tipoFormulario === "edicion") {
          if (!values.cliente) return true;
          if (values.cliente && !values.contacto) return false;
          return true;
        }
      }

      if (inputsReadOnly.includes(id)) return true;
      if (reglasCampos[id]?.readonly) return true;

      const dependencia = reglasCampos[id]?.require;

      if (!dependencia) return false;

      return !values[dependencia];
    },
    [
      tipoFormulario,
      defaultValues?.entidad_id,
      defaultValues?.entidadcontacto_id,
      values,
      inputsReadOnly,
      reglasCampos,
    ],
  );

  const verificarSiEsRequerido = React.useCallback(
    (id: string) => {
      if (tipoFormulario === "lectura") return false;
      if (inputsNoObligatorios.includes(id)) return false;

      const esTerrestre = getLabel(values.tipoTransporte).trim().toUpperCase() === "TERRESTRE";

      if (id === "estacion") {
        const codTipoPago =
          (getValue(values.tipoPago) as Id | null) ?? (values.cod_tipo_pago as Id | null);

        const codTipoServicio =
          (getValue(values.tipoServicio) as Id | null) ?? (values.cod_tipo_servicio as Id | null);

        if (
          mismoId(codTipoPago, TIPO_PAGO.TODOS) &&
          mismoId(codTipoServicio, COD_TIPO_SERVICIO_ESTACION)
        ) {
          return true;
        }

        if (
          mismoId(codTipoPago, TIPO_PAGO.COLLECT) &&
          mismoId(codTipoServicio, COD_TIPO_SERVICIO_ESTACION)
        ) {
          return true;
        }

        return false;
      }

      if (id === "contacto_estacion") {
        return values.estacion != null;
      }

      if (id === "paisOrigen" || id === "paisDestino") {
        return false;
      }

      if (id === "ciudadOrigen" || id === "ciudadDestino") {
        return esTerrestre;
      }

      if (
        id === "tipoPuntoEnlaceOrigen" ||
        id === "tipoPuntoEnlaceDestino" ||
        id === "puntoEnlaceOrigen" ||
        id === "puntoEnlaceDestino"
      ) {
        return !esTerrestre;
      }

      return CAMPOS_REQUERIDOS.includes(id);
    },
    [tipoFormulario, inputsNoObligatorios, values],
  );

  return {
    obtenerCatalogoById,
    verificarSiGrupoEsVisible,
    verificarSiEsVisible,
    verificarSiEsLectura,
    verificarSiEsRequerido,
  };
}
