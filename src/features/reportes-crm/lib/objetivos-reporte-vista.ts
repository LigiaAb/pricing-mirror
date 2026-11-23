import type { ObjetivoReporte } from "../api/objetivos-reporte";
export function etiquetaPeriodo(unidad: string, numero: number): string {
  const etiqueta =
    (
      {
        SEMANA: "Semana",
        MES: "Mes",
        AÑO: "Año",
        DIA: "Día",
        DÍA: "Día",
        QUINCENA: "Quincena",
      } as Record<string, string>
    )[unidad.toUpperCase()] ?? "Periodo";
  return `${etiqueta} ${numero}`;
}
export function maxPeriodos(objetivo: ObjetivoReporte): number {
  return Math.max(0, ...objetivo.empleados.map((empleado) => empleado.datos.length));
}
export function indicesPeriodo(objetivo: ObjetivoReporte): number[] {
  return Array.from({ length: maxPeriodos(objetivo) }, (_, indice) => indice + 1);
}
export function cumpleMeta(valor: number, meta: number): boolean {
  return valor >= meta;
}
