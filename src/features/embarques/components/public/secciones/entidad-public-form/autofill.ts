/**
 * Parches puros del formulario público de entidad: auto-relleno desde el
 * maestro, parche satélite al cambiar un campo y preservación de los campos
 * ya modificados al reemplazar el snapshot. La orquestación (efectos, refs)
 * vive en use-entidad-public-form.ts.
 */

import {
  type EntidadPublicFormValues,
  extractContactoTipoList,
  extraerMaestroEntidad,
  type JsonRecord,
  ENTIDAD_PUBLIC_FORM_KEYS as K,
  resolveEntidadNombre,
} from "./model";

export const CAMPOS_ENTIDAD_LIMPIOS: Partial<EntidadPublicFormValues> = {
  entidad_id: "",
  entidad_nombre: "",
  entidad_pais: "",
  entidad_industria: "",
  direccion_recoleccion: "",
  direccion_recoleccion_pais: "",
  direccion_recoleccion_ciudad: "",
  direccion_recoleccion_depto: "",
  direccion_recoleccion_muni: "",
  entidadcontacto_id: "",
  entidad_contacto_nombre: "",
  entidad_contacto_email: "",
  entidad_contacto_telefono: "",
  _contacto_tipo_list: [],
  entidad_nit: "",
};

const esVacio = (v: unknown) => v === "" || v == null || (Array.isArray(v) && v.length === 0);

/**
 * Campos vacíos de `prev` rellenables desde el maestro de la entidad `ent`
 * (`canFill` excluye los que el cliente ya modificó explícitamente). Cada
 * subcampo del contacto se rellena de forma independiente: agrupar todo
 * detrás de `entidadcontacto_id` pisaba campos ya guardados con el default
 * del contacto maestro en cada mount/refetch.
 */
export function construirAutofillPatch(
  prev: JsonRecord,
  ent: JsonRecord,
  canFill: (key: string) => boolean,
): JsonRecord {
  const { contacto, direccion, nit } = extraerMaestroEntidad(ent);
  const patch: JsonRecord = {};
  const fill = (key: string, valor: unknown) => {
    if (esVacio(prev[key]) && valor !== "" && valor != null && canFill(key)) patch[key] = valor;
  };
  fill("entidad_nombre", resolveEntidadNombre(ent));
  fill("entidad_pais", ent.cod_pais ?? "");
  fill("entidad_industria", ent.cod_industria ?? "");
  // La dirección tiene su propio país, que puede diferir del país de
  // clasificación de la entidad — usar siempre el de la dirección guardada.
  fill("direccion_recoleccion_pais", ent.cod_pais ?? "");
  fill("direccion_recoleccion_ciudad", ent.cod_ciudad ?? "");
  fill("direccion_recoleccion_depto", direccion?.cod_depto ?? "");
  fill("direccion_recoleccion_muni", direccion?.cod_muni ?? "");
  if (contacto) {
    fill("entidadcontacto_id", String(contacto.entidadcontacto_id));
    fill("entidad_contacto_nombre", contacto.entidadcontacto_nombre ?? "");
    fill("entidad_contacto_email", contacto.entidadcontacto_email ?? "");
    fill("entidad_contacto_telefono", contacto.entidadcontacto_telefono ?? "");
    fill("_contacto_tipo_list", extractContactoTipoList(contacto));
  }
  fill("direccion_recoleccion", direccion?.entidaddireccion_direccion ?? "");
  fill("entidad_nit", nit);
  return patch;
}

/**
 * Parche satélite al cambiar un campo: seleccionar entidad rellena todo desde
 * su maestro, seleccionar contacto rellena sus subcampos, y cambiar país/depto
 * limpia los dependientes en cascada.
 */
export function construirParcheCambioCampo(
  key: string,
  value: unknown,
  ent: JsonRecord | null,
  rawEntidadActual: JsonRecord | null,
): JsonRecord {
  if (key === K.entityField) {
    const { contacto, direccion, nit } = extraerMaestroEntidad(ent);
    const texto = (v: unknown) => (v == null ? "" : String(v));
    return {
      entidad_nombre: resolveEntidadNombre(ent),
      entidad_pais: texto(ent?.cod_pais),
      entidad_industria: texto(ent?.cod_industria),
      direccion_recoleccion_pais: texto(ent?.cod_pais),
      direccion_recoleccion_ciudad: texto(ent?.cod_ciudad),
      direccion_recoleccion_depto: texto(direccion?.cod_depto),
      direccion_recoleccion_muni: texto(direccion?.cod_muni),
      entidadcontacto_id: contacto ? String(contacto.entidadcontacto_id) : "",
      entidad_contacto_nombre: texto(contacto?.entidadcontacto_nombre),
      entidad_contacto_email: texto(contacto?.entidadcontacto_email),
      entidad_contacto_telefono: texto(contacto?.entidadcontacto_telefono),
      _contacto_tipo_list: extractContactoTipoList(contacto),
      direccion_recoleccion: texto(direccion?.entidaddireccion_direccion),
      entidad_nit: nit,
    };
  }
  if (key === K.contactIdField) {
    const contactos = Array.isArray(rawEntidadActual?.data_contactos)
      ? (rawEntidadActual.data_contactos as JsonRecord[])
      : [];
    const contacto = contactos.find((c) => String(c.entidadcontacto_id) === String(value));
    if (contacto) {
      return {
        [K.contactField]: contacto.entidadcontacto_nombre ?? "",
        [K.phoneField]: contacto.entidadcontacto_telefono ?? "",
        [K.emailField]: contacto.entidadcontacto_email ?? "",
        _contacto_tipo_list: extractContactoTipoList(contacto),
      };
    }
    return {};
  }
  if (key === K.paisField) {
    return {
      [K.ciudadField]: "",
      [K.addressCountryField]: value,
      [K.addressDeptoField]: "",
      [K.addressMuniField]: "",
    };
  }
  if (key === K.addressCountryField) {
    return { [K.addressDeptoField]: "", [K.addressMuniField]: "" };
  }
  if (key === K.addressDeptoField) {
    return { [K.addressMuniField]: "" };
  }
  return {};
}

/**
 * Entidad temporal sin entidad_id (modal "Crear Entidad"): sus datos base
 * viajan en los campos del formulario para detectarse como modificados y
 * guardarse en la carta. El backend la crea al procesar actualizar-json-link
 * (público) o el motor de commit al confirmar "Crear Coordinación" (privado).
 * Entidad nueva: sin contactos guardados, el contacto también arranca en modo
 * "nuevo" (campos libres).
 */
export function construirParcheEntidadCreada(optionEntidad: JsonRecord): JsonRecord {
  const texto = (v: unknown) => (v == null ? "" : String(v));
  return {
    entidad_id: "",
    entidad_nombre: texto(optionEntidad.entidad_nombre),
    entidad_pais: texto(optionEntidad.cod_pais),
    direccion_recoleccion_ciudad: texto(optionEntidad.cod_ciudad),
    entidad_industria: texto(optionEntidad.cod_industria),
    entidadcontacto_id: "",
    entidad_contacto_nombre: "",
    entidad_contacto_email: "",
    entidad_contacto_telefono: "",
    _contacto_tipo_list: [],
  };
}

/**
 * Snapshot nuevo aplicado sin perder los campos que el cliente ya modificó
 * explícitamente: un snapshot recién refetcheado (o momentáneamente
 * incompleto) no debe pisarlos con "".
 */
export function aplicarSnapshotPreservandoModificados(
  nuevos: EntidadPublicFormValues,
  prev: JsonRecord,
  explicitlyModifiedKeys: Set<string>,
): EntidadPublicFormValues {
  const patched: EntidadPublicFormValues = { ...nuevos };
  for (const key of explicitlyModifiedKeys) {
    const previo = prev[key];
    if (esVacio(patched[key]) && previo && !(Array.isArray(previo) && previo.length === 0)) {
      patched[key] = previo;
    }
  }
  return patched;
}
