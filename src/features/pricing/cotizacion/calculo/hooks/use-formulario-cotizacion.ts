"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import type { Empresa, Pais, Tipo } from "@/features/catalogos";
import {
  useBusquedaEntidadCriterio,
  useFetchEntidadContacto,
  useFetchEntidades,
} from "@/features/entidades";
import type { CotizacionCabeceraPayload } from "../api/cotizacion-cabecera";

import { CAMPOS_REQUERIDOS, construirReglasFormulario } from "../lib/cabecera";
import {
  COD_PAIS_GUATEMALA,
  COD_PUNTO_ENLACE_GUA,
  COD_TIPO_SERVICIO_ESTACION,
  TIPO_PAGO,
} from "../lib/constantes";
import type { Id } from "../lib/tipos";
import { esRegistro, mismoId } from "../lib/utils";

const PAISES_TERRESTRES = new Set(["GT", "SV", "HN", "NI", "CR", "PA", "BZ", "MX", "US"]);

export type TipoFormularioCotizacion = "filtro" | "ingreso" | "edicion" | "lectura";

export type OpcionFormularioCotizacion = {
  value: Id;
  label: string;

  cod_tipo?: Id | null;
  cod_tipo_padre?: Id | null;

  cod_empresa?: Id | null;
  codEmpresaCc?: Id | null;
  cod_empresa_cc?: Id | null;

  cod_pais?: Id | null;

  cod_puntoenlace?: Id | null;
  cod_tipo_puntoenlace?: Id | null;
  codigo?: string | null;

  cod_continente?: Id | null;
  cod_continent?: Id | null;

  entidad_id?: Id | null;
  entidad_nombre?: string | null;
  codigo_entidad?: string | null;

  entidadcontacto_id?: Id | null;
  entidadcontacto_nombre?: string | null;
  entidadcontacto_email?: string | null;

  [key: string]: unknown;
};

export type CatalogosFormularioCotizacion = {
  empresas?: OpcionFormularioCotizacion[];
  centrosCosto?: OpcionFormularioCotizacion[];

  tiposTransporte?: OpcionFormularioCotizacion[];
  tiposServicio?: OpcionFormularioCotizacion[];

  tiposCarga?: OpcionFormularioCotizacion[];
  clasificacionesCarga?: OpcionFormularioCotizacion[];

  incoterms?: OpcionFormularioCotizacion[];
  tiposPago?: OpcionFormularioCotizacion[];

  paises?: OpcionFormularioCotizacion[];
  tiposPuntoEnlace?: OpcionFormularioCotizacion[];
  puntosEnlace?: OpcionFormularioCotizacion[];

  ciudades?: OpcionFormularioCotizacion[];
  continentes?: OpcionFormularioCotizacion[];

  clientes?: OpcionFormularioCotizacion[];
  contactos?: OpcionFormularioCotizacion[];

  /**
   * Carrier existe en el formulario legado, aunque GestionCotizacion
   * actualmente lo oculta tanto en filtro como en información.
   */
  proveedores?: OpcionFormularioCotizacion[];
};

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

type ValoresFormulario = Record<string, unknown>;

const TIPO_PUNTO_POR_TRANSPORTE: Record<string, string> = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};

const EMPTY_FIELDS: readonly string[] = [];
const DEFAULT_READ_ONLY_FIELDS: readonly string[] = ["fecha"];
const EMPTY_CATALOGOS: CatalogosFormularioCotizacion = {};

function getValue(value: unknown) {
  if (!esRegistro(value)) return value ?? null;
  return value.value ?? null;
}

function getLabel(value: unknown) {
  if (!esRegistro(value)) return "";
  return String(value.label ?? "");
}

function buscarPorValue(opciones: OpcionFormularioCotizacion[] | undefined, value: unknown) {
  if (value == null) return null;
  return opciones?.find((item) => mismoId(item.value, value)) ?? null;
}

function buscarPorLabel(opciones: OpcionFormularioCotizacion[] | undefined, label: string) {
  const objetivo = label.trim().toUpperCase();

  return (
    opciones?.find(
      (item) =>
        String(item.label ?? "")
          .trim()
          .toUpperCase() === objetivo,
    ) ?? null
  );
}

function idNumerico(value: unknown) {
  const numero = Number(value);
  return Number.isFinite(numero) ? numero : 0;
}

function valoresFormularioIguales(
  actual: ValoresFormulario,
  siguiente: ValoresFormulario,
): boolean {
  const keysActual = Object.keys(actual);
  const keysSiguiente = Object.keys(siguiente);

  if (keysActual.length !== keysSiguiente.length) {
    return false;
  }

  return keysSiguiente.every((key) => {
    const actualValue = actual[key];
    const siguienteValue = siguiente[key];

    if (Object.is(actualValue, siguienteValue)) {
      return true;
    }

    if (actualValue instanceof Date && siguienteValue instanceof Date) {
      return actualValue.getTime() === siguienteValue.getTime();
    }

    if (esRegistro(actualValue) && esRegistro(siguienteValue)) {
      return mismoId(actualValue.value, siguienteValue.value);
    }

    return false;
  });
}

function entidadAOption(entidadOrigen: object): OpcionFormularioCotizacion | null {
  const entidad = entidadOrigen as Record<string, unknown>;
  const entidadId = entidad.entidad_id;

  if (typeof entidadId !== "string" && typeof entidadId !== "number") {
    return null;
  }

  const nombre = String(entidad.entidad_nombre ?? "");
  const codigo = String(entidad.codigo_entidad ?? "");

  return {
    ...entidad,
    value: entidadId,
    label: [codigo, nombre].filter(Boolean).join(" - ") || String(entidadId),
    entidad_id: entidadId,
    entidad_nombre: nombre,
    codigo_entidad: codigo,
    cod_tipo:
      typeof entidad.cod_tipo === "string" || typeof entidad.cod_tipo === "number"
        ? entidad.cod_tipo
        : null,
  } satisfies OpcionFormularioCotizacion;
}

/** Convierte entidades a opciones descartando las que repiten `value` (la key del combobox). */
function entidadesAOpcionesUnicas(entidades: readonly object[]): OpcionFormularioCotizacion[] {
  const vistos = new Set<string>();
  const opciones: OpcionFormularioCotizacion[] = [];

  for (const entidad of entidades) {
    const opcion = entidadAOption(entidad);
    if (!opcion) continue;

    const clave = String(opcion.value).trim();
    if (vistos.has(clave)) continue;

    vistos.add(clave);
    opciones.push(opcion);
  }

  return opciones;
}

function contactoAOption(contactoOrigen: object): OpcionFormularioCotizacion | null {
  const contacto = contactoOrigen as Record<string, unknown>;
  const contactoId = contacto.entidadcontacto_id;

  if (typeof contactoId !== "string" && typeof contactoId !== "number") {
    return null;
  }

  const nombre = String(contacto.entidadcontacto_nombre ?? "");
  const email = String(contacto.entidadcontacto_email ?? "");

  return {
    ...contacto,
    value: contactoId,
    label: [nombre, email].filter(Boolean).join(" - ") || String(contactoId),
    entidadcontacto_id: contactoId,
    entidadcontacto_nombre: nombre,
    entidadcontacto_email: email,
  } satisfies OpcionFormularioCotizacion;
}

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
   * CLIENTE
   * ========================================================================== */

  const [busquedaCliente, setBusquedaCliente] = React.useState("");

  const clientesQuery = useBusquedaEntidadCriterio(
    {
      ref_busqueda: busquedaCliente,
      list_descripcion_tipo: ["CLIENTE", "PRE-CLIENTE"],
      tipo_busqueda: "NOMBRE",
    },
    {
      enabled: false,
    },
  );

  const busquedaClienteRef = React.useRef(0);
  const clientesRef = React.useRef(clientesQuery);
  clientesRef.current = clientesQuery;

  const fetchClientes = React.useCallback(async (valor: string) => {
    // Debounce: identificamos esta ejecución
    const busquedaActual = ++busquedaClienteRef.current;

    if (!valor) return [];

    if (valor.length < 3) return [];

    // Esperamos a que el usuario termine de escribir
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 400);
    });

    // Si hubo otra búsqueda durante la espera, descartamos esta
    if (busquedaActual !== busquedaClienteRef.current) {
      return [];
    }

    flushSync(() => {
      setBusquedaCliente(valor);
    });

    // 1. Esperamos directamente a que TanStack Query termine la solicitud
    const resultado = await clientesRef.current.refetch();

    // Si hubo otra búsqueda mientras esperaba la API, descartamos esta respuesta
    if (busquedaActual !== busquedaClienteRef.current) {
      return [];
    }

    // 2. Usamos los datos devueltos por esa solicitud,
    //    en lugar de clientes.data, que puede pertenecer al render anterior
    return entidadesAOpcionesUnicas(resultado.data?.entidades ?? []);
  }, []);

  const entidadIdActual =
    (getValue(values.cliente) as Id | null) ?? (values.entidad_id as Id | null) ?? null;

  const clienteDefaultId = defaultValues?.entidad_id ?? null;

  const clientePersistidoQuery = useFetchEntidades(
    {
      entidad_id: idNumerico(clienteDefaultId),
      tipo_entidad: "CLIENTE",
    },
    {
      enabled: clienteDefaultId != null && values.cliente == null,
    },
  );

  const preClientePersistidoQuery = useFetchEntidades(
    {
      entidad_id: idNumerico(clienteDefaultId),
      tipo_entidad: "PRE-CLIENTE",
    },
    {
      enabled: clienteDefaultId != null && values.cliente == null,
    },
  );

  const clientesEncontrados = React.useMemo<OpcionFormularioCotizacion[]>(
    // Sin duplicados: el backend puede devolver la misma entidad más de una vez
    // (ej. como CLIENTE y PRE-CLIENTE) y el combobox usa el value como key.
    () => entidadesAOpcionesUnicas(clientesQuery.data?.entidades ?? []),
    [clientesQuery.data],
  );

  React.useEffect(() => {
    if (values.cliente != null) return;
    if (clienteDefaultId == null) return;

    const encontrado = [
      ...(clientePersistidoQuery.data ?? []),
      ...(preClientePersistidoQuery.data ?? []),
    ]
      .map(entidadAOption)
      .find((item) => item != null);

    if (!encontrado) return;

    setValues((prev) => ({
      ...prev,
      cliente: encontrado,
      entidad_id: encontrado.value,
    }));
  }, [
    values.cliente,
    clienteDefaultId,
    clientePersistidoQuery.data,
    preClientePersistidoQuery.data,
  ]);

  const clienteSeleccionado = React.useMemo(() => {
    if (esRegistro(values.cliente)) {
      return values.cliente as OpcionFormularioCotizacion;
    }

    return null;
  }, [values.cliente]);

  const codTipoCliente = clienteSeleccionado?.cod_tipo ?? null;

  /* ==========================================================================
   * CONTACTOS
   * ========================================================================== */

  const codCcActual =
    (getValue(values.centroCosto) as Id | null) ?? (values.cod_cc as Id | null) ?? null;

  const contactosQuery = useFetchEntidadContacto(
    {
      cod_tipo: idNumerico(codTipoCliente),
      ...(entidadIdActual != null ? { entidad_id: idNumerico(entidadIdActual) } : {}),
      ...(codCcActual != null ? { cod_cc: idNumerico(codCcActual) } : {}),
    },
    {
      enabled: Boolean(codTipoCliente && entidadIdActual && codCcActual),
    },
  );

  const contactos = React.useMemo<OpcionFormularioCotizacion[]>(
    () =>
      (contactosQuery.data?.data ?? [])
        .map(contactoAOption)
        .filter((item): item is OpcionFormularioCotizacion => item != null),
    [contactosQuery.data],
  );

  React.useEffect(() => {
    if (values.contacto != null) return;

    const contactoId = defaultValues?.entidadcontacto_id;

    if (contactoId == null || contactos.length === 0) return;

    const contacto = buscarPorValue(contactos, contactoId);

    if (!contacto) return;

    setValues((prev) => ({
      ...prev,
      contacto,
      entidadcontacto_id: contacto.value,
    }));
  }, [values.contacto, defaultValues?.entidadcontacto_id, contactos]);

  /* ==========================================================================
   * ESTACIÓN
   * ========================================================================== */

  const [busquedaEstacion, setBusquedaEstacion] = React.useState("");
  const busquedaEstacionDiferida = React.useDeferredValue(busquedaEstacion);

  const estacionesQuery = useBusquedaEntidadCriterio(
    {
      ref_busqueda: busquedaEstacionDiferida,
      list_descripcion_tipo: ["DSV"],
      tipo_busqueda: "NOMBRE",
    },
    {
      enabled: busquedaEstacionDiferida.trim().length >= 2,
    },
  );

  const estacionesEncontradas = React.useMemo<OpcionFormularioCotizacion[]>(
    () =>
      (estacionesQuery.data?.entidades ?? [])
        .map(entidadAOption)
        .filter((item): item is OpcionFormularioCotizacion => item != null),
    [estacionesQuery.data],
  );

  const estacionDefaultId = defaultValues?.entidad_id_estacion ?? null;

  const estacionPersistidaQuery = useFetchEntidades(
    {
      entidad_id: idNumerico(estacionDefaultId),
      tipo_entidad: "DSV",
    },
    {
      enabled: estacionDefaultId != null && values.estacion == null,
    },
  );

  React.useEffect(() => {
    if (values.estacion != null) return;
    if (estacionDefaultId == null) return;

    const estacion = (estacionPersistidaQuery.data ?? [])
      .map(entidadAOption)
      .find((item) => item != null);

    if (!estacion) return;

    setValues((prev) => ({
      ...prev,
      estacion,
      entidad_id_estacion: estacion.value,
    }));
  }, [values.estacion, estacionDefaultId, estacionPersistidaQuery.data]);

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
          const nombreTransporte = getLabel(valorFinal).trim().toUpperCase();

          const nombreTipoPunto = TIPO_PUNTO_POR_TRANSPORTE[nombreTransporte];

          const tipoPunto = nombreTipoPunto
            ? buscarPorLabel(catalogos.tiposPuntoEnlace, nombreTipoPunto)
            : null;

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
          if (nombreTransporte === "TERRESTRE") {
            const ciudadGtm =
              (catalogos.ciudades ?? []).find((ciudad) => ciudad.siglas_ciudad === "GTM") ?? null;

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

    resultado.direccion_destino = (values.direccion_destino ??
      defaultValues?.direccion_destino ??
      null) as string | null;

    resultado.direccion_origen = (values.direccion_origen ??
      defaultValues?.direccion_origen ??
      null) as string | null;

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
