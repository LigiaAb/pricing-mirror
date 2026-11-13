/* ==========================================================================
 * PRICING · COMPARTIDO
 *
 * Lo que usan Tarifas y Cotizaciones a la vez. Ninguno de los dos módulos
 * importa al otro: ambos dependen solo de aquí.
 *
 *   api/         consultas de catálogos (métodos, proveedores, clientes) y
 *                lectura de rangos de tarifa.
 *   components/  FichaResumen (resumen de un servicio/método de tarifa).
 *   calculadora-embarque/  CalculadoraMedidas + cálculos de volumen, peso y
 *                CW por transporte (corporativos, sin datos de cotización).
 *
 * Regla: aquí solo entra código que usan AMBOS módulos y que no depende de
 * ninguno de ellos.
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
} from "./calculadora-embarque/calculadora-medidas";
export {
  calcularTotalesMedidas,
  calcularVolumen,
  combinarTotales,
  convertirLongitud,
  convertirPesoAKg,
  convertirVolumetrico,
  crearDimension,
  type DimensionCalculo,
  type TotalesMedidas,
  type Unidad,
} from "./calculadora-embarque/calculos";
export {
  TIPO_TRANSPORTE,
  TIPOS_TRANSPORTE,
  type TipoTransporte,
  UNIDAD_DEFAULT,
} from "./calculadora-embarque/constantes";
export {
  type EtiquetasCalculadora,
  obtenerEtiquetasCalculadora,
} from "./calculadora-embarque/etiquetas";
export {
  esUnidadEmbarque,
  normalizarUnidades,
  type TipoMedida,
} from "./calculadora-embarque/unidades";
export { useUnidadesEmbarque } from "./calculadora-embarque/use-unidades-embarque";
export {
  FichaResumen,
  type ItemFichaResumen,
} from "./components/ficha-resumen";
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
  fijo,
  type FormularioCampo,
  moneda,
  type MonedaOpcion,
  monto,
  opcion,
  type PayloadMetodo,
  propio,
  rangoPermitido,
  type ReglaMetodo,
  type ResultadoValidacion,
  rubro,
  type RubroOpcion,
  sinEsquema,
  ventaNoMenorQueCosto,
} from "./lib/campos-metodo";
export { type ConAmbosFormatos, conAmbosFormatos } from "./lib/formatos";
export {
  type FilaRango,
  METODO_RANGO,
  type TarifaRangoMutationPayload,
} from "./lib/metodos/rango";
export { getEstadoMetodo } from "./lib/vigencia-metodo";
