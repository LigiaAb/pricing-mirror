"use client";

import * as React from "react";
import { esNombre, normalizarNombre } from "@/features/pricing/shared";
import type { CotizacionCabeceraPayload } from "../api/cotizacion-cabecera";

import { construirReglasFormulario } from "../lib/cabecera";
import {
  COD_PAIS_GUATEMALA,
  COD_PUNTO_ENLACE_GUA,
  NOMBRE_TRANSPORTE,
  TIPO_PAGO,
} from "../lib/constantes";
import {
  buscarPorLabel,
  buscarPorValue,
  CAMPOS_UBICACION_POR_TRANSPORTE,
  getLabel,
  getValue,
  TIPO_PUNTO_POR_TRANSPORTE,
  valoresFormularioIguales,
} from "../lib/formulario-cotizacion-helpers";
import type {
  CatalogosFormularioCotizacion,
  TipoFormularioCotizacion,
  ValoresFormulario,
} from "../lib/formulario-cotizacion-tipos";
import type { Id } from "../lib/tipos";
import { esRegistro, mismoId } from "../lib/utils";
import { useFormularioCotizacionEntidades } from "./use-formulario-cotizacion-entidades";
import { useFormularioCotizacionReglas } from "./use-formulario-cotizacion-reglas";

export type {
  CatalogosFormularioCotizacion,
  OpcionFormularioCotizacion,
  TipoFormularioCotizacion,
} from "../lib/formulario-cotizacion-tipos";

type Props = {
  tipoFormulario?: TipoFormularioCotizacion;

  defaultValues?: CotizacionCabeceraPayload;

  catalogos?: CatalogosFormularioCotizacion;

  resetKey?: string | number;

  inputsToHide?: readonly string[];
  groupsToHide?: readonly string[];
  inputsReadOnly?: readonly string[];
  inputsNoObligatorios?: readonly string[];

  currentEmpresaId?: Id | null;
  currentCentroCostoId?: Id | null;
  currentPaisId?: Id | null;

  codUsuario?: Id | null;
  codEstadoActivo: Id;

  /**
   * Sustituye setEsValido del formulario legado.
   */
  onValidezChange?: (esValido: boolean) => void;

  /**
   * Punto de integración para la futura API Next de plantillas de cliente.
   *
   * El legado consultaba plantilla cuando existían:
   * cliente + empresa + centro de costo.
   */
  onClienteContextoChange?: (
    contexto: {
      entidad_id: Id;
      cod_emp: Id;
      cod_cc: Id;
    } | null,
  ) => void;
};

const EMPTY_FIELDS: readonly string[] = [];
const DEFAULT_READ_ONLY_FIELDS: readonly string[] = ["fecha"];
const EMPTY_CATALOGOS: CatalogosFormularioCotizacion = {};
export function useFormularioCotizacion({
  tipoFormulario = "lectura",
  defaultValues,
  catalogos = EMPTY_CATALOGOS,
  resetKey = 0,

  inputsToHide = EMPTY_FIELDS,
  groupsToHide = EMPTY_FIELDS,
  inputsReadOnly = DEFAULT_READ_ONLY_FIELDS,
  inputsNoObligatorios = EMPTY_FIELDS,

  currentEmpresaId,
  currentCentroCostoId,
  currentPaisId,

  codUsuario,
  codEstadoActivo,

  onValidezChange,
  onClienteContextoChange,
}: Props) {
  /* ==========================================================================
   * CATÁLOGOS / DEFAULTS
   * ========================================================================== */

  const empresaDefault = React.useMemo(
    () => buscarPorValue(catalogos.empresas, currentEmpresaId),
    [catalogos.empresas, currentEmpresaId],
  );

  const centroCostoDefault = React.useMemo(() => {
    const centros = catalogos.centrosCosto ?? [];

    return (
      centros.find((item) => {
        const empresa = item.codEmpresaCc ?? item.cod_empresa_cc ?? item.cod_empresa;

        return mismoId(empresa, currentEmpresaId) && mismoId(item.value, currentCentroCostoId);
      }) ?? null
    );
  }, [catalogos.centrosCosto, currentEmpresaId, currentCentroCostoId]);

  const paisDefault = React.useMemo(
    () => buscarPorValue(catalogos.paises, currentPaisId),
    [catalogos.paises, currentPaisId],
  );

  const tipoPagoDefault = React.useMemo(
    () => buscarPorValue(catalogos.tiposPago, TIPO_PAGO.TODOS),
    [catalogos.tiposPago],
  );

  /*
   * Reglas de cada campo (cod, catálogo, reset, require, readonly):
   * vienen de la definición única en lib/cabecera.ts.
   * Aquí solo se agregan los valores iniciales que dependen del contexto.
   */
  const reglasCampos = React.useMemo(
    () =>
      construirReglasFormulario({
        fecha: tipoFormulario === "filtro" ? null : new Date(),
        empresa: empresaDefault,
        centroCosto: centroCostoDefault,
        tipoPago: tipoPagoDefault,
        paisOrigen: paisDefault,
        estado: codEstadoActivo,
        cod_usuario: codUsuario ?? null,
      }),
    [
      tipoFormulario,
      empresaDefault,
      centroCostoDefault,
      paisDefault,
      tipoPagoDefault,
      codEstadoActivo,
      codUsuario,
    ],
  );

  const valoresIniciales = React.useMemo<ValoresFormulario>(() => {
    const base: ValoresFormulario = {};

    for (const [campo, regla] of Object.entries(reglasCampos)) {
      base[campo] = regla.default ?? null;

      if (regla.cod !== campo) {
        base[regla.cod] = getValue(regla.default);
      }
    }

    return base;
  }, [reglasCampos]);

  const defaultValuesProcesados = React.useMemo<ValoresFormulario>(() => {
    if (!defaultValues) return {};

    const resultado: ValoresFormulario = {
      ...defaultValues,
    };

    for (const [campo, regla] of Object.entries(reglasCampos)) {
      const codigo = defaultValues[regla.cod];

      if (codigo == null) continue;
      if (!regla.catalogo) continue;

      const opcion = buscarPorValue(catalogos[regla.catalogo], codigo);

      if (opcion) {
        resultado[campo] = opcion;
      }
    }

    resultado.cod_usuario =
      defaultValues.cod_usuario ?? codUsuario ?? resultado.cod_usuario ?? null;

    return resultado;
  }, [defaultValues, reglasCampos, catalogos, codUsuario]);

  const [values, setValues] = React.useState<ValoresFormulario>(() => ({
    ...valoresIniciales,
    ...defaultValuesProcesados,
  }));

  const valoresResetRef = React.useRef<ValoresFormulario>({
    ...valoresIniciales,
    ...defaultValuesProcesados,
  });

  valoresResetRef.current = {
    ...valoresIniciales,
    ...defaultValuesProcesados,
  };

  React.useEffect(() => {
    // resetKey fuerza la reconstrucción aunque los valores conserven su referencia.
    void resetKey;

    const siguientesValores = valoresResetRef.current;

    setValues((prev) => {
      if (valoresFormularioIguales(prev, siguientesValores)) {
        return prev;
      }

      return siguientesValores;
    });
  }, [resetKey]);
  /* ==========================================================================
   * CLIENTE / CONTACTOS / ESTACIÓN (hooks/use-formulario-cotizacion-entidades.ts)
   * ========================================================================== */

  const {
    busquedaCliente,
    setBusquedaCliente,
    clientesQuery,
    fetchClientes,
    clientesEncontrados,
    clienteSeleccionado,
    contactosQuery,
    contactos,
    busquedaEstacion,
    setBusquedaEstacion,
    estacionesQuery,
    estacionesEncontradas,
  } = useFormularioCotizacionEntidades({ values, setValues, defaultValues });

  /* ==========================================================================
   * INPUT
   * ========================================================================== */

  const onInput = React.useCallback(
    ({ id, val }: { id: string; val: unknown }) => {
      setValues((prev) => {
        if (Object.is(prev[id], val)) return prev;

        const next = {
          ...prev,
        };

        let valorFinal = val;

        /*
         * El legado no permite dejar tipo de pago vacío:
         * vuelve a 131.
         */
        if (id === "tipoPago" && val == null) {
          valorFinal = tipoPagoDefault;
        }

        if (id === "tipoTransporte") {
          const nombreTransporte = normalizarNombre(getLabel(valorFinal));

          const nombreTipoPunto = TIPO_PUNTO_POR_TRANSPORTE[nombreTransporte];

          const tipoPunto = nombreTipoPunto
            ? buscarPorLabel(catalogos.tiposPuntoEnlace, nombreTipoPunto)
            : null;

          // Lo elegido para el transporte anterior ya no aplica (#142).
          if (!mismoId(getValue(prev.tipoTransporte), getValue(valorFinal))) {
            for (const key of CAMPOS_UBICACION_POR_TRANSPORTE) {
              next[key] = null;
            }
          }

          next.tipoPuntoEnlaceOrigen = tipoPunto;
          next.cod_tipo_puntoenlace_origen = tipoPunto?.value ?? null;

          next.tipoPuntoEnlaceDestino = tipoPunto;
          next.cod_tipo_puntoenlace_destino = tipoPunto?.value ?? null;

          if (nombreTipoPunto === "AEROPUERTO" && mismoId(currentPaisId, COD_PAIS_GUATEMALA)) {
            const gua =
              (catalogos.puntosEnlace ?? []).find((item) =>
                mismoId(item.cod_puntoenlace ?? item.value, COD_PUNTO_ENLACE_GUA),
              ) ?? null;

            next.puntoEnlaceOrigen = gua;
            next.cod_puntoenlace_origen = gua?.value ?? null;
          }
          /*
           * Las siglas de ciudad se repiten entre países: se valida que el país origen
           * sea Guatemala y que la ciudad sea de Guatemala.
           */
          if (
            esNombre(nombreTransporte, NOMBRE_TRANSPORTE.TERRESTRE) &&
            mismoId(getValue(next.paisOrigen), COD_PAIS_GUATEMALA)
          ) {
            const ciudadGtm =
              (catalogos.ciudades ?? []).find(
                (ciudad) =>
                  ciudad.siglas_ciudad === "GUA" && mismoId(ciudad.cod_pais, COD_PAIS_GUATEMALA),
              ) ?? null;

            next.ciudadOrigen = ciudadGtm;
            next.cod_ciudad_origen = ciudadGtm?.value ?? null;
          }
        }

        const regla = reglasCampos[id];

        if (!regla) {
          next[id] = valorFinal;
          return next;
        }

        next[id] = valorFinal ?? null;
        next[regla.cod] = getValue(valorFinal);

        for (const key of regla.reset ?? []) {
          next[key] = null;
        }

        return next;
      });
    },
    [
      tipoPagoDefault,
      catalogos.tiposPuntoEnlace,
      catalogos.puntosEnlace,
      catalogos.ciudades,
      currentPaisId,
      reglasCampos,
    ],
  );
  /* ==========================================================================
   * CATÁLOGOS DEPENDIENTES / VISIBILIDAD / READONLY / REQUERIDOS
   * (hooks/use-formulario-cotizacion-reglas.ts)
   * ========================================================================== */

  const {
    obtenerCatalogoById,
    verificarSiGrupoEsVisible,
    verificarSiEsVisible,
    verificarSiEsLectura,
    verificarSiEsRequerido,
  } = useFormularioCotizacionReglas({
    values,
    catalogos,
    reglasCampos,
    tipoFormulario,
    defaultValues,
    inputsToHide,
    groupsToHide,
    inputsReadOnly,
    inputsNoObligatorios,
  });

  /* ==========================================================================
   * PAYLOAD
   * ========================================================================== */

  const valoresSoloCodigos = React.useMemo<CotizacionCabeceraPayload>(() => {
    const resultado: CotizacionCabeceraPayload = {};

    for (const [campo, regla] of Object.entries(reglasCampos)) {
      const valorVisual = values[campo];

      resultado[regla.cod] =
        valorVisual != null ? getValue(valorVisual) : (values[regla.cod] ?? null);
    }

    const puntoOrigen = esRegistro(values.puntoEnlaceOrigen) ? values.puntoEnlaceOrigen : null;

    const puntoDestino = esRegistro(values.puntoEnlaceDestino) ? values.puntoEnlaceDestino : null;

    resultado.cod_continente_origen =
      (puntoOrigen?.cod_continente as Id | null | undefined) ??
      (puntoOrigen?.cod_continent as Id | null | undefined) ??
      null;

    resultado.cod_continente_destino =
      (puntoDestino?.cod_continente as Id | null | undefined) ??
      (puntoDestino?.cod_continent as Id | null | undefined) ??
      null;

    resultado.cod_usuario = (values.cod_usuario as Id | null | undefined) ?? codUsuario ?? null;

    resultado.contacto_estacion =
      typeof values.contacto_estacion === "string" ? values.contacto_estacion : null;

    resultado.cod_cotizacion_cabecera =
      (values.cod_cotizacion_cabecera as Id | null | undefined) ??
      defaultValues?.cod_cotizacion_cabecera ??
      null;

    resultado.cod_tarifaplantilla =
      (values.cod_tarifaplantilla as Id | null | undefined) ??
      defaultValues?.cod_tarifaplantilla ??
      null;

    // `values` ya trae las de `defaultValues`; sin respaldo, para que una dirección limpiada no vuelva (#142).
    resultado.direccion_destino = (values.direccion_destino ?? null) as string | null;

    resultado.direccion_origen = (values.direccion_origen ?? null) as string | null;

    resultado.descripcion =
      typeof values.descripcion === "string"
        ? values.descripcion
        : ((defaultValues?.descripcion as string | null | undefined) ?? null);

    return resultado;
  }, [values, reglasCampos, codUsuario, defaultValues]);

  /* ==========================================================================
   * VALIDEZ
   * ========================================================================== */

  const camposFaltantes = React.useMemo(() => {
    if (tipoFormulario === "lectura") return [];

    return Object.keys(reglasCampos).filter((id) => {
      if (!verificarSiEsRequerido(id)) return false;

      return !values[id];
    });
  }, [tipoFormulario, reglasCampos, verificarSiEsRequerido, values]);

  const esValido = tipoFormulario === "lectura" || camposFaltantes.length === 0;

  React.useEffect(() => {
    onValidezChange?.(esValido);
  }, [esValido, onValidezChange]);

  /* ==========================================================================
   * PLANTILLAS: PUNTO DE INTEGRACIÓN
   * ========================================================================== */

  React.useEffect(() => {
    if (!onClienteContextoChange) return;

    const entidadId = (getValue(values.cliente) as Id | null) ?? (values.entidad_id as Id | null);

    const codEmp = (getValue(values.empresa) as Id | null) ?? (values.cod_empresa as Id | null);

    const codCc = (getValue(values.centroCosto) as Id | null) ?? (values.cod_cc as Id | null);

    if (entidadId == null || codEmp == null || codCc == null) {
      onClienteContextoChange(null);
      return;
    }

    onClienteContextoChange({
      entidad_id: entidadId,
      cod_emp: codEmp,
      cod_cc: codCc,
    });
  }, [
    values.cliente,
    values.entidad_id,
    values.empresa,
    values.cod_empresa,
    values.centroCosto,
    values.cod_cc,
    onClienteContextoChange,
  ]);

  return {
    values,
    valoresSoloCodigos,
    onInput,

    /* búsqueda de entidades */
    busquedaCliente,
    setBusquedaCliente,
    clientesEncontrados,
    fetchClientes,
    clienteSeleccionado,
    isLoadingClientes: clientesQuery.isFetching,

    busquedaEstacion,
    setBusquedaEstacion,
    estacionesEncontradas,
    isLoadingEstaciones: estacionesQuery.isFetching,

    /* contactos */
    contactos,
    isLoadingContactos: contactosQuery.isFetching,
    refetchContactos: contactosQuery.refetch,

    /* catálogos dependientes */
    obtenerCatalogoById,

    /* reglas visuales */
    verificarSiEsLectura,
    verificarSiEsVisible,
    verificarSiGrupoEsVisible,
    verificarSiEsRequerido,

    /* validación */
    esValido,
    camposFaltantes,
  };
}
