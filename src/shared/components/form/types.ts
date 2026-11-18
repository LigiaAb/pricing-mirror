import type * as React from "react";
import type { ZodType } from "zod";

type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "url"
  | "tel"
  | "date"
  | "datetime"
  | "time"
  | "textarea"
  | "select"
  | "combobox"
  | "catalogo"
  | "async"
  | "checkbox"
  | "multi-checkbox"
  | "radio"
  | "switch"
  | "separator"
  | "color"
  | "file";

export interface FieldOption {
  value: string;
  label: string;
  description?: string | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  disabled?: boolean | undefined;
  [key: string]: unknown;
}

export type FormValues = Record<string, unknown>;

/**
 * Fuente de opciones para un campo `type: "catalogo"`: un hook (se invoca dentro
 * del campo, por eso debe ser estable y declararse a nivel de módulo) que
 * devuelve las opciones ya mapeadas. Ver `catalogoOpciones`.
 */
/**
 * Búsqueda en el servidor para un campo `type: "async"`. Declarar a nivel de
 * módulo (o estable): la caché de TanStack Query se indexa por `buscarQueryKey`,
 * no por la identidad de la función.
 */
export type FieldBuscar = (search: string, signal?: AbortSignal) => Promise<FieldOption[]>;

export type FieldCatalogo = () => { options: FieldOption[]; isLoading: boolean };

/**
 * `TValues` es opt-in: `FormSection<MisValores>[]` hace que `name` y
 * `resetOnChange` solo acepten claves reales del schema.
 */
type FieldName<TValues extends FormValues> = Extract<keyof TValues, string>;

export interface FormFieldConfig<TValues extends FormValues = FormValues> {
  name: FieldName<TValues>;
  label?: string | undefined;
  component?: React.ComponentType<FieldRendererProps> | undefined;
  type?: FieldType | undefined;
  placeholder?: string | undefined;
  description?: string | undefined;
  hint?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | undefined;
  rows?: number | undefined;
  options?: FieldOption[] | undefined;
  /** Origen de las opciones del campo `catalogo` (carga y estado `isLoading` incluidos). */
  catalogo?: FieldCatalogo | undefined;
  /** Búsqueda del campo `async`: el valor del formulario es el `value` de la opción elegida. */
  buscar?: FieldBuscar | undefined;
  /** Clave de caché compartida entre todos los campos `async` que consulten lo mismo. */
  buscarQueryKey?: string | undefined;
  /** Caracteres mínimos antes de consultar; con 0 se consulta al abrir. */
  minSearchLength?: number | undefined;
  searchPlaceholder?: string | undefined;
  /** Opciones ya conocidas (modo edición): dan la etiqueta del valor inicial sin consultar. */
  initialOptions?: FieldOption[] | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
  min?: number | string | undefined;
  max?: number | string | undefined;
  step?: number | undefined;
  maxLength?: number | undefined;
  autoComplete?: string | undefined;
  accept?: string | undefined;
  /** Fuerza el valor a kebab-case mientras se escribe (campos tipo `text`). */
  kebabCase?: boolean | undefined;
  className?: string | undefined;
  actions?: Array<{ label: string; onClick: () => void }> | undefined;
  /** Los campos `select` son buscables por defecto; usar `false` para el selector simple. */
  searchable?: boolean | undefined;
  /** Monta el menú del selector en un portal; usar `false` dentro de diálogos modales. */
  portalled?: boolean | undefined;
  /** Valor por defecto, util en combobox con valor por defecto y deshabilitado */
  fixedValue?: string | undefined;
  onChange?: ((val: string) => void) | undefined;
  /** Nombres de otros campos del mismo formulario a limpiar cuando este cambia (cascadas). */
  resetOnChange?: FieldName<TValues>[] | undefined;
  /** Determina si el campo debe renderizarse con los valores actuales del formulario. */
  visibleWhen?: ((values: FormValues) => boolean) | undefined;
  hidden?: boolean | ((values: FormValues) => boolean) | undefined; // prop para esconder visualmente (css) un campo del form
}

export interface FormSection<TValues extends FormValues = FormValues> {
  id?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  fields: FormFieldConfig<TValues>[];
  defaultColSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | undefined;
  className?: string | undefined;
  /**
   * Encabezado acentuado (chip + título en `section-accent`) del patrón wizard
   * de embarques, en vez del encabezado discreto por defecto.
   */
  accent?: boolean | undefined;
}

export interface FormBuilderProps<
  TValues extends FormValues = FormValues,
  TInput extends FormValues = TValues,
> {
  /** El tipo de `onSubmit` se infiere de la salida del schema; el de `defaultValues`, de su entrada. */
  schema?: ZodType<TValues, TInput> | undefined;
  /**
   * Valores iniciales en la forma que el usuario edita (la entrada del schema:
   * con `z.coerce.number()` son strings). Admite claves extra, por ejemplo el id
   * del registro que se edita y que el schema descarta.
   */
  defaultValues?: (Partial<TInput> & FormValues) | undefined;
  sections?: FormSection<TValues>[] | FormSection[] | undefined;
  fields?: FormFieldConfig<TValues>[] | FormFieldConfig[] | undefined;
  onSubmit: (values: TValues) => void | Promise<void>;
  /** Cuándo validar; `onTouched` (por defecto) espera al primer blur de cada campo. */
  mode?: "onChange" | "onBlur" | "onTouched" | "onSubmit" | "all" | undefined;
  onCancel?: (() => void) | undefined;
  isLoading?: boolean | undefined;
  /** Deshabilita el botón de envío sin mostrar el estado de carga (p. ej. faltan datos). */
  submitDisabled?: boolean | undefined;
  labels?: { submit?: string; cancel?: string; loading?: string } | undefined;
  title?: string | undefined;
  description?: string | undefined;
  stickyFooter?: boolean | undefined;
  hideFooter?: boolean | undefined;
  className?: string | undefined;
  children?: React.ReactNode;
  afterField?: Record<string, React.ReactNode>; // prop para renderizar un componente despues de un campo del form
  editableFields?: readonly string[] | undefined; // prop para bloquear la modificacion del campo
}

/** Atributos que `FormControl` inyecta para enlazar label, descripción y error con el control real. */
export interface FieldA11yProps {
  id?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
  /** Nombre accesible: el `label` del campo (o su `name` si no tiene), nunca el nombre técnico cuando hay label. */
  "aria-label"?: string | undefined;
  onBlur?: (() => void) | undefined;
  ref?: React.Ref<HTMLElement> | undefined;
}

export interface FieldRendererProps extends FieldA11yProps {
  value: unknown;
  onChange: (val: unknown) => void;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  placeholder?: string | undefined;
  rows?: number | undefined;
  options?: FieldOption[] | undefined;
  catalogo?: FieldCatalogo | undefined;
  buscar?: FieldBuscar | undefined;
  buscarQueryKey?: string | undefined;
  minSearchLength?: number | undefined;
  searchPlaceholder?: string | undefined;
  initialOptions?: FieldOption[] | undefined;
  isLoading?: boolean | undefined;
  name?: string | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  maxLength?: number | undefined;
  autoComplete?: string | undefined;
  accept?: string | undefined;
  errorCls?: string | undefined;
  readOnlyCls?: string | undefined;
  searchable?: boolean | undefined;
  portalled?: boolean | undefined;
  fixedValue?: string | undefined;
  type?: string | undefined;
}

export type FieldRenderer = (props: FieldRendererProps) => React.ReactNode;
