/* ==========================================================================
 * PRICING · COMPARTIDO
 *
 * Lo que usan Tarifas y Cotizaciones a la vez. Ninguno de los dos módulos
 * importa al otro: ambos dependen solo de aquí.
 *
 *   api/         consultas de catálogos (métodos, proveedores, clientes) y
 *                lectura de rangos de tarifa.
 *   components/  FichaResumen (resumen de un servicio/método de tarifa),
 *                ComboboxOpcion (select buscable en memoria con valor objeto) y
 *                Panel / SectionHeader / MensajeVacio (panel con encabezado).
 *   hooks/       usePermisosPricing (permisos por opción de cada pantalla).
 *   calculadora-embarque/  CalculadoraMedidas + cálculos de volumen, peso y
 *                CW por transporte (corporativos, sin datos de cotización).
 *
 * Regla: aquí entra código que usan AMBOS módulos, o componentes de pantalla
 * reutilizables en pricing; en los dos casos sin depender de ningún submódulo.
 * ========================================================================== */

export {
  CLIENTES_TARIFA_QUERY_KEY,
  type ClienteTarifa,
  clientesSimpleTarifaOptions,
  clientesTarifaOptions,
  consultar100ClientesTarifa,
  consultarClientesTarifa,
  useClientesTarifa,
  useClientesTarifaSimple,
} from "./api/clientes";
export {
  type FiltrosMetodos,
  METODOS_QUERY_KEY,
  type Metodo,
  type MetodoMutationPayload,
  metodoSchema,
  metodos,
  metodosOptions,
  useActualizarMetodo,
  useInsertarMetodo,
  useMetodos,
} from "./api/metodos";
export {
  consultarProveedoresTarifa,
  PROVEEDORES_TARIFA_QUERY_KEY,
  type ProveedorTarifa,
  proveedoresTarifaOptions,
  useProveedoresTarifa,
} from "./api/proveedores";
export {
  type FiltrosTarifaRango,
  TARIFA_RANGOS_QUERY_KEY,
  type TarifaRango,
  tarifaRangoSchema,
  tarifaRangosOptions,
  useTarifaRangos,
} from "./api/tarifa-rangos";
export {
  CalculadoraMedidas,
  type CalculadoraMedidasProps,
} from "./calculadora-embarque/components/calculadora-medidas";
export { useNombreTransporte } from "./calculadora-embarque/hooks/use-nombre-transporte";
export { useUnidadesEmbarque } from "./calculadora-embarque/hooks/use-unidades-embarque";
export {
  calcularTotalesMedidas,
  calcularVolumen,
  combinarTotales,
  convertirLongitud,
  convertirPesoAKg,
  convertirVolumetrico,
  crearDimension,
  type DimensionCalculo,
  esUnidadConocida,
  recalcularDimension,
  reconocerTransporte,
  redondearArriba,
  type TotalesMedidas,
  type Unidad,
} from "./calculadora-embarque/lib/calculos";
export {
  NOMBRE_TRANSPORTE,
  NOMBRE_UNIDAD,
  TIPO_TRANSPORTE,
  TIPOS_TRANSPORTE,
  type TipoTransporte,
  UNIDAD_DEFAULT,
} from "./calculadora-embarque/lib/constantes";
export {
  type EtiquetasCalculadora,
  obtenerEtiquetasCalculadora,
} from "./calculadora-embarque/lib/etiquetas";
export {
  esUnidadEmbarque,
  normalizarUnidades,
  type TipoMedida,
} from "./calculadora-embarque/lib/unidades";
export {
  ComboboxOpcion,
  type ComboboxOpcionProps,
  type OpcionComboboxBase,
} from "./components/combobox-opcion";
export {
  FichaResumen,
  type ItemFichaResumen,
} from "./components/ficha-resumen";
export { MensajeVacio, Panel, SectionHeader } from "./components/panel-dashboard";
export { ResumenItem } from "./components/resumen-item";
export {
  type CatalogosPricing,
  type CentroCostoCatalog,
  type CiudadesCatalog,
  type ContinentesCatalog,
  type EmpresaCatalog,
  type EstadoCatalog,
  type IncotermCatalog,
  type MonedaCatalog,
  type OpcionEntidad,
  type PaisesCatalog,
  type PuntoEnlaceCatalog,
  type RelacionTipoCatalog,
  type RubroCatalog,
  type TipoCatalog,
  type UsuariosCatalog,
  useCatalogosPricing,
} from "./hooks/use-catalogos-pricing";
export {
  OPCION_PERMISOS,
  type OpcionPermisosPricing,
  type PermisosPricing,
  usePermisosPricing,
} from "./hooks/use-permisos-pricing";
export {
  booleano,
  type CampoBooleano,
  type CampoContexto,
  type CampoFijo,
  type CampoMoneda,
  type CampoMonto,
  type CampoOpcion,
  type CampoPropio,
  type CampoRubro,
  type CatalogosMetodo,
  type ContextoMetodo,
  type DefCampo,
  definirMetodo,
  delContexto,
  type ErrorRegla,
  esquemaMonto,
  type FormularioCampo,
  fijo,
  type MonedaOpcion,
  moneda,
  monto,
  opcion,
  type PayloadMetodo,
  propio,
  type ReglaMetodo,
  type ResultadoValidacion,
  type RubroOpcion,
  rangoPermitido,
  rubro,
  sinEsquema,
  ventaNoMenorQueCosto,
} from "./lib/campos-metodo";
export { type ConAmbosFormatos, conAmbosFormatos } from "./lib/formatos";
export {
  type FilaRango,
  METODO_RANGO,
  type TarifaRangoMutationPayload,
} from "./lib/metodos/rango";
export { esNombre, normalizarNombre } from "./lib/nombres";
export { getEstadoMetodo } from "./lib/vigencia-metodo";
