export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Cada valor identifica la opción que el formulario persiste. El API puede
 * repetir registros; conservar la primera opción evita valores ambiguos en
 * controles de selección y garantiza keys únicas para React.
 */
export function deduplicarOpciones<T extends { value: string }>(options: readonly T[]): T[] {
  const values = new Set<string>();

  return options.filter((option) => {
    if (values.has(option.value)) return false;
    values.add(option.value);
    return true;
  });
}
