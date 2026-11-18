import type { CampoConfig } from "./niveles-builder";
import type { NivelConfig } from "./use-grouped-tree";

/**
 * Convierte la lista ordenada de campos elegidos por el usuario en el
 * NivelesBuilder al formato { campo, prefijo, defecto, esHoja } que
 * espera useGroupedTree.
 */
export function construirNivelesDesdeConfig(nivelesActivos: CampoConfig[]): NivelConfig[] {
  return nivelesActivos.map((n, index) => ({
    campo: n.campo,
    prefijo: n.campo.toLowerCase(),
    defecto: `SIN_${n.campo}`,
    esHoja: index === nivelesActivos.length - 1,
  }));
}
