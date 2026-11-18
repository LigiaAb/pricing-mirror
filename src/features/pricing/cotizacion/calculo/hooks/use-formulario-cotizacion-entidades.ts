"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import {
  useBusquedaEntidadCriterio,
  useFetchEntidadContacto,
  useFetchEntidades,
} from "@/features/entidades";
import type { CotizacionCabeceraPayload } from "../api/cotizacion-cabecera";
import {
  buscarPorValue,
  contactoAOption,
  entidadAOption,
  entidadesAOpcionesUnicas,
  getValue,
  idNumerico,
} from "../lib/formulario-cotizacion-helpers";
import type {
  OpcionFormularioCotizacion,
  ValoresFormulario,
} from "../lib/formulario-cotizacion-tipos";
import type { Id } from "../lib/tipos";
import { esRegistro } from "../lib/utils";

type Params = {
  values: ValoresFormulario;
  setValues: React.Dispatch<React.SetStateAction<ValoresFormulario>>;
  defaultValues: CotizacionCabeceraPayload | undefined;
};

/**
 * Cliente, contactos y estación del formulario de cotización: búsquedas y carga de los valores guardados.
 * Parte de `useFormularioCotizacion`.
 */
export function useFormularioCotizacionEntidades({ values, setValues, defaultValues }: Params) {
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
    setValues,
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
  }, [values.contacto, defaultValues?.entidadcontacto_id, contactos, setValues]);

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
  }, [values.estacion, estacionDefaultId, estacionPersistidaQuery.data, setValues]);

  return {
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
  };
}
