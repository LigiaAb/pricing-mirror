import type { Actividad } from "../api/actividades";

const TODOS = "todos";
const NINGUNO = "ninguno";
const ESTADOS_LEGACY = [23, 24];

export interface FiltrosCalendario {
  estados: Set<number>;
  tipos: Set<number>;
  codUsuario?: number;
}

function codigosDesdeUrl(valor: string | null, disponibles: number[], porDefecto: number[]) {
  if (valor === TODOS) return new Set(disponibles);
  if (valor === NINGUNO) return new Set<number>();
  if (!valor) return new Set(porDefecto.filter((codigo) => disponibles.includes(codigo)));
  return new Set(
    valor
      .split(",")
      .map(Number)
      .filter((codigo) => Number.isInteger(codigo) && disponibles.includes(codigo)),
  );
}

export function filtrosCalendarioDesdeUrl(
  estado: string | null,
  tipo: string | null,
  estadosDisponibles: number[],
  tiposDisponibles: number[],
): FiltrosCalendario {
  return {
    estados: codigosDesdeUrl(estado, estadosDisponibles, ESTADOS_LEGACY),
    tipos: codigosDesdeUrl(tipo, tiposDisponibles, tiposDisponibles),
  };
}

export function filtrosCalendarioUrl(codigos: Set<number>, disponibles: number[]): string | null {
  if (codigos.size === 0) return NINGUNO;
  if (codigos.size === disponibles.length && disponibles.every((codigo) => codigos.has(codigo))) {
    return TODOS;
  }
  return [...codigos].sort((a, b) => a - b).join(",");
}

export function filtrarActividadesCalendario(
  actividades: Actividad[],
  filtros: FiltrosCalendario,
): Actividad[] {
  return actividades.filter(
    (actividad) =>
      (filtros.codUsuario ? actividad.cod_asesor === filtros.codUsuario : true) &&
      filtros.estados.has(Number(actividad.cod_estado)) &&
      filtros.tipos.has(Number(actividad.cod_tipo)),
  );
}
