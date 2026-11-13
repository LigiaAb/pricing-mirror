/* ==========================================================================
 * MÉTODOS DE TARIFA: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Cada campo de un método (costo, venta, moneda, ...) se declara UNA vez en
 * la definición del método (lib/metodos/<metodo>.ts). A partir de ella se
 * obtienen:
 *
 *   - el esquema Zod de la lista y el tipo del registro   (api/tarifa-<metodo>.ts)
 *   - el tipo del payload y la función que lo arma        (aPayload)
 *   - la fila del formulario desde el registro del API    (aFila: busca las opciones)
 *   - la validación del formulario                        (validar)
 *   - la fila inicial de un registro nuevo                (filaNueva)
 *   - la etiqueta y el input de cada campo                (components/metodos/campo-metodo.tsx)
 *
 * Tipos de campo: monto, moneda, rubro, booleano, fijo, delContexto.
 * Si un campo no se comporta como su tipo, se sobrescribe SOLO esa parte en
 * la definición (aPayload, deApi, esquema, ...) en lugar de forzar el tipo.
 *
 * ¿Cómo agrego un campo a un método?
 *   1. Agrégalo en `campos` de lib/metodos/<metodo>.ts.
 *   2. Si se ve en el formulario: <CampoMetodo {...campo} campo="mi_campo" /> en su -form.tsx.
 *   El orden de `campos` es el orden del payload.
 * ========================================================================== */

import { z } from "zod";

import { zId } from "@/shared/lib/zod-scalars";

import type { MonedaOpcion, RubroOpcion } from "../hooks/use-opciones-tarifa";

type Id = string | number;

type Simplificar<T> = { [K in keyof T]: T[K] } & {};

/** Valores de una fila tal como los maneja el formulario. */
type Valores = Record<string, unknown>;

/** Datos que no vienen de la fila sino del componente (props). */
export type ContextoMetodo = {
  codMetodo: Id;
  codServicio?: Id | null | undefined;
};

/** Catálogos con los que se convierten códigos del API en opciones de select. */
export type CatalogosMetodo = {
  monedas?: readonly MonedaOpcion[] | undefined;
  rubros?: readonly RubroOpcion[] | undefined;
};

/** Cómo se dibuja el campo en el formulario. */
export type FormularioCampo = {
  /** `min` / `max` / `step` del input numérico. */
  min?: number;
  max?: number;
  step?: string | number;
  /** Campo de moneda cuyo símbolo se muestra al final del input. */
  simboloDe?: string;
  /** Texto fijo al final del input (ej. "%"). */
  sufijo?: string;
};

export type DefCampo<TPayload = unknown> = {
  tipo: "monto" | "moneda" | "rubro" | "booleano" | "fijo" | "contexto";
  /** Texto que ve el usuario (formulario y mensajes). */
  label?: string;
  /** Validación al leer del API. Sin esquema, el campo no forma parte del registro. */
  esquema?: z.ZodType;
  /** Clave en la fila del formulario cuando no es la del API (ej. la opción de moneda). */
  en?: string;
  /** Obligatorio para poder guardar. */
  requerido?: boolean;
  /**
   * Valor con el que empieza un registro nuevo (filaNueva), en `en` si el campo lo tiene.
   * Sin `inicial`, el campo empieza vacío.
   */
  inicial?: unknown;
  /** Valor que se envía al backend. */
  aPayload: (valores: Valores, cod: string, ctx: ContextoMetodo) => TPayload;
  /** Valor de la fila (en `en`) a partir del registro del API. */
  deApi?: (registro: Valores, cod: string, catalogos: CatalogosMetodo) => unknown;
  /** Si el campo está vacío (para `requerido`). */
  falta?: (valores: Valores, cod: string) => boolean;
  formulario?: FormularioCampo;
};

/** Error de una regla: se muestra debajo de `campo` (CampoMetodo lo dibuja solo). */
export type ErrorRegla = { campo: string; mensaje: string };

export type ReglaMetodo = (valores: Valores) => ErrorRegla | null;

/* ==========================================================================
 * TIPOS DE CAMPO
 * ========================================================================== */

const vacio = (valor: unknown) => valor == null || valor === "";

const esquemaMonto = z.union([z.string(), z.number()]).nullable();

type AlPayload<P> = DefCampo<P>["aPayload"];

/** Lo que cualquier campo visible puede sobrescribir. */
type Sobrescribir<P> = {
  label?: string;
  requerido?: boolean;
  aPayload?: AlPayload<P>;
};

type Campo<Tipo extends DefCampo["tipo"], P> = Omit<DefCampo<P>, "tipo" | "aPayload"> & {
  tipo: Tipo;
  aPayload: AlPayload<P>;
};

export type CampoMonto<P = number> = Campo<"monto", P> & { esquema: typeof esquemaMonto };

type OpcionesMonto<P> = Sobrescribir<P> & { inicial?: number; formulario?: FormularioCampo };

/** Número (costo, venta, mínimos, porcentajes). Se envía con Number(valor). */
export function monto(opciones?: OpcionesMonto<number> & { aPayload?: never }): CampoMonto;
export function monto<P>(opciones: OpcionesMonto<P> & { aPayload: AlPayload<P> }): CampoMonto<P>;
export function monto<P>(opciones: OpcionesMonto<P> = {}): CampoMonto<P> {
  const { aPayload, ...resto } = opciones;

  return {
    tipo: "monto",
    esquema: esquemaMonto,
    falta: (valores, cod) => vacio(valores[cod]),
    aPayload: aPayload ?? ((valores, cod) => Number(valores[cod]) as unknown as P),
    ...resto,
  };
}

export type CampoMoneda<En extends string, P = Id | null> = Campo<"moneda", P> & {
  esquema: z.ZodNullable<typeof zId>;
  en: En;
  deApi: (registro: Valores, cod: string, catalogos: CatalogosMetodo) => MonedaOpcion | null;
};

/**
 * Moneda: en el API es un código (cod_moneda_costo); en el formulario es la
 * opción completa, guardada en `en` (moneda_costo). Se envía opcion.cod_moneda.
 */
export function moneda<const En extends string>(
  opciones: Sobrescribir<Id | null> & { en: En; inicial?: null; aPayload?: never },
): CampoMoneda<En>;
export function moneda<const En extends string, P>(
  opciones: Sobrescribir<P> & { en: En; inicial?: null; aPayload: AlPayload<P> },
): CampoMoneda<En, P>;
export function moneda<const En extends string, P>(
  opciones: Sobrescribir<P> & { en: En; inicial?: null },
): CampoMoneda<En, P> {
  const { aPayload, ...resto } = opciones;
  const opcionDe = (valores: Valores) => valores[resto.en] as MonedaOpcion | null | undefined;

  return {
    tipo: "moneda",
    esquema: zId.nullable(),
    falta: (valores) => !opcionDe(valores),
    aPayload: aPayload ?? ((valores) => (opcionDe(valores)?.cod_moneda ?? null) as unknown as P),
    deApi: (registro, cod, catalogos) =>
      catalogos.monedas?.find((item) => String(item.cod_moneda) === String(registro[cod])) ?? null,
    ...resto,
  };
}

export type CampoRubro<En extends string, P = Id | null> = Campo<"rubro", P> & {
  esquema: z.ZodNullable<typeof zId>;
  en: En;
  deApi: (registro: Valores, cod: string, catalogos: CatalogosMetodo) => RubroOpcion | null;
};

/** Rubro: como `moneda`, pero con el catálogo de rubros (código cod_rubro ?? value). */
export function rubro<const En extends string>(
  opciones: Sobrescribir<Id | null> & { en: En; inicial?: null },
): CampoRubro<En> {
  const { aPayload, ...resto } = opciones;
  const opcionDe = (valores: Valores) => valores[resto.en] as RubroOpcion | null | undefined;
  const codigo = (opcion: RubroOpcion | null | undefined) => opcion?.cod_rubro ?? opcion?.value;

  return {
    tipo: "rubro",
    esquema: zId.nullable(),
    falta: (valores) => !opcionDe(valores),
    aPayload: aPayload ?? ((valores) => codigo(opcionDe(valores)) ?? null),
    deApi: (registro, cod, catalogos) =>
      catalogos.rubros?.find((item) => String(codigo(item)) === String(registro[cod])) ?? null,
    ...resto,
  };
}

export type CampoBooleano = Campo<"booleano", boolean> & { esquema: z.ZodBoolean };

/** Sí / no (ej. es_porcentaje). Se envía Boolean(valor). El input se escribe en el formulario. */
export function booleano(opciones: { label?: string; inicial?: boolean } = {}): CampoBooleano {
  return {
    tipo: "booleano",
    esquema: z.boolean(),
    aPayload: (valores, cod) => Boolean(valores[cod]),
    ...opciones,
  };
}

export type CampoFijo<V> = Campo<"fijo", V>;

/** Valor que siempre se envía igual (ej. cod_estado: 1). Con `esquema`, también se lee del API. */
export function fijo<const V>(valor: V): CampoFijo<V>;
export function fijo<const V, E extends z.ZodType>(
  valor: V,
  opciones: { esquema: E },
): CampoFijo<V> & { esquema: E };
export function fijo<const V>(valor: V, opciones: { esquema?: z.ZodType } = {}): CampoFijo<V> {
  return { tipo: "fijo", aPayload: () => valor, ...opciones };
}

export type CampoContexto = Campo<"contexto", Id | null>;

/** Valor que viene de las props del componente (ej. cod_servicio). Se envía `?? null`. */
export function delContexto(clave: Exclude<keyof ContextoMetodo, "codMetodo">): CampoContexto {
  return { tipo: "contexto", aPayload: (_valores, _cod, ctx) => ctx[clave] ?? null };
}

/**
 * El campo se envía pero no se declara en el esquema de la lista (llega por
 * passthrough, si llega). Ej. cod_rubro en costo-porcentaje.
 */
export function sinEsquema<T extends DefCampo>(campo: T): Omit<T, "esquema"> {
  const { esquema: _esquema, ...resto } = campo;

  return resto;
}

/* ==========================================================================
 * REGLAS REUTILIZABLES
 * ========================================================================== */

/**
 * Error en `venta` cuando costo > venta.
 * Por defecto solo compara si ambos tienen valor; con `vaciosComoCero` un
 * vacío cuenta como 0 (ej. cobertura: costo 5 y venta vacía es error).
 */
export const ventaNoMenorQueCosto =
  (
    costo: string,
    venta: string,
    mensaje: string,
    opciones: { vaciosComoCero?: boolean } = {},
  ): ReglaMetodo =>
  (valores) => {
    if (opciones.vaciosComoCero) {
      return Number(valores[costo] ?? 0) > Number(valores[venta] ?? 0)
        ? { campo: venta, mensaje }
        : null;
    }

    if (vacio(valores[costo]) || vacio(valores[venta])) return null;

    return Number(valores[costo]) > Number(valores[venta]) ? { campo: venta, mensaje } : null;
  };

/** Error en `campo` si Number(valor ?? 0) queda fuera de [min, max] (ej. porcentajes 0–100). */
export const rangoPermitido =
  (campo: string, min: number, max: number, mensaje: string): ReglaMetodo =>
  (valores) => {
    const valor = Number(valores[campo] ?? 0);

    return valor < min || valor > max ? { campo, mensaje } : null;
  };

/* ==========================================================================
 * DEFINICIÓN DEL MÉTODO
 * ========================================================================== */

type CamposMetodo = Record<string, DefCampo>;

type ShapeMetodo<IdCod extends string, C extends CamposMetodo> = Simplificar<
  { [K in IdCod]: typeof zId } & { cod_metodo: z.ZodNullable<typeof zId> } & {
    [K in keyof C as C[K] extends { esquema: z.ZodType } ? K : never]: C[K] extends {
      esquema: infer E;
    }
      ? E
      : never;
  }
>;

export type PayloadMetodo<IdCod extends string, C extends CamposMetodo> = Simplificar<
  { [K in IdCod]?: Id | null } & { cod_metodo: Id } & {
    [K in keyof C]: ReturnType<C[K]["aPayload"]>;
  }
>;

type OpcionesFila<C extends CamposMetodo> = {
  [K in keyof C as C[K] extends { en: infer E extends string } ? E : never]?: C[K] extends {
    deApi: (...args: never[]) => infer O;
  }
    ? O
    : never;
};

type ConfigMetodo<IdCod extends string, C extends CamposMetodo> = {
  /** Llave del registro y valor que se envía si la fila aún no la tiene (nuevo). */
  id: { cod: IdCod; siFalta: null | 0 };
  campos: C;
  /** Validaciones entre campos (ej. venta >= costo). */
  reglas?: readonly ReglaMetodo[];
};

export type ResultadoValidacion = {
  /** No falta ningún requerido y ninguna regla falla. */
  valido: boolean;
  /** Etiquetas de los requeridos vacíos, en el orden de `campos`. */
  faltantes: string[];
  /** Mensajes de error por campo, en el orden de `reglas`. */
  errores: Partial<Record<string, string[]>>;
};

export function definirMetodo<const IdCod extends string, const C extends CamposMetodo>(
  config: ConfigMetodo<IdCod, C>,
) {
  const { id, campos, reglas = [] } = config;
  const entradas = Object.entries(campos) as [string, DefCampo][];

  const shape: Record<string, z.ZodType> = { [id.cod]: zId, cod_metodo: zId.nullable() };

  for (const [cod, campo] of entradas) {
    if (campo.esquema) shape[cod] = campo.esquema;
  }

  const esquema = z.object(shape as ShapeMetodo<IdCod, C>).passthrough();

  type Registro = z.infer<typeof esquema>;
  type Fila = Simplificar<Partial<Registro> & OpcionesFila<C>>;
  type Payload = PayloadMetodo<IdCod, C>;

  /** Registro del API → fila del formulario (agrega las opciones de select). */
  const aFila = (registro: Registro, catalogos: CatalogosMetodo): Fila => {
    const fila: Valores = { ...registro };

    for (const [cod, campo] of entradas) {
      if (campo.en && campo.deApi) fila[campo.en] = campo.deApi(registro, cod, catalogos);
    }

    return fila as Fila;
  };

  /** Fila del formulario → payload del backend. */
  const aPayload = (fila: Fila, ctx: ContextoMetodo): Payload => {
    const valores = fila as Valores;
    const payload: Valores = {
      [id.cod]: valores[id.cod] ?? id.siFalta,
      cod_metodo: ctx.codMetodo,
    };

    for (const [cod, campo] of entradas) {
      payload[cod] = campo.aPayload(valores, cod, ctx);
    }

    return payload as Payload;
  };

  /** Fila de un registro nuevo: solo los campos con `inicial`, en el orden de `campos`. */
  const filaNueva = (): Fila => {
    const fila: Valores = {};

    for (const [cod, campo] of entradas) {
      if (campo.inicial !== undefined) fila[campo.en ?? cod] = campo.inicial;
    }

    return fila as Fila;
  };

  const validar = (fila: Fila): ResultadoValidacion => {
    const valores = fila as Valores;

    const faltantes = entradas
      .filter(([cod, campo]) => campo.requerido && campo.falta?.(valores, cod))
      .map(([cod, campo]) => campo.label ?? cod);

    const errores: Partial<Record<string, string[]>> = {};

    for (const regla of reglas) {
      const error = regla(valores);
      if (error) errores[error.campo] = [...(errores[error.campo] ?? []), error.mensaje];
    }

    return {
      valido: faltantes.length === 0 && Object.keys(errores).length === 0,
      faltantes,
      errores,
    };
  };

  return {
    id,
    campos,
    esquema,
    aFila,
    aPayload,
    filaNueva,
    validar,
    /** Solo para tipos: `typeof METODO.tipos.fila`. */
    tipos: undefined as unknown as { registro: Registro; fila: Fila; payload: Payload },
  };
}
