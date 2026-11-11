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
import { useClientesTarifaSimple } from "../api/clientes";
import { type Metodo, useMetodos } from "../api/metodos";
import { useProveedoresTarifa } from "../api/proveedores";
// import { type Servicio, useServicios } from "../api/servicios";
import type { FilaServicioMetodo, OptionEntidad } from "../api/types-api";
import type { RutaOption } from "../components/metodo-pais/pais-columns";
import type { KeysToLowerCase } from "../lib/form-types";
import {
  CATALOGOS_AGREGAR_TODOS,
  conAmbosFormatos,
  DEFAULT_TODOS_VALUE,
} from "../lib/tarifa-helpers";

type EmpresaCatalog = Partial<Empresa> & {
  value?: string | number | null;
  label?: string | number | null;
};
type CentroCostoCatalog = Partial<CentroCosto> & {
  value?: string | number | null;
  label?: string | number | null;
};
type IncotermCatalog = Partial<Incoterm> & {
  value?: string | number | null;
  label?: string | number | null;
};
type RubroCatalog = Partial<Rubro> & {
  value?: string | number | null;
  label?: string | number | null;
};
type TipoCatalog = Partial<Tipo> & {
  value?: string | number | null;
  label?: string | number | null;
};
type RelacionTipoCatalog = Partial<RelacionTipo> & {
  value?: string | number | null;
  label?: string | number | null;
  cod_estado?: number;
  tipo_padre_desc: string;
};
type EstadoCatalog = Partial<Estado> & {
  value?: string | number | null;
  label?: string | number | null;
};
type MonedaCatalog = Partial<Moneda> & {
  value?: string | number | null;
  label?: string | number | null;
};
type PuntoEnlaceCatalog = Partial<PuntoEnlace> & {
  value?: string | number | null;
  label?: string | number | null;
};
type PaisesCatalog = Partial<Pais> & {
  value?: string | number | null;
  label?: string | number | null;
};
type ContinentesCatalog = Partial<Continente> & {
  value?: string | number | null;
  label?: string | number | null;
};
type CiudadesCatalog = Partial<Ciudad> & {
  value?: string | number | null;
  label?: string | number | null;
};
type UsuariosCatalog = Partial<Usuario> & {
  value?: string | number | null;
  label?: string | number | null;
};

const DEFAULT_AGREGAR_TODOS_CONFIG: AgregarTodosConfig = {
  default: DEFAULT_TODOS_VALUE,
  catalogos: CATALOGOS_AGREGAR_TODOS,
};

type AgregarTodosConfig =
  | boolean
  | string[]
  | {
      default: unknown;
      catalogos: Record<string, boolean | unknown>;
    };

type CatalogosProcesados = {
  servicios: Servicio[];
  metodos: Metodo[];
  empresas: EmpresaCatalog[];
  centrosCosto: CentroCostoCatalog[];
  tipos: TipoCatalog[];
  tiposRelacion: RelacionTipoCatalog[];
  rubros: RubroCatalog[];
  estados: EstadoCatalog[];
  incoterms: IncotermCatalog[];
  proveedores: OptionEntidad[];
  clientes: OptionEntidad[];
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
  tiposRuta: RutaOption[];
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

type UseCatalogosTarifaOptions = {
  agregarTodos?: AgregarTodosConfig | undefined;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildTodosOption = (valueTodos: unknown) => ({
  label: "TODOS",
  value: valueTodos,
});

const getConfigAgregarTodos = (
  agregarTodos: AgregarTodosConfig | undefined,
  key: string,
): { aplicar: boolean; value: unknown } => {
  if (!agregarTodos) return { aplicar: false, value: null };

  if (Array.isArray(agregarTodos)) {
    return { aplicar: agregarTodos.includes(key), value: null };
  }

  if (typeof agregarTodos === "boolean") {
    return { aplicar: agregarTodos, value: null };
  }

  const catalogosConfig = agregarTodos.catalogos ?? {};
  const tieneConfigPropia = Object.hasOwn(catalogosConfig, key);

  if (!tieneConfigPropia) return { aplicar: false, value: agregarTodos.default };

  const valorConfig = catalogosConfig[key];

  return {
    aplicar: valorConfig !== false,
    value: valorConfig === true ? agregarTodos.default : valorConfig,
  };
};

const agregarTodosACatalogo = <T extends { label?: string; value?: unknown }>(
  catalogo: T[],
  key: string,
  agregarTodos: AgregarTodosConfig | undefined,
): T[] => {
  if (!Array.isArray(catalogo)) return catalogo;

  const config = getConfigAgregarTodos(agregarTodos, key);
  if (!config.aplicar) return catalogo;

  const yaExiste = catalogo.some((i) => i?.label === "TODOS");
  if (yaExiste) return catalogo;

  return [buildTodosOption(config.value) as unknown as T, ...catalogo];
};

// const eliminarDuplicadosById = <T>(arr: T[], id: keyof T) => {
//   return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
// };

export const keysToLowerCase = <T>(obj: T): KeysToLowerCase<T> => {
  if (typeof obj !== "object" || obj === null) {
    return obj as KeysToLowerCase<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => keysToLowerCase(item)) as KeysToLowerCase<T>;
  }

  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key.toLowerCase()] = keysToLowerCase(value);

    return acc;
  }, {}) as KeysToLowerCase<T>;
};

export const useCatalogosTarifas = (props: UseCatalogosTarifaOptions = {}) => {
  const { agregarTodos = DEFAULT_AGREGAR_TODOS_CONFIG } = props;

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
  // const _equipos =

  // ── Loading global ───────────────────────────────────────────────────────────
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

  const catalogos = React.useMemo(() => {
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
      proveedores: (proveedores.data ?? []) as OptionEntidad[],
      clientes: (clientes.data ?? []) as OptionEntidad[],
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
        .filter((t) => t.tipoTabla === "TARIFA_RUTA") as RutaOption[],
      tiposPuntoEnlace: allTipos
        .filter((item) => estaActivo(item.cod_estado ?? item.codEstado))
        .filter((t) => t.tipoTabla === "PUNTO_ENLACE") as RutaOption[],
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

    const catalogosProcesados = Object.fromEntries(
      Object.entries(base).map(([key, value]) => [
        key,
        agregarTodosACatalogo(
          value as { label?: string; value?: unknown }[],
          key,
          agregarTodos ?? {},
        ),
      ]),
    ) as CatalogosProcesados;

    return catalogosProcesados;
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
    agregarTodos,
  ]);

  type ItemCatalogo = FilaServicioMetodo & {
    categoria?: string | number | null;
    cod_proveedor?: string | number | null;
    minimo?: string | number | null | undefined;
    descripcion?: string | null;
    ultimo_usuario?: string | number | null;
  };

  /*
   * Memoizada: solo cambia cuando cambian los catálogos. Si se recreara en cada
   * render, las tablas que la usan dentro de un useMemo (ej. TarifasTable)
   * recibirían datos "nuevos" en cada render y regresarían a la primera página.
   */
  const mapWithCatalogo = React.useCallback((item: ItemCatalogo): FilaServicioMetodo => {
    const categoriaId = item?.categoria ?? item?.categoria_transporte ?? null;
    const proveedorId = item?.entidad_id ?? item?.cod_proveedor ?? null;

    const rubro = catalogos?.rubros?.find((r) => r.cod_rubro === item?.cod_rubro) ?? null;
    const tipoServicio =
      catalogos?.tiposServicio?.find((t) => t.value === item?.cod_tipo_servicio) ?? null;
    const tipoAplicacion =
      catalogos?.tiposAplicacion?.find((t) => t.value === item?.cod_tipo_aplicacion) ?? null;
    const estado = catalogos?.estados?.find((e) => e.value === item?.cod_estado) ?? null;

    const empresa = catalogos?.empresas?.find((e) => e.value === item?.cod_empresa) ?? null;
    const centroCosto = catalogos?.centrosCosto?.find((c) => c.value === item?.cod_cc) ?? null;
    const proveedor =
      catalogos?.proveedores?.find((p) => String(p.value) === String(proveedorId)) ?? null;
    const tipoTransporte =
      catalogos?.tiposTransporte?.find((t) => t.value === item?.cod_tipo_transporte) ?? null;
    const tipoClasificacion =
      catalogos?.tiposClasificacionServicio?.find((c) => c.value === item?.clasificacion) ?? null;
    const categoriaTransporte =
      catalogos?.categoriasTransporte?.find((t) => t.value === categoriaId) ?? null;
    const clasificacionCarga =
      catalogos?.clasificacionesCarga?.find((c) => c.value === item?.cod_clasificacion_carga) ??
      null;
    const tipoCarga = catalogos?.tiposCarga?.find((t) => t.value === item?.cod_tipo_carga) ?? null;
    const tipoPago =
      catalogos?.tiposPago?.find((t) =>
        item?.cod_tipo_pago ? t.value === item?.cod_tipo_pago : t.value === 131,
      ) ?? null;
    const incoterm = catalogos?.incoterms?.find((t) => t.codigo === item?.incoterm_id) ?? null;
    const tipoCalculo =
      catalogos?.tiposCalculo?.find((t) => t.value === item?.cod_tipo_calculo) ?? null;
    const metodoCalculo =
      catalogos?.metodosCalculo?.find((t) => t.value === item?.cod_tipo) ?? null;
    const tipoTarifa =
      catalogos?.tiposTarifa?.find((t) => t.value === item?.cod_tipo_tarifa) ?? null;
    const metodo = catalogos?.metodos?.find((t) => t.cod_servicio === item?.cod_servicio) ?? null;

    const minimo = item?.minimo ?? 0;

    const usuario = catalogos?.usuarios?.find((u) => u.codUsuario === item?.ultimo_usuario) ?? null;

    const ultimoUsuario = usuario?.usuario;

    const fechaInicio = item.fecha_inicial ?? null;
    const fechaFin = item.fecha_final ?? null;

    const obj = {
      ...item,
      ...metodo,
      cod_servicio: item.cod_servicio ?? metodo?.cod_servicio ?? null,
      cod_estado: item.cod_estado ?? metodo?.cod_estado ?? null,
      id: `${item?.cod_servicio ?? ""} - ${item?.descripcion ?? item?.nombre ?? ""}`,
      rubro,
      rubro_nombre: rubro?.nombre ?? "",
      tipoServicio,
      tipoServicio_nombre: tipoServicio?.label ?? "",
      tipoAplicacion,
      tipoAplicacion_nombre: tipoAplicacion?.label ?? "",
      estado,
      estado_nombre: estado?.label ?? "",
      empresa,
      empresa_nombre: empresa?.label ?? "",
      centroCosto,
      centroCosto_nombre: centroCosto?.label ?? "",
      proveedor,
      proveedor_nombre: proveedor?.label ?? "",
      tipoTransporte,
      tipoTransporte_nombre: tipoTransporte?.label ?? "",
      tipoClasificacion,
      tipoClasificacion_nombre: tipoClasificacion?.label ?? "",
      categoriaTransporte,
      categoriaTransporte_nombre: categoriaTransporte?.label ?? "",
      clasificacionCarga,
      clasificacionCarga_nombre: clasificacionCarga?.label ?? "",
      tipoCarga,
      tipoCarga_nombre: tipoCarga?.label ?? "",
      tipoPago,
      tipoPago_nombre: tipoPago?.label ?? "",
      incoterm,
      incoterm_nombre: incoterm?.label ?? "",
      tipoCalculo,
      tipoCalculo_nombre: tipoCalculo?.label ?? "",
      metodoCalculo,
      metodoCalculo_nombre: metodoCalculo?.label ?? "",
      tipoTarifa,
      tipoTarifa_nombre: tipoTarifa?.label ?? "",
      aplicaOrigenesDestinos: item?.todos_los_paises,
      aplicaCommodities: item?.todos_los_commodities,
      fechaInicio,
      fechaFin,
      metodo,
      minimo,
      usuario,
      ultimoUsuario,
    };

    return obj;
  }, [catalogos]);

  return {
    mapWithCatalogo,
    isLoading,
    catalogos,
    refetchMetodos: metodos.refetch,
    refetchServicios: servicios.refetch,
  };
};
