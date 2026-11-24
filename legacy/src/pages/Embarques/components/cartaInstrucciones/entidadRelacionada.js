// Helpers SOLO de la vista pública (cliente) para construir el array slim
// `recuperar-datos-entidad-relacionada`: lo usa el backend para sincronizar los
// datos maestros de la entidad (shipper/consignatario) al crear la coordinación.
// El display NO depende de esto (usa carta_shipper/carta_consignatario).

// La API de recuperar-datos-entidad-relacionada devuelve claves en MAYÚSCULAS;
// normalizamos a minúsculas recursivamente para trabajar con claves consistentes.
export const normalizeKeys = (obj) => {
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.toLowerCase(), normalizeKeys(v)]),
    );
  }
  return obj;
};

// Mapea cada campo de formulario al/los campo(s) con naming "raw" que espera
// recuperar-datos-entidad-relacionada. `code` toma el valor editado del form;
// `label` solo se incluye si el código editado coincide con el del snapshot raw
// (evita arrastrar etiquetas desactualizadas cuando el código cambió).
export const ENTIDAD_REL_FIELD_MAP = {
  entidad_nombre: { code: "entidad_nombre" },
  entidad_industria: { code: "cod_industria", label: "nom_industria_es", src: "entidad" },
  entidad_pais: { code: "cod_pais", label: "nombre_pais", src: "entidad" },
  direccion_recoleccion_ciudad: { code: "cod_ciudad", label: "nombre_ciudad", src: "entidad" },
  direccion_recoleccion: { code: "entidaddireccion_direccion", src: "direccion" },
  direccion_recoleccion_pais: { code: "direccion_cod_pais", rawCode: "cod_pais", label: "direccion_nombre_pais", rawLabel: "nombre_pais", src: "direccion" },
  direccion_recoleccion_depto: { code: "cod_depto", label: "nombre_depto", src: "direccion" },
  direccion_recoleccion_muni: { code: "cod_muni", label: "nombre_muni", src: "direccion" },
  entidad_nit: { code: "entidadidentificacio_numero", src: "identificacion" },
  entidadcontacto_id: { code: "entidadcontacto_id", src: "contacto" },
  entidad_contacto_nombre: { code: "entidadcontacto_nombre", src: "contacto" },
  entidad_contacto_telefono: { code: "entidadcontacto_telefono", src: "contacto" },
  entidad_contacto_email: { code: "entidadcontacto_email", src: "contacto" },
};

// Localiza, dentro del snapshot raw, el sub-registro del que sale la etiqueta.
export function getEntidadRelSource(raw, src, modVals) {
  if (!raw) return null;
  switch (src) {
    case "direccion":
      return (raw.data_direcciones || []).find((d) => d.cod_tipo === 145) || null;
    case "contacto":
      return (
        (raw.data_contactos || []).find(
          (c) => String(c.entidadcontacto_id) === String(modVals?.entidadcontacto_id),
        ) || raw.data_contactos?.[0] || null
      );
    case "identificacion":
      return (
        (raw.data_identificaciones || []).find(
          (i) => String(i.nom_identificacion || "").toLowerCase() === "nit",
        ) || null
      );
    default:
      return raw;
  }
}

// Construye un registro slim de entidad-relacionada: entidad_id + SOLO los campos
// cuyo valor del formulario difiere del snapshot raw (cambios reales del cliente).
// Devuelve null si no hay ningún cambio, para no enviar la entidad. No depende de
// `_modificados` (que se contamina al unir con la carta persistida).
//
// Caso "entidad nueva": si no hay `raw` (la entidad no existe todavía, se creó vía
// el modal "Crear Entidad" en público sin llamar a ningún endpoint — no hay uno
// disponible sin sesión) pero el formulario trae `entidad_nombre` y NO trae
// `entidad_id`, se envían TODOS los campos presentes (sin diff, no hay snapshot
// contra qué comparar) y sin `entidad_id`: el backend la crea al procesar
// actualizar-json-link.
export function buildEntidadRelacionadaSlim(raw, formVals = {}, ctx = {}) {
  const esNueva = !raw && !formVals.entidad_id && Boolean(formVals.entidad_nombre);
  if (!raw && !esNueva) return null;
  const slim = {};

  Object.entries(ENTIDAD_REL_FIELD_MAP).forEach(([formKey, def]) => {
    const value = formVals[formKey];
    if (value === undefined || value === null || value === "") return;
    if (!esNueva) {
      const source = getEntidadRelSource(raw, def.src, formVals);
      const rawValue = source?.[def.rawCode || def.code];
      if (String(rawValue ?? "") === String(value)) return; // sin cambio
    }
    slim[def.code] = value;
    if (formKey === "entidad_industria" && typeof ctx.industriaLabel === "function") {
      const label = ctx.industriaLabel(value);
      if (label != null) slim[def.label] = label;
    }
  });

  if (Array.isArray(formVals._contacto_tipo_list) && formVals._contacto_tipo_list.length > 0) {
    const rawTipos = esNueva
      ? []
      : (getEntidadRelSource(raw, "contacto", formVals)?.data_entidad_contacto_tipo || [])
          .map((t) => String(t.cod_tipo)).sort();
    const formTipos = formVals._contacto_tipo_list.map(String).sort();
    if (esNueva || JSON.stringify(rawTipos) !== JSON.stringify(formTipos)) {
      slim.data_entidad_contacto_tipo = formVals._contacto_tipo_list.map((c) => ({ cod_tipo: Number(c) }));
    }
  }

  if (Object.keys(slim).length === 0) return null; // ningún cambio real
  if (esNueva) {
    return {
      ...(formVals._tipoEntidad != null ? { cod_tipo: formVals._tipoEntidad } : {}),
      ...slim,
    };
  }
  return { entidad_id: raw.entidad_id ?? formVals.entidad_id, ...slim };
}
