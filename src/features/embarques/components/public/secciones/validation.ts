/**
 * Validaciones para secciones públicas de embarques
 */

export interface CampoFormulario {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  colSpan?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  readOnly?: boolean;
}

export interface FilaCarga {
  descripcion?: string;
  valor?: string | number;
  [key: string]: unknown;
}

/**
 * Verifica si los campos requeridos están llenos
 */
export function areRequiredFieldsFilled(
  fields: Array<Pick<CampoFormulario, "key" | "required">>,
  values: Record<string, unknown>,
): boolean {
  return fields
    .filter((f) => f.required)
    .every((f) => {
      const val = values[f.key];
      if (val === undefined || val === null) return false;
      if (typeof val === "string") return val.trim() !== "";
      if (Array.isArray(val)) return val.length > 0;
      return true;
    });
}

/**
 * Campos obligatorios de una carga (paridad con el legacy funcional). Un
 * producto sin todos estos completos aparece como "Faltan datos" en la tabla.
 */
const CAMPOS_OBLIGATORIOS_CARGA: ReadonlyArray<{ key: string; label: string }> = [
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

/** Etiquetas de los campos obligatorios que faltan en una fila de carga. */
export function getCamposFaltantesCarga(row: Record<string, unknown> | null | undefined): string[] {
  if (!row) return CAMPOS_OBLIGATORIOS_CARGA.map((c) => c.label);
  const faltantes: string[] = [];
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

/**
 * Verifica si las filas de carga son válidas (todas con sus campos
 * obligatorios completos). Sin filas, no es válido.
 */
export function areCargaRowsValid(rows: FilaCarga[]): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.every((r) => getCamposFaltantesCarga(r).length === 0);
}

/**
 * Campos cuyo valor actual difiere del inicial (edición real del usuario).
 * `_modificados` se excluye de la comparación.
 */
export function getModifiedFields(
  initValues: Record<string, unknown> = {},
  currentValues: Record<string, unknown> = {},
): string[] {
  const keys = new Set([...Object.keys(initValues ?? {}), ...Object.keys(currentValues ?? {})]);
  const modified: string[] = [];
  for (const key of keys) {
    if (key === "_modificados") continue;
    if (JSON.stringify(initValues?.[key] ?? "") !== JSON.stringify(currentValues?.[key] ?? "")) {
      modified.push(key);
    }
  }
  return modified;
}

/**
 * Habilita "Guardar" en el diálogo de alta/edición de una carga (paridad
 * `modalCargas.jsx:validarFilaEditable`): descripción, valor (≥0.01), tipo de
 * embalaje, partida arancelaria, régimen aduanal, cantidad (≥1), peso
 * (≥0.001), unidad de medida y país origen. A diferencia de
 * `CAMPOS_OBLIGATORIOS_CARGA` (fila "completa" para el aviso de la tabla), el
 * legacy NO bloquea el guardado del diálogo por falta de largo/alto/ancho.
 */
export function isCargaFormularioValido(formData: Record<string, unknown>): boolean {
  return getCamposInvalidosCargaFormulario(formData).length === 0;
}

/** Campos que impiden guardar una carga desde el diálogo. */
export function getCamposInvalidosCargaFormulario(formData: Record<string, unknown>): string[] {
  const presente = (v: unknown) => v !== undefined && v !== null && v !== "";
  const minimo = (v: unknown, min: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min;
  };
  return [
    !presente(formData.descripcion) && "descripcion",
    !minimo(formData.valor, 0.01) && "valor",
    !presente(formData.tipoEmbalaje) && "tipoEmbalaje",
    !presente(formData.partidaArancelaria) && "partidaArancelaria",
    !presente(formData.regimenAduanal) && "regimenAduanal",
    !minimo(formData.cantidad, 1) && "cantidad",
    !minimo(formData.pesoTotal, 0.001) && "pesoTotal",
    !presente(formData.unidadMedida) && "unidadMedida",
    !presente(formData.paisOrigenId) && "paisOrigenId",
  ].filter((field): field is string => Boolean(field));
}

/** Unión sin duplicados de dos listas de campos modificados. */
export function unionModificados(a: string[] = [], b: string[] = []): string[] {
  return Array.from(new Set([...(a ?? []), ...(b ?? [])]));
}
