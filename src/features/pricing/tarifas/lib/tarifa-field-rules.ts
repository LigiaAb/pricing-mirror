import type { FieldRule } from "./form-types";
import { DEFAULT_TODOS_VALUE } from "./tarifa-helpers";

/**
 * 🟡 CUÁNDO USAR:
 * - formularios complejos
 * - payload múltiple
 * - defaults
 * - resets
 * - visibleWhen
 *
 * 🔴 CAMBIAR:
 * - dejar solo los campos reales de tu pantalla
 *
 * 🔵 NO TOCAR:
 * - la estructura de cada regla (type FieldRule)
 */
export const fieldRules: Record<string, FieldRule> = {
  empresa: {
    // 🔴 OBLIGATORIO: nombre backend
    cod: "cod_empresa",

    // 🟣 RESET: limpia estos al cambiar empresa
    reset: ["centroCosto", "cod_cc"],

    // 🟡 SELECT: catálogo que alimenta el input
    catalogo: "empresas",

    // 🔵 PAYLOAD: este campo pertenece a servicio
    payload: ["servicio"],

    // 🟠 DEFAULT: valor inicial
    default: null,

    // ⚫ READONLY: no se puede editar
    readonly: false,
  },

  centroCosto: {
    cod: "cod_cc",

    // 🟤 REQUIRE: no se habilita si no hay empresa
    require: ["empresa"],
    catalogo: "centrosCosto",
    payload: ["servicio"],
  },

  estado: {
    cod: "cod_estado",

    // 🔵 este campo va en ambos payloads
    payload: ["servicio", "metodo"],
  },

  servicio: {
    cod: "cod_servicio",
    tipo: "number",
    payload: ["servicio", "metodo"],
  },

  rubro: {
    cod: "cod_rubro",
    catalogo: "rubros",
    payload: ["servicio"],
  },

  proveedor: {
    cod: "entidad_id",
    catalogo: "proveedores",
    payload: ["servicio"],
  },

  nombre: {
    cod: "nombre",
    payload: ["servicio"],
  },

  siglas: {
    cod: "siglas",
    payload: ["servicio"],
  },

  tipoTransporte: {
    cod: "cod_tipo_transporte",

    // 🟣 RESET: cambiar transporte invalida estos campos
    reset: [
      "tipoServicio",
      "cod_tipo_servicio",
      "tipoCalculo",
      "cod_tipo_calculo",
      "tipoClasificacion",
      "clasificacion",
      "categoriaTransporte",
      "categoria",
    ],
    catalogo: "tiposTransporte",
    payload: ["servicio"],
  },

  tipoServicio: {
    cod: "cod_tipo_servicio",
    reset: ["tipoAplicacion", "cod_tipo_aplicacion"],
    require: ["tipoTransporte"],
    catalogo: "tiposServicio",
    payload: ["servicio"],
    default: { label: "TODOS", value: DEFAULT_TODOS_VALUE },
  },

  tipoClasificacion: {
    cod: "clasificacion",
    require: ["tipoTransporte"],
    catalogo: "tiposClasificacionServicio",
    payload: ["servicio"],
  },

  categoriaTransporte: {
    cod: "categoria",
    require: ["tipoTransporte"],
    catalogo: "categoriasTransporte",
    payload: ["servicio"],
    default: { label: "TODOS", value: DEFAULT_TODOS_VALUE },
  },

  obligatorio: {
    cod: "obligatorio",
    require: ["tipoClasificacion"],

    // 🟢 VISIBLE WHEN: solo aparece si se cumple la condición
    visibleWhen: {
      field: "tipoClasificacion",
      key: "label",
      value: ["DUE AGENT", "INTERNO"],
    },
    payload: ["servicio"],
  },

  clasificacionCarga: {
    cod: "cod_clasificacion_carga",
    catalogo: "clasificacionesCarga",
    payload: ["servicio"],
    default: { label: "TODOS", value: DEFAULT_TODOS_VALUE },
  },

  tipoCarga: {
    cod: "cod_tipo_carga",
    catalogo: "tiposCarga",
    payload: ["servicio"],
    default: { label: "TODOS", value: DEFAULT_TODOS_VALUE },
  },

  incoterm: {
    cod: "incoterm_id",
    catalogo: "incoterms",
    payload: ["servicio"],
  },

  tipoPago: {
    cod: "cod_tipo_pago",
    catalogo: "tiposPago",
    payload: ["servicio"],
  },

  tipoAplicacion: {
    cod: "cod_tipo_aplicacion",
    catalogo: "tiposAplicacion",
    payload: ["servicio"],
    default: { label: "TODOS", value: DEFAULT_TODOS_VALUE },
  },

  tipoCalculo: {
    cod: "cod_tipo_calculo",
    catalogo: "tiposCalculo",
    payload: ["servicio"],
  },

  servicioInterno: {
    cod: "servicio_interno",
    payload: ["servicio"],

    // 🟠 DEFAULT: valor inicial
    default: null,
  },

  metodoCalculo: {
    cod: "cod_tipo",
    catalogo: "metodosCalculo",
    payload: ["metodo"],
  },

  aplicaOrigenesDestinos: {
    cod: "todos_los_paises",
    payload: ["metodo"],
    default: true,
  },

  aplicaCommodities: {
    cod: "todos_los_commodities",
    payload: ["metodo"],
    default: true,
  },

  aplicaTodosClientes: {
    cod: "todos_los_clientes",
    payload: ["metodo"],
    default: undefined,
  },

  tipoTarifa: {
    cod: "cod_tipo_tarifa",
    catalogo: "tiposTarifa",
    payload: ["metodo"],
    default: { cod_tipo: 97, nom_tipo: "PUBLICA", label: "PUBLICA", value: 97 },
  },

  metodo: {
    cod: "cod_metodo",
    payload: ["metodo"],
  },

  minimo: {
    cod: "minimo",
    payload: ["metodo"],
  },

  fechaInicio: {
    cod: "fecha_inicial",

    // 🟠 TIPO: campo especial para fechas
    tipo: "datetime",
    payload: ["metodo"],
    default: new Date(),
  },

  fechaFin: {
    cod: "fecha_final",
    tipo: "datetime",
    payload: ["metodo"],
  },

  fechaCreacion: {
    cod: "fecha_creacion",
    tipo: "datetime",
    payload: ["metodo"],
    default: new Date(),
  },

  fechaModificacion: {
    cod: "ultima_fecha_modificacion",
    tipo: "datetime",
    payload: ["metodo"],
    default: new Date(),
  },

  usuario: {
    cod: "ultimo_usuario",
    payload: ["metodo"],
  },
};
