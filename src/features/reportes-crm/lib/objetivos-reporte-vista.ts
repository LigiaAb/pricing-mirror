import type { ActividadObjetivo, ObjetivoReporte } from "../api/objetivos-reporte";
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
/** Periodo de una columna (`numero` y fechas): del primer empleado que lo tenga. */
export function periodoDeColumna(objetivo: ObjetivoReporte, numero: number) {
  return objetivo.empleados
    .map((empleado) => empleado.datos[numero - 1])
    .find((periodo) => periodo !== undefined);
}
export interface ClienteActividadObjetivo {
  entidad_id: string | number;
  entidad_nombre: string;
}
export interface FilaActividadObjetivo {
  cod_actividad: ActividadObjetivo["cod_actividad"];
  tipo: string;
  asunto: string;
  asesor: string;
  cliente: string;
  estado: string;
  fecha_programada: string;
}
/**
 * Filas del modal de actividades (legacy `ModalActividades`). A diferencia del
 * legacy, si un código no está en su catálogo la celda queda vacía (no se cae).
 */
export function filasActividadesObjetivo(
  actividades: ActividadObjetivo[],
  catalogos: {
    tipos: Array<{ codTipo: string | number; nomTipo: string }>;
    empleados: Array<{ codUsuario: string | number; nombreCompleto: string }>;
    estados: Array<{ cod_estado: string | number; estado_desc: string }>;
    clientes: ClienteActividadObjetivo[];
  },
): FilaActividadObjetivo[] {
  const tipos = new Map(catalogos.tipos.map((tipo) => [String(tipo.codTipo), tipo.nomTipo]));
  const empleados = new Map(
    catalogos.empleados.map((empleado) => [String(empleado.codUsuario), empleado.nombreCompleto]),
  );
  const estados = new Map(
    catalogos.estados.map((estado) => [String(estado.cod_estado), estado.estado_desc]),
  );
  const clientes = new Map(
    catalogos.clientes.map((cliente) => [String(cliente.entidad_id), cliente.entidad_nombre]),
  );
  return actividades.map((actividad) => ({
    cod_actividad: actividad.cod_actividad,
    tipo: tipos.get(String(actividad.cod_tipo)) ?? "",
    asunto: actividad.asunto,
    asesor: empleados.get(String(actividad.cod_asesor)) ?? "",
    cliente: clientes.get(String(actividad.entidad_id ?? actividad.cod_cliente)) ?? "",
    estado: estados.get(String(actividad.cod_estado)) ?? "",
    fecha_programada: actividad.fecha_programada,
  }));
}
