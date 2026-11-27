export const TODOS = "todos";

/** Usuario por el que se consultan las actividades: el asignado (asesor) o el creador. */
export type TipoUsuario = "asignado" | "creador";

export const OPCIONES_TIPO_USUARIO: { value: TipoUsuario; label: string }[] = [
  { value: "asignado", label: "Asignado" },
  { value: "creador", label: "Creador" },
];

export interface FiltroActividades {
  codEmp: string;
  codCc: string;
  tipoUsuario: TipoUsuario;
  codUsuario: string;
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

  if (!opciones.sinAsignar) {
    const usuario = opciones.puedeVerTodo ? filtro.codUsuario : opciones.codUsuario;
    if (usuario !== null && usuario !== TODOS && usuario !== "") {
      resultado.cod_usuario = Number(usuario);
      resultado.tipo_usuario = filtro.tipoUsuario;
    }
  }

  return resultado;
}
