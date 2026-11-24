export function areRequiredFieldsFilled(fields = [], values = {}) {
  return fields
    .filter((f) => f.required)
    .every((f) => {
      const val = values[f.key];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val.trim() !== '';
      if (Array.isArray(val)) return val.length > 0;
      return true;
    });
}


export function getModifiedFields(initValues = {}, currentValues = {}) {
  const keys = new Set([...Object.keys(initValues || {}), ...Object.keys(currentValues || {})]);
  const modified = [];
  keys.forEach((key) => {
    if (key === "_modificados") return;
    if (JSON.stringify(initValues?.[key] ?? "") !== JSON.stringify(currentValues?.[key] ?? "")) {
      modified.push(key);
    }
  });
  return modified;
}

export function unionModificados(a = [], b = []) {
  return Array.from(new Set([...(a || []), ...(b || [])]));
}

export const CAMPOS_OBLIGATORIOS_CARGA = [
  { key: "paisOrigenId", label: "País Origen" },
  { key: "descripcion", label: "Descripción" },
  { key: "valor", label: "Valor declarado" },
  { key: "partidaArancelaria", label: "Partida Arancelaria" },
  { key: "regimenAduanal", label: "Régimen Aduanal" },
  { key: "cantidad", label: "# Bultos" },
  { key: "pesoTotal", label: "Peso" },
  { key: "unidadMedida", label: "Unidad de medida" },
  { key: "tipoEmbalaje", label: "Tipo Embalaje" },
  { key: "largo", label: "Largo" },
  { key: "alto", label: "Alto" },
  { key: "ancho", label: "Ancho" },
];

export function getCamposFaltantesCarga(row = {}) {
  if (!row) return CAMPOS_OBLIGATORIOS_CARGA.map((c) => c.label);
  const faltantes = [];
  for (const { key, label } of CAMPOS_OBLIGATORIOS_CARGA) {
    const v = row[key];
    if (v === undefined || v === null || v === "") {
      faltantes.push(label);
      continue;
    }
    if (typeof v === "string" && v.trim() === "") {
      faltantes.push(label);
    }
  }
  return faltantes;
}

export function areCargaRowsValid(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.every((r) => getCamposFaltantesCarga(r).length === 0);
}
