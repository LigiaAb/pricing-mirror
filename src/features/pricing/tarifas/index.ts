// Métodos y proveedores viven en pricing/shared; se re-exportan aquí por compatibilidad.
export {
  consultarProveedoresTarifa,
  type FiltrosMetodos,
  METODOS_QUERY_KEY,
  type Metodo,
  type MetodoMutationPayload,
  metodoSchema,
  metodos,
  metodosOptions,
  PROVEEDORES_TARIFA_QUERY_KEY,
  type ProveedorTarifa,
  proveedoresTarifaOptions,
  useActualizarMetodo,
  useInsertarMetodo,
  useMetodos,
  useProveedoresTarifa,
} from "@/features/pricing/shared";
export { buscarClientesTarifa, type EntidadTarifaOption } from "./api/buscar-entidad";
export {
  COD_ESTADO_ELIMINADO,
  crearCatalogoMetodo,
  type FiltrosMetodo,
} from "./api/catalogo-metodo";
export { type Incoterm, incotermSchema, incotermsOptions, useIncoterms } from "./api/iconterms";
export {
  type FiltrosMetodoCommodity,
  METODO_COMMODITIES_QUERY_KEY,
  type MetodoCommodity,
  type MetodoCommodityMutationPayload,
  metodoCommoditiesOptions,
  metodoCommoditySchema,
  useActualizarMetodoCommodity,
  useEliminarMetodoCommodity,
  useInsertarMetodoCommodity,
  useMetodoCommodities,
} from "./api/metodo-commodities";
export {
  MONEDAS_OPERATIVAS_QUERY_KEY,
  type MonedaOperativa,
  monedaOperativaSchema,
  monedasOperativas,
  monedasOperativasOptions,
  useMonedasOperativas,
} from "./api/monedas";
export { type MetodoRaw, metodosSchema } from "./api/schemas";
export {
  actualizarServicioOptions,
  type FiltrosServicios,
  insertarServicioOptions,
  SERVICIOS_QUERY_KEY,
  type Servicio,
  type ServicioMutationPayload,
  servicioSchema,
  serviciosOptions,
  useActualizarServicio,
  useInsertarServicio,
  useServicios,
} from "./api/servicios";
export {
  type FiltrosTarifaCobertura,
  type MonedaCobertura,
  monedaCoberturaSchema,
  monedasCoberturaOptions,
  TARIFA_COBERTURA_QUERY_KEY,
  type TarifaCobertura,
  type TarifaCoberturaMutationPayload,
  tarifaCoberturaOptions,
  tarifaCoberturaSchema,
  useActualizarTarifaCobertura,
  useInsertarTarifaCobertura,
  useMonedasCobertura,
  useTarifaCobertura,
} from "./api/tarifa-cobertura";
export {
  type FiltrosTarifaCostoVenta,
  type MonedaCostoVenta,
  monedaCostoVentaSchema,
  monedasCostoVentaOptions,
  TARIFA_COSTOVENTA_QUERY_KEY,
  type TarifaCostoVenta,
  type TarifaCostoVentaMutationPayload,
  tarifaCostoVentaOptions,
  tarifaCostoVentaSchema,
  useActualizarTarifaCostoVenta,
  useInsertarTarifaCostoVenta,
  useMonedasCostoVenta,
  useTarifaCostoVenta,
} from "./api/tarifa-costoventa";
export {
  type FiltrosTarifaDetalle,
  TARIFA_DETALLES_QUERY_KEY,
  type TarifaDetalle,
  type TarifaDetalleMutationPayload,
  tarifaDetalleSchema,
  tarifaDetallesOptions,
  useActualizarTarifaDetalle,
  useEliminarTarifaDetalle,
  useInsertarTarifaDetalle,
  useTarifaDetalles,
} from "./api/tarifa-detalles";
export {
  eliminarTarifaEntidadOptions,
  type FiltrosTarifaEntidad,
  guardarTarifaEntidadOptions,
  TARIFA_ENTIDADES_QUERY_KEY,
  type TarifaEntidad,
  type TarifaEntidadMutationPayload,
  tarifaEntidadesOptions,
  tarifaEntidadSchema,
  useEliminarTarifaEntidad,
  useGuardarTarifaEntidad,
  useTarifaEntidades,
} from "./api/tarifa-entidades";
export {
  type FiltrosTarifaEquipo,
  type MonedaEquipo,
  monedaEquipoSchema,
  monedasEquipoOptions,
  TARIFA_EQUIPO_QUERY_KEY,
  type TarifaEquipo,
  type TarifaEquipoMutationPayload,
  tarifaEquipoOptions,
  tarifaEquipoSchema,
  useActualizarTarifaEquipo,
  useInsertarTarifaEquipo,
  useMonedasEquipo,
  useTarifaEquipo,
} from "./api/tarifa-equipo";
export {
  type FiltrosTarifaPorcentaje,
  type MonedaPorcentaje,
  monedaPorcentajeSchema,
  monedasPorcentajeOptions,
  TARIFA_PORCENTAJE_QUERY_KEY,
  type TarifaPorcentaje,
  type TarifaPorcentajeMutationPayload,
  tarifaPorcentajeOptions,
  tarifaPorcentajeSchema,
  useActualizarTarifaPorcentaje,
  useInsertarTarifaPorcentaje,
  useMonedasPorcentaje,
  useTarifaPorcentaje,
} from "./api/tarifa-porcentaje";
export {
  type FiltrosTarifaRango,
  guardarTarifaRangosOptions,
  type MonedaRango,
  monedaRangoSchema,
  monedasRangoOptions,
  TARIFA_RANGOS_QUERY_KEY,
  type TarifaRango,
  type TarifaRangoMutationPayload,
  tarifaRangoSchema,
  tarifaRangosOptions,
  useGuardarTarifaRangos,
  useMonedasRango,
  useTarifaRangos,
} from "./api/tarifa-rangos";
export {
  type FiltrosTarifaRuta,
  TARIFA_RUTAS_QUERY_KEY,
  type TarifaRuta,
  type TarifaRutaMutationPayload,
  tarifaRutaSchema,
  tarifaRutasOptions,
  useActualizarTarifaRuta,
  useEliminarTarifaRuta,
  useInsertarTarifaRuta,
  useTarifaRutas,
} from "./api/tarifa-rutas";
export {
  type FiltrosTarifaScalling,
  type MonedaScalling,
  monedaScallingSchema,
  monedasScallingOptions,
  TARIFA_SCALLING_QUERY_KEY,
  type TarifaScalling,
  type TarifaScallingMutationPayload,
  tarifaScallingOptions,
  tarifaScallingSchema,
  useActualizarTarifaScalling,
  useEliminarTarifaScalling,
  useInsertarTarifaScalling,
  useMonedasScalling,
  useTarifaScalling,
} from "./api/tarifa-scalling";
export type { FilaServicioMetodo, OptionEntidad, SelectOptionBase } from "./api/types-api";
export { CreacionTarifa } from "./components/creacion-tarifa";
export { FormularioTarifa, type TarifaSubmitPayload } from "./components/formulario-tarifa";
export {
  type CommodityOption,
  crearCommoditiesColumns,
  type EstadoCommodityOption,
  type FilaMetodoCommodity,
} from "./components/metodo-commodities/commodities-columns";
export { CommoditiesForm } from "./components/metodo-commodities/commodities-form";
export { CommoditiesTable } from "./components/metodo-commodities/commodities-table";
export {
  crearDetalleColumns,
  type DetalleTipoOption,
  type FilaMetodoDetalle,
} from "./components/metodo-detalle/detalle-columns";
export { DetalleForm } from "./components/metodo-detalle/detalle-form";
export { DetalleTable } from "./components/metodo-detalle/detalle-table";
export {
  crearEntidadColumns,
  type FilaMetodoEntidad,
} from "./components/metodo-entidad/entidad-columns";
export { EntidadForm } from "./components/metodo-entidad/entidad-form";
export { EntidadTable } from "./components/metodo-entidad/entidad-table";
export {
  crearPaisColumns,
  type FilaMetodoPais,
  type RutaOption,
} from "./components/metodo-pais/pais-columns";
export { PaisForm } from "./components/metodo-pais/pais-form";
export { PaisTable } from "./components/metodo-pais/pais-table";
export { CampoMetodo } from "./components/metodos/campo-metodo";
export {
  MetodoCobertura,
  /** @deprecated Nombre anterior; usar `MetodoCobertura`. */
  MetodoCobertura as CoberturaTable,
} from "./components/metodos/cobertura/cobertura";
export { CoberturaForm } from "./components/metodos/cobertura/cobertura-form";
export {
  MetodoCostoPorcentaje,
  /** @deprecated Nombre anterior; usar `MetodoCostoPorcentaje`. */
  MetodoCostoPorcentaje as CostoPorcentajeTable,
} from "./components/metodos/costo-porcentaje/costo-porcentaje";
export { CostoPorcentajeForm } from "./components/metodos/costo-porcentaje/costo-porcentaje-form";
export {
  MetodoCostoVenta,
  /** @deprecated Nombre anterior; usar `MetodoCostoVenta`. */
  MetodoCostoVenta as CostoVentaTable,
} from "./components/metodos/costoVenta/costo-venta";
export { CostoVentaForm } from "./components/metodos/costoVenta/costo-venta-form";
export {
  MetodoEquipo,
  /** @deprecated Nombre anterior; usar `MetodoEquipo`. */
  MetodoEquipo as EquipoTable,
} from "./components/metodos/equipo/equipo";
export { EquipoForm } from "./components/metodos/equipo/equipo-form";
export {
  MetodoPorcentaje,
  /** @deprecated Nombre anterior; usar `MetodoPorcentaje`. */
  MetodoPorcentaje as PorcentajeTable,
} from "./components/metodos/porcentaje/porcentaje";
export { PorcentajeForm } from "./components/metodos/porcentaje/porcentaje-form";
export {
  crearRangoColumns,
  type FilaMetodoRango,
  type MonedaRangoOption,
} from "./components/metodos/rango/rango-columns";
export { RangoForm } from "./components/metodos/rango/rango-form";
export { RangoTable } from "./components/metodos/rango/rango-table";
export {
  crearScallingColumns,
  type FilaMetodoScalling,
  type MonedaScallingOption,
  type PuntoEnlaceScallingOption,
  type TipoPuntoEnlaceScallingOption,
} from "./components/metodos/scalling/scalling-columns";
export { ScallingForm } from "./components/metodos/scalling/scalling-form";
export { ScallingTable } from "./components/metodos/scalling/scalling-table";
export { TarifasTabs } from "./components/tab-tarifas";
export { crearTarifasColumns } from "./components/tarifas-columns";
export { TarifasTable } from "./components/tarifas-table";
export { keysToLowerCase, useCatalogosTarifas } from "./hooks/use-catalogos-tarifas";
export { useFormulario } from "./hooks/use-formulario-tarifas";
export {
  filtrarOpciones,
  type MonedaOpcion,
  monedaAOpcion,
  type RubroOpcion,
  useFiltroOpciones,
  useOpcionesMonedas,
  useOpcionesRubros,
} from "./hooks/use-opciones-tarifa";
export {
  booleano,
  type CampoBooleano,
  type CampoFijo,
  type CampoMoneda,
  type CampoMonto,
  type CampoOpcion,
  type CampoRubro,
  type CatalogosMetodo,
  type ContextoMetodo,
  type DefCampo,
  definirMetodo,
  delContexto,
  fijo,
  moneda,
  monto,
  opcion,
  rangoPermitido,
  type ReglaMetodo,
  rubro,
  sinEsquema,
  ventaNoMenorQueCosto,
} from "./lib/campos-metodo";
export type {
  CatalogOption,
  CatalogosProcesados,
  DefaultValues,
  FieldAction,
  FieldRule,
  FieldRulesMap,
  FormValuesState,
  KeysToLowerCase,
  OnInputArgs,
  TipoFormulario,
  UseFormularioOptions,
  VisibleWhenRule,
} from "./lib/form-types";
export {
  type FilaCobertura,
  METODO_COBERTURA,
  type MonedaCoberturaOption,
} from "./lib/metodos/cobertura";
export {
  type FilaCostoPorcentaje,
  METODO_COSTO_PORCENTAJE,
  type MonedaCostoPorcentajeOption,
  type RubroCostoPorcentajeOption,
} from "./lib/metodos/costo-porcentaje";
export {
  type FilaCostoVenta,
  METODO_COSTO_VENTA,
  type MonedaCostoVentaOption,
} from "./lib/metodos/costo-venta";
export {
  type EquipoOption,
  type FilaEquipo,
  METODO_EQUIPO,
  type MonedaEquipoOption,
} from "./lib/metodos/equipo";
export {
  type FilaPorcentaje,
  METODO_PORCENTAJE,
  type MonedaPorcentajeOption,
  type RubroPorcentajeOption,
} from "./lib/metodos/porcentaje";
export { fieldRules } from "./lib/tarifa-field-rules";
export {
  CATALOGOS_AGREGAR_TODOS,
  conAmbosFormatos,
  convertClasificacionServicio,
  DEFAULT_TODOS_VALUE,
  eliminarDuplicadosById,
  setServicioBase,
} from "./lib/tarifa-helpers";
export {
  filtrarValoresPorPayload,
  getPlainValue,
  valoresSoloCodigos,
} from "./lib/transforms-tarifa";
