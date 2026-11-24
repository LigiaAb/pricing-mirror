import { useMemo } from 'react';

/**
 * Hook genérico para agrupar una lista plana de documentos en un árbol
 * de N niveles (padre -> hijo -> ... -> hoja), acumulando totales por
 * columna en cada nivel.
 *
 * @param {Array} documentos - lista plana de documentos (ya filtrados)
 * @param {Array} niveles - definición de la jerarquía, de raíz a hoja. Cada nivel:
 *   {
 *     campo: 'FILE_DEPTO',          // campo del doc que define el grupo
 *     prefijo: 'depto',             // prefijo para el id del nodo (debe ser único entre niveles)
 *     defecto: 'SIN_DEPTO',         // valor si el campo viene null/undefined
 *     label: (doc, idValor) => ...  // opcional: cómo se ve el label (por defecto = idValor)
 *     esHoja: true                  // SOLO en el último nivel: marca que ahí cuelgan los documentos individuales
 *   }
 * @param {Array} columnas - columnas numéricas a acumular. Acepta dos formatos:
 *        - array de strings: ['2023', '2024', '2025']
 *        - array de objetos: [{ key, label }]  (formato anterior, sigue funcionando)
 * @param {(doc) => string} obtenerColumnaActiva - dado un doc, retorna la "key" de columna
 *        que debe recibir su valor (ej: el año, o el tipo de documento, según el caso)
 * @param {(doc) => number} obtenerValor - dado un doc, retorna el valor numérico a sumar
 *        (ej: doc.DOC_VALORDOLAR)
 * @param {(doc) => string} idDocumento - dado un doc, retorna el identificador de la hoja
 *        final (ej: doc.DOC_NUMERO)
 *
 * NOTA IMPORTANTE: el último elemento de `niveles` debe llevar `esHoja: true`.
 * Ese es el nivel donde se cuelgan los documentos individuales. Si ningún nivel
 * lo tiene, el hook ahora lo asigna automáticamente al último, para que nunca
 * truene por "Cannot read properties of undefined (reading 'push')".
 */
export function useGroupedTree({
  documentos,
  niveles,
  columnas,
  obtenerColumnaActiva,
  obtenerValor,
  obtenerValoresDocumento,
  idDocumento,
}) {
  return useMemo(() => {
    if (!documentos?.length || !niveles?.length) return [];

    // Acepta tanto ['2023','2024'] como [{key:'2023', label:'2023'}]
    const columnKeys = columnas.map((c) => (typeof c === 'string' ? c : c.key));
    const safeNum = (v) => Number(v) || 0;

    // Garantizamos que SIEMPRE haya un nivel hoja: si el usuario no marcó
    // ninguno con esHoja, forzamos que lo sea el último del array.
    const hayHojaExplicita = niveles.some((n) => n.esHoja);
    const nivelesNormalizados = hayHojaExplicita
      ? niveles
      : niveles.map((n, i) => (i === niveles.length - 1 ? { ...n, esHoja: true } : n));

    const crearValoresVacios = () => {
      const v = {};
      columnKeys.forEach((k) => (v[k] = 0));
      return v;
    };

    const raiz = { childrenMap: {} };

    documentos.forEach((doc) => {
      let valoresDocumento = obtenerValoresDocumento
      ? obtenerValoresDocumento(doc, columnKeys)
      : null;
      // console.log("docu",doc)
      // console.log("valores",valoresDocumento)

      if(!valoresDocumento) {
        const columnaActiva =obtenerColumnaActiva(doc);
        const valor = safeNum(obtenerValor(doc));
         valoresDocumento ={};
         columnKeys.forEach((k) => {
          valoresDocumento[k] = k === columnaActiva ? valor : 0;
         })
      }
        
      // Recorremos los niveles definidos, creando/reusando nodos en cada paso
      let nodoActual = raiz;
      const nodosEnRuta = [];

      nivelesNormalizados.forEach((nivel) => {
        const idValor = doc[nivel.campo] ?? nivel.defecto;
        const key = `${nivel.prefijo}_${idValor}`;

        if (!nodoActual.childrenMap[key]) {
          const label = nivel.label ? nivel.label(doc, idValor) : String(idValor);
          nodoActual.childrenMap[key] = nivel.esHoja
            ? { id: key, label, values: crearValoresVacios(), children: [] }
            : { id: key, label, values: crearValoresVacios(), childrenMap: {} };
        }

        nodoActual = nodoActual.childrenMap[key];
        nodosEnRuta.push(nodoActual);
      });

      // El último nivel (esHoja) es donde cuelga el documento individual
      const nodoHoja = nodosEnRuta[nodosEnRuta.length - 1];
      const docId = idDocumento(doc);
      nodoHoja.children.push({
        id: `doc_${nodoHoja.children.length}_${docId}`,
        label: docId,
        values: valoresDocumento,
      });

      // Acumular totales en todos los niveles de la ruta (incluida la hoja)
      nodosEnRuta.forEach((nodo) => {
        columnKeys.forEach((k) => {
          nodo.values[k] += valoresDocumento[k];
        });
      });
    });

    // Convertir el árbol de Maps anidados a arrays (recursivo, N niveles)
    const aArray = (childrenMap) =>
      Object.values(childrenMap).map((nodo) => ({
        id: nodo.id,
        label: nodo.label,
        values: nodo.values,
        children: nodo.children ?? aArray(nodo.childrenMap),
      }));

    return aArray(raiz.childrenMap);
  }, [documentos, niveles, columnas, obtenerColumnaActiva, obtenerValor, idDocumento]);
}

/**
 * Helper para generar `todasLasColumnas` a partir de un solo campo, sin
 * tener que escribir el useMemo + Object.keys + sort a mano cada vez.
 *
 * Uso en el componente:
 *   const todasLasColumnas = useColumnasDesdeCampo(documentos, 'DOC_TIPO_NOMBRE');
 *   // antes tenías que escribir ~15 líneas para esto
 *
 * @param {Array} documentos - lista plana de documentos
 * @param {string} campo - nombre del campo que define cada columna (ej: 'DOC_TIPO_NOMBRE', 'FILE_ANIO')
 * @returns {Array<{key: string, label: string}>} columnas únicas, ordenadas alfabéticamente
 */
export function useColumnasDesdeCampo(documentos, campo) {
  return useMemo(() => {
    if (!documentos?.length) return [];
    if(campo === "RANGO_VENCIMIENTOS") {
      return[
        { key:"POR_VENCER",label: "Por Vencer"},
        { key:"S15", label:"1 - 15"},
        { key:"S16_30", label:"16 - 30"},
        { key:"S31_60", label:"31 - 60"},
        { key:"S61_90", label:"61 - 90"},
        { key:"MAS_90", label:"Mas 90"}

      ]
    }

    const valoresUnicos = {};
    documentos.forEach((doc) => {
      const valor = doc[campo];
      if (valor != null && valor !== '') {
        valoresUnicos[valor] = true;
      }
    });

    return Object.keys(valoresUnicos)
      .sort()
      .map((valor) => ({ key: valor, label: valor }));
  }, [documentos, campo]);
}