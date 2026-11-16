/**
 * Constructor declarativo de los campos del formulario público de entidad
 * (port de `buildEntidadPublicFields` del legacy). El renderizado vive en
 * form-fields-renderer.tsx.
 */

import { Building2, FileText, type LucideIcon, MapPin, Phone } from "lucide-react";
import type { EntidadPublicConfig, OpcionCatalogo } from "./model";
import { ENTIDAD_PUBLIC_FORM_KEYS, ENTIDAD_PUBLIC_REQUIRED_FIELDS } from "./model";

export interface AccionCampo {
  visible: boolean;
  enabled: boolean;
  nombre: string;
  onClick: () => void;
}

export interface OpcionContacto extends OpcionCatalogo {
  nombre?: string;
  email?: string;
  telefono?: string;
}

export interface CampoEntidadPublic {
  key: string;
  label?: string;
  type: "select" | "text" | "textarea" | "email" | "checkboxes" | "section" | "button";
  required?: boolean;
  colSpan?: number;
  options?: OpcionCatalogo[] | OpcionContacto[];
  /** Habilita el ingreso de texto para filtrar las opciones del selector. */
  searchable?: boolean;
  rows?: number;
  readOnly?: boolean;
  action?: AccionCampo | undefined;
  /** Solo para `type: "section"` — icono del chip (paridad ModernFormHeader). */
  icon?: LucideIcon;
}

export interface BuildFieldsParams {
  config: EntidadPublicConfig;
  entityOptions?: OpcionCatalogo[];
  paisOptions?: OpcionCatalogo[];
  ciudadOptions?: OpcionCatalogo[];
  departamentoOptions?: OpcionCatalogo[];
  municipioOptions?: OpcionCatalogo[];
  industriaOptions?: OpcionCatalogo[];
  contactoOptions?: OpcionContacto[];
  tiposContactoOptions?: OpcionCatalogo[];
  nuevoEntityAction?: AccionCampo;
  nuevoContactoAction?: AccionCampo;
  disableEntitySelector?: boolean;
  modoNuevoContacto?: boolean;
  modoNuevaEntidad?: boolean;
  selectedEntidadId?: string | number | null;
  selectedContactoId?: string | number | null;
  hiddenFields?: Set<string> | undefined;
  readOnlyFields?: Set<string> | undefined;
  readOnly?: boolean;
}

const K = ENTIDAD_PUBLIC_FORM_KEYS;
const CAMPOS_CONTACTO = new Set([
  "_contacto_tipo_list",
  K.contactField,
  K.emailField,
  K.phoneField,
]);

export function buildEntidadPublicFields({
  config,
  entityOptions = [],
  paisOptions = [],
  ciudadOptions = [],
  departamentoOptions = [],
  municipioOptions = [],
  industriaOptions = [],
  contactoOptions = [],
  tiposContactoOptions = [],
  nuevoEntityAction,
  nuevoContactoAction,
  disableEntitySelector = false,
  modoNuevoContacto = false,
  modoNuevaEntidad = false,
  selectedEntidadId = null,
  selectedContactoId = null,
  hiddenFields,
  readOnlyFields,
  readOnly = false,
}: BuildFieldsParams): CampoEntidadPublic[] {
  const camposHabilitados = Boolean(selectedEntidadId) || modoNuevaEntidad;
  // Los campos del contacto solo se habilitan con un contacto elegido o en
  // modo "nuevo contacto": sin eso no hay nada que editar.
  const contactoHabilitado =
    camposHabilitados && (modoNuevoContacto || Boolean(selectedContactoId));

  const fields: CampoEntidadPublic[] = [
    ...(disableEntitySelector
      ? []
      : ([
          {
            key: K.entityField,
            label: `Seleccionar ${config.title}`,
            type: "select",
            required: !modoNuevaEntidad,
            colSpan: 10,
            options: entityOptions,
            searchable: true,
            readOnly: modoNuevaEntidad,
          },
          {
            key: "__btn_nueva_entidad__",
            type: "button",
            colSpan: 2,
            action: nuevoEntityAction,
          },
        ] as CampoEntidadPublic[])),
    {
      key: "__section_info__",
      type: "section",
      label: config.sectionLabel || config.title,
      icon: Building2,
    },
    {
      key: K.nombreField,
      label: "Nombre",
      type: "text",
      colSpan: 12,
      readOnly: !camposHabilitados,
    },
    {
      key: K.paisField,
      label: "País",
      type: "select",
      colSpan: 4,
      options: paisOptions,
      searchable: true,
      readOnly: !camposHabilitados,
    },
    {
      key: K.ciudadField,
      label: "Ciudad",
      type: "select",
      colSpan: 4,
      options: ciudadOptions,
      searchable: true,
      readOnly: !camposHabilitados,
    },
    {
      key: K.industriaField,
      label: "Industria",
      type: "select",
      colSpan: 4,
      options: industriaOptions,
      searchable: true,
      readOnly: !camposHabilitados,
    },
    { key: "__section_direccion__", type: "section", label: "Dirección", icon: MapPin },
    {
      key: K.addressField,
      label: "Dirección de Recolección",
      type: "textarea",
      rows: 2,
      colSpan: 12,
      readOnly: !camposHabilitados,
    },
    {
      key: K.addressCountryField,
      label: "País",
      type: "select",
      colSpan: 4,
      options: paisOptions,
      searchable: true,
      readOnly: true,
    },
    {
      key: K.addressDeptoField,
      label: "Departamento",
      type: "select",
      colSpan: 4,
      options: departamentoOptions,
      searchable: true,
      readOnly: !camposHabilitados,
    },
    {
      key: K.addressMuniField,
      label: "Municipio",
      type: "select",
      colSpan: 4,
      options: municipioOptions,
      searchable: true,
      readOnly: !camposHabilitados,
    },
    {
      key: "__section_contacto__",
      type: "section",
      label: "Contacto",
      icon: Phone,
    },
    {
      key: K.contactIdField,
      label: "Seleccionar Contacto",
      type: "select",
      colSpan: 10,
      options: contactoOptions,
      readOnly: modoNuevoContacto || !camposHabilitados,
    },
    {
      key: "__btn_nuevo_contacto__",
      type: "button",
      colSpan: 2,
      action: nuevoContactoAction,
    },
    {
      key: "_contacto_tipo_list",
      label: "Tipo(s) de Contacto",
      type: "checkboxes",
      options: tiposContactoOptions,
      colSpan: 12,
      readOnly: !contactoHabilitado,
    },
    {
      key: K.contactField,
      label: "Nombre Contacto",
      type: "text",
      colSpan: 4,
      readOnly: !contactoHabilitado,
    },
    { key: K.emailField, label: "Email", type: "email", colSpan: 4, readOnly: !contactoHabilitado },
    {
      key: K.phoneField,
      label: "Teléfono",
      type: "text",
      colSpan: 4,
      readOnly: !contactoHabilitado,
    },
    ...(config.hideIdentificacion
      ? []
      : ([
          {
            key: "__section_identificacion__",
            type: "section",
            label: "Identificación",
            icon: FileText,
          },
          {
            key: K.identNumeroField,
            label: "NIT",
            type: "text",
            colSpan: 12,
            readOnly: !camposHabilitados,
          },
        ] as CampoEntidadPublic[])),
  ];

  const visibles = hiddenFields?.size ? fields.filter((f) => !hiddenFields.has(f.key)) : fields;
  const conRequired = visibles.map((f) => ({
    ...f,
    required: ENTIDAD_PUBLIC_REQUIRED_FIELDS.has(f.key) || f.required === true,
  }));
  // Modo lectura (privado): sin botones y todos los campos bloqueados. Para
  // cada entidad pública también se pueden bloquear secciones puntuales sin
  // afectar los selectores y acciones del resto del formulario.
  if (readOnly) {
    return conRequired.filter((f) => f.type !== "button").map((f) => ({ ...f, readOnly: true }));
  }
  if (!readOnlyFields?.size) return conRequired;
  return conRequired.map((f) => {
    // Los datos de un contacto existente son de consulta. Al crear uno nuevo
    // se habilita únicamente su captura, sin desbloquear los demás datos del
    // shipper.
    const editableNuevoContacto = modoNuevoContacto && CAMPOS_CONTACTO.has(f.key);
    return readOnlyFields.has(f.key) && !editableNuevoContacto ? { ...f, readOnly: true } : f;
  });
}

/**
 * Campos ocultos por config que deben mostrarse al crear una entidad NUEVA
 * (sin maestro que los autocomplete, el cliente debe capturarlos a mano).
 */
export function effectiveHiddenFields(
  hiddenFields: Set<string> | undefined,
  forzarNuevaEntidad: boolean,
): Set<string> | undefined {
  if (!forzarNuevaEntidad || !hiddenFields?.size) return hiddenFields;
  const visibleEnNueva = new Set([
    K.paisField,
    K.ciudadField,
    K.industriaField,
    K.addressCountryField,
    K.addressDeptoField,
    K.addressMuniField,
    "_contacto_tipo_list",
  ]);
  const next = new Set(hiddenFields);
  for (const key of visibleEnNueva) next.delete(key);
  return next;
}
