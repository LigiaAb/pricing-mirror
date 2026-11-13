import React from "react";
import type { Servicio } from "@/features/catalogos";
import {
  type CentroCostoCatalog,
  type CiudadesCatalog,
  type ContinentesCatalog,
  type EmpresaCatalog,
  type EstadoCatalog,
  type IncotermCatalog,
  type Metodo,
  type MonedaCatalog,
  type PaisesCatalog,
  type PuntoEnlaceCatalog,
  type RelacionTipoCatalog,
  type RubroCatalog,
  type TipoCatalog,
  type UsuariosCatalog,
  useCatalogosPricing,
} from "@/features/pricing/shared";
import type { FilaServicioMetodo, OptionEntidad } from "../api/types-api";
import type { RutaOption } from "../components/metodo-pais/pais-columns";
import type { KeysToLowerCase } from "../lib/form-types";
import { CATALOGOS_AGREGAR_TODOS, DEFAULT_TODOS_VALUE } from "../lib/tarifa-helpers";

/*
 * La carga y normalización de catálogos vive en pricing/shared
 * (useCatalogosPricing), porque Cotizaciones también la usa. Aquí solo queda
 * lo propio de Tarifas: la opción "TODOS" y mapWithCatalogo.
 */

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

  const { catalogos: base, isLoading, refetchMetodos, refetchServicios } = useCatalogosPricing();

  const catalogos = React.useMemo(() => {
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
  }, [base, agregarTodos]);

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
  const mapWithCatalogo = React.useCallback(
    (item: ItemCatalogo): FilaServicioMetodo => {
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
      const tipoCarga =
        catalogos?.tiposCarga?.find((t) => t.value === item?.cod_tipo_carga) ?? null;
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

      const usuario =
        catalogos?.usuarios?.find((u) => u.codUsuario === item?.ultimo_usuario) ?? null;

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
    },
    [catalogos],
  );

  return {
    mapWithCatalogo,
    isLoading,
    catalogos,
    refetchMetodos,
    refetchServicios,
  };
};
