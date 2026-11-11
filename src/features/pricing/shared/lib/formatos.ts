/* Variantes camelCase / snake_case de los campos que devuelve el backend. */

// Convierte camelCase -> snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
}

// Convierte snake_case -> camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letra) => letra.toUpperCase());
}

type SnakeToCamelCase<S extends string> = S extends `${infer P}_${infer R}`
  ? `${P}${Capitalize<SnakeToCamelCase<R>>}`
  : S;

type CamelToSnakeCase<S extends string> = S extends `${infer P}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Lowercase<P>}${CamelToSnakeCase<R>}`
    : `${Lowercase<P>}_${CamelToSnakeCase<R>}`
  : S;

export type ConAmbosFormatos<T extends object> = T & {
  [K in keyof T as K extends string
    ? K extends `${string}_${string}`
      ? SnakeToCamelCase<K>
      : CamelToSnakeCase<K>
    : never]: T[K];
};

/**
 * Agrega automáticamente la variante camelCase o snake_case
 * de cada campo del objeto, sin pisar valores ya existentes.
 */
export function conAmbosFormatos<T extends object>(obj: T): ConAmbosFormatos<T> {
  const source = obj as Record<string, unknown>;
  const resultado: Record<string, unknown> = { ...source };

  for (const key of Object.keys(source)) {
    const valor = source[key];

    if (key.includes("_")) {
      const camel = snakeToCamel(key);

      if (!(camel in resultado)) {
        resultado[camel] = valor;
      }
    } else {
      const snake = camelToSnake(key);

      if (!(snake in resultado)) {
        resultado[snake] = valor;
      }
    }
  }

  return resultado as ConAmbosFormatos<T>;
}
