/* ==========================================================================
 * CATÁLOGOS DE PRICING (compartidos por Tarifas y Cotizaciones)
 *
 * Carga los catálogos generales y los deja normalizados ({ value, label } +
 * campos en camelCase y snake_case). Antes vivía dentro de useCatalogosTarifas
 * y Cotizaciones tenía que importar Tarifas para usarlo.
 *
 * - Tarifas: useCatalogosTarifas = esto + opción "TODOS" + mapWithCatalogo.
 * - Cotizaciones: useCatalogosCotizacion = esto + normalización propia.
 *
 * React Query comparte la caché: si ambas pantallas lo usan, no se repiten
 * consultas.
 * ========================================================================== */

import React from "react";
import {
  type CentroCosto,
  type Ciudad,
  type Continente,
  ciudades as ciudadesFetch,
  continentes as continentesFetch,
  type Empresa,
  type Estado,
  centrosCosto as fetchCentrosCosto,
  empresas as fetchEmpresas,
  incoterms as fetchIncoterms,
  paises as fetchPaises,
  puntosEnlace as fetchPuntosEnlace,
  servicios as fetchServicios,
  type Incoterm,
  type Moneda,
  type Pais,
  type PuntoEnlace,
  type RelacionTipo,
  type Rubro,
  type Servicio,
  type Tipo,
  type Usuario,
  estados as useFetchEstados,
  monedas as useFetchMonedas,
  relacionTipo as useFetchRelacionTipo,
  rubros as useFetchRubros,
  tipos as useFetchTipos,
  usuarios as useFetchUsuarios,
} from "@/features/catalogos";
import type { Entidad } from "@/features/entidades";
import { useClientesTarifaSimple } from "../api/clientes";
import { type Metodo, useMetodos } from "../api/metodos";
import { useProveedoresTarifa } from "../api/proveedores";
import { conAmbosFormatos } from "../lib/formatos";

export type OpcionEntidad = Partial<Entidad> & {
  value?: string | number | null;
  label?: string | number | null;
};

export type EmpresaCatalog = Partial<Empresa> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type CentroCostoCatalog = Partial<CentroCosto> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type IncotermCatalog = Partial<Incoterm> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type RubroCatalog = Partial<Rubro> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type TipoCatalog = Partial<Tipo> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type RelacionTipoCatalog = Partial<RelacionTipo> & {
  value?: string | number | null;
  label?: string | number | null;
  cod_estado?: number;
  tipo_padre_desc: string;
};
export type EstadoCatalog = Partial<Estado> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type MonedaCatalog = Partial<Moneda> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type PuntoEnlaceCatalog = Partial<PuntoEnlace> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type PaisesCatalog = Partial<Pais> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type ContinentesCatalog = Partial<Continente> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type CiudadesCatalog = Partial<Ciudad> & {
  value?: string | number | null;
  label?: string | number | null;
};
export type UsuariosCatalog = Partial<Usuario> & {
  value?: string | number | null;
  label?: string | number | null;
};

export type CatalogosPricing = {
  servicios: Servicio[];
  metodos: Metodo[];
  empresas: EmpresaCatalog[];
  centrosCosto: CentroCostoCatalog[];
  tipos: TipoCatalog[];
  tiposRelacion: RelacionTipoCatalog[];
  rubros: RubroCatalog[];
  estados: EstadoCatalog[];
  incoterms: IncotermCatalog[];
  proveedores: OpcionEntidad[];
  clientes: OpcionEntidad[];
  tiposServicio: RelacionTipoCatalog[];
  tiposAplicacion: TipoCatalog[];
  categoriasTransporte: TipoCatalog[];
  clasificacionesCarga: TipoCatalog[];
  tiposCarga: TipoCatalog[];
  tiposTransporte: TipoCatalog[];
  tiposPago: TipoCatalog[];
  tiposCalculo: TipoCatalog[];
  metodosCalculo: TipoCatalog[];
  tiposTarifa: TipoCatalog[];
  tiposPuntoEnlace: TipoCatalog[];
  tiposRuta: TipoCatalog[];
  monedas: MonedaCatalog[];
  puntosEnlace: PuntoEnlaceCatalog[];
  paises: PaisesCatalog[];
  unidadesMedida: RelacionTipoCatalog[];
  unidadesPeso: RelacionTipoCatalog[];
  continentes: ContinentesCatalog[];
  ciudades: CiudadesCatalog[];
  tiposClasificacionServicio: RelacionTipoCatalog[];
  usuarios: UsuariosCatalog[];
};

export function useCatalogosPricing() {
  const servicios = fetchServicios.useLista();
  const metodos = useMetodos();
  const empresas = fetchEmpresas.useLista({ cod_estado: 1 });
  const centrosCosto = fetchCentrosCosto.useLista({ cod_estado: 1 });
  const tipos = useFetchTipos.useLista();
  const tiposRelacion = useFetchRelacionTipo.useLista({ cod_estado: 1 });
  const rubros = useFetchRubros.useLista({ cod_estado: 1 });
  const estados = useFetchEstados.useLista();
  const incoterms = fetchIncoterms.useLista();
  const monedas = useFetchMonedas.useLista({ cod_estado: 1 });
  const puntosEnlace = fetchPuntosEnlace.useLista();
  const paises = fetchPaises.useLista({ cod_estado: 1 });
  const continentes = continentesFetch.useLista();
  const ciudades = ciudadesFetch.useLista();
  const proveedores = useProveedoresTarifa();
  const clientes = useClientesTarifaSimple();
  const usuarios = useFetchUsuarios.useLista();

  const isLoading = React.useMemo(
    () =>
      empresas.isLoading ||
      centrosCosto.isLoading ||
      rubros.isLoading ||
      tipos.isLoading ||
      tiposRelacion.isLoading ||
      incoterms.isLoading ||
      monedas.isLoading ||
      puntosEnlace.isLoading ||
      paises.isLoading ||
      continentes.isLoading ||
      ciudades.isLoading ||
      estados.isLoading ||
      proveedores.isLoading ||
      clientes.isLoading ||
      servicios.isLoading ||
      usuarios.isLoading ||
      metodos.isLoading,
    [
      empresas.isLoading,
      centrosCosto.isLoading,
      rubros.isLoading,
      tipos.isLoading,
      tiposRelacion.isLoading,
      incoterms.isLoading,
      monedas.isLoading,
      puntosEnlace.isLoading,
      paises.isLoading,
      continentes.isLoading,
      ciudades.isLoading,
      estados.isLoading,
      proveedores.isLoading,
      clientes.isLoading,
      servicios.isLoading,
      usuarios.isLoading,
      metodos.isLoading,
    ],
  );

  const catalogos = React.useMemo((): CatalogosPricing => {
    const allTipos = ((tipos.data ?? []) as TipoCatalog[]).map(conAmbosFormatos).map((i) => ({
      ...i,
      value: i.cod_tipo as string | number,
      label: String(i.label ?? i.nom_tipo ?? ""),
    }));
    const allRelaciones = ((tiposRelacion.data ?? []) as RelacionTipoCatalog[])
      .map(conAmbosFormatos)
      .map((i) => ({
        ...i,
        value: i.cod_tipo as string | number,
        label: String(i.label ?? i.tipo_desc ?? ""),
      }));

    const estaActivo = (codEstado: unknown) => Number(codEstado) === 1;

    const base = {
      empresas: ((empresas.data ?? []) as EmpresaCatalog[])
        .map(conAmbosFormatos)
        ?.map((i) => ({ ...i, value: i.cod_empresa, label: i.nombre_emp })),
      centrosCosto: ((centrosCosto.data ?? []) as CentroCostoCatalog[])
        .map(conAmbosFormatos)
        ?.map((i) => ({ ...i, value: i.codCc, label: i.nombreCc })),
      tiposTransporte: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "TRANSPORTE"),
      tiposServicio: allRelaciones
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "SERVICIO" && t.tipo_padre_tabla === "TRANSPORTE"),
      tiposClasificacionServicio: allRelaciones
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter(
          (t) => t.tipo_tabla === "CLASIFICACION_SERVICIO" && t.tipo_padre_tabla === "TRANSPORTE",
        ),
      unidadesMedida: allRelaciones
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter(
          (t) =>
            t.tipo_tabla === "COORDINACION_CARGA" &&
            t.tipo_padre_tabla === "TIPO_MEDIDA" &&
            t.tipo_padre_desc === "VOLUMEN",
        ),
      unidadesPeso: allRelaciones
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter(
          (t) =>
            t.tipo_tabla === "COORDINACION_CARGA" &&
            t.tipo_padre_tabla === "TIPO_MEDIDA" &&
            t.tipo_padre_desc === "PESO",
        ),
      categoriasTransporte: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "CATEGORIA_TRANSPORTE"),
      tiposCarga: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "TIPO_CARGA"),
      clasificacionesCarga: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "CLASIFICACION_CARGA"),
      incoterms: (
        (incoterms.data ?? []).map((i) => ({
          ...i,
          label: `${i.codigo} - ${i.descripcion}`,
          value: i.incoterm_id,
        })) as IncotermCatalog[]
      ).map(conAmbosFormatos),
      tiposAplicacion: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "APLICACION"),
      tiposCalculo: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "CALCULO"),
      metodosCalculo: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "METODO"),
      tiposTarifa: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "TARIFA"),
      tiposPago: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "PAGO"),
      tipos: allTipos ?? [],
      tiposRelacion: allRelaciones ?? [],
      estados: (estados.data ?? []) as EstadoCatalog[],
      metodos: metodos.data ?? [],
      servicios: servicios.data ?? [],
      proveedores: (proveedores.data ?? []) as OpcionEntidad[],
      clientes: (clientes.data ?? []) as OpcionEntidad[],
      monedas: (monedas.data ?? []) as MonedaCatalog[],
      puntosEnlace: ((puntosEnlace.data ?? []) as PuntoEnlaceCatalog[]).map((item) => ({
        ...item,
        value: item.cod_puntoenlace as string | number,
        label: String(item.label ?? item.nombre ?? ""),
      })),
      paises: ((paises.data ?? []) as PaisesCatalog[]).map((item) => ({
        ...item,
        value: item.cod_pais as string | number,
        label: String(item.label ?? item.nombre_pais ?? ""),
      })),
      tiposRuta: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "TARIFA_RUTA"),
      tiposPuntoEnlace: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "PUNTO_ENLACE"),
      continentes: ((continentes.data ?? []) as ContinentesCatalog[]).map((item) => ({
        ...item,
        value: item.cod_continente as string | number,
        label: String(item.label ?? item.continente_nombre ?? ""),
      })),
      ciudades: (ciudades.data ?? []).map((i) => ({
        ...i,
        label: `${i.siglas_ciudad} - ${i.nombre_ciudad}`,
        value: i.cod_ciudad,
      })),
      rubros: (
        (rubros.data ?? []).map((r) => ({
          ...r,
          label: r.nombre,
          value: r.cod_rubro,
        })) as RubroCatalog[]
      ).filter((item) => estaActivo(item.cod_estado)),
      usuarios: (usuarios.data ?? []) as UsuariosCatalog[],
    };

    return base as CatalogosPricing;
  }, [
    tipos.data,
    rubros.data,
    estados.data,
    centrosCosto.data,
    empresas.data,
    tiposRelacion.data,
    metodos.data,
    incoterms.data,
    servicios.data,
    monedas.data,
    puntosEnlace.data,
    paises.data,
    continentes.data,
    ciudades.data,
    proveedores.data,
    clientes.data,
    usuarios.data,
  ]);

  return {
    catalogos,
    isLoading,
    refetchMetodos: metodos.refetch,
    refetchServicios: servicios.refetch,
  };
}
