// import type { Entidad } from "@/features/entidades";

/**
 * Modos permitidos del formulario.
 */
export type TipoFormulario = "ingreso" | "edicion" | "lectura" | "filtro";

/**
 * Regla de visibilidad condicional de un campo.
 */
export type VisibleWhenRule = {
  field: string;
  key?: string;
  value: unknown;
};

/**
 * Acción extra disponible para un campo.
 */
export type FieldAction = {
  id: string;
  icon?: string;
  label?: string;
};

/**
 * Regla base de un campo del formulario.
 */
export type FieldRule = {
  cod: string;
  catalogo?: string;
  payload?: string[];
  default?: unknown;
  reset?: string[];
  require?: string | string[];
  readonly?: boolean;
  tipo?: "datetime" | "number" | "select" | "text";
  visibleWhen?: VisibleWhenRule;
  acciones?: FieldAction[];
};

/**
 * Mapa completo de reglas por id visual del campo.
 */
export type FieldRulesMap = Record<string, FieldRule>;

/**
 * Opción base de catálogo procesado.
 *
 * Nota:
 * No describe un catálogo real del negocio.
 * Solo representa la forma mínima que el manual asume para los selects.
 */
export type CatalogOption = {
  label: string;
  value: unknown;
  [key: string]: unknown;
} & Record<string, unknown>;

/**
 * Mapa de catálogos ya procesados para la UI.
 *
 * Ejemplo:
 * {
 *   empresas: CatalogOption[],
 *   centrosCosto: CatalogOption[],
 * }
 */
export type CatalogosProcesados = Record<string, unknown[]>;

/**
 * Valores por defecto que llegan al formulario.
 * Se mantienen genéricos porque dependen del endpoint real.
 */
export type DefaultValues = Record<string, unknown>;

/**
 * Estado visual interno del formulario.
 */
export type FormValuesState = Record<string, unknown>;

/**
 * Argumento del helper onInput.
 */
export type OnInputArgs = {
  id: string;
  val: unknown;
};

/**
 * Opciones del hook principal useFormulario.
 */
export type UseFormularioOptions = {
  tipoFormulario: TipoFormulario;
  defaultValues?: DefaultValues;
  catalogosProcesados?: CatalogosProcesados;
  isLoading?: boolean;
  inputsReadOnly?: string[];
  inputsToHide?: string[];
  groupsToHide?: string[];
  obligatorios?: string[];
  // fetchClienteById?: (entidad_id: number) => Promise<Entidad | null>;
};

/**
 * Utilizado para transformar las keys de un objeto a lowercase.
 */
export type KeysToLowerCase<T> = T extends readonly unknown[]
  ? { [K in keyof T]: KeysToLowerCase<T[K]> }
  : T extends object
    ? {
        [K in keyof T as K extends string ? Lowercase<K> : K]: KeysToLowerCase<T[K]>;
      }
    : T;
