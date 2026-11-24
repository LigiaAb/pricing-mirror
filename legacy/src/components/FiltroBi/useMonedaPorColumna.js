import { useMemo } from 'react'

// Construye un mapa { [valorDeColumna]: moneda }
// Solo asigna moneda si TODOS los documentos de esa columna tienen la misma moneda.
// Si hay mezcla (ej: 2024 tiene GTQ y USD), el key queda sin moneda → no se muestra prefijo.

// Parámetros:
// - documentos: array de docs planos
// - campoColumna: campo que define las columnas (ej: 'FILE_ANIO', 'DOC_TIPO_NOMBRE')
// - campMoneda: campo con la moneda (por defecto 'DOC_MONEDA')

export function useMonedaPorColumna(documentos, campoColumna, campoMoneda = 'DOC_MONEDA') {
  return useMemo(() => {
    const mapa = {}   // { colKey: Set<moneda> }

    documentos.forEach((doc) => {
      const colKey = String(doc[campoColumna] ?? '')
      const moneda = doc[campoMoneda]
      if (!colKey || !moneda) return

      if (!mapa[colKey]) mapa[colKey] = new Set()
      mapa[colKey].add(moneda)
    })

    // Si una columna solo tiene UNA moneda → la asignamos
    // Si tiene varias → undefined (sin prefijo)
    const resultado = {}
    Object.entries(mapa).forEach(([colKey, monedas]) => {
      if (monedas.size === 1) {
        resultado[colKey] = [...monedas][0]
      }
    })

    return resultado
  }, [documentos, campoColumna, campoMoneda])
}