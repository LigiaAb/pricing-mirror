/* ==========================================================================
 * CABECERA DE COTIZACIÓN: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Cada campo de la cabecera se declara UNA vez aquí. A partir de esta lista
 * se generan automáticamente:
 *
 *   - el esquema Zod y el tipo `CotizacionCabecera`      (api/cotizacion-cabecera.ts)
 *   - el tipo `CotizacionCabeceraPayload`                 (insertar / actualizar)
 *   - las reglas del formulario y los campos obligatorios (hooks/use-formulario-cotizacion.ts)
 *   - las etiquetas del formulario y del mensaje "favor de completar"
 *   - los filtros del listado y los que se envían al backend
 *   - los datos que se mandan al cálculo (filtrosCalculo)
 *
 * ¿Cómo agrego un campo?
 *   1. Agrégalo en CAMPOS_CABECERA (abajo) con sus propiedades.
 *   2. Si se ve en el formulario, colócalo en el JSX de components/cotizacion-form.tsx:
 *        {renderSelect("miCampo")}   o   {renderText("miCampo")}
 *   Nada más.
 * ========================================================================== */

import { z } from "zod";

import { zId } from "@/shared/lib/zod-scalars";

import type { CatalogosFormularioCotizacion } from "../hooks/use-formulario-cotizacion";
import type { Id } from "./tipos";

/* ==========================================================================
 * TIPOS DE LA DEFINICIÓN
 * ========================================================================== */

/** Comportamiento del campo dentro del formulario de cabecera. */
type FormularioCampo = {
  /** Catálogo que alimenta el select (ver use-catalogos-cotizacion). */
  catalogo?: keyof CatalogosFormularioCotizacion;
  /** Campos que se limpian cuando este cambia. */
  reset?: readonly string[];
  /** Campo que debe tener valor antes de poder editar este. */
  require?: string;
  /** No se puede editar. */
  readonly?: boolean;
  /** Obligatorio para considerar el formulario válido. */
  requerido?: boolean;
};

type DefCampoCabecera = {
  /** Nombre del campo en el backend. */
  cod: string;
  /** Validación al leer del backend. */
  esquema: z.ZodTypeAny;
  /** Texto que ve el usuario. */
  label?: string;
  /** Si existe, el campo forma parte del formulario. La llave del objeto es su id visual. */
  formulario?: FormularioCampo;
  /** Se envía al cálculo de tarifas (filtrosCalculo). */
  calculo?: boolean;
  /** Se puede filtrar el listado por este campo desde el formulario de filtros. */
  filtro?: boolean;
  /** El filtro además se envía al backend (si no, solo filtra en pantalla). */
  filtroApi?: boolean;
};

/* Validaciones reutilizables */
const id = () => zId.nullable().optional();
const texto = () => z.string().nullable().optional();
const fecha = () => z.union([z.string(), z.date()]).nullable().optional();

/* ==========================================================================
 * CAMPOS
 *
 * La llave es el id visual del formulario (ej. "tipoCarga"); `cod` es el
 * nombre en el backend (ej. "cod_tipo_carga"). El orden de los campos con
 * `formulario` es el orden en que se validan y se listan los faltantes.
 * ========================================================================== */

export const CAMPOS_CABECERA = {
  cod_cotizacion_cabecera: { cod: "cod_cotizacion_cabecera", esquema: zId, formulario: {} },

  cod_tarifaplantilla: { cod: "cod_tarifaplantilla", esquema: id(), formulario: {} },

  fecha: {
    cod: "cabezera_cotizacion_fecha",
    esquema: fecha(),
    label: "Fecha",
    formulario: { readonly: true, requerido: true },
  },

  empresa: {
    cod: "cod_empresa",
    esquema: id(),
    label: "Empresa",
    formulario: { catalogo: "empresas", reset: ["centroCosto", "cod_cc"], readonly: true, requerido: true },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  centroCosto: {
    cod: "cod_cc",
    esquema: id(),
    label: "Centro de costo",
    formulario: { catalogo: "centrosCosto", require: "empresa", requerido: true },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  cliente: {
    cod: "entidad_id",
    esquema: id(),
    label: "Cliente",
    formulario: { reset: ["contacto", "entidadcontacto_id"], requerido: true },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  contacto: {
    cod: "entidadcontacto_id",
    esquema: id(),
    label: "Contacto",
    formulario: { require: "cliente", requerido: true },
  },

  tipoTransporte: {
    cod: "cod_tipo_transporte",
    esquema: id(),
    label: "Tipo de transporte",
    formulario: {
      catalogo: "tiposTransporte",
      reset: ["tipoServicio", "cod_tipo_servicio", "tipoCalculo", "cod_tipo_calculo", "tipoClasificacion", "clasificacion"],
      requerido: true,
    },
    calculo: true,
    filtro: true,
  },

  tipoServicio: {
    cod: "cod_tipo_servicio",
    esquema: id(),
    label: "Tipo de servicio",
    formulario: { catalogo: "tiposServicio", reset: ["tipoAplicacion", "cod_tipo_aplicacion"], requerido: true },
    calculo: true,
    filtro: true,
  },

  tipoCarga: {
    cod: "cod_tipo_carga",
    esquema: id(),
    label: "Tipo de carga",
    formulario: { catalogo: "tiposCarga", requerido: true },
    calculo: true,
  },

  clasificacionCarga: {
    cod: "cod_clasificacion_carga",
    esquema: id(),
    label: "Clasificación de carga",
    formulario: { catalogo: "clasificacionesCarga", requerido: true },
    calculo: true,
  },

  incoterm: {
    cod: "incoterm_id",
    esquema: id(),
    label: "Incoterm",
    formulario: { catalogo: "incoterms" },
    calculo: true,
    filtro: true,
  },

  tipoPago: {
    cod: "cod_tipo_pago",
    esquema: id(),
    label: "Tipo de pago",
    formulario: { catalogo: "tiposPago", reset: ["estacion", "entidad_id_estacion"], requerido: true },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  estacion: { cod: "entidad_id_estacion", esquema: id(), label: "Estación DSV", formulario: {} },

  contacto_estacion: { cod: "contacto_estacion", esquema: texto(), label: "Contacto estación", formulario: {} },

  paisOrigen: {
    cod: "cod_pais_origen",
    esquema: id(),
    label: "País de origen",
    formulario: {
      catalogo: "paises",
      reset: ["puntoEnlaceOrigen", "cod_puntoenlace_origen", "ciudadOrigen"],
      requerido: true,
    },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  tipoPuntoEnlaceOrigen: {
    cod: "cod_tipo_puntoenlace_origen",
    esquema: id(),
    label: "Tipo de origen",
    formulario: {
      catalogo: "tiposPuntoEnlace",
      reset: ["puntoEnlaceOrigen", "cod_puntoenlace_origen"],
      requerido: true,
    },
  },

  puntoEnlaceOrigen: {
    cod: "cod_puntoenlace_origen",
    esquema: id(),
    label: "Origen",
    formulario: { catalogo: "puntosEnlace", requerido: true },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  ciudadOrigen: {
    cod: "cod_ciudad_origen",
    esquema: id(),
    label: "Ciudad de origen",
    formulario: { catalogo: "ciudades" },
    calculo: true,
  },

  direccion_origen: { cod: "direccion_origen", esquema: texto(), label: "Origen", formulario: {} },

  paisDestino: {
    cod: "cod_pais_destino",
    esquema: id(),
    label: "País de destino",
    formulario: {
      catalogo: "paises",
      reset: ["puntoEnlaceDestino", "cod_puntoenlace_destino", "ciudadDestino"],
      requerido: true,
    },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  tipoPuntoEnlaceDestino: {
    cod: "cod_tipo_puntoenlace_destino",
    esquema: id(),
    label: "Tipo de destino",
    formulario: {
      catalogo: "tiposPuntoEnlace",
      reset: ["puntoEnlaceDestino", "cod_puntoenlace_destino"],
      requerido: true,
    },
  },

  puntoEnlaceDestino: {
    cod: "cod_puntoenlace_destino",
    esquema: id(),
    label: "Destino",
    formulario: { catalogo: "puntosEnlace", requerido: true },
    calculo: true,
    filtro: true,
    filtroApi: true,
  },

  ciudadDestino: {
    cod: "cod_ciudad_destino",
    esquema: id(),
    label: "Ciudad de destino",
    formulario: { catalogo: "ciudades", require: "paisDestino" },
    calculo: true,
  },

  direccion_destino: { cod: "direccion_destino", esquema: texto(), label: "Destino", formulario: {} },

  estado: { cod: "cod_estado", esquema: id(), label: "Estado", formulario: {}, filtroApi: true },

  cod_usuario: { cod: "cod_usuario", esquema: id(), formulario: {} },

  cod_continente_origen: { cod: "cod_continente_origen", esquema: id(), formulario: {}, calculo: true },

  cod_continente_destino: { cod: "cod_continente_destino", esquema: id(), formulario: {}, calculo: true },

  descripcion: { cod: "descripcion", esquema: texto(), label: "Descripción", formulario: {} },

  carrier: { cod: "carrier_id", esquema: id(), label: "Carrier", formulario: { catalogo: "proveedores" } },

  /* ----- Solo lectura: los devuelve el backend, no están en el formulario ----- */

  entidad_nombre: { cod: "entidad_nombre", esquema: texto() },
  cod_version_activa: { cod: "cod_version_activa", esquema: id() },
  estado_nombre: { cod: "estado_nombre", esquema: z.string().nullable() },
  usuario: { cod: "usuario", esquema: z.string().nullable() },
  peso: { cod: "peso", esquema: z.number().nullable() },
  volumen: { cod: "volumen", esquema: z.number().nullable() },
} as const satisfies Record<string, DefCampoCabecera>;

/* ==========================================================================
 * ESQUEMA Y TIPOS (generados)
 * ========================================================================== */

type Campos = typeof CAMPOS_CABECERA;

/** Id visual de cualquier campo de la cabecera. */
export type IdCampoCabecera = keyof Campos;

type ShapeCabecera = { [K in keyof Campos as Campos[K]["cod"]]: Campos[K]["esquema"] };

const LISTA_CAMPOS = Object.entries(CAMPOS_CABECERA) as Array<[IdCampoCabecera, DefCampoCabecera]>;

const shapeCabecera = Object.fromEntries(
  LISTA_CAMPOS.map(([, campo]) => [campo.cod, campo.esquema]),
) as ShapeCabecera;

const esquemaCamposCabecera = z.object(shapeCabecera);

/**
 * Cabecera de cotización tal como la devuelve el backend.
 * passthrough conserva cualquier campo extra que devuelva el backend.
 */
export const cotizacionCabeceraSchema = esquemaCamposCabecera.passthrough();

export type CotizacionCabecera = z.infer<typeof cotizacionCabeceraSchema>;

type CamposCabecera = z.infer<typeof esquemaCamposCabecera>;

/** Nombre en el backend de cualquier campo de la cabecera. */
export type CodCampoCabecera = keyof CamposCabecera;

/** Lo que se envía al insertar / actualizar: todos los campos opcionales. */
export type CotizacionCabeceraPayload = {
  [K in CodCampoCabecera]?: CamposCabecera[K] | null;
} & {
  cabezera_cotizacion_fecha?: Date | string | null;

  [key: string]: unknown;
};

/* ==========================================================================
 * FORMULARIO
 * ========================================================================== */

export type ReglaCampoCabecera = FormularioCampo & {
  cod: string;
  default?: unknown;
};

/**
 * Reglas del formulario: { idVisual: { cod, catalogo, reset, require, readonly, default } }.
 * `defaults` trae los valores iniciales que dependen del contexto (empresa actual, usuario...).
 */
export function construirReglasFormulario(
  defaults: Partial<Record<IdCampoCabecera, unknown>> = {},
): Record<string, ReglaCampoCabecera> {
  const reglas: Record<string, ReglaCampoCabecera> = {};

  for (const [idCampo, campo] of LISTA_CAMPOS) {
    if (!campo.formulario) continue;

    const { requerido: _requerido, ...regla } = campo.formulario;

    reglas[idCampo] = {
      cod: campo.cod,
      ...regla,
      ...(idCampo in defaults ? { default: defaults[idCampo] } : {}),
    };
  }

  return reglas;
}

/** Ids visuales de los campos obligatorios del formulario. */
export const CAMPOS_REQUERIDOS: readonly string[] = LISTA_CAMPOS.filter(
  ([, campo]) => campo.formulario?.requerido,
).map(([idCampo]) => idCampo);

/** Texto que ve el usuario para un campo (si no tiene label, devuelve el id). */
export function etiquetaCampo(idCampo: string): string {
  const campo = (CAMPOS_CABECERA as Record<string, DefCampoCabecera>)[idCampo];
  return campo?.label ?? idCampo;
}

/* ==========================================================================
 * FILTROS DEL LISTADO
 * ========================================================================== */

/** Campos (nombre backend) que se toman del formulario de filtros. */
export const CAMPOS_FILTRO = LISTA_CAMPOS.filter(([, campo]) => campo.filtro).map(
  ([, campo]) => campo.cod as CodCampoCabecera,
);

/** Campos (nombre backend) que se envían como parámetro al listar cabeceras. */
export const CAMPOS_FILTRO_API = LISTA_CAMPOS.filter(([, campo]) => campo.filtroApi).map(
  ([, campo]) => campo.cod as CodCampoCabecera,
);

/** Filtros del listado, con los mismos nombres que el backend (cod_empresa, cod_cc, ...). */
export type FiltrosCotizacionesCabecera = Partial<Record<CodCampoCabecera, Id | null>>;

/* ==========================================================================
 * CÁLCULO
 * ========================================================================== */

/** Campos (nombre backend) que se envían al cálculo de tarifas. */
export const CAMPOS_CALCULO = LISTA_CAMPOS.filter(([, campo]) => campo.calculo).map(
  ([, campo]) => campo.cod as CodCampoCabecera,
);

/** Campos opcionales sin `undefined` explícito (compatible con exactOptionalPropertyTypes). */
type OpcionalesSinUndefined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/** Cabecera mínima que necesita el cálculo: el id y cualquier otro campo conocido. */
export type CotizacionParaCalculo = Pick<CamposCabecera, "cod_cotizacion_cabecera"> &
  OpcionalesSinUndefined<Omit<CamposCabecera, "cod_cotizacion_cabecera">> & {
    [key: string]: unknown;
  };

/** Datos de la cabecera que viajan al cálculo de tarifas. */
export function construirFiltrosCalculo(cotizacion: Partial<CotizacionCabecera>): Record<string, unknown> {
  const filtros: Record<string, unknown> = {};

  for (const cod of CAMPOS_CALCULO) {
    filtros[cod] = cotizacion[cod] ?? null;
  }

  return filtros;
}
