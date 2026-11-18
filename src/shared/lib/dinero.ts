// Montos de una sola moneda con 2 decimales. Las sumas y comparaciones se hacen
// en centavos enteros, que son exactos en JS; en flotantes 0.1 + 0.2 > 0.3.

/** Convierte un monto a centavos enteros, redondeando la mitad lejos de cero. */
export function aCentavos(monto: number): number {
  // toPrecision(15) descarta el ruido de la multiplicación: 1.005 * 100 = 100.49999999999999.
  const centavos = Number((monto * 100).toPrecision(15));
  return Math.sign(centavos) * Math.round(Math.abs(centavos));
}

export function deCentavos(centavos: number): number {
  return centavos / 100;
}

export function redondearCentavos(monto: number): number {
  return deCentavos(aCentavos(monto));
}

export function sumarMontos(montos: readonly number[]): number {
  return deCentavos(montos.reduce((total, monto) => total + aCentavos(monto), 0));
}
