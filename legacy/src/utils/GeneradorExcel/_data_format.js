import { alignmentFormat } from "./_libreria_estilos_excel";

/**
 *
 * TRANSFORMA LOS DATOS PARA PODER SER UTILIZADOS CON 'generarExcel', RECIBE:
 *
 * headers: los encabezados de la tabla junto a su equivalente en los campos de los datos, ie:
 *  [
 *      { label: "Campo en tabla", campo: "campo_en_datos", filtrarSiMultiplesValores: true }
 *  ]
 *
 * datos: Lista de datos, ie:
 * [
 *      {
 *          campo1: "hsajkdhska",
 *          campo2: "1212121",
 *          ...
 *      },
 *      ...
 * ]
 *
 * excepciones: Lista de campos que no se deben formatear como número, ie:
 * ["campo1", "campo2"]
 */

const isEmprty = (string) => {
  if (string === undefined || string === null) return true;
  return `${string}`.trim() === "";
};

/**
 * Filtra los headers cuya bandera `filtrarSiMultiplesValores` está activa
 * y la columna tiene más de un valor distinto en los datos.
 */
function filtrarHeadersPorValoresUnicos(headers, datos) {
  return headers.filter((header) => {
    if (!header.filtrarSiMultiplesValores) return true;

    const valoresUnicos = new Set(
      datos.map((item) => {
        const val = item[header.campo];
        return isEmprty(val) ? null : val;
      }),
    );

    // Si solo hay 1 valor distinto (o todos vacíos), se incluye la columna
    console.log(`[TransformDatos] Columna "${header.label}" tiene ${valoresUnicos.size} valores distintos.`);
    return valoresUnicos.size > 1;
  });
}

export function transformDatos(headers, datos, excepciones = []) {
  // Aplicar filtro de múltiples valores antes de construir el mapa
  const headersFiltrados = filtrarHeadersPorValoresUnicos(headers, datos);

  const headerMap = headersFiltrados.reduce((map, header) => {
    map[header.campo] = header.label;
    return map;
  }, {});

  const dataReturn = datos.map((item) => {
    let transformedItem = {};
    Object.keys(headerMap).forEach((d) => {
      transformedItem[headerMap[d]] = { dato: " ", alignFormat: alignmentFormat.middleLeft, formato: {} };
    });
    for (let key in item) {
      if (headerMap[key]) {
        transformedItem[headerMap[key]] = {
          dato: isEmprty(item[key]) ? " " : excepciones.includes(key) || isNaN(item[key]) ? item[key] || " " : Number(item[key]),
          alignFormat: alignmentFormat.middleLeft,
          formato: isEmprty(item[key]) || excepciones.includes(key) || isNaN(item[key]) ? {} : { tipo: "numero", formato: "0.00" },
        };
      }
    }
    return transformedItem;
  });

  return dataReturn;
}
