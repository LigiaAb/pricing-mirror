export const TODOS = "todos";

export interface FiltroActividades {
  codEmp: string;
  codCc: string;
  codAsesor: string;
  codCreador: string;
  codEstado: string;
  fechaInicio: string;
  fechaFin: string;
}

export function construirFiltrosActividades(
  filtro: FiltroActividades,
  opciones: Readonly<{
    codUsuario: string | number | null;
    puedeVerTodo: boolean;
    sinAsignar?: boolean;
  }>,
): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};

  if (filtro.codEmp !== TODOS) resultado.cod_empresa = Number(filtro.codEmp);
  if (filtro.codCc !== TODOS) resultado.cod_cc = Number(filtro.codCc);
  if (filtro.codEstado !== TODOS) resultado.cod_estado = Number(filtro.codEstado);
  if (filtro.fechaInicio) resultado.fecha_inicio = filtro.fechaInicio;
  if (filtro.fechaFin) resultado.fecha_fin = filtro.fechaFin;
  if (filtro.codCreador && filtro.codCreador !== TODOS) {
    resultado.cod_creador = Number(filtro.codCreador);
  }

  if (!opciones.sinAsignar) {
    const asesor = opciones.puedeVerTodo ? filtro.codAsesor : opciones.codUsuario;
    if (asesor !== null && asesor !== TODOS && asesor !== "") {
      resultado.cod_asesor = Number(asesor);
    }
  }

  return resultado;
}
