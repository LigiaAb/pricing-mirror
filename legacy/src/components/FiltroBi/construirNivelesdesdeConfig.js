/**
 * Convierte la lista ordenada de campos elegidos por el usuario en el
 * NivelesBuilder al formato { campo, prefijo, defecto, esHoja } que
 * espera useGroupedTree.
 *
 * @param {Array<{campo: string, etiqueta: string}>} nivelesActivos
 * @returns {Array} niveles listos para useGroupedTree
 */
export function construirNivelesDesdeConfig(nivelesActivos) {
  return nivelesActivos.map((n, index) => ({
    campo: n.campo,
    prefijo: n.campo.toLowerCase(),
    defecto: `SIN_${n.campo}`,
    esHoja: index === nivelesActivos.length - 1,
  }));
}